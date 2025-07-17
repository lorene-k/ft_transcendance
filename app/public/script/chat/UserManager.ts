import { User } from "./chatTypes.js";
import HistoryManager from "./HistoryManager.js";
import ChatUI from "./ChatUI.js";
import ChatClient from "./ChatClient.js";

export default class UserManager {
  private activeUsers: User[] = [];
  private targetUsers: User[] = [];
  private targetId: string | null = null;
  private convId: number | null = null;
  private targetToConvId = new Map<string, number>();
  private socket: any;
  private chatClient: ChatClient;
  private chatUI: ChatUI;
  private historyManager: HistoryManager;
  
  constructor(chatClient: ChatClient) {
    this.chatClient = chatClient;
    this.socket = chatClient.getSocket();
    this.chatUI = chatClient.getChatUI();
    this.historyManager = new HistoryManager(chatClient);
    this.initUserListeners();
  }

  getTargetId() {
      return (this.targetId);
  }
  
  getConvId() {
      return (this.convId);
  }

  initUserListeners() {
    this.socket.on("users", (newUsers: User[]) => {
      newUsers.forEach((user) => {
        // console.log(`User connected: ${user.username} (${user.userId})`); // ! DEBUG
        if (user.userId === this.chatClient.getSessionId()) user.self = true;
      });
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
      this.activeUsers.push(user);
      this.displayActiveUsers();
    });
  }

  private addActiveUser(userList: HTMLElement, user: User) {
    const li = document.createElement("li");
    li.textContent = user.username;
    if (user.self) return;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
        this.targetId = user.userId;
      // console.log("Target set to:", targetId); // ! DEBUG
        this.convId = this.targetToConvId.get(this.targetId!)!;
        this.historyManager.openChat(user);
    });
    userList.appendChild(li);
  }
    
  private displayActiveUsers() {
    const userList = document.getElementById("user-list");
    if (!userList) return;
    userList.innerHTML = "";
    this.activeUsers.forEach((user) => {
      // console.log(`User: ${user.username} (${user.userId})`); // ! DEBUG
      this.addActiveUser(userList, user);
    });
  }

  loadConversations(conversations: any[], convInfo: Record<number, string>) {
    if (!conversations || conversations.length === 0) {
        console.log("No conversations found.");
      } else {
        // console.log("Received conversations: ", conversations); // ! DEBUG
        for (const conv of conversations) {
          const otherUsername = convInfo[conv.otherUserId];
          if (otherUsername) this.updateConvPreview(conv.otherUserId.toString(), otherUsername);
          this.targetToConvId.set(conv.otherUserId.toString(), conv.id);
          this.targetUsers.push({
            userId: conv.otherUserId.toString(),
            username: otherUsername,
          });
        }
        // console.warn("targetUsers =", targetUsers); // ! DEBUG
      }
    } // ! ADD UPDATE CONVO PREVIEW
        

  getTargetUsername(otherUserId: string, senderUsername: string, isSent: boolean): string { // ! WHY IS ID A NUMBER ?
    if (isSent) {
      const targetUser = this.targetUsers.find(u => u.userId === otherUserId.toString());
      if (targetUser) return (targetUser.username);
      const activeTargetUser = this.activeUsers.find(u => u.userId === otherUserId.toString());
      if (activeTargetUser) return (activeTargetUser.username);
    } else return (senderUsername);
    console.warn("No target user found for ID:", otherUserId);
    return ("Unknown User");
  }

   async updateConvPreview(userId: string, targetName: string) {
      const res = await this.chatUI.updateConvPreviewUI(userId, targetName);
      if (!res) return;
      const { card, allMessages } = res;
      card.addEventListener("click", () => {
          this.targetId = userId;
          // console.log("Target set to:", this.targetId); // ! DEBUG
          this.convId = this.targetToConvId.get(this.targetId)!;
          this.historyManager.openChat({ userId: userId, username: targetName, self: false });
        });
      allMessages.prepend(card);
   }
}