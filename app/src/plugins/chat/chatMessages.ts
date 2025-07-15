import { FastifyInstance } from 'fastify';
import { Message } from './chatplugin.js';
import { runInsertConversation, runInsertMessage } from './chatHistory.js';
import { getUsername } from './chatAuthenticate.js';
import { Socket } from 'socket.io';

export async function getAllConversations(fastify: FastifyInstance, userId: number, io: any) {
    try {
        const convInfo: Record<number, string> = {};
        const conversations = await fastify.database.fetch_all(
        `SELECT id, 
        CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId
        FROM conversations WHERE user1_id = ? OR user2_id = ?`,
        [userId, userId, userId]
        );
        for (const conv of conversations) {
          const username = await getUsername(fastify, conv.otherUserId);
          if (username) convInfo[conv.otherUserId] = username;
        }
        io.to(userId.toString()).emit("allConversations", conversations, convInfo);
    } catch (err) {
        console.error("Failed to fetch conversations", err);
    }
  }
  
async function getOrCreateConversation(fastify: FastifyInstance, senderId: number,
    targetId: number): Promise<number> {
    let [user1, user2] = [senderId!, targetId!].sort((a, b) => a - b);
    try {
        const conv = await fastify.database.fetch_one(
          `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
          [user1, user2]
        );
        if (conv) return (conv.id);
        const conversationId = await runInsertConversation(fastify, user1, user2);
        return (conversationId);
    } catch (err) {
        console.error("Failed to create or get conversation: ", err);
        return (-1);
    }
}
  
async function insertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
    try {
        const messageId = await runInsertMessage(fastify, msg);
        return (messageId);
    } catch (err) {
        console.error("Failed to insert message: ", err);
        return (-1);
    }
}
  
export function handleMessages(fastify: FastifyInstance, socket: Socket, io: any) {
    socket.on("message", async (msg: Message, callback) => {
        msg.senderId = socket.session.userId.toString();
        msg.senderUsername = socket.username;
        try {
            const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId!));
            if (conversationId === -1) return (callback({ status: "error" }));
            msg.convId = conversationId; // ! CHECK (redundant ?)
            msg.serverOffset = await insertMessage(fastify, msg);
            io.to(msg.targetId).emit("message", msg);
            io.to(msg.senderId).emit("message", msg);
            callback({ status: "ok", serverOffset: msg.serverOffset });
        } catch (err: any) {
            if (err.errno === "SQLITE_CONSTRAINT") {
              callback({ status: "duplicate" });
            } else {
              console.log("Message insert failed:", err);
              callback({ status: "retry" });
            }
        }
    });
}