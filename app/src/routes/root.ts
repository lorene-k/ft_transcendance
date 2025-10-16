import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { getRoot, navbar, getChat, getDashboard, play, footer } from "./controllers/root.controller.js";
import { getAccount, getPP, setPP, changeEmail, changePassword, changeUsername, removefriend } from "./controllers/account.controller.js";
import { check_user, is_logged, handle_game, addfriend } from "./controllers/api.controller.js";
import { register, login, logout } from "./controllers/auth.controller.js";
import { getMessages, getBlocked } from "./controllers/chat.controller.js";
import { getStats } from "./controllers/dashboard.controller.js";
import { getGoogleClientId, handleGoogleAuth } from "./controllers/google.controller.js";
import { authentification_preHandler } from "./hooks.js";

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

    // navbar
    fastify.get("/script/nav", navbar);

    // footer
    fastify.get("/script/footer", footer);

    // account.html
    fastify.get("/account", { preHandler: authentification_preHandler }, getAccount(fastify));

    // chat.html
    fastify.get("/chat", { preHandler: authentification_preHandler }, getChat());

    // dashboard.html
    fastify.get("/dashboard", { preHandler: authentification_preHandler }, getDashboard());

    fastify.get("/play", { preHandler: authentification_preHandler }, play());
}

async function auth(fastify: FastifyInstance, options: FastifyPluginOptions) {
    // authentification api route
    fastify.post("/register", register(fastify));
    fastify.post("/login", login(fastify));
    fastify.get("/logout", { preHandler: authentification_preHandler }, logout(fastify));

    // google authentification
    fastify.get("/api/auth/google-client-id", getGoogleClientId);
    fastify.post("/api/auth/google", handleGoogleAuth);
}

async function api(fastify: FastifyInstance, options: FastifyPluginOptions) {
    fastify.post("/api/check-username", check_user(fastify));
    fastify.get("/api/islogged", is_logged(fastify));

    // api/chat
    fastify.get("/api/chat/messages", getMessages(fastify));
    fastify.get("/api/chat/blocked", getBlocked(fastify));

    // api/dashboard
    fastify.get("/api/dashboard/stats", getStats(fastify));
    fastify.post("/api/handle-game", handle_game(fastify));

    // api/account
    fastify.post('/api/account/picture/set', { preHandler: authentification_preHandler }, setPP(fastify));
    fastify.get('/api/account/picture/get/:userId', { preHandler: authentification_preHandler }, getPP(fastify));
    fastify.post('/api/account/email', { preHandler: authentification_preHandler }, changeEmail(fastify))
    fastify.post('/api/account/username', { preHandler: authentification_preHandler }, changeUsername(fastify))
    fastify.post('/api/account/password', { preHandler: authentification_preHandler }, changePassword(fastify))
    fastify.get("/api/account", { preHandler: authentification_preHandler }, getAccount(fastify));
    fastify.post("/api/addfriend", { preHandler: authentification_preHandler }, addfriend(fastify));
    fastify.get("/api/removefriend/:username", { preHandler: authentification_preHandler }, removefriend(fastify));
}

export default { routes, api, auth };