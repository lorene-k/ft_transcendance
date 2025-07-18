import fp from "fastify-plugin";
import { FastifyPluginAsync } from "fastify";
import { Socket } from "socket.io";
import { handleMessages, getAllConversations } from "./chatMessages.js";
import { handleBlocks } from "./chatBlocks.js";
import handleRecovery from "./chatRecovery.js";
import getActiveUsers from "./chatUsers.js";
import SocketManager from "./SocketManager.js";
import handleGameInvites from "./gameInvites.js"; // Import the game invite handler

const chatPlugin: FastifyPluginAsync = async (fastify) => {
  const chatNamespace = fastify.io.of("/chat");
  const socketManager = new SocketManager(fastify);
  socketManager.authenticate(chatNamespace);
  
  chatNamespace.on("connection", async (socket: Socket) => {   // ! ADD namespace io.of("/chat")
    await socketManager.setSessionInfo(socket);
    socketManager.sendUserId(socket);
    handleMessages(fastify, socket, chatNamespace);
    getActiveUsers(socket, chatNamespace, socketManager);
    getAllConversations(fastify, socket.session.userId, chatNamespace, socketManager);
    handleBlocks(socket, fastify);
    handleGameInvites(socket, chatNamespace);
    handleRecovery(socket, fastify, chatNamespace);
    socketManager.handleDisconnect(socket);
  });
};

export default fp(chatPlugin);

// ! Test all if deleting user (conversations, blocks, etc.)