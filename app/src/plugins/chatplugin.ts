import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync, Session } from "fastify";
import { parse } from "cookie";
import { Socket } from "socket.io";

const userSockets = new Map<string, number>();

// ********************************************************** Handle session */
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

// **************************************** Handle messages & db interaction */
async function getConversation(fastify: FastifyInstance, senderId: number, targetId: number): Promise<number> {
  // Prevent duplicates
  let [user1, user2] = [senderId!, targetId!].sort((a, b) => a - b);
  try {
    const conv = await fastify.database.fetch_one(
      `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
      [user1, user2]
    );
    // Return existing conversation ID
    if (conv) return (conv.id);
    // Create conversation if doesn't exist
    console.log("Creating new conversation between", user1, "and", user2);
    const res = await fastify.database.run(
      `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
      [user1, user2]
    );
    return (res.lastID);
  } catch (e) {
    console.error("Failed to create or get conversation: ", e);
    return (-1);
  }
}

async function insertMessage(fastify: FastifyInstance, msg: string, conversationId: number, senderId: number, clientOffset: number): Promise<number> {
  try {
    const res = await fastify.database.run(
      `INSERT INTO messages (conversation_id, sender_id, content, client_offset)
       VALUES (?, ?, ?, ?)`,
      [conversationId, senderId, msg, clientOffset]
    );
    console.log(`Message (content = ${msg}) inserted in conversation: `, conversationId); // ! DEBUG
    return (res.lastID);
  } catch (e) {
    console.error("Failed to insert message: ", e);
    return (-1);
  }
}

function handleMessages(fastify: FastifyInstance, socket: any, io: any) {
  socket.on("message", async ({ targetId, msg, clientOffset } :
    { targetId: string, msg: string, clientOffset: number }) => {
    const senderSessionId = socket.session.userId;
    const targetSessionId = userSockets.get(targetId);
    const conversationId = await getConversation(fastify, senderSessionId, targetSessionId!);
    if (conversationId === -1) return;
    const offset = await insertMessage(fastify, msg, conversationId, senderSessionId, clientOffset);
    const data = {
      senderId: socket.id,
      senderUsername: socket.username,
      msg,
      serverOffset: offset,
    };
    io.to(targetId).emit("message", data);  // Send to target
    socket.emit("message", data);           // Send to sender
  });
}

// ************************************************* Handle message recovery */
// async function handleRecovery(socket : any, fastify : FastifyInstance) { // ! filter by conversationId
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
// ! get conv ID

// ******************************************************** Get active users */
function listUsers(socket: Socket, io: any) {
  const users = [];
  for (let [id, socket] of io.of("/").sockets) {
    users.push({
      userID: id,
      username: socket.username,
    });
  }
  socket.emit("users", users);
}

// New connection - notify existing users
function notifyUsers(socket: Socket) {
   socket.broadcast.emit("User connected", {
    userID: socket.id,
    username: socket.username,
  });
}

// ************************************************************************* */
// Attach username to socket
async function getUsername(fastify: FastifyInstance, userId: number) { // ! Maybe query DB each time in case of change ?
  const row = await fastify.database.fetch_one(
    `SELECT username FROM user WHERE id = ?`,
    [userId]
  );
  if (!row) return ("Unknown user");
  return (row.username);
}

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  const io = fastify.io;
  authenticateSession(io, fastify);
  
  io.on("connection", async (socket) => {
    console.log(`User connected:`, socket.id);
    socket.username = await getUsername(fastify, socket.session.userId!);
    socket.join(socket.session.userId);                 // For sending events to all user sockets >> io.to(userId).emit("message", data);
    userSockets.set(socket.id, socket.session.userId);  // 1 tab = 1 session (if multiple tabs : Map<userId, Set<socket.id>>)
    handleMessages(fastify, socket, io);
    // handleRecovery(socket, fastify);
    listUsers(socket, io);
    notifyUsers(socket);
  });
};

export default fp(chatPlugin);

// ! handle disconnect + call on logout + session expiration
// io.emit(event, data) – Broadcast to all clients
// socket.emit(event, data) – Send to the specific socket
// (client to server = socket.emit("message", "Hello server!");)

// socket.broadcast.emit(event, data) – Send to everyone except sender

/*
If multiple sockets per userId :
if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket);

  In this case, disconnect handler : 
    socket.on("disconnect", () => {
    userSockets.get(userId).delete(socket);
    if (userSockets.get(userId).size === 0) {
      userSockets.delete(userId);
    }
  });
*/