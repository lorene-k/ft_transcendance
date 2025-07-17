import { loadTemplate, addChatBubble } from "./chatBubbles.js";
import { Message, User } from "./chatTypes.js";
import { ChatClient } from "./ChatClient.js";
// import { checkBlockedTarget } from "./chatBlocks.js";
// import { handleOptions } from "./chatOptions.js";

async function openFirstConv(chatClient: ChatClient) {
    const convContainer = document.getElementById("conversation-container");
    const chatWindow = await loadTemplate("/chat/chat-window.html");
    if (!chatWindow || !convContainer) return;
    const p = document.getElementById("conv-placeholder");
    if (p) p.remove();
    convContainer.appendChild(chatWindow);
    const input = document.querySelector('textarea');
    chatClient.setInputListeners();
    // await handleOptions(chatClient.getSocket()); // !!!!!!!!!!!!!!!! ONGOING 
}

async function getConversationId(user1: string, user2: string): Promise<number | null> {
    try {
      const res = await fetch(`/api/chat/conversation?userA=${user1}&userB=${user2}`);
      const data = await res.json();
      if (res.status === 404) {
        console.log(data.message);
        return (null);
      } else if (res.status === 500) {
        console.error(data.message);
        return (null);
      }
      return (data.id);
    } catch (err) {
      console.error("Failed to fetch or parse JSON:", err);
      return (null);
    }
  }

  async function getMessageHistory(conversationId: number): Promise<Message[] | null> {
    try {
      const res = await fetch(`/api/chat/${conversationId}/messages`);
      const data = await res.json();
      if (res.status === 500) {
        console.error(data.message);
        return (null);
      }
      return (data);
    } catch (err) {
      console.error("Failed to fetch or parse JSON:", err);
      return (null);
    }
  }

  async function displayMessageHistory(conversationId: number, sessionId: string, targetId: string) {
    const messages = await getMessageHistory(conversationId);
    if (messages) {
      for (const entry of messages as any) {
        const message: Message = {
          content: entry.content,
          senderId: entry.sender_id.toString(),
          sentAt: entry.sent_at
        }
        await addChatBubble(sessionId, message, targetId);
      }
    } else
      console.error("Failed to fetch messages for conversation ID:", conversationId);
  }

export async function openChat(user: User, chatClient: ChatClient) {
  const currentSessionId = chatClient.getSessionId();
    if (!document.getElementById("chat-window")) await openFirstConv(chatClient);
    const chatBox = document.getElementById("conversation-box");
    const recipientName = document.getElementById("recipient-name");
    if (!chatBox || !recipientName) return;
    chatBox.innerHTML = "";
    recipientName.textContent = user.username;
    const conversationId = await getConversationId(currentSessionId, user.userId);
    if (!conversationId) return;
    displayMessageHistory(conversationId, chatClient.getSessionId(), chatClient.getUserManager().getTargetId()!);
    // checkBlockedTarget();
}