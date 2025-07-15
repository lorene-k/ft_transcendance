import fp from "fastify-plugin";
import { SocketManager } from "./chatSocketManager.js";
import { handleMessages, getAllConversations } from "./chatMessages.js";
import { handleRecovery } from "./chatRecovery.js";
import { listUsers, notifyUsers } from "./chatUsers.js";
import { handleBlocks } from "./chatBlocks.js";
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
        handleBlocks(socket, fastify);
        handleRecovery(socket, fastify, io);
        socketManager.handleDisconnect(socket);
    });
};
export default fp(chatPlugin);
// ! Test all if deleting user (conversations, blocks, etc.)
