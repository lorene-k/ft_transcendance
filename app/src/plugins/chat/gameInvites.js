export default function handleGameInvites(socket, chatNamespace) {
    socket.on("inviteToGame", (targetId) => {
        try {
            const inviterUsername = socket.username;
            chatNamespace.to(targetId).emit("inviteToGame", inviterUsername);
        }
        catch (err) {
            console.error("Error sending game invite:", err);
        }
    });
}
