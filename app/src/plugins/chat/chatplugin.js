import fp from "fastify-plugin";
import { sendUserId, setSessionInfo, authenticateSession, socketToSession, userSockets } from "./chatAuthenticate.js";
import { handleMessages, getAllConversations } from "./chatMessages.js";
import { handleRecovery } from "./chatRecovery.js";
import { listUsers, notifyUsers } from "./chatUsers.js";
function handleDisconnect(socket) {
    socket.on("disconnect", () => {
        const userId = socketToSession.get(socket.id);
        if (userId) {
            const socketSet = userSockets.get(userId);
            if (socketSet) {
                socketSet.delete(socket.id);
                if (socketSet.size === 0) {
                    userSockets.delete(userId);
                }
            }
        }
        socketToSession.delete(socket.id);
    });
}
const chatPlugin = async (fastify) => {
    const io = fastify.io;
    authenticateSession(io, fastify);
    io.on("connection", async (socket) => {
        await setSessionInfo(fastify, socket);
        sendUserId(socket);
        handleMessages(fastify, socket, io);
        listUsers(socket, io);
        notifyUsers(socket);
        getAllConversations(fastify, socket.session.userId, io);
        handleRecovery(socket, fastify, io);
        handleDisconnect(socket);
    });
};
export default fp(chatPlugin);
// TODO - Handle blocks
// After merge : Check dependencies & socket.io versions ("socket.io": "^4.7.2", "socket.io-client": "^4.7.2")
// Check Socket.IO versions mismatch (rare but can cause ack issues)
// ! Careful with types (check typeof() if pb)
