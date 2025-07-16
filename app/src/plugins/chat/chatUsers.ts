import { Socket, Namespace} from "socket.io";
import { SocketManager } from "./chatSocketManager.js";

export function listUsers(socket: Socket, chatNamespace: Namespace, socketManager: SocketManager) {
    const users = [];
    const userSockets = socketManager.getUserSockets();
    for (const [sessionId, socketIds] of userSockets) {
        const firstSocketId = socketIds.values().next().value;
        const sock = chatNamespace.sockets.get(firstSocketId!);
        if (sock) {
          users.push({
              userId: sessionId.toString(),
              username: sock.username,
          });
        }
    }
    socket.emit("users", users);
}

export function notifyUsers(socket: Socket) {
    socket.broadcast.emit("User connected", {
        userId: socket.session.userId.toString(),
        username: socket.username,
    });
}