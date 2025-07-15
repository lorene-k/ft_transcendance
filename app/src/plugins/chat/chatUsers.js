export function listUsers(socket, io, socketManager) {
    const users = [];
    const userSockets = socketManager.getUserSockets();
    for (const [sessionId, socketIds] of userSockets) {
        const firstSocketId = socketIds.values().next().value;
        const sock = io.of("/").sockets.get(firstSocketId);
        if (sock) {
            users.push({
                userId: sessionId.toString(),
                username: sock.username,
            });
        }
    }
    socket.emit("users", users);
}
export function notifyUsers(socket) {
    socket.broadcast.emit("User connected", {
        userId: socket.session.userId.toString(),
        username: socket.username,
    });
}
