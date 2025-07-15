import { parse } from "cookie";
export const userSockets = new Map();
export const socketToSession = new Map();
// Authenticate session before connecting socket
export function authenticateSession(io, fastify) {
    io.use((socket, next) => {
        const cookies = parse(socket.handshake.headers.cookie || "");
        const signedSessionId = cookies.sessionId;
        if (!signedSessionId)
            return (next(new Error("No session Id found")));
        const sessionId = signedSessionId.split(".")[0];
        fastify.sessionStore.get(sessionId, (err, session) => {
            if (err || !session || !session.authenticated)
                return (next(new Error("Unauthorized connection")));
            socket.session = session;
            fastify.sessionStore.set(sessionId, session, (e) => {
                if (e)
                    return (next(new Error("No session Id found")));
                next();
            });
        });
    });
}
// Attach username to socket
export async function getUsername(fastify, userId) {
    const row = await fastify.database.fetch_one(`SELECT username FROM user WHERE id = ?`, [userId]);
    if (!row)
        return ("Unknown user");
    return (row.username);
}
// Attach socket info to session
export async function setSessionInfo(fastify, socket) {
    const sessionId = socket.session.userId;
    socket.username = await getUsername(fastify, sessionId);
    socket.join(sessionId.toString());
    if (!userSockets.has(sessionId))
        userSockets.set(sessionId, new Set());
    userSockets.get(sessionId).add(socket.id);
    socketToSession.set(socket.id, sessionId);
}
// Send userId and username to client
export function sendUserId(socket) {
    socket.emit("session", {
        sessionId: socket.session.userId.toString(),
        username: socket.username,
    });
}
