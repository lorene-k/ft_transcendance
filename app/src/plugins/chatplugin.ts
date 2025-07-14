import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync, Session } from "fastify";
import { parse } from "cookie";
import { Socket } from "socket.io";

const userSockets = new Map<number, Set<string>>();
const socketToSession = new Map<string, number>();
let currConvId = 0; // ! useless ?
interface Message {
  senderId: number;
  content: string;
  senderUsername?: string;
  targetId?: string;
  clientOffset?: string;
  serverOffset?: number;
  sentAt?: Date;
  convId?: number;
}

// ********************************************************** Authentication */
function authenticateSession(io : any, fastify : FastifyInstance) {
  io.use((socket: Socket, next: Function) => {
    const cookies = parse(socket.handshake.headers.cookie || "");
    const signedSessionId = cookies.sessionId;
    if (!signedSessionId) return (next(new Error("No session Id found")));
    const sessionId = signedSessionId.split(".")[0];
  
    fastify.sessionStore.get(sessionId!, (err: Error | null, session: Session) => {
      if (err || !session || !session.authenticated)
        return (next(new Error("Unauthorized connection")));
      socket.session = session;
      fastify.sessionStore.set(sessionId!, session, (e : Error | null) => {
        if (e) return (next(new Error("No session Id found")));
        next();
      });
    });
  });
}

// Attach username to socket
async function getUsername(fastify: FastifyInstance, userId: number) {
  const row = await fastify.database.fetch_one(
    `SELECT username FROM user WHERE id = ?`,
    [userId]
  );
  if (!row) return ("Unknown user");
  return (row.username);
}

// Attach socket info to session
async function setSessionInfo(fastify: FastifyInstance, socket: Socket) {
  const sessionId = socket.session.userId;
  socket.username = await getUsername(fastify, sessionId!);
  socket.join(sessionId.toString());
  if (!userSockets.has(sessionId)) userSockets.set(sessionId, new Set());
  userSockets.get(sessionId)!.add(socket.id);
  socketToSession.set(socket.id, sessionId);
} 

// Send userId and username to client
function sendUserId(socket: Socket) {
socket.emit("session", {
  sessionId: socket.session.userId.toString(),
  username: socket.username,
});
}

// ********************************************************** Update history */
async function runInsertConversation(fastify: FastifyInstance, user1: number,
  user2: number): Promise<number> {
  return new Promise((resolve, reject) => {
    fastify.database.run(
      'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
      [user1, user2],
      function (this: any, err: Error | null) {
      if (err) {
        console.error("Failed to create conversation:", err.message);
        return (reject(-1));
      }
      resolve(this.lastID);
    });
  });
}

function runInsertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
  return new Promise((resolve, reject) => {
    fastify.database.run(
      `INSERT INTO messages (conversation_id, sender_id, content, client_offset)
      VALUES (?, ?, ?, ?)`,
      [msg.convId, msg.senderId, msg.content, msg.clientOffset],
      function (this: any, err: Error | null) {
        if (err) {
          console.error("Error inserting message:", err.message);
          return (reject(-1));
        }
        // console.log("Message inserted with content:", msg.content); // ! PB HERE
        resolve(this.lastID);
      }
    );
  });
}

// ***************************************** Handle messages & conversations */
async function getAllConversations(fastify: FastifyInstance, userId: number, io: any) {
  try {
    const convInfo: Record<number, string> = {};
    const conversations = await fastify.database.fetch_all(
    `SELECT id, 
    CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId
    FROM conversations WHERE user1_id = ? OR user2_id = ?`,
    [userId, userId, userId]
    );
    for (const conv of conversations) {
      const username = await getUsername(fastify, conv.otherUserId);
      if (username) convInfo[conv.otherUserId] = username;
    }
    io.to(userId.toString()).emit("allConversations", conversations, convInfo);
  } catch (err) {
    console.error("Failed to fetch conversations", err);
  }
}

async function getOrCreateConversation(fastify: FastifyInstance, senderId: number,
  targetId: number): Promise<number> {
  let [user1, user2] = [senderId!, targetId!].sort((a, b) => a - b);
  try {
    const conv = await fastify.database.fetch_one(
      `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
      [user1, user2]
    );
    if (conv) return (conv.id);
    const conversationId = await runInsertConversation(fastify, user1, user2);
    return (conversationId);
  } catch (err) {
    console.error("Failed to create or get conversation: ", err);
    return (-1);
  }
}

async function insertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
  try {
    const messageId = await runInsertMessage(fastify, msg);
    return (messageId);
  } catch (err) {
    console.error("Failed to insert message: ", err);
    return (-1);
  }
}

// With ack
// function handleMessages(fastify: FastifyInstance, socket: Socket, io: any) {
//   socket.on("message", async (msg: Message,
//     callback: (response: { status: string; serverOffset?: number }) => void) => {
//     msg.senderId = socket.session.userId.toString();
//     msg.senderUsername = socket.username;
//     try {
//       const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId!));
//       if (conversationId === -1) return (callback({ status: "error" }));
//       msg.convId = currConvId = conversationId; // ! CHECK (redundant ?)
//       msg.serverOffset = await insertMessage(fastify, msg);
//       io.to(msg.targetId).emit("message", msg);
//       console.log("msg = ", msg); // ! DEBUG
//       callback({ status: "ok", serverOffset: msg.serverOffset });
//       io.to(msg.senderId!.toString()).emit("message", msg);
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

function handleMessages(fastify: FastifyInstance, socket: Socket, io: any) {
  socket.on("message", async (msg: Message) => {
    msg.senderId = socket.session.userId.toString();
    msg.senderUsername = socket.username;
    console.log("Received message content :", msg.content); // ! DEBUG
    try {
      const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId!));
      if (conversationId === -1) return;
      msg.convId = conversationId; // ! Already received from client
      msg.serverOffset = await insertMessage(fastify, msg);
      io.to(msg.targetId).emit("message", msg);
      io.to(msg.senderId).emit("message", msg);
      // console.log("Message sent:", msg); // ! DEBUG
    } catch (err: any) {
        console.log("Message insert failed:", err);
    }
  });
}

// ************************************************* Handle message recovery */
// async function handleRecovery(socket: Socket, fastify: FastifyInstance, io: any) { // ! CHECK
//   if (!socket.recovered) {
//     try {
//       const valid = await fastify.database.fetch_one(
//         `SELECT 1 FROM conversations 
//          WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
//         [currConvId, socket.session.userId, socket.session.userId]
//       );
//       if (!valid) return;
//       const messages = await fastify.database.fetch_all(
//         `SELECT id, content, sender_id, sent_at FROM messages
//          WHERE conversation_id = ? AND id > ? 
//          ORDER BY id ASC`,
//         [currConvId, socket.handshake.auth.serverOffset || 0]
//         );
//       for (const entry of messages) {
//         const msg: Message = {
//         senderId: entry.sender_id,
//         content: entry.content,
//         sentAt: entry.sent_at,
//         serverOffset: entry.id,
//         }
//         io.to(socket.session.userId!.toString()).emit("message", msg);
//       }
//     } catch (err) {
//       console.error("Message recovery failed:", err);
//     }
//   }
// }

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
    // handleRecovery(socket, fastify, io);
    handleDisconnect(socket);
  });
};

export default fp(chatPlugin);

// TODO - Handle blocks
// After merge : Check dependencies & socket.io versions ("socket.io": "^4.7.2", "socket.io-client": "^4.7.2")
// Check Socket.IO versions mismatch (rare but can cause ack issues)