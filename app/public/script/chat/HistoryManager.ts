import { Message, User } from "./chatTypes.js";
import ChatClient from "./ChatClient.js";

export default class HistoryManager {
  private chatClient: ChatClient;

  constructor(chatClient: ChatClient) {
    this.chatClient = chatClient;
  }

  private async openFirstConv() {
      const convContainer = document.getElementById("conversation-container");
      const chatWindow = await this.chatClient.getBubbleHandler().loadTemplate("/chat/chat-window.html");
      if (!chatWindow || !convContainer) return;
      const p = document.getElementById("conv-placeholder");
      if (p) p.remove();
      convContainer.appendChild(chatWindow);
      const input = document.querySelector('textarea');
      this.chatClient.setInputListeners();
      this.chatClient.getOptionHandler().initDropdownListeners(); // ! ONGOING
  }

  private async fetchConversationId(user1: string, user2: string): Promise<number | null> {
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

    private async fetchMessageHistory(conversationId: number): Promise<Message[] | null> {
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

    private async displayMessageHistory(conversationId: number) {
      const sessionId = this.chatClient.getSessionId();
      const targetId = this.chatClient.getUserManager().getTargetId();
      const messages = await this.fetchMessageHistory(conversationId);
      if (messages) {
        for (const entry of messages as any) {
          const message: Message = {
            content: entry.content,
            senderId: entry.sender_id.toString(),
            sentAt: entry.sent_at
          }
          await this.chatClient.getBubbleHandler().addChatBubble(sessionId, message, targetId!);
        }
      } else
        console.error("Failed to fetch messages for conversation ID:", conversationId);
    }

   async openChat(user: User) {
    const currentSessionId = this.chatClient.getSessionId();
      if (!document.getElementById("chat-window")) await this.openFirstConv();
      const chatBox = document.getElementById("conversation-box");
      const recipientName = document.getElementById("recipient-name");
      if (!chatBox || !recipientName) return;
      chatBox.innerHTML = "";
      recipientName.textContent = user.username;
      const conversationId = await this.fetchConversationId(currentSessionId, user.userId);
      if (!conversationId) return;
      this.displayMessageHistory(conversationId);
      this.chatClient.getOptionHandler().getBlockManager().checkBlockedTarget();
  }
}