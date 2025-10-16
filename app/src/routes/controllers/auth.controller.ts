import fastify, { FastifyReply, FastifyRequest, FastifyInstance } from "fastify";
import bcrypt from 'bcrypt';
import { RequestFullscreen } from "babylonjs";
const saltRounds = 10;

interface RegisterBody {
    username: string;
    email: string;
    password: string;
}

interface LoginBody {
    username: string;
    password: string;
}

const insertuser = 'INSERT INTO user (username, email, password, created_at) VALUES (?, ?, ?, date())'

export function register(fastify: FastifyInstance) {
    return async function (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) {
        const { username, email, password } = request.body;
        if (!username || !email || !password || password.length < 6)
            return reply.code(400).send({ "registered": false, reason: "missing component or password unworthy" })
        bcrypt.hash(password, saltRounds, function (err, hash) {
            if (err) {
                console.error(err)
            }
            else {
                fastify.database.prepare(insertuser).all([username, email, hash], (err: Error) => {
                    fastify.log.error(err?.message);
                    return reply.send({ "registered": false, "reason": err?.message })
                })
                fastify.log.info("new user entry:\nusername:%s, email:%s, password:%s", username, email, hash)
            }
        })
        return reply.send({ "registered": true })
    }
}

export function login(fastify: FastifyInstance) {
    return async function (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) {
        const { username, password } = request.body;
        if (!username || !password) {
            return reply.code(400).send({
                "logged": false,
                "reason": "parsing error, no username or password",
            });
        }
        fastify.log.info("request login for: %s", username);
        const rows = await fastify.database.fetch_all('SELECT id, password FROM user WHERE username = ?', [username])
        if (!rows || rows.length === 0) {
            fastify.log.error('query returned empty');
            return reply.send({
                "logged": false,
                "reason": "username unknown",
            });
        }
        else {
            const user = rows[0]
            if (!user.password)
                return reply.send({
                    "logged": false,
                    "reason": "google sign in account",
                });
            if (await bcrypt.compare(password, user.password)) {
                fastify.log.info("user %s logged", username);
                request.session.authenticated = true;
                request.session.userId = user.id;
            }
            else {
                return reply.send({
                    "logged": false,
                    "reason": "wrong password",
                });
            }
            request.session.save();
            return reply.send({
                "logged": true,
                "id": request.session.userId
            });
        }
    }
}

export function logout(FastifyInstance: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        request.session.authenticated = false;
        request.session.userId = NaN
        request.session.destroy(err => {
            return reply.send({ "logout": true });
        })
    }
}

export function whoami(fastify: FastifyInstance) {
    return async function (request: FastifyRequest, reply: FastifyReply) {
        const { authenticated, userId } = request.session;

        if (!authenticated || !userId) {
            return reply.status(401).send({ success: false, message: "Unauthorized" });
        }

        const user = await fastify.database.fetch_one(
            "SELECT id, username, email, is_admin FROM user WHERE id = ?",
            [userId]
        );

        if (!user) {
            return reply.status(404).send({ success: false, message: "User not found" });
        }

        return reply.send({
            id: user.id,
            username: user.username,
            email: user.email,
            isAdmin: !!user.is_admin
        });
    };
}
