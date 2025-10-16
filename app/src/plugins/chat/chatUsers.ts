import { Socket, Namespace } from "socket.io";
import SocketManager from "./SocketManager.js";
import { checkSessionExpiry } from "./chatplugin.js";

export function listUsers(socket: Socket, chatNamespace: Namespace, socketManager: SocketManager) {
    if (!checkSessionExpiry(socket)) return;
    const users = [];
    const userSockets = socketManager.getUserSockets();
    for (const [sessionId, socketIds] of userSockets) {
        const firstSocketId = socketIds.values().next().value;
        const sock = chatNamespace.sockets.get(firstSocketId!);
        if (sock) {
            users.push({
                userId: sessionId.toString(),
                username: sock.username,
                self: sock.session.userId === socket.session.userId
            });
        }
    }
    socket.emit("users", users);
}

function notifyUsers(socket: Socket) {
    if (!checkSessionExpiry(socket)) return;
    socket.broadcast.emit("user connected", {
        userId: socket.session.userId.toString(),
        username: socket.username,
        self: false
    });
}

export default function getActiveUsers(socket: Socket, chatNamespace: Namespace, socketManager: SocketManager) {
    listUsers(socket, chatNamespace, socketManager);
    notifyUsers(socket);
}