import { Socket, Namespace } from "socket.io";

export default function handleGameInvites(socket: Socket, chatNamespace: Namespace) {
    socket.on("inviteToGame", (targetId: string) => {
		try {
			const inviterUsername = socket.username;
			chatNamespace.to(targetId!).emit("inviteToGame", inviterUsername);
		} catch (err) {
			console.error("Error sending game invite:", err);
		}
	});
}