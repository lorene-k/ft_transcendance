import { Message, User } from "./chatTypes.js";
import ChatClient from "./ChatClient.js";
import BubbleHandler from "./BubbleHandler.js";
import ChatUI from "./ChatUI.js";
import { applyTranslations } from "../../translate.js";

export default class HistoryManager {
  private chatClient: ChatClient;
  private bubbleHandler: BubbleHandler | null = null;
  private chatUI: ChatUI | null = null;
  private chatBox: HTMLElement | null = null;
  private recipientName: HTMLElement | null = null;
  private chatWindowPic: HTMLImageElement | null = null;

  constructor(chatClient: ChatClient) {
    this.chatClient = chatClient;
    this.bubbleHandler = chatClient.getBubbleHandler();
    this.chatUI = chatClient.getChatUI();
    this.chatBox = document.getElementById("conversation-box");
    this.recipientName = document.getElementById("recipient-name");
    this.chatWindowPic = document.getElementById("chat-window-pic") as HTMLImageElement;
  }

  private async openFirstConv() {
    const chatWindow = document.getElementById("chat-window");
    if (chatWindow && !chatWindow.classList.contains("hidden")) return;
    const convPlaceholder = document.getElementById("conv-placeholder");
    const input = document.querySelector("textarea") as HTMLTextAreaElement;
    if (!convPlaceholder || !chatWindow || !input) return;
    convPlaceholder.remove();
    chatWindow.classList.remove("hidden", "pointer-events-none");
    input.focus();
  }

    private async fetchMessageHistory(targetId: string): Promise<Message[] | null> {
      try {
        const res = await fetch(`/api/chat/messages?target=${targetId}`);
        const data = await res.json();
        if (res.status === 500) {
          console.log(data.message);
          return (null);
        }
        return (data);
      } catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
        return (null);
      }
    }

    private async displayMessageHistory(targetId: string) {
      const messages = await this.fetchMessageHistory(targetId);
      if (messages) {
        for (const entry of messages as any) {
          const message: Message = {
            content: entry.content,
            senderId: entry.sender_id.toString(),
            sentAt: entry.sent_at
          }
          const isSent = message.senderId === targetId;
          await this.bubbleHandler!.addChatBubble(isSent, message, targetId!);
        }
      }
    }

   async openChat(user: User) {
      this.openFirstConv();
      this.chatBox!.innerHTML = "";
      this.recipientName!.textContent = user.username;
      this.chatWindowPic!.src = await this.chatUI!.loadImage(user.username);
      this.displayMessageHistory(user.userId);
      const userManager = this.chatClient.getUserManager();
      if (userManager) userManager.getBlockManager()!.checkBlockedTarget();
  }
}