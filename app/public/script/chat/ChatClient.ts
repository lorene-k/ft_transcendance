import { Message } from "./chatTypes.js";
import ChatUI from "./ChatUI.js";
import UserManager from "./UserManager.js";
import OptionHandler from "./OptionHandler.js";
import BubbleHandler from "./BubbleHandler.js";
import InviteManager from "./InviteHandler.js";
import HistoryManager from "./HistoryManager.js";

declare const io: any;

export default class ChatClient {
    private socket: any;
    private counter = 0;
    private chatUI: ChatUI | null = null;
    private userManager: UserManager | null = null;
    private optionHandler: OptionHandler | null = null;
    private inviteManager: InviteManager | null = null;
    private bubbleHandler: BubbleHandler | null = null;

    constructor() {
        this.socket = io(`${window.location.origin}/chat`, {
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
        this.bubbleHandler = new BubbleHandler();
        const historyManager = new HistoryManager(this);
        this.userManager = new UserManager(this, historyManager);
        this.optionHandler = new OptionHandler(this);
        this.inviteManager = new InviteManager(this);
        this.initSocketListeners();
    }

    destroy() {
        this.socket.removeAllListeners();
        this.socket.disconnect();
        this.optionHandler!.destroy();
        this.inviteManager!.destroy();
        this.chatUI!.destroy();
        this.optionHandler = null;
        this.inviteManager = null;
        this.userManager = null;
        this.chatUI = null;
        this.bubbleHandler = null;
    }

    // Getters & Setters
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
        return (this.optionHandler);
    }

    getInviteManager() {
        return (this.inviteManager);
    }

    getBubbleHandler() {
        return (this.bubbleHandler);
    }

    // Init all base listeners
    private initSocketListeners() {

        // Listen for messages
        this.socket.on("message", async (payload: any) => {
            try {
                if (!payload || typeof (payload) !== "object") {
                    return;
                }
                const { targetId, senderId, senderUsername, content, serverOffset, isSent } = payload as any;
                const hasUserInfo = isSent ? targetId != null : senderId != null || senderUsername != null;
                if (!hasUserInfo) return;
                const otherUsername = this.userManager!.getTargetUsername(targetId!, senderUsername, isSent);
                if (!otherUsername) return;
                this.socket.auth.serverOffset = serverOffset;
                if (isSent) this.userManager!.updateConvPreview(targetId, otherUsername);
                else this.userManager!.updateConvPreview(senderId, otherUsername);
                const message: Message = {
                    content: content,
                    targetId: targetId,
                    senderId: senderId,
                    senderUsername: senderUsername,
                    isSent: isSent,
                    sentAt: (new Date()).toISOString().slice(0, 21)
                }
                await this.bubbleHandler!.addChatBubble(isSent, message, this.userManager!.getTargetId()!);
            } catch (e) {
                console.error("Error processing message received from server:", e);
            }
        });

        // Get conversation history
        this.socket.on("allConversations", (conversations: any[], convInfo: Record<number, string>) => {
            this.userManager!.loadConversations(conversations, convInfo);
        });

        // Listen for game invites
        this.socket.on("inviteToGame", (inviterUsername: string, inviterId: string, invitedId: string) => {
            this.inviteManager!.setInviteInfo(inviterUsername, inviterId, invitedId);
        });

        // Listen for game invite cancellations
        this.socket.on("cancelGameInvite", (inviterId: string) => {
            this.inviteManager!.setCancelledInvite(inviterId);
        });
    }

    // Send message
    sendMessage(msg: string) {
        const clientOffset = `${Date.now()}-${this.counter++}`;
        const targetId = this.userManager!.getTargetId();
        const convId = this.userManager!.getConvId();
        this.socket.emit("message", { targetId: targetId, content: msg, clientOffset: clientOffset, convId: convId },
            (response: { status: string; serverOffset?: number }) => {
                if (!response) return;
                if (response.serverOffset) this.socket.auth.serverOffset = response.serverOffset;
            });
    }
}