import { addChatBubble } from "./chatBubbles.js";
import { users, targetId, updateConvPreview, getConnectedUsers, currConvId } from "./chatUsers.js";
let counter = 0;
const lastOffset = localStorage.getItem(`serverOffset-${currConvId}`) || "0";
export const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
        serverOffset: lastOffset
    },
    // ackTimeout: 10000, // Use emit with ack to guarantee msg delivery
    // retries: 3
});
export let currentSessionId = "";
export const targetToConvId = new Map();
// ******************************************************* Handle connection */
// Get active users list
getConnectedUsers(socket);
// *************************************************** Send/Receive messages */
// Get conversation history
socket.on("allConversations", (conversations) => {
    if (!conversations || conversations.length === 0) {
        console.log("No conversations found.");
    }
    else {
        // console.log("Received conversations: ", conversations); // ! DEBUG
        for (const conv of conversations) {
            const otherUser = users.find(u => u.userId === conv.otherUserId.toString());
            if (otherUser)
                updateConvPreview(otherUser.userId, otherUser.username);
            targetToConvId.set(conv.otherUserId.toString(), conv.id.toString()); // ! CHECK
        }
    }
});
// Send message
export function setSendBtnListener() {
    const sendBtn = document.getElementById("send-btn");
    if (!sendBtn)
        return;
    sendBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const input = document.querySelector('textarea');
        if (!input)
            return;
        const msg = input.value;
        if (input.value) {
            // Ensure client delivery after state recovery/temp disconnection
            const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // !!!!!!!!! CHECK
            // console.log("TEST : targetId = ", targetId); // ! DEBUG
            socket.emit("message", { targetId: targetId, msg, clientOffset });
            input.value = "";
        }
        input.focus();
    });
}
// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset }) => {
    const isSent = senderId === currentSessionId;
    const userId = isSent ? targetId : senderId;
    const username = isSent ? users.find(u => u.userId === targetId)?.username : senderUsername;
    if (!userId || !username) {
        console.error("Invalid user ID or username received in message event.");
        return;
    }
    updateConvPreview(userId, username);
    localStorage.setItem(`serverOffset-${currConvId}`, serverOffset);
    console.log("Listening for msg : CURR CONV ID = ", currConvId); // ! DEBUG
    socket.auth.serverOffset = serverOffset;
    const message = {
        content: msg,
        senderId: senderId,
        sentAt: new Date()
    };
    await addChatBubble(currentSessionId, message);
});
// Get current user info
socket.on("session", ({ sessionId, username }) => {
    currentSessionId = sessionId;
    socket.auth.username = username;
});
// TODO - handle blocked users
// ? check msg recovery handling
// ? add last_seen in conv to send missed messages in case of disconnect (cache) ?
// ? update landing page (add search bar for friends & new conversations)
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);
// TODO - friends (search bar w/ db fetch)
