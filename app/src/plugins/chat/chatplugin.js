import fp from "fastify-plugin";
import { SocketManager } from "./chatSocketManager.js";
import { handleMessages, getAllConversations } from "./chatMessages.js";
import { handleRecovery } from "./chatRecovery.js";
import { listUsers, notifyUsers } from "./chatUsers.js";
import { handleBlocks } from "./chatBlocks.js";
const chatPlugin = async (fastify) => {
    const chatNamespace = fastify.io.of("/chat");
    const socketManager = new SocketManager(fastify);
    socketManager.authenticate(chatNamespace);
    chatNamespace.on("connection", async (socket) => {
        await socketManager.setSessionInfo(socket);
        socketManager.sendUserId(socket);
        handleMessages(fastify, socket, chatNamespace);
        listUsers(socket, chatNamespace, socketManager);
        notifyUsers(socket);
        getAllConversations(fastify, socket.session.userId, chatNamespace, socketManager);
        handleBlocks(socket, fastify);
        handleRecovery(socket, fastify, chatNamespace);
        socketManager.handleDisconnect(socket);
    });
};
export default fp(chatPlugin);
// ! Test all if deleting user (conversations, blocks, etc.)
