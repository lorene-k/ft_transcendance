export default class BlockManager {
    constructor(chatClient) {
        this.blockedUsers = [];
        this.targetBlocked = false;
        this.chatClient = chatClient;
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
        const blockedBtn = document.querySelector('[data-action="block-user"]');
        const blockedMsg = document.getElementById("blocked-msg");
        if (!blockedBtn || !blockedMsg)
            return;
        if (this.targetBlocked) {
            blockedMsg.classList.remove("hidden");
            blockedBtn.textContent = "Unblock user";
        }
        else if (!this.targetBlocked) {
            blockedMsg.classList.add("hidden");
            blockedBtn.textContent = "Block user";
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
            if (response)
                console.log("Response from server: ", response.status);
            // else console.error("No response received from server."); // ! solve server ack pb
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
