// GET /api/chat/conversation?userA=1&userB=2
export function getConversation(fastify) {
    return async function (request, reply) {
        const { userA, userB } = request.query;
        let user1 = parseInt(userA);
        let user2 = parseInt(userB);
        [user1, user2] = [user1, user2].sort((a, b) => a - b);
        try {
            const convId = await fastify.database.fetch_one(`SELECT id FROM conversations 
             WHERE (user1_id = ? AND user2_id = ?)`, [user1, user2]);
            if (!convId)
                return (reply.status(200).send({ message: "New conversation" }));
            return (reply.send(convId));
        }
        catch (err) {
            console.error("Failed to fetch conversation", err);
            reply.status(500).send({ error: "Database error" });
        }
    };
}
// GET /api/chat/:conversationId/messages
export function getMessages(fastify) {
    return async function (request, reply) {
        const { conversationId } = request.params;
        try {
            const messages = await fastify.database.fetch_all("SELECT * FROM messages WHERE conversation_id = ? ORDER BY sent_at ASC", [conversationId]);
            return (reply.send(messages));
        }
        catch (err) {
            reply.status(500).send({ error: "Failed to fetch messages" });
        }
    };
}
