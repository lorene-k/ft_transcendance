import fp from "fastify-plugin";
import { SocketManager } from "./chatSocketManager.js";
import { handleMessages, getAllConversations } from "./chatMessages.js";
import { handleRecovery } from "./chatRecovery.js";
import { listUsers, notifyUsers } from "./chatUsers.js";
const chatPlugin = async (fastify) => {
    const io = fastify.io;
    const socketManager = new SocketManager(fastify);
    socketManager.authenticate(io);
    io.on("connection", async (socket) => {
        await socketManager.setSessionInfo(socket);
        socketManager.sendUserId(socket);
        handleMessages(fastify, socket, io);
        listUsers(socket, io, socketManager);
        notifyUsers(socket);
        getAllConversations(fastify, socket.session.userId, io, socketManager);
        handleRecovery(socket, fastify, io);
        socketManager.handleDisconnect(socket);
    });
};
export default fp(chatPlugin);
// TODO - Handle blocks
// After merge : Check dependencies & socket.io versions ("socket.io": "^4.7.2", "socket.io-client": "^4.7.2")
// Check Socket.IO versions mismatch (rare but can cause ack issues)
// ! Careful with types (check typeof() if pb)
