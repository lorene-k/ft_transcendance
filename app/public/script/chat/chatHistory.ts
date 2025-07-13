import { currentSessionId, setSendBtnListener } from "./chat.js";
import { addChatBubble, loadTemplate } from "./chatBubbles.js";
import { User } from "./chatUsers.js";
import { handleOptions } from "./chatOptions.js";

export interface Message {
  content: string;
  senderId: string;
  sentAt: Date;
}

// Get conversation ID
async function getConversationId(user1: string, user2: string) {
    const res = await fetch(`/api/chat/conversation?userA=${user1}&userB=${user2}`);
    if (res.status === 404 || res.status === 500) return (null);
    const data = await res.json();
    if (!data) return (null);
    return (data.id);
}

// Get message history
async function getMessageHistory(conversationId: number) {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.status === 500) return (null);
    const messages = await res.json();
    return (messages);
}

// Load chat window
async function openFirstConv() {
    const convContainer = document.getElementById("conversation-container");
    const chatWindow = await loadTemplate("/chat/chat-window.html");
    if (!chatWindow || !convContainer) return;
    const p = document.getElementById("conv-placeholder");
    if (p) p.remove();
    convContainer.appendChild(chatWindow);
    setSendBtnListener();
    // Handle chat options (dropdown menu)
    handleOptions();
}

// Open conversation
export async function openChat(user: User) {
    if (!document.getElementById("chat-window")) await openFirstConv();
    const chatBox = document.getElementById("conversation-box");
    const recipientName = document.getElementById("recipient-name");
    if (!chatBox || !recipientName) return;
    chatBox.innerHTML = "";
    recipientName.textContent = user.username;
    const conversationId = await getConversationId(currentSessionId, user.userId);
    if (!conversationId ) {
      console.log("No existing conversation found.");
      return;
    }
    const messages = await getMessageHistory(conversationId);
    if (messages) {
      for (const entry of messages) {
        const message: Message = {
          content: entry.content,
          senderId: entry.sender_id.toString(),
          sentAt: new Date(entry.sent_at)
        }
        await addChatBubble(currentSessionId, message);
      }
    } else
      console.error("Failed to fetch messages for conversation ID:", conversationId);
}

// ? ADD DATES 
// ! Load profile picture
// ! Cache Last Messages
// >> GET /api/chat/:conversationId/messages?since=123