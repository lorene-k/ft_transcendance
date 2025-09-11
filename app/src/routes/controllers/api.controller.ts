import { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import { FastifySessionObject } from "@fastify/session";
import { GameManager } from "../../game/gameManager.js";
import { Player } from "../../../includes/custom.js";

export function addfriend(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const id = (request.body as { id: number }).id
        if (await fastify.database.fetch_one('SELECT id FROM friends WHERE user_1 = ? AND user_2 = ?', [request.session.userId, id]))
            return reply.send(200).send({ status: "entry already exist" })

        fastify.database.run('INSERT INTO friends (user_1, user_2) VALUES (?, ?)', [request.session.userId, id])
        return reply.send(200).send({ status: "added" })
    }
}

export function check_user(fastify: FastifyInstance) {
    // return the async function needed by the get handler
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const username = (request.body as { username: string | null }).username;
        if (!username) {
            return reply.send({ error: "no username submitted" })
        }
        const user = await fastify.database.fetch_one('SELECT username, email from user where username = ?', [username])
        if (user)
            return reply.send({ exists: true });
        else {
            return reply.send({ exists: false });
        }
    }
};

export function is_logged(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        if (request.session.authenticated) {
            let user = await fastify.database.fetch_one('SELECT username, email from user where id = ?', [request.session.userId])
            return {
                "authenticated": true,
                "username": user.username,
                "email": user.email,
            };
        } else {
            return { "authenticated": false };
        }
    }
}

// function setPlayers(currId: number, player1: string, player2: string, session: FastifySessionObject): { p1: Player; p2: Player } {
//     const currIdStr = currId.toString();
//     const p1: Player = {
//         id: parseInt(player1),
//         username: player1, // fallback
//         online: true,
//         role: "player1"
//     };
//     const p2: Player = {
//         id: parseInt(player2),
//         username: player2,
//         online: true,
//         role: "player2"
//     };
//     if (player1 === currIdStr) {
//         p1.session = session;
//         p1.socket = session.socketId;
//         p1.username = (session as any).username ?? player1;
//     } else if (player2 === currIdStr) {
//         p2.session = session;
//         p2.socket = session.socketId;
//         p2.username = (session as any).username ?? player2;
//     }
//     return { p1, p2 };
// }

export function handle_game(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const gm = GameManager.getInstance(fastify);
        setInterval(() => {
            gm.checkRoomsStatus();
        }, 5000);
        const body = request.body as { mode: string; player1: string; player2: string };
        const mode = body.mode;
        const player1 = body.player1;
        const player2 = body.player2;
        //const currId = request.session.userId!;
        if (mode == "invite" && player1 && player2)
            gm.addRoom(mode, request.session, player1, player2);
        else gm.addRoom(mode, request.session);
        reply.send({ success: true, mode: mode }); // redondant
    };
}
