import { FastifyInstance } from 'fastify';
import { Message } from './chatMessages.js';

// Insert new conversation into database
export async function runInsertConversation(fastify: FastifyInstance, user1: number, user2: number): Promise<number> {
    return new Promise((resolve, reject) => {
      fastify.database.run(
        'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)',
        [user1, user2],
        function (this: any, err: Error | null) {
        if (err) {
          console.error("Failed to create conversation:", err.message);
          return (reject(-1));
        }
        resolve(this.lastID);
      });
    });
}

// Insert new message into database
export function runInsertMessage(fastify: FastifyInstance, msg: Message): Promise<number> {
  return new Promise((resolve, reject) => {
    fastify.database.run(
      `INSERT INTO messages (conversation_id, sender_id, content, client_offset)
      VALUES (?, ?, ?, ?)`,
      [msg.convId, msg.senderId, msg.content, msg.clientOffset],
      function (this: any, err: Error | null) {
        if (err) {
          console.error("Error inserting message:", err.message);
          return (reject(-1));
        }
        resolve(this.lastID);
      }
    );
  });
}