export class BlockManager {
    constructor(chatClient) {
        this.blockedUsers = [];
        this.targetBlocked = false;
        this.chatClient = chatClient;
        this.blockedBtn = document.querySelector('[data-action="block-user"]');
        this.blockedMsg = document.getElementById("blocked-msg");
        this.fetchBlockedUsers();
    }
    async fetchBlockedUsers() {
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
            this.blockedUsers = data.map(u => u.blocked_id.toString());
            // console.log("in getBlockedUsers - blockedUsers = ", blockedUsers); // ! DEBUG
        }
        catch (err) {
            console.error("Failed to fetch or parse JSON:", err);
        }
    }
    toggleBlockedMsg() {
        if (this.targetBlocked) {
            this.blockedMsg.classList.remove("hidden");
            this.blockedBtn.textContent = "Unblock user";
        }
        else if (!this.targetBlocked) {
            this.blockedMsg.classList.add("hidden");
            this.blockedBtn.textContent = "Block user";
        }
    }
    checkBlockedTarget() {
        const targetId = this.chatClient.getUserManager().getTargetId();
        this.targetBlocked = this.blockedUsers.includes(targetId);
        // console.log("targetId = ", targetId, "isBlocked =", this.targetBlocked); // ! DEBUG
        this.toggleBlockedMsg();
        return (this.targetBlocked);
    }
    blockOrUnblockUser(chatClient) {
        const socket = chatClient.getSocket();
        const targetId = this.chatClient.getUserManager().getTargetId();
        this.targetBlocked = this.checkBlockedTarget();
        socket.emit("blockUser", { targetId: parseInt(targetId), block: !this.targetBlocked }, (response) => {
            if (!response)
                console.error("No response received from server."); // ! solve server ack pb
            else
                console.log("Response from server: ", response.status);
        });
        if (!this.targetBlocked)
            this.blockedUsers.push(targetId);
        else {
            const index = this.blockedUsers.indexOf(targetId);
            if (index !== -1)
                this.blockedUsers.splice(index, 1);
        }
        this.checkBlockedTarget();
    }
}
