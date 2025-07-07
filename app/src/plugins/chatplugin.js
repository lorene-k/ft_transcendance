import fp from "fastify-plugin";
import { parse } from "cookie";
async function getUsername(fastify, userId) {
    const row = await fastify.database.fetch_one(`SELECT username FROM user WHERE id = ?`, [userId]);
    if (!row)
        return ("Unknown user");
    return (row.username);
}
// Verify session before connection & link session to socket
function setupSocketAuth(io, fastify) {
    io.use((socket, next) => {
        const cookies = parse(socket.handshake.headers.cookie || "");
        const signedSessionId = cookies.sessionId;
        if (!signedSessionId)
            return (next(new Error("No session Id found")));
        const sessionId = signedSessionId.split(".")[0];
        fastify.sessionStore.get(sessionId, (err, session) => {
            const username = getUsername(fastify, session.userId);
            if (err || !session || !session.authenticated)
                return (next(new Error("Unauthorized connection")));
            socket.session = session; // ! Extend socket type in interface ?
            fastify.sessionStore.set(sessionId, session, (e) => {
                if (e)
                    return (next(new Error("No session Id found")));
                next();
            });
        });
    });
}
// Handle messages & db interaction
function handleConnection(fastify, socket, io) {
    console.log(`User connected:`, socket.id);
    socket.on("message", async (msg) => {
        let res;
        try {
            res = await fastify.database.run('INSERT INTO messages (content) VALUES (?)', msg);
        }
        catch (e) {
            console.error("Failed to insert message in database: ", e); // TODO handle failure
        }
        const data = { senderId: socket.id, msg, serverOffset: res.lastId };
        io.emit("message", data);
    });
}
/*
! HANDLE DMs
socket.on("private-message", ({ toUserId, message }) => {
    const targetSocketId = userSockets.get(toUserId);
    if (targetSocketId) {
      io.to(targetSocketId).emit("private-message", {
        from: userId,
        message,
      });
    }
  });

! HANDLE DISCONNECT
socket.on("disconnect", () => {
    userSockets.delete(userId);
  });
*/
/*
! DMs with username
socket.on("private-message", async ({ toUsername, message }) => {
  // Find the socket of the target user by username
  const toSocketEntry = [...socketUsers.entries()].find(
    ([, user]) => user.username === toUsername
  );

  if (!toSocketEntry) return;

  const [toSocketId, toUser] = toSocketEntry;

  // Save message to DB
  await fastify.database.run(
    `INSERT INTO messages (senderId, receiverId, content) VALUES (?, ?, ?)`,
    [socket.userId, toUser.userId, message]
  );

  // Send to recipient
  io.to(toSocketId).emit("private-message", {
    fromUsername: socket.username,
    message,
  });

  // Optionally, send to sender too
  socket.emit("private-message", {
    fromUsername: socket.username,
    message,
    toUsername,
  });
});
*/
// Handle message recovery after disconnection
async function handleRecovery(socket, fastify) {
    if (!socket.recovered) {
        try {
            await fastify.database.each('SELECT id, content FROM messages WHERE id > ?', // ! change this when changing db table
            [socket.handshake.auth.serverOffset || 0], (_err, row) => {
                socket.emit('message', { senderId: 'server', msg: row.content, serverOffset: row.id });
            });
        }
        catch (e) {
            console.error("Failed to recover messages: ", e);
        }
    }
}
const chatPlugin = async (fastify) => {
    const io = fastify.io;
    // const userSockets = new Map<number, string>();       // ! Attach user ID to socket for later use
    setupSocketAuth(io, fastify);
    io.on("connection", async (socket) => {
        socket.username = await getUsername(fastify, socket.session.userId);
        handleConnection(fastify, socket, io);
        // userSockets.set(socket.session.user.id, socket.id); // ! 1 tab = 1 session (if multiple tabs : Map<userId, Set<socket.id>>)
        handleRecovery(socket, fastify);
    });
};
export default fp(chatPlugin);
/*
interface Session {
  user?: { id: number; username: string };
  authenticated?: boolean;
  socketId?: string;
}

interface Socket {
  session?: MySession;
  userId?: number;
}
*/
// SERVER-SIDE
// io.emit(event, data) – Broadcast to all clients
// socket.emit(event, data) – Send to the specific socket
// (client to server = socket.emit("message", "Hello server!");)
// socket.broadcast.emit(event, data) – Send to everyone except sender
/*
Handle DMs
1. Identify each user (via session, username, or user ID).
2. Map user IDs to socket IDs.
3. Send messages to specific socket IDs.

*/ 
