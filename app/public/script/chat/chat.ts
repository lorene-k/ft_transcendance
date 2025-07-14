import { addChatBubble }from "./chatBubbles.js";
import { activeUsers, targetId, updateConvPreview, getConnectedUsers, currConvId, User } from "./chatUsers.js";
import { Message } from "./chatHistory.js";

declare const io: any;
export const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
      serverOffset: 0
    },
    ackTimeout: 10000,
    retries: 3,
});
export let currentSessionId = "";
export const targetToConvId = new Map<string, number>();
let counter = 0;
const targetUsers: User[] = [];

// Get active users list
getConnectedUsers(socket);

// Get conversation history
socket.on("allConversations", (conversations: any[], convInfo: Record<number, string>) => {
  if (!conversations || conversations.length === 0) {
    console.log("No conversations found.");
  } else {
    // console.log("Received conversations: ", conversations); // ! DEBUG
    for (const conv of conversations) {
      const otherUsername = convInfo[conv.otherUserId];
      if (otherUsername) updateConvPreview(conv.otherUserId.toString(), otherUsername);
      targetToConvId.set(conv.otherUserId.toString(), conv.id);
      targetUsers.push({
        userId: conv.otherUserId.toString(),
        username: otherUsername,
      }); // ! ADD SELF ? (useless?)
    }
    // console.warn("targetUsers =", targetUsers); // ! DEBUG
  }
});

// Send message
function sendMessage(msg: string) {
  const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // OR USE getRandomValues() to generate a unique offset
  socket.emit("message", { targetId: targetId, content: msg, clientOffset: clientOffset, convId: currConvId },
    (response: { status: string; serverOffset?: number }) => {
      if (!response) return;
      if (response.serverOffset) socket.auth.serverOffset = response.serverOffset;
      // console.log("Acknowledged by server:", response); // ! DEBUG
  });
}

// Get input value
function getInput(input: HTMLTextAreaElement) {
    if (input && input.value) {
      const msg = input.value;
      sendMessage(msg);
      input.value = "";
      input.focus();
    }
}

// Send with ctrl+enter / cmd+enter
function setInputListener(input: HTMLTextAreaElement) {
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    const isMac = navigator.userAgent.toUpperCase().includes("MAC");
    const isModifierPressed = isMac ? e.metaKey : e.ctrlKey;
    if (e.key === "Enter" && isModifierPressed) {
      e.preventDefault();
      getInput(input);
    }
  });
}

// Set send listeners (button & keydown events)
export function setSendListeners() {
  const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
  const input = document.querySelector('textarea') as HTMLTextAreaElement;
  if (!sendBtn || !input) return;
  setInputListener(input);
  sendBtn.addEventListener('click', (e) => {
    e.preventDefault();
    getInput(input);
  });
}

// Get target name from active users or open conversations list
function getTargetUsername(otherUserId: string, senderUsername: string, isSent: boolean): string { // ! WHY IS ID A NUMBER ?
  if (isSent) {
    const targetUser = targetUsers.find(u => u.userId === otherUserId.toString());
    if (targetUser) return (targetUser.username);
    const activeTargetUser = activeUsers.find(u => u.userId === otherUserId.toString());
    if (activeTargetUser) return (activeTargetUser.username);
  } else return (senderUsername);
  console.warn("No target user found for ID:", otherUserId);
  return ("Unknown User");
}

// Listen for messages
socket.on("message", async ({ senderId, senderUsername, content, serverOffset } :
  { senderId: string; senderUsername: string, content: string, serverOffset: number }) => {
    try {
      // console.log("Received message :", content); // ! DEBUG
      const isSent = senderId === currentSessionId;
      const otherUserId = isSent ? targetId : senderId;
      const otherUsername = getTargetUsername(otherUserId!, senderUsername, isSent);
      if (!otherUserId || !otherUsername) {
        console.error("Invalid user ID or username received in message event.");
        return;
      }
      socket.auth.serverOffset = serverOffset;
      updateConvPreview(otherUserId, otherUsername);
      const message: Message = {
        content: content,
        senderId: senderId,
        sentAt: new Date()
      }
      await addChatBubble(currentSessionId, message);
    } catch (e) {
      console.error("Error processing message received from server:", e);
    }
});

// Get current user info
socket.on("session", ({ sessionId, username } :
  { sessionId: string, username: string }) => {
  currentSessionId = sessionId;
  socket.auth.username = username; // ! Useless ?
});

// ! FIX : must refresh page to see msg
// TODO - handle message recovery
// TODO - handle blocked users

// TODO - friends (search bar w/ db fetch)
// TODO - invite to game
// TODO - Announce next tournament (io.emit)
