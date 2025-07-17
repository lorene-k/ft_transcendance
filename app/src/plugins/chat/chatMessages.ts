import { FastifyInstance } from "fastify";
import { runInsertConversation, runInsertMessage } from "./chatHistory.js";
import { SocketManager } from "./chatSocketManager.js";
import { Socket, Namespace } from "socket.io";
import { checkBlockedTarget } from "./chatBlocks.js";

export interface Message {
    senderId: number;
    content: string;
    senderUsername?: string;
    targetId?: string;
    clientOffset?: string;
    serverOffset?: number;
    sentAt?: Date;
    convId?: number;
}
export let currConvId = 0;

export async function getAllConversations(fastify: FastifyInstance, userId: number, chatNamespace: Namespace, socketManager: SocketManager) {
    try {
        const convInfo: Record<number, string> = {};
        const conversations = await fastify.database.fetch_all(
        `SELECT id, 
        CASE WHEN user1_id = ? THEN user2_id ELSE user1_id END AS otherUserId
        FROM conversations WHERE user1_id = ? OR user2_id = ?`,
        [userId, userId, userId]
        );
        for (const conv of conversations) {
          const username = await socketManager.getUsername(conv.otherUserId);
          if (username) convInfo[conv.otherUserId] = username;
        }
        // console.log("All conversations:", conversations); // ! DEBUG - OK
        chatNamespace.to(userId.toString()).emit("allConversations", conversations, convInfo);
    } catch (err) {
        console.error("Failed to fetch conversations", err);
    }
}

async function getOrCreateConversation(fastify: FastifyInstance, senderId: number,
    targetId: number): Promise<number> {
    try {
        let [user1, user2] = [senderId!, targetId!].sort((a, b) => a - b);
        const conv = await fastify.database.fetch_one(
          `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
          [user1, user2]
        );
        // if (conv) console.log("Get conversation: conv =", conv); // ! DEBUG
        if (conv) return (conv.id);
        const conversationId = await runInsertConversation(fastify, user1, user2);
        // console.log(`Created new conversation between ${user1} and ${user2}, ID: ${conversationId}`); // ! DEBUG
        return (conversationId);
    } catch (err) {
        console.error("Failed to create or get conversation: ", err);
        return (-1);
    }
}

async function insertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
    try {
        const messageId = await runInsertMessage(fastify, msg);
        // console.log(`Message inserted with ID: ${messageId}, content: ${msg.content}`); // ! DEBUG
        return (messageId);
    } catch (err) {
        console.error("Failed to insert message: ", err);
        return (-1);
    }
}

export async function handleMessages(fastify: FastifyInstance, socket: Socket, chatNamespace: Namespace) {
    socket.on("message", async (msg: Message, callback) => {
        try {
            msg.senderId = socket.session.userId.toString();
            const senderBlocked = await checkBlockedTarget(msg.senderId, parseInt(msg.targetId!), fastify);
            msg.senderUsername = socket.username;
            const conversationId = await getOrCreateConversation(fastify, socket.session.userId, parseInt(msg.targetId!));
            if (conversationId === -1) return (callback({ status: "DBerror" }));
            msg.convId = currConvId = conversationId;
            msg.serverOffset = await insertMessage(fastify, msg);
            if (!senderBlocked) chatNamespace.to(msg.targetId!).emit("message", msg);
            chatNamespace.to(msg.senderId.toString()).emit("message", msg);
            return callback({ status: "ok", serverOffset: msg.serverOffset });
        } catch (err: any) {
            if (err.errno === "SQLITE_CONSTRAINT") callback({ status: "duplicate" });
            console.error("Message insert failed:", err);
            callback({ status: "retry" });
        }
    });
}