import { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

export async function navbar(request: FastifyRequest, reply: FastifyReply) {
    if (request.session.authenticated)
        return reply.sendFile('views/navbar/logged.html');
    else {
        return reply.sendFile('views/navbar/default.html');
    }
}

export async function footer(request: FastifyRequest, reply: FastifyReply) {
    return reply.sendFile('views/footer.html');
}

export function getRoot(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        return reply.sendFile("index.html");
    };
}

export function getChat() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.session.authenticated) return reply.redirect("/");
        return reply.sendFile("views/chat.html");
    };
}

export function getDashboard() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.session.authenticated) return reply.redirect("/");
        return reply.sendFile("views/dashboard.html");
    };
}

export function play() {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.session.authenticated) return reply.redirect("/");
        return reply.sendFile("views/play.html");
    }
}
