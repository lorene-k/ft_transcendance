import { loadTemplate, addChatBubble } from "./chatBubbles.js";
import { Message } from "./chatTypes.js";
import { ChatClient } from "./ChatClient.js";

export class ChatUI {
    private chatClient: ChatClient;
  
    constructor(chatClient: any) {
      this.chatClient = chatClient;
    }

    initInputListeners() {
        const input = document.querySelector("textarea") as HTMLTextAreaElement;
        const sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
        if (!input || !sendBtn) return;
    
        sendBtn.onclick = (e) => {
          e.preventDefault();
          this.sendInput(input);
        };
    
        input.addEventListener("keydown", (e: KeyboardEvent) => {
          const isMac = navigator.userAgent.toUpperCase().includes("MAC");
          if (e.key === "Enter" && (isMac ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            this.sendInput(input);
          }
        });
      }
    
      private sendInput(input: HTMLTextAreaElement) {
        if (!input.value.trim()) return;
        this.chatClient.sendMessage(input.value);
        input.value = "";
        input.focus();
      }
    
    async displayChatBubble(sessionId: string, message: Message) {
        await addChatBubble(sessionId, message, this.chatClient.getUserManager().getTargetId()!);
      }

      async updateConvPreviewUI(userId: string, targetName: string) {
        const allMessages = document.getElementById("all-messages");
        if (!allMessages) return (null);
        const displayed = allMessages.querySelector(`[data-user-id="${userId}"]`);
        if (displayed) {
          displayed.classList.add("transition-all", "duration-300");
          allMessages.prepend(displayed);
        } else {
          const card = await loadTemplate("/chat/conv-preview.html");
          if (!card) return (null);
          card.setAttribute("data-user-id", userId);
          const name = card.querySelector("p");
          if (name) name.textContent = targetName;
          return { card, allMessages };
        }
        return (null);
}
}