import { addChatBubble }from "./chatBubbles.js";
import { users, targetId, updateConvPreview, getConnectedUsers } from "./chatUsers.js";
import { Message } from "./chatHistory.js";
import "./chatUsers.js";

let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");

declare const io: any;
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
socket.on("allConversations", (conversations: any[]) => {
  if (!conversations || conversations.length === 0) {
    console.log("No conversations found.");
  } else {
    // console.log("Received conversations: ", conversations); // ! DEBUG
    for (const conv of conversations) {
      const otherUser = users.find(u => u.userId === conv.otherUserId.toString());
      if (otherUser) updateConvPreview(otherUser.userId, otherUser.username!);
    }
  }
});

// Send message
document.getElementById("conversation-container")?.addEventListener('click', (e) => { // ! careful if adding a button on landing page (add id)
  const target = e.target as HTMLElement;
  if (target && target.tagName === 'BUTTON') {
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (!input) return ;
    const msg = input.value;
    if (input.value) {
        // Ensure client delivery after state recovery/temp disconnection
        const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // !!!!!!!!! CHECK
        console.log("TEST : targetId = ", targetId);
        socket.emit("message", { targetId: targetId, msg, clientOffset });
        input.value = "";
    }
    input.focus();
  }
});

// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset } :
    { senderId: string; senderUsername: string, msg: string, serverOffset: string }) => {
    const isSent = senderId === currentSessionId;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    
    // Update conversation preview
    if (isSent) {
      const targetUser = users.find(u => u.userId === targetId);
      if (targetUser) updateConvPreview(targetUser.userId, targetUser.username);
    } else 
      updateConvPreview(senderId, senderUsername);
    const message: Message = {
      content: msg,
      senderId: senderId,
      sentAt: new Date()
    }
    await addChatBubble(currentSessionId, message);
});

// Get current user info
socket.on("session", ({ sessionId, username } :
  { sessionId: string, username: string }) => {
  currentSessionId = sessionId;
  socket.auth.username = username;
});

// ! FIX : msg bubbles x2 when sent
// TODO - Disconnect
// ? add last_seen in conv to send missed messages in case of disconnect (cache) ?
// TODO - update landing page (add search bar for friends & new conversations)
// TODO - check msg recovery handling

// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);

// TODO - create landing page for new chat, otherwise display last conversation
// TODO - friends (search bar w/ db fetch)