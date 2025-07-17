import { ChatClient } from "./ChatClient.js";

export class BlockManager {
    private blockedUsers: string[] = [];
    private targetBlocked: boolean = false;
    private chatClient: ChatClient;
    private blockedBtn: HTMLElement;
    private blockedMsg: HTMLElement;

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        this.blockedBtn = document.querySelector('[data-action="block-user"]') as HTMLElement;
        this.blockedMsg = document.getElementById("blocked-msg") as HTMLElement;
        this.fetchBlockedUsers();
    }

    private async fetchBlockedUsers() {
        try {
            const res = await fetch(`/api/chat/blocked?blocker=${this.chatClient.getSessionId()}`);
            const data = await res.json();
            if (res.status === 404) {
              console.log(data.message);
              return;
            }
            if (res.status === 500) {
              console.error(data.message);
              return;
            }
            this.blockedUsers = (data as { blocked_id: number }[]).map(u => u.blocked_id.toString());
            // console.log("in getBlockedUsers - blockedUsers = ", blockedUsers); // ! DEBUG
        } catch (err) {
            console.error("Failed to fetch or parse JSON:", err);
        }
    }

    private toggleBlockedMsg() {
        if (this.targetBlocked) {
            this.blockedMsg.classList.remove("hidden");
            this.blockedBtn.textContent = "Unblock user";
        } else if (!this.targetBlocked) {
            this.blockedMsg.classList.add("hidden");
            this.blockedBtn.textContent = "Block user";
        }
    }
    
    checkBlockedTarget(): boolean {
        const targetId = this.chatClient.getUserManager().getTargetId();
        this.targetBlocked = this.blockedUsers.includes(targetId!);
        // console.log("targetId = ", targetId, "isBlocked =", this.targetBlocked); // ! DEBUG
        this.toggleBlockedMsg();
        return (this.targetBlocked);
    }
    
    blockOrUnblockUser(chatClient: ChatClient) {
        const socket = chatClient.getSocket();
        const targetId = this.chatClient.getUserManager().getTargetId();
        this.targetBlocked = this.checkBlockedTarget();
        socket.emit("blockUser", { targetId: parseInt(targetId!), block: !this.targetBlocked }, (response: { status: string }) => {
            if (!response) console.error("No response received from server."); // ! solve server ack pb
            else console.log("Response from server: ", response.status);
        });
        if (!this.targetBlocked) this.blockedUsers.push(targetId!);
        else {
            const index = this.blockedUsers.indexOf(targetId!);
            if (index !== -1) this.blockedUsers.splice(index, 1);
        }
        this.checkBlockedTarget();
    }
}