import './env.js';
import * as path from "path";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import root from "./routes/root.js";
import dbPlugin from "./plugins/dbplugin.js";
import formbody from "@fastify/formbody";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";
import Store from "./db/store.js";
import fastifySocketIO from "fastify-socket.io";
import chatPlugin from "./plugins/chat/chatplugin.js";
import { fileURLToPath } from "url";
import { GameManager } from "./game/gameManager.js";
import { generateCerts } from './utils/generateCerts.js';
import fs from 'fs';
import Multipart from '@fastify/multipart';
import friends from './utils/friends.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

generateCerts();

const server = fastify({
    https: {
        key: fs.readFileSync('./key.pem'),
        cert: fs.readFileSync('./cert.pem'),
    },
    logger: {
        level: "error",
    },
});

let db = server.register(dbPlugin);
server.register(formbody);
server.register(fastifyCookie);
await db;
server.register(Multipart, {
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 10,
    },
});

const sessionStore = new Store.SessionStore(server.database, server.log);
server.register(fastifySession, {
    secret: process.env.SESSION_SECRET as string,
    cookie: {
        maxAge: 1800000,
        secure: true,
        sameSite: "none"
    },
    store: sessionStore,
});

server.decorate("sessionStore", new Store.SessionStore(server.database, server.log));
await server.register(fastifySocketIO.default, { connectionStateRecovery: {} });
await server.register(chatPlugin);
server.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
})

// User endpoints
server.register(root.routes);

// API routes
server.register(root.api);

// Requests linked to authentification
server.register(root.auth);

const gm = GameManager.getInstance(server);
const f = friends.getInstance(server);

server.decorate("friends", f);

server.listen({ port: 8080, host: "0.0.0.0" }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
