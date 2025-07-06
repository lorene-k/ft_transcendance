import * as path from "path";
import fastifyStatic from "@fastify/static";
import fastify from "fastify";
import root from "./routes/root.js";
import dbPlugin from "./plugins/dbplugin.js";
import chatPlugin from "./plugins/chatplugin.js";
import formbody from "@fastify/formbody";
import fastifySession from "@fastify/session";
import fastifyCookie from "@fastify/cookie";
import Store from "./db/store.js";
import fastifySocketIO from "fastify-socket.io";
const __dirname = import.meta.dirname;
const server = fastify({
    logger: {
        level: "error",
    },
});
// PLUGINS (register plugins first or problems)
let db = server.register(dbPlugin);
server.register(formbody);
await server.register(fastifyCookie);
await db; // db needed for session
await server.register(fastifySession, {
    cookieName: "sessionId",
    //TODO: secret should be in .ENV file
    secret: "2c8c3c1549e14bfc7f124ed4a8dbbb94",
    cookie: { maxAge: 1800000, secure: "auto" },
    store: new Store.SessionStore(server.database, server.log),
});
server.decorate("sessionStore", new Store.SessionStore(server.database, server.log));
await server.register(fastifySocketIO.default, { connectionStateRecovery: {} });
await server.register(chatPlugin);
server.register(fastifyStatic, {
    root: path.join(__dirname, "..", "public"),
    prefix: "/",
});
// --------------------------
//all user endpoints here
server.register(root.routes);
//all api routes (and hooks ?) here
server.register(root.api);
//all request linked to authentification (and sessions managment ?) here
server.register(root.auth);
server.listen({ port: 8080 }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
});
