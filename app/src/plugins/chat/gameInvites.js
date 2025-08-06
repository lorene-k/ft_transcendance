export default function handleGameInvites(socket, chatNamespace) {
    socket.on("inviteToGame", (targetId) => {
        try {
            const inviterUsername = socket.username;
            const inviterId = socket.session.userId.toString();
            chatNamespace.to(targetId).emit("inviteToGame", inviterUsername, inviterId);
        }
        catch (err) {
            console.error("Error sending game invite:", err);
        }
    });
    socket.on("respondToGameInvite", (inviterId, accepted) => {
        try {
            const invitedId = socket.session.userId.toString();
            if (accepted)
                console.log("Accepted = ", accepted); // ! EAR - If (accepted) Emit to gamespace name to start game
            else
                chatNamespace.to(inviterId).emit("getResponse", invitedId, false);
        }
        catch (err) {
            console.error("Error responding to game invite:", err);
        }
    });
}
// ADD "gameInviteResponse" event handler with boolean "accepted" parameter
// If accepted === true => emit "launchGame" event to game namespace
// Else update frontend (remove pending popup)
