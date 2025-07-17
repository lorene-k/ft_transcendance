import { ChatUI } from "./ChatUI.js";
import { UserManager } from "./UserManager.js";
import { Message } from "./chatTypes.js";
import { addChatBubble } from "./chatBubbles.js";
import { OptionHandler } from "./OptionHandler.js";
import { BubbleHandler } from "./BubbleHandler.js";

declare const io: any;

export class ChatClient {
  private socket: any;
  private sessionId = "";
  private counter = 0;
  private chatUI: ChatUI;
  private userManager: UserManager;
  private OptionHandler: OptionHandler;
  private bubbleHandler: BubbleHandler

  constructor() {
    this.socket = io("http://localhost:8080/chat", {
      withCredentials: true,
      transports: ['websocket'],
      auth: {
        serverOffset: 0,
        username: "",
      },
      ackTimeout: 10000,
      retries: 3,
    });
    this.chatUI = new ChatUI(this);
    this.userManager = new UserManager(this);
    this.OptionHandler = new OptionHandler();
    this.bubbleHandler = new BubbleHandler();
    this.initSocketListeners();
  }

  getSessionId() {
    return (this.sessionId);
  }
  
  getSocket() {
    return (this.socket);
  }

  getChatUI() {
    return (this.chatUI);
  }

  getUserManager() {
    return (this.userManager);
  }

  getOptionHandler() {
    return (this.OptionHandler);
  }

  getBubbleHandler() {
    return (this.bubbleHandler);
  }
  
   setInputListeners() {
    this.chatUI.initInputListeners();
  }

  private initSocketListeners() {
    // Get current user info
    this.socket.on("session", ({ sessionId, username } :
      { sessionId: string, username: string }) => {
      this.sessionId = sessionId;
      this.socket.auth.username = username; // ! Useless ?
    });

    // Listen for messages
    this.socket.on("message", async ({ senderId, senderUsername, content, serverOffset } :
      { senderId: string; senderUsername: string, content: string, serverOffset: number }) => {
        try {
          // console.log("Received message :", content); // ! DEBUG
          const isSent = senderId === this.sessionId;
          const otherUserId = isSent ? this.userManager.getTargetId() : senderId;
          const otherUsername = this.userManager.getTargetUsername(otherUserId!, senderUsername, isSent);
          if (!otherUserId || !otherUsername) {
            console.error("Invalid user ID or username received in message event.");
            return;
          }
          this.socket.auth.serverOffset = serverOffset;
          this.userManager.updateConvPreview(otherUserId, otherUsername);
          const message: Message = {
            content: content,
            senderId: senderId,
            sentAt: (new Date()).toISOString().slice(0,21)
          }
          await this.bubbleHandler.addChatBubble(this.sessionId, message, this.userManager.getTargetId()!);
        } catch (e) {
          console.error("Error processing message received from server:", e);
        }
    });

    // Get conversation history
    this.socket.on("allConversations", (conversations: any[], convInfo: Record<number, string>) => {
        this.userManager.loadConversations(conversations, convInfo);
      });
  }

  // Send message
  sendMessage(msg: string) {
    const clientOffset = `${this.sessionId}-${Date.now()}-${this.counter++}`; // OR USE getRandomValues() to generate a unique offset
    const targetId = this.userManager.getTargetId();
    const convId = this.userManager.getConvId();
    this.socket.emit("message", { targetId: targetId, content: msg, clientOffset: clientOffset, convId: convId }, // ! change to response any ?
      (response: { status: string; serverOffset?: number }) => {
        if (!response) {
          console.error("No response received from server.");
          return;
        }
        if (response.serverOffset) this.socket.auth.serverOffset = response.serverOffset;
        console.log("Acknowledged by server:", response); // ! DEBUG
    });
  }
}