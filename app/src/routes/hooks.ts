import { FastifyInstance, FastifyPluginOptions, FastifyRequest, FastifyReply } from "fastify";

export async function authentification_preHandler(request: FastifyRequest<{ Params: any | null }>, reply: FastifyReply) {
    const cookie = request.session.authenticated
    if (!cookie) {
        return reply.code(401).send({ error: "Unauthorized" });
    }
}

interface param {
    userId: number,
}

interface Ifriendremove {
    username: string,
}
