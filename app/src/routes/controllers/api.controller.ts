import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";

export function check_user(fastify: FastifyInstance) {
    // return the async function needed by the get handler
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const username = (request.body as { username: string }).username;
        fastify.database.get('SELECT id FROM users WHERE username = ?', username, (err: Error, row: any[]) => {
            if (err) {
                console.error(err)
                return reply.status(500).send({ error: 'no user found', exists: 0 });
            }

            reply.send({ exists: 1 });
        });
    }

}
