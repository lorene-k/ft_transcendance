import { FastifyInstance, Session } from "fastify";
import { Socket } from "socket.io";
import { parse } from "cookie";

export const userSockets = new Map<number, Set<string>>();
export const socketToSession = new Map<string, number>();

export function authenticateSession(io : any, fastify : FastifyInstance) {
    io.use((socket: Socket, next: Function) => {
      const cookies = parse(socket.handshake.headers.cookie || "");
      const signedSessionId = cookies.sessionId;
      if (!signedSessionId) return (next(new Error("No session Id found")));
      const sessionId = signedSessionId.split(".")[0];
    
      fastify.sessionStore.get(sessionId!, (err: Error | null, session: Session) => {
        if (err || !session || !session.authenticated)
          return (next(new Error("Unauthorized connection")));
        socket.session = session;
        fastify.sessionStore.set(sessionId!, session, (e : Error | null) => {
          if (e) return (next(new Error("No session Id found")));
          next();
        });
      });
    });
  }
  
// Attach username to socket
export async function getUsername(fastify: FastifyInstance, userId: number) {
    const row = await fastify.database.fetch_one(
      `SELECT username FROM user WHERE id = ?`,
      [userId]
    );
    if (!row) return ("Unknown user");
    return (row.username);
}
  
// Attach socket info to session
export async function setSessionInfo(fastify: FastifyInstance, socket: Socket) {
    const sessionId = socket.session.userId;
    socket.username = await getUsername(fastify, sessionId!);
    socket.join(sessionId.toString());
    if (!userSockets.has(sessionId)) userSockets.set(sessionId, new Set());
    userSockets.get(sessionId)!.add(socket.id);
    socketToSession.set(socket.id, sessionId);
} 
  
// Send userId and username to client
export function sendUserId(socket: Socket) {
    socket.emit("session", {
      sessionId: socket.session.userId.toString(),
      username: socket.username,
    });
}
  