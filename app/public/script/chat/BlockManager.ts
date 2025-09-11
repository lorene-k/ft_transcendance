import ChatClient from "./ChatClient.js";
import UserManager from "./UserManager.js";

export default class BlockManager {
    private blockedUsers: string[] = [];
    private targetBlocked: boolean = false;
    private userManager: UserManager | null = null;
    private socket: any;

    constructor(chatClient: ChatClient) {
        this.socket = chatClient.getSocket();
        this.fetchBlockedUsers();
    }

    setUserManager(userManager: UserManager) {
        this.userManager = userManager;
    }

    private async fetchBlockedUsers() {
        try {
            const res = await fetch(`/api/chat/blocked`);
            const data = await res.json();
            if (res.status === 500) {
                console.error(data.message);
                return (null);
            }
            this.blockedUsers = (data as { blocked_id: number }[]).map(u => u.blocked_id.toString());
        } catch (err) {
            console.error("Failed to fetch or parse JSON:", err);
        }
    }

    private toggleBlockedMsg() {
        const blockedBtn = document.querySelector('[data-action="block-user"]') as HTMLElement;
        const blockedMsg = document.getElementById("blocked-msg") as HTMLElement;
        if (!blockedBtn || !blockedMsg) return;
        if (this.targetBlocked) {
            blockedMsg.classList.remove("hidden");
            const savedLang = localStorage.getItem("lang");
            switch (savedLang) {
                case 'es':
                    blockedBtn.textContent = `Desbloquear usuario`;
                    break;
                case 'fr':
                    blockedBtn.textContent = `Débloquer l'utilisateur`;
                    break;
                default:
                    blockedBtn.textContent = `Unblock user`;
                    break;
            }
            // blockedBtn.textContent = "Unblock user";
        } else if (!this.targetBlocked) {
            blockedMsg.classList.add("hidden");
            const savedLang = localStorage.getItem("lang");
            switch (savedLang) {
                case 'es':
                    blockedBtn.textContent = `Bloquear usuario`;
                    break;
                case 'fr':
                    blockedBtn.textContent = `Débloquer l'utilisateur`;
                    break;
                default:
                    blockedBtn.textContent = `Block user`;
                    break;
            }
            // blockedBtn.textContent = "Block user";
        }
    }

    checkBlockedTarget(): boolean {
        const targetId = this.userManager!.getTargetId();
        this.targetBlocked = this.blockedUsers.includes(targetId!);
        this.toggleBlockedMsg();
        return (this.targetBlocked);
    }

    blockOrUnblockUser() {
        const targetId = this.userManager!.getTargetId();
        this.targetBlocked = this.checkBlockedTarget();
        this.socket.emit("blockUser", { targetId: parseInt(targetId!), block: !this.targetBlocked },
            (ack: { success: boolean }) => {
                if (ack && ack.success) console.log("Server ack OK");
            });
        if (!this.targetBlocked) this.blockedUsers.push(targetId!);
        else this.blockedUsers = this.blockedUsers.filter(id => id !== targetId);
        this.checkBlockedTarget();
    }
}
