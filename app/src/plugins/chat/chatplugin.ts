import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
import { Socket } from "socket.io";
import { sendUserId, setSessionInfo, authenticateSession, socketToSession, userSockets, getUsername } from "./chatAuthenticate.js";
import { handleMessages, getAllConversations } from "./chatMessages.js";

let currConvId = 0; // ! useless ?
export interface Message {
  senderId: number;
  content: string;
  senderUsername?: string;
  targetId?: string;
  clientOffset?: string;
  serverOffset?: number;
  sentAt?: Date;
  convId?: number;
}

// // ***************************************** Handle messages & conversations */
// async function getAllConversations(fastify: FastifyInstance, userId: number, io: any) {
//   try {
//     const convInfo: Record<number, string> = {};
//     const conversations = await fastify.database.fetch_all(
//     `SELECT id, 
//     CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId
//     FROM conversations WHERE user1_id = ? OR user2_id = ?`,
//     [userId, userId, userId]
//     );
//     for (const conv of conversations) {
//       const username = await getUsername(fastify, conv.otherUserId);
//       if (username) convInfo[conv.otherUserId] = username;
//     }
//     io.to(userId.toString()).emit("allConversations", conversations, convInfo);
//   } catch (err) {
//     console.error("Failed to fetch conversations", err);
//   }
// }

// async function getOrCreateConversation(fastify: FastifyInstance, senderId: number,
//   targetId: number): Promise<number> {
//   let [user1, user2] = [senderId!, targetId!].sort((a, b) => a - b);
//   try {
//     const conv = await fastify.database.fetch_one(
//       `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
//       [user1, user2]
//     );
//     if (conv) return (conv.id);
//     const conversationId = await runInsertConversation(fastify, user1, user2);
//     return (conversationId);
//   } catch (err) {
//     console.error("Failed to create or get conversation: ", err);
//     return (-1);
//   }
// }

// async function insertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
//   try {
//     const messageId = await runInsertMessage(fastify, msg);
//     return (messageId);
//   } catch (err) {
//     console.error("Failed to insert message: ", err);
//     return (-1);
//   }
// }

// function handleMessages(fastify: FastifyInstance, socket: Socket, io: any) {
//   socket.on("message", async (msg: Message, callback) => {
//     msg.senderId = socket.session.userId.toString();
//     msg.senderUsername = socket.username;
//     try {
//       const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId!));
//       if (conversationId === -1) return (callback({ status: "error" }));
//       msg.convId = currConvId = conversationId; // CHECK (redundant ?)
//       msg.serverOffset = await insertMessage(fastify, msg);
//       io.to(msg.targetId).emit("message", msg);
//       io.to(msg.senderId).emit("message", msg);
//       callback({ status: "ok", serverOffset: msg.serverOffset });
//     } catch (err: any) {
//       if (err.errno === "SQLITE_CONSTRAINT") {
//         callback({ status: "duplicate" });
//       } else {
//         console.log("Message insert failed:", err);
//         callback({ status: "retry" });
//       }
//     }
//   });
// }

// ************************************************* Handle message recovery */
async function handleRecovery(socket: Socket, fastify: FastifyInstance, io: any) {  // TODO - test
  // console.log("Recovery triggered. Socket recovered:", socket.recovered);  // ! DEBUG
  // console.log("Fetching messages after offset:", socket.handshake.auth.serverOffset);  // ! DEBUG
  if (!socket.recovered) {
    try {
      const valid = await fastify.database.fetch_one(
        `SELECT 1 FROM conversations 
         WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
        [currConvId, socket.session.userId, socket.session.userId]
      );
      if (!valid) return;
      const messages = await fastify.database.fetch_all(
        `SELECT id, content, sender_id, sent_at FROM messages
         WHERE conversation_id = ? AND id > ? 
         ORDER BY id ASC`,
        [currConvId, socket.handshake.auth.serverOffset || 0]
        );
      for (const entry of messages) {
        const msg: Message = {
        senderId: entry.sender_id,
        content: entry.content,
        sentAt: entry.sent_at,
        serverOffset: entry.id,
        }
        // console.log("Recovered message:", msg); // ! DEBUG
        io.to(socket.session.userId!.toString()).emit("message", msg);
      }
    } catch (err) {
      console.error("Message recovery failed:", err);
    }
  }
}

// ******************************************************** Get active users */
function listUsers(socket: Socket, io: any) {
  const users = [];
  for (const [sessionId, socketIds] of userSockets) {
    const firstSocketId = socketIds.values().next().value;
    const sock = io.of("/").sockets.get(firstSocketId);
    if (sock) {
      users.push({
        userId: sessionId.toString(),
        username: sock.username,
      });
    }
  }
  socket.emit("users", users);
}

// New connection - notify existing users
function notifyUsers(socket: Socket) {
   socket.broadcast.emit("User connected", {
    userId: socket.session.userId.toString(),
    username: socket.username,
  });
}

// **************************************************** Connect & disconnect */
function handleDisconnect(socket: Socket) {
  socket.on("disconnect", () => {
    const userId = socketToSession.get(socket.id);
    if (userId) {
      const socketSet = userSockets.get(userId);
      if (socketSet) {
        socketSet.delete(socket.id);
        if (socketSet.size === 0) {
          userSockets.delete(userId);
        }
      }
    }
    socketToSession.delete(socket.id);
  });
}

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  const io = fastify.io;
  authenticateSession(io, fastify);
  
  io.on("connection", async (socket) => {
    await setSessionInfo(fastify, socket);
    sendUserId(socket);
    handleMessages(fastify, socket, io);
    listUsers(socket, io);
    notifyUsers(socket);
    getAllConversations(fastify, socket.session.userId, io);
    handleRecovery(socket, fastify, io);
    handleDisconnect(socket);
  });
};

export default fp(chatPlugin);

// TODO - Handle blocks
// After merge : Check dependencies & socket.io versions ("socket.io": "^4.7.2", "socket.io-client": "^4.7.2")
// Check Socket.IO versions mismatch (rare but can cause ack issues)
// ! Careful with types (check typeof() if pb)