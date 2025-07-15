import { FastifyInstance } from "fastify";
import { Socket } from "socket.io";
import { Message, currConvId } from './chatMessages.js';

export async function handleRecovery(socket: Socket, fastify: FastifyInstance, io: any) {
    // console.log("Recovery triggered. Socket recovered:", socket.recovered);  // ! DEBUG
    // console.log("Fetching messages after offset:", socket.handshake.auth.serverOffset);  // ! DEBUG
    if (!socket.recovered) {
      try {
        const valid = await fastify.database.fetch_one(
          `SELECT 1 FROM conversations 
           WHERE id = ? AND (user1_id = ? OR user2_id = ?)`,
          [currConvId, socket.session.userId, socket.session.userId]
        );
        if (!valid) return;
        const messages = await fastify.database.fetch_all(
          `SELECT id, content, sender_id, sent_at FROM messages
           WHERE conversation_id = ? AND id > ? 
           ORDER BY id ASC`,
          [currConvId, socket.handshake.auth.serverOffset || 0]
          );
        for (const entry of messages) {
          const msg: Message = {
          senderId: entry.sender_id,
          content: entry.content,
          sentAt: entry.sent_at,
          serverOffset: entry.id,
          }
          // console.log("Recovered message:", msg); // ! DEBUG
          io.to(socket.session.userId!.toString()).emit("message", msg);
        }
      } catch (err) {
        console.error("Message recovery failed:", err);
      }
    }
  }
  