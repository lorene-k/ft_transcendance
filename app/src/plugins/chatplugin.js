import fp from "fastify-plugin";
const chatPlugin = async (fastify) => {
    const io = fastify.io;
    // console.log("Checking session...");
    //   // Middleware to authorize socket connection based on session
    //   io.use(async (socket, next) => {
    //     const req = (socket as any).request; // ! CHANGE LATER: Use correct type
    //     // Parse cookies
    //     const cookieHeader = req.headers.cookie;
    //     const cookies = cookieHeader ? parse(cookieHeader) : {};
    //     const sessionId = cookies["sessionId"]; // adjust if your cookie name differs
    //     if (!sessionId)
    //       return (next(new Error("No session ID")));
    //     // Use fastify-session store to load session
    //     fastify.sessionStore.get(sessionId, (err: any, session: any) => {
    //       if (err || !session?.authenticated)
    //         return (next(new Error("Unauthorized")));
    //       // Attach session to socket
    //       (socket as any).session = session;
    //       next(); // allow connection
    //     });
    //   });
    console.log("Connecting socket...");
    io.on("connection", (socket) => {
        console.log(`User connected:`, socket.id);
        socket.on("message", (msg) => {
            const data = {
                senderId: socket.id,
                msg,
            };
            io.emit("message", data);
        });
    });
};
export default fp(chatPlugin);
