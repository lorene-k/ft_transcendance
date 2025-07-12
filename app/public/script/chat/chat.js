import { addChatBubble } from "./chatBubbles.js";
import { users, targetId, updateConvPreview, getConnectedUsers } from "./chatUsers.js";
import "./chatUsers.js";
let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");
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
// *************************************************** Send/Receive messages */
// Get active users list
getConnectedUsers(socket);
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
                updateConvPreview(conv.id, otherUser.username);
        }
    }
});
// Send message
document.getElementById("conversation-container")?.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'BUTTON') {
        e.preventDefault();
        const input = document.querySelector('textarea');
        if (!input)
            return;
        const msg = input.value;
        if (input.value) {
            // Ensure client delivery after state recovery/temp disconnection
            const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // !!!!!!!!! CHECK
            socket.emit("message", { targetId: targetId, msg, clientOffset });
            input.value = "";
        }
        input.focus();
    }
});
// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset }) => {
    const isSent = senderId === currentSessionId;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    // Update conversation preview
    if (isSent) {
        const targetUser = users.find(u => u.userId === targetId);
        if (targetUser)
            updateConvPreview(targetId, targetUser.username);
    }
    else
        updateConvPreview(targetId, senderUsername);
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
// ! FIX : msg bubbles x2 when sent
// TODO - update landing page (add search bar for friends & new conversations)
// ? add last_seen in conv to send missed messages in case of disconnect (cache) ?
// TODO - check msg recovery handling
// TODO - Disconnect
// TODO - check what happens if same user connected in different tabs (don't create new socket)
// >> check if session.userId exists in map, assign socket.id to it (change map to hold socket.id ARRAY)
// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);
// TODO - create landing page for new chat, otherwise display last conversation
// TODO - friends (search bar w/ db fetch)
