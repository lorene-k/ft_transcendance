import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

interface MessageBody {
    conversationId: number;
    senderId: number;
    content: string;
    clientOffset?: string;
}

// POST /api/chat/conversation
export function postConversation(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
      let { userA, userB } = request.body as { userA: number; userB: number };
  
      // Ensure order to prevent duplicates (e.g., (A,B) vs (B,A))
      if (userA > userB) [userA, userB] = [userB, userA];
      try {
        const conv = await fastify.database.fetch_one(
          `SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
          [userA, userB]
        );
        if (conv) return reply.send({ conversationId: conv.id });
        // Create conv entry if doesn't exist
        const result = await fastify.database.run(
          `INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
          [userA, userB]
        );
        return reply.send({ conversationId: result.lastID });
        } catch (err) {
          console.error("Failed to create or fetch conversation:", err);
          reply.status(500).send({ error: "Server error while creating conversation" });
        }
    };
}
  

//   POST /api/chat/:conversationId/messages
export function postMessage(fastify: FastifyInstance) {
    return async function (request: FastifyRequest<{ Body: MessageBody}>, reply: FastifyReply) {
      const { conversationId, senderId, content, clientOffset } = request.body;
      try {
        const res = await fastify.database.run(
          `INSERT INTO messages (conversation_id, sender_id, content, client_offset)
           VALUES (?, ?, ?, ?)`,
          [conversationId, senderId, content, clientOffset || null]
        );
        reply.send({ messageId: res.lastID });
      } catch (err) {
        console.error("Failed updating database:", err);
        reply.status(500).send({ error: "Server error while sending message" });
      }
    };
}

// GET /api/chat/conversation?userA=1&userB=2
export function getConversation(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const { userA, userB } = request.query as { userA: number; userB: number };
        try {
          const convId = await fastify.database.fetch_one(
            `SELECT id FROM conversations 
             WHERE (user1_id = ? AND user2_id = ?) 
                OR (user1_id = ? AND user2_id = ?)`,
            [userA, userB, userB, userA]
          );
          if (!convId) return reply.status(404).send({ error: "Conversation not found" });
          return reply.send(convId);
        } catch (err) {
          console.error("Failed to fetch conversation", err);
          return reply.status(500).send({ error: "Database error" });
        }
    };
}

// GET /api/chat/:conversationId/messages
export function getMessages(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const { conversationId } = request.params as { conversationId: string };
        try {
          const messages = await fastify.database.fetch_all(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC",
            [conversationId]
          );
          reply.send(messages);
        } catch (err) {
          reply.status(500).send({ error: "Failed to fetch messages" });
        }
    };
}