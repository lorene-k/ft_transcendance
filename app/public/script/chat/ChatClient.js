import { ChatUI } from "./ChatUI.js";
import { UserManager } from "./UserManager.js";
import { OptionHandler } from "./OptionHandler.js";
import { BubbleHandler } from "./BubbleHandler.js";
export class ChatClient {
    constructor() {
        this.sessionId = "";
        this.counter = 0;
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
    initSocketListeners() {
        // Get current user info
        this.socket.on("session", ({ sessionId, username }) => {
            this.sessionId = sessionId;
            this.socket.auth.username = username; // ! Useless ?
        });
        // Listen for messages
        this.socket.on("message", async ({ senderId, senderUsername, content, serverOffset }) => {
            try {
                // console.log("Received message :", content); // ! DEBUG
                const isSent = senderId === this.sessionId;
                const otherUserId = isSent ? this.userManager.getTargetId() : senderId;
                const otherUsername = this.userManager.getTargetUsername(otherUserId, senderUsername, isSent);
                if (!otherUserId || !otherUsername) {
                    console.error("Invalid user ID or username received in message event.");
                    return;
                }
                this.socket.auth.serverOffset = serverOffset;
                this.userManager.updateConvPreview(otherUserId, otherUsername);
                const message = {
                    content: content,
                    senderId: senderId,
                    sentAt: (new Date()).toISOString().slice(0, 21)
                };
                await this.bubbleHandler.addChatBubble(this.sessionId, message, this.userManager.getTargetId());
            }
            catch (e) {
                console.error("Error processing message received from server:", e);
            }
        });
        // Get conversation history
        this.socket.on("allConversations", (conversations, convInfo) => {
            this.userManager.loadConversations(conversations, convInfo);
        });
    }
    // Send message
    sendMessage(msg) {
        const clientOffset = `${this.sessionId}-${Date.now()}-${this.counter++}`; // OR USE getRandomValues() to generate a unique offset
        const targetId = this.userManager.getTargetId();
        const convId = this.userManager.getConvId();
        this.socket.emit("message", { targetId: targetId, content: msg, clientOffset: clientOffset, convId: convId }, // ! change to response any ?
        (response) => {
            if (!response) {
                console.error("No response received from server.");
                return;
            }
            if (response.serverOffset)
                this.socket.auth.serverOffset = response.serverOffset;
            console.log("Acknowledged by server:", response); // ! DEBUG
        });
    }
}
