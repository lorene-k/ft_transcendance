import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

// GET /api/chat/conversation?userA=1&userB=2
export function getConversation(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const { userA, userB } = request.query as { userA: string; userB: string };
        let user1 = parseInt(userA);
        let user2 = parseInt(userB);
        [user1, user2] = [user1, user2].sort((a, b) => a - b);
        try {
          const convId = await fastify.database.fetch_one(
            `SELECT id FROM conversations 
             WHERE (user1_id = ? AND user2_id = ?)`,
            [user1, user2]
          );
          if (!convId) return (reply.status(200).send({ message: "New conversation" }));
          return (reply.send(convId));
        } catch (err) {
          console.error("Failed to fetch conversation", err);
          reply.status(500).send({ error: "Database error" });
        }
    };
}

// GET /api/chat/:conversationId/messages
export function getMessages(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const { conversationId } = request.params as { conversationId: string };
        try {
          const messages = await fastify.database.fetch_all(
            "SELECT * FROM messages WHERE conversation_id = ? ORDER BY id ASC",
            [conversationId]
          );
          return (reply.send(messages));
        } catch (err) {
          reply.status(500).send({ error: "Failed to fetch messages" });
        }
    };
}