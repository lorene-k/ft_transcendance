import { Socket, Namespace } from "socket.io";
import { checkSessionExpiry } from "./chatplugin.js";

export default function handleGameInvites(socket: Socket, chatNamespace: Namespace) {

	// Send game invite - from inviter to invited
    socket.on("inviteToGame", (invitedId: string, ack?: Function) => {
		try {
			if (!checkSessionExpiry(socket)) return;
			const inviterUsername = socket.username;
			const inviterId = socket.session.userId.toString();
			chatNamespace.to(invitedId!).emit("inviteToGame", inviterUsername, inviterId, invitedId);
			if (ack) ack({ success: true });
		} catch (err) {
			console.error("Error sending game invite:", err);
			if (ack) ack({ success: false, error: (err as any).message });
		}
	});

	// Send game invite cancellation - from inviter to invited
	socket.on("cancelGameInvite", (invitedId: string, ack?: Function) => {
        try {
			if (!checkSessionExpiry(socket)) return;
			const inviterId = socket.session.userId.toString();
            chatNamespace.to(invitedId).emit("cancelGameInvite", inviterId);
            if (ack) ack({ success: true });
        } catch (err) {
            console.error("Error cancelling game invite:", err);
            if (ack) ack({ success: false, error: (err as any).message });
        }
    });

	// Send invited's response to inviter
	socket.on("respondToGameInvite", (inviterId: string, accepted: boolean, ack?: Function) => {
		try {
			if (!checkSessionExpiry(socket)) return;
			const invitedId = socket.session.userId.toString();
			chatNamespace.to(inviterId).emit("respondToGameInvite", invitedId, inviterId, accepted);
			if (ack) ack({ success: true });
		} catch (err) {
			console.error("Error responding to game invite:", err);
			if (ack) ack({ success: false, error: (err as any).message });
		}
	});
}