import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync, Session } from "fastify";
import { parse } from "cookie";
import { Socket } from "socket.io";

const userSockets = new Map<number, Set<string>>();
const socketToSession = new Map<string, number>();

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

function runInsertMessage(fastify: FastifyInstance, msg: string, conversationId: number,
  senderId: number, clientOffset: number): Promise<number> {
  return new Promise((resolve, reject) => {
    fastify.database.run(
      `INSERT INTO messages (conversation_id, sender_id, content, client_offset)
      VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, msg, clientOffset],
      function (this: any, err: Error | null) {
        if (err) {
          console.error("Error inserting message:", err.message);
          return (reject(-1));
        }
        resolve(this.lastID);
      }
    );
  });
}

// ***************************************** Handle messages & conversations */
async function getAllConversations(fastify: FastifyInstance, userId: number, io: any) {
  try {
    const conversations = await fastify.database.fetch_all(
    `SELECT id, 
    CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId 
    FROM conversations WHERE user1_id = ? OR user2_id = ?`,
    [userId, userId, userId]
    );
    io.to(userId.toString()).emit("allConversations", conversations);
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
    // console.log("GETCONV : user1 = ", user1, "user2 = ", user2); // ! DEBUG
    if (conv) return (conv.id);
    const conversationId = await runInsertConversation(fastify, user1, user2);
    // console.log("New conversation created with id:", conversationId); // ! DEBUG
    return (conversationId);
  } catch (e) {
    console.error("Failed to create or get conversation: ", e);
    return (-1);
  }
}

async function insertMessage(fastify: FastifyInstance, msg: string, conversationId: number,
  senderId: number, clientOffset: number): Promise<number> {
  try {
    const messageId = await runInsertMessage(fastify, msg, conversationId, senderId, clientOffset);
    // console.log("Message inserted with ID:", messageId); // ! DEBUG
    return (messageId);
  } catch (e) {
    console.error("Failed to insert message: ", e);
    return (-1);
  }
}

function handleMessages(fastify: FastifyInstance, socket: any, io: any) {
  socket.on("message", async ({ targetId, msg, clientOffset } :
    { targetId: string, msg: string, clientOffset: number }) => {
    const senderId = socket.session.userId;
    const conversationId = await getOrCreateConversation(fastify, senderId, parseInt(targetId));
    if (conversationId === -1) return;
    const offset = await insertMessage(fastify, msg, conversationId, senderId, clientOffset);
    const data = {
      senderId: socket.session.userId.toString(),
      senderUsername: socket.username,
      msg,
      serverOffset: offset,
    };
    // console.log("Message sent to target :", targetId, "and sender : ", senderId); // ! DEBUG
    io.to(targetId.toString()).emit("message", data);
    io.to(senderId.toString()).emit("message", data);
  });
}

// ************************************************* Handle message recovery */
// async function handleRecovery(socket : any, fastify : FastifyInstance) { // ! get conv Id
//   if (!socket.recovered) {
//     try {
//       await fastify.database.each(
//         `SELECT id, content, sender_id FROM messages
//          WHERE conversation_id = ? AND id > ? 
//          ORDER BY sent_at ASC`,
//         [conversationId, socket.handshake.auth.serverOffset || 0],
//         (_err, row) => {
//           socket.emit("message", {
//             senderId: row.sender_id,
//             msg: row.content,
//             serverOffset: row.id,
//           });
//         }
//       );
//         (_err: Error | null, row: { id: number; content: string }) => {
//           socket.emit('message', { senderId: 'server', msg: row.content, serverOffset: row.id });
//         }
//       )
//     } catch (e) {
//       console.error("Failed to recover messages: ", e);
//     }
//   }
// }

// ******************************************************** Get active users */
function listUsers(socket: Socket, io: any) {
  const users = [];
  for (const [sessionId, socketIds] of userSockets) {
    const firstSocketId = socketIds.values().next().value; // Get first socket ID
    const sock = io.of("/").sockets.get(firstSocketId);    // Get Socket instance
    if (sock) {
      users.push({
        userId: sessionId.toString(),
        username: sock.username,
      });
    }
  }
  // console.log("Active users:", users); // ! DEBUG
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
        // console.log(`Socket ${socket.id} disconnected for user ${userId}.`); // ! DEBUG
        if (socketSet.size === 0) {
          userSockets.delete(userId);
          // console.log(`All sockets for user ${userId} disconnected.`); // ! DEBUG
        }
      }
    }
    socketToSession.delete(socket.id);
    // console.log(`Socket ${socket.id} removed from session.`); // ! DEBUG
  });
}

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  const io = fastify.io;
  authenticateSession(io, fastify);
  
  io.on("connection", async (socket) => {
    // console.log(`Socket connected:`, socket.id); // ! DEBUG
    const sessionId = socket.session.userId;
    socket.username = await getUsername(fastify, sessionId!);
    socket.join(sessionId.toString());
    if (!userSockets.has(sessionId)) userSockets.set(sessionId, new Set());
    userSockets.get(sessionId)!.add(socket.id);
    socketToSession.set(socket.id, sessionId);
    sendUserId(socket);
    handleMessages(fastify, socket, io);
    // handleRecovery(socket, fastify);
    listUsers(socket, io);
    notifyUsers(socket);
    getAllConversations(fastify, sessionId, io);
    handleDisconnect(socket);
  });
};

export default fp(chatPlugin);

// ? Handle msg recovery
// ? Display dates in msg history

// ! Ensure "exactly once" msg delivery
// 1. Offset : avoid sending same msg twice
// 2. Acknowledge msg delivery
/*
ADD ack & timeouts :
socket.emit("message", msgData, (ack) => {
  if (ack.success) {
    // Mark as delivered
  } else {
    // Retry or notify failure
  }
});
*/