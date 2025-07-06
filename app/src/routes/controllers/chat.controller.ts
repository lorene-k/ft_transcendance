import { FastifyRequest, FastifyReply, FastifyInstance } from 'fastify';

// HTTP REST API routes for chat (message history, send message, block user, see blocked users)

// ! display history query DB for messages
// export function getMessages(fastify: FastifyInstance) {
//   return async function (request: FastifyRequest, reply: FastifyReply) {
//     fastify.database.all('SELECT * FROM message ORDER BY timestamp DESC', [], (err, rows) => {
//       if (err) {
//         console.error(err);
//         return reply.status(500).send({ error: 'Failed to fetch messages' });
//       }
//       reply.send({ messages: rows });
//     });
//   };
// }

// ! insert message to DB
// export function postMessage(fastify: FastifyInstance) {
//   return async function (request: FastifyRequest, reply: FastifyReply) {
//     const { sender_id, receiver_id, content } = request.body as { sender_id: number; receiver_id: number; content: string; };
//     fastify.database.run(
//       'INSERT INTO message (sender_id, receiver_id, content) VALUES (?, ?, ?)',
//       [sender_id, receiver_id, content],
//       function (err) {
//         if (err) {
//           console.error(err);
//           return reply.status(500).send({ error: 'Failed to insert message' });
//         }
//         reply.send({ success: true, messageId: this.lastID });
//       }
//     );
//   };
// }