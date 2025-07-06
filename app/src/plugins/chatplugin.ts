
import fp from "fastify-plugin";
import { FastifyInstance, FastifyPluginAsync } from "fastify";
// import { parse } from "cookie";

// function setupSocketAuth(io : any, fastify : FastifyInstance) { // ! NOT WORKING - session.authenticated = undefined (unavailable cookie pb ?)
//   io.use(async (socket: any, next: Function) => {
//   const req = (socket as any).request;
//   const cookies = parse(req.headers.cookie || "");
//   const sessionId = cookies["sessionId"];
//   if (!sessionId) return next(new Error("No session"));

//   fastify.sessionStore.get(sessionId, (err : Error | null, session : any) => {
//     if (err || !session || !session.authenticated)
//       return next(new Error("Unauthorized connection"));
//     console.log("Session retrieved:", session);
//     (socket as any).session = session;
//     console.log("Session user ID = ", socket.session.userId);
//     next();
//   });
//   });
// }

function handleConnection(fastify : FastifyInstance, socket : any, io : any) {
  console.log(`User connected:`, socket.id);
  socket.on("message", async (msg: string) => {
    let res;
    try {
      res = await fastify.database.run('INSERT INTO messages (content) VALUES (?)', msg);
    } catch (e) {
      console.error("Failed to insert message in database: ", e);       // TODO handle failure
    }
    const data = { senderId: socket.id, msg, serverOffset: res.lastId };
    io.emit("message", data);
  });
}

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

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  const io = fastify.io;
  // const userSockets = new Map<number, string>();       // ! Attach user ID to socket for later use
  // setupSocketAuth(io, fastify);

  io.on("connection", (socket) => {
    handleConnection(fastify, socket, io);
    // userSockets.set(socket.session.user.id, socket.id); // ! 1 tab = 1 session (if multiple tabs : Map<userId, Set<socket.id>>)
    handleRecovery(socket, fastify);
  });
};

export default fp(chatPlugin);