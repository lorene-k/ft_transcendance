import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync, Session } from "fastify";
import { parse } from "cookie";
import { Socket } from "socket.io";

// *********************** Handle session */
function setupSocketAuth(io : any, fastify : FastifyInstance) {
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

// *********************** Handle messages & db interaction */
function handleConnection(fastify: FastifyInstance, socket: any, io: any) {
  console.log(`User connected:`, socket.id);
  socket.on("message", async (msg: string) => {
    let res;
    try {
      res = await fastify.database.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (e) {
      console.error("Failed to insert message in database: ", e);       // TODO handle DB & failure
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

// *********************** Handle message recovery */
async function handleRecovery(socket : any, fastify : FastifyInstance) {
  if (!socket.recovered) {
    try {
      await fastify.database.each('SELECT id, content FROM messages WHERE id > ?', // ! change this when changing db table
        [socket.handshake.auth.serverOffset || 0],
        (_err: Error | null, row: { id: number; content: string }) => {
          socket.emit('message', { senderId: 'server', msg: row.content, serverOffset: row.id });
        }
      )
    } catch (e) {
      console.error("Failed to recover messages: ", e);
    }
  }
}

// *********************** Get active users */
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

// ******************************************* */
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
  // const userSockets = new Map<number, string>();       // Attach user ID to socket for later use
  setupSocketAuth(io, fastify);
  
  io.on("connection", async (socket) => {
    socket.username = await getUsername(fastify, socket.session.userId!);
    handleConnection(fastify, socket, io);
    // userSockets.set(socket.session.user.id, socket.id); // 1 tab = 1 session (if multiple tabs : Map<userId, Set<socket.id>>)
    handleRecovery(socket, fastify);
    listUsers(socket, io);
    notifyUsers(socket);
    // ! handle disconnect + call on logout + session expiration
  });
};

export default fp(chatPlugin);

// SERVER-SIDE
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