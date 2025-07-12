import { addChatBubble }from "./chatBubbles.js";
import { users, targetId, updateConvPreview, getConnectedUsers } from "./chatUsers.js";
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
getConnectedUsers(socket);

// Get conversation history
socket.on("allConversations", (conversations: any[]) => {  // ! check if conv.id needed (maybe attach it to preview instead of data-user-id to avoid api call to get conv id ?)
  if (!conversations || conversations.length === 0) {
    console.log("No conversations found.");
  } else {
    console.log("Received conversations: ", conversations);
    for (const conv of conversations) {
      const otherUser = users.find(u => u.userId === conv.otherUserId.toString());
      if (otherUser) updateConvPreview(conv.id, otherUser.username!);
    }
  }
});

// Send message
document.getElementById("conversation-container")?.addEventListener('click', (e) => { // ! careful if adding a button on landing page (add id)
  const target = e.target as HTMLElement;
  if (target && target.tagName === 'BUTTON') {
    console.log(`Sending message to ${targetId} from ${socket.auth.username}`); // ! DEBUB - get current username
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (!input) return ;
    const msg = input.value;
    if (input.value) {
        // compute unique offset (ensure client delivery after state recovery/temp disconnection)
        const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // !!!!!!!!! CHECK
        socket.emit("message", { targetId: targetId, msg, clientOffset });
        input.value = "";
    }
    input.focus();
  }
});

// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset } :
    { senderId: string; senderUsername: string, msg: string, serverOffset: string }) => {
    console.log(`Received message from ${senderId}: ${msg}`);     // ! DEBUG
    const isSent = senderId === currentSessionId;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    
    // Update conversation preview
    if (isSent) {
      const targetUser = users.find(u => u.userId === targetId);
      if (targetUser) updateConvPreview(targetId!, targetUser.username!);
    } else updateConvPreview(targetId!, senderUsername!);
    await addChatBubble(msg, isSent, currentSessionId);
});

// Get current user info
socket.on("session", ({ sessionId, username } :
  { sessionId: string, username: string }) => {
  currentSessionId = sessionId;
  socket.auth.username = username;
});

// ! FIX - sending to user null ??
// ! FIX users list - bancal
// ! FIX - load msg history when opening chat-window
// TODO - update landing page
// ? add last_seen in conv to send missed messages in case of disconnect ?
// TODO - check msg recovery handling
// TODO - Disconnect
// TODO - check what happens if same user connected in different tabs (don't create new socket)
// >> check if session.userId exists in map, assign socket.id to it (change map to hold socket.id ARRAY)

// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);

// TODO - create landing page for new chat, otherwise display last conversation
// TODO - friends (search bar w/ db fetch)