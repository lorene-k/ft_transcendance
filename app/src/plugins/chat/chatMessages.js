import { runInsertConversation, runInsertMessage } from './chatHistory.js';
export let currConvId = 0;
export async function getAllConversations(fastify, userId, io, socketManager) {
    try {
        const convInfo = {};
        const conversations = await fastify.database.fetch_all(`SELECT id, 
        CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId
        FROM conversations WHERE user1_id = ? OR user2_id = ?`, [userId, userId, userId]);
        for (const conv of conversations) {
            const username = await socketManager.getUsername(conv.otherUserId);
            if (username)
                convInfo[conv.otherUserId] = username;
        }
        io.to(userId.toString()).emit("allConversations", conversations, convInfo);
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
    catch (err) {
        console.error("Failed to create or get conversation: ", err);
        return (-1);
    }
}
async function insertMessage(fastify, msg) {
    try {
        const messageId = await runInsertMessage(fastify, msg);
        return (messageId);
    }
    catch (err) {
        console.error("Failed to insert message: ", err);
        return (-1);
    }
}
export function handleMessages(fastify, socket, io) {
    socket.on("message", async (msg, callback) => {
        msg.senderId = socket.session.userId.toString();
        msg.senderUsername = socket.username;
        try {
            const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId));
            if (conversationId === -1)
                return (callback({ status: "error" }));
            msg.convId = currConvId = conversationId;
            msg.serverOffset = await insertMessage(fastify, msg);
            io.to(msg.targetId).emit("message", msg);
            io.to(msg.senderId).emit("message", msg);
            callback({ status: "ok", serverOffset: msg.serverOffset });
        }
        catch (err) {
            if (err.errno === "SQLITE_CONSTRAINT") {
                callback({ status: "duplicate" });
            }
            else {
                console.log("Message insert failed:", err);
                callback({ status: "retry" });
            }
        }
    });
}
