import { User } from "./chatTypes.js";
import HistoryManager from "./HistoryManager.js";
import ChatUI from "./ChatUI.js";
import ChatClient from "./ChatClient.js";
import BlockManager from "./BlockManager.js";

export default class UserManager {
  private activeUsers: User[] = [];
  private targetUsers: User[] = [];
  private targetId: string | null = null;
  private convId: number | null = null;
  private targetToConvId = new Map<string, number>();
  private socket: any;
  private chatUI: ChatUI | null = null;
  private historyManager: HistoryManager | null = null;
  private blockManager: BlockManager | null = null;
  
  constructor(chatClient: ChatClient, historyManager: HistoryManager) {
    this.socket = chatClient.getSocket();
    this.chatUI = chatClient.getChatUI();
    this.blockManager = new BlockManager(chatClient);
    this.blockManager.setUserManager(this); 
    this.historyManager = historyManager;
    this.initUserListeners();
  }

  getTargetId() {
      return (this.targetId);
  }
  
  getConvId() {
      return (this.convId);
  }

  getBlockManager() {
    return (this.blockManager);
  }

  initUserListeners() {
    this.socket.on("users", (newUsers: User[]) => {
      newUsers = newUsers.sort((a, b) => {
        if (a.self) return -1;
        if (b.self) return 1;
        if (a.username < b.username) return -1;
        return a.username > b.username ? 1 : 0;
      });
      this.activeUsers = newUsers;
      this.displayActiveUsers();
    });
        
    this.socket.on("user connected", (user: User) => {
      if (!this.activeUsers.find(u => u.userId === user.userId)) {
        this.activeUsers.push(user);
        this.displayActiveUsers();
      }
    });

    this.socket.on("user disconnected", ({ userId }: { userId: string }) => {
      this.activeUsers = this.activeUsers.filter(u => u.userId !== userId);
      this.displayActiveUsers();
    });
  }

  private addActiveUser(userList: HTMLElement, user: User) {
    if (user.self) return;
    const li = document.createElement("li");
    li.textContent = user.username;
    li.addEventListener("click", () => {
        this.targetId = user.userId;
        this.convId = this.targetToConvId.get(this.targetId!)!;
        this.historyManager!.openChat(user);
    });
    li.classList.add("user-list-style");
    userList.appendChild(li);
  }
    
  private displayActiveUsers() {
    const userList = document.getElementById("user-list");
    if (!userList) return;
    userList.innerHTML = "";
    this.activeUsers.forEach((user) => {
      this.addActiveUser(userList, user);
    });
  }

  loadConversations(conversations: any[], convInfo: Record<number, string>) {
    if (!conversations || conversations.length === 0) {
        console.log("No conversations found.");
      } else {
        for (const conv of conversations) {
          const otherUsername = convInfo[conv.otherUserId];
          if (otherUsername) this.updateConvPreview(conv.otherUserId.toString(), otherUsername);
          this.targetToConvId.set(conv.otherUserId.toString(), conv.id);
          this.targetUsers.push({
            userId: conv.otherUserId.toString(),
            username: otherUsername,
            self: false
          });
        }
      }
    }

  getTargetUsername(otherUserId: string, senderUsername: string, isSent: boolean): string | null {
    if (!otherUserId) return (null);
    if (isSent) {
      if (!this.targetUsers) return (null);
      const targetUser = this.targetUsers.find(u => u?.userId?.toString() === otherUserId.toString());
      if (targetUser) return (targetUser.username);
      const activeTargetUser = this.activeUsers.find(u => u?.userId?.toString() === otherUserId.toString());
      if (activeTargetUser) return (activeTargetUser.username);
    } else return (senderUsername);
    return (null);
  }

  async updateConvPreview(userId: string, targetName: string) {
      const res = await this.chatUI!.updateConvPreviewUI(userId, targetName);
      if (!res) return;
      const { card, allMessages } = res;
      if (!card || !allMessages) return;
      card.addEventListener("click", () => {
        this.targetId = userId;
        this.convId = this.targetToConvId.get(this.targetId)!;
        this.historyManager!.openChat({ userId: userId, username: targetName, self: false });
      });
      allMessages.prepend(card!);
   }
}