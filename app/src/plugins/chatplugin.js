import fp from "fastify-plugin";
import { parse } from "cookie";
const userSockets = new Map();
const socketToSession = new Map();
// ********************************************************** Authentication */
function authenticateSession(io, fastify) {
    io.use((socket, next) => {
        const cookies = parse(socket.handshake.headers.cookie || "");
        const signedSessionId = cookies.sessionId;
        if (!signedSessionId)
            return (next(new Error("No session Id found")));
        const sessionId = signedSessionId.split(".")[0];
        fastify.sessionStore.get(sessionId, (err, session) => {
            if (err || !session || !session.authenticated)
                return (next(new Error("Unauthorized connection")));
            socket.session = session;
            fastify.sessionStore.set(sessionId, session, (e) => {
                if (e)
                    return (next(new Error("No session Id found")));
                next();
            });
        });
    });
}
// Attach username to socket
async function getUsername(fastify, userId) {
    const row = await fastify.database.fetch_one(`SELECT username FROM user WHERE id = ?`, [userId]);
    if (!row)
        return ("Unknown user");
    return (row.username);
}
// Send userId and username to client
function sendUserId(socket) {
    socket.emit("session", {
        sessionId: socket.session.userId.toString(),
        username: socket.username,
    });
}
// ********************************************************** Update history */
async function runInsertConversation(fastify, user1, user2) {
    return new Promise((resolve, reject) => {
        fastify.database.run('INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [user1, user2], function (err) {
            if (err) {
                console.error("Failed to create conversation:", err.message);
                return (reject(-1));
            }
            console.log(`Created new conversation with ID ${this.lastID} between ${user1} and ${user2}`); // ! DEBUG
            resolve(this.lastID);
        });
    });
}
function runInsertMessage(fastify, msg, conversationId, senderId, clientOffset) {
    return new Promise((resolve, reject) => {
        fastify.database.run(`INSERT INTO messages (conversation_id, sender_id, content, client_offset) VALUES (?, ?, ?, ?)`, [conversationId, senderId, msg, clientOffset], function (err) {
            if (err) {
                console.error("Error inserting message:", err.message);
                return (reject(-1));
            }
            console.log(`Message inserted with ID ${this.lastID}`);
            resolve(this.lastID);
        });
    });
}
// ***************************************** Handle messages & conversations */
async function getAllConversations(fastify, userId, io) {
    try {
        const conversations = await fastify.database.fetch_all(`SELECT id, 
    CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId 
    FROM conversations WHERE user1_id = ? OR user2_id = ?`, [userId, userId, userId]);
        io.to(userId.toString()).emit("allConversations", conversations);
    }
    catch (err) {
        console.error("Failed to fetch conversations", err);
    }
}
async function getOrCreateConversation(fastify, senderId, targetId) {
    let [user1, user2] = [senderId, targetId].sort((a, b) => a - b);
    try {
        const conv = await fastify.database.fetch_one(`SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`, [user1, user2]);
        if (conv)
            return (conv.id);
        const conversationId = await runInsertConversation(fastify, user1, user2);
        return (conversationId);
    }
    catch (e) {
        console.error("Failed to create or get conversation: ", e);
        return (-1);
    }
}
async function insertMessage(fastify, msg, conversationId, senderId, clientOffset) {
    try {
        const messageId = await runInsertMessage(fastify, msg, conversationId, senderId, clientOffset);
        console.log(`Message (content = ${msg}) inserted in conversation: `, conversationId); // ! DEBUG
        return (messageId);
    }
    catch (e) {
        console.error("Failed to insert message: ", e);
        return (-1);
    }
}
function handleMessages(fastify, socket, io) {
    socket.on("message", async ({ targetId, msg, clientOffset }) => {
        const senderId = socket.session.userId;
        const conversationId = await getOrCreateConversation(fastify, senderId, parseInt(targetId));
        if (conversationId === -1)
            return;
        const offset = await insertMessage(fastify, msg, conversationId, senderId, clientOffset);
        const data = {
            senderId: socket.session.userId.toString(),
            senderUsername: socket.username,
            msg,
            serverOffset: offset,
        };
        io.to(targetId.toString()).emit("message", data);
        io.to(senderId.toString()).emit("message", data);
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
function listUsers(socket, io) {
    const users = [];
    for (const [sessionId, socketIds] of userSockets) {
        const firstSocketId = socketIds.values().next().value; // Get first socket ID
        const sock = io.of("/").sockets.get(firstSocketId); // Get Socket instance
        if (sock) {
            users.push({
                userId: sessionId.toString(),
                username: sock.username,
            });
            // console.log(`List users: userID = ${sessionId}, username = ${sock.username}`); // ! DEBUG
        }
    }
    socket.emit("users", users);
}
// New connection - notify existing users
function notifyUsers(socket) {
    socket.broadcast.emit("User connected", {
        userId: socket.session.userId.toString(),
        username: socket.username,
    });
    // console.log(`New user connected: userID = ${socket.session.userId.toString()}, username = ${socket.username}`); // ! DEBUG
}
// ************************************************************************* */
const chatPlugin = async (fastify) => {
    const io = fastify.io;
    authenticateSession(io, fastify);
    io.on("connection", async (socket) => {
        // console.log(`Socket connected:`, socket.id); // ! DEBUG
        const sessionId = socket.session.userId;
        socket.username = await getUsername(fastify, sessionId);
        socket.join(sessionId.toString());
        if (!userSockets.has(sessionId))
            userSockets.set(sessionId, new Set());
        userSockets.get(sessionId).add(socket.id);
        socketToSession.set(socket.id, sessionId);
        sendUserId(socket);
        handleMessages(fastify, socket, io);
        // handleRecovery(socket, fastify);
        listUsers(socket, io);
        notifyUsers(socket);
        getAllConversations(fastify, sessionId, io);
    });
};
export default fp(chatPlugin);
// ! handle disconnect + call on logout + session expiration
// io.emit(event, data) – Broadcast to all clients
// socket.emit(event, data) – Send to the specific socket
// (client to server = socket.emit("message", "Hello server!");)
// socket.broadcast.emit(event, data) – Send to everyone except sender
/*
  Disconnect :
   socket.on("disconnect", () => {
  const userId = socketToSession.get(socket.id);
  if (userId) {
    const set = userSockets.get(userId);
    if (set) {
      set.delete(socket.id);
      if (set.size === 0) userSockets.delete(userId);
    }
  }
  socketToSession.delete(socket.id);
});

*/ 
