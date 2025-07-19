import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getRoot, getGame, getAccount, navbar, getChat, getDashboard } from "./controllers/root.controller.js";
import { check_user, is_logged } from "./controllers/api.controller.js";
import { register, login, logout } from "./controllers/auth.controller.js";
import { getConversation, getMessages, getBlocked } from "./controllers/chat.controller.js";

/**
 * A plugin that provide encapsulated routes
 * @param {FastifyInstance} fastify encapsulated fastify instance
 * @param {Object} options plugin options, refer to https://fastify.dev/docs/latest/Reference/Plugins/#plugin-options
 */
async function routes(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // dummy route
    fastify.get("/ping", async (request, reply) => {
        return { reply: "pong" };
    });

    // index.html
    fastify.get("/", getRoot(fastify));

    // nav bar
    fastify.get("/script/nav", navbar);

    // game
    fastify.get("/game/pong", getGame(fastify));

    // account.html
    fastify.get("/account", getAccount(fastify));

    // chat.html
    fastify.get("/chat", getChat());

    //dashboard.html
    fastify.get("/dashboard", getDashboard());
}

async function auth(fastify: FastifyInstance, options: FastifyPluginOptions) {
    //authentification api route, now return json
    fastify.post("/register", register(fastify));
    fastify.post("/login", login(fastify));
    fastify.get("/logout", logout(fastify));
}

async function api(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // api/user-check
    fastify.post("/api/check-username", check_user(fastify));
    fastify.get("/api/islogged", is_logged(fastify));
    // api/chat
    fastify.get("/api/chat/conversation", getConversation(fastify));
    fastify.get("/api/chat/:conversationId/messages", getMessages(fastify));
    fastify.get("/api/chat/blocked", getBlocked(fastify));
}

export default { routes, api, auth };
