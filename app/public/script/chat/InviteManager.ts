import ChatClient from "./ChatClient.js";

export default class InviteHandler {
    private chatClient: ChatClient;
    private targetInvited: boolean = false;
    private socket;

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        this.socket = chatClient.getSocket();
        this.initInviteListeners();
    }

    private initInviteListeners() {
        this.socket.on("inviteToGame", (inviterUsername: string, inviterId: string) => {
            this.showInvitePopup(inviterUsername, inviterId);
            console.log(`Invitation received from user ${inviterUsername}`); // DEBUG
        });

        this.socket.on("getResponse", (invitedId: string, accepted: boolean) => { // ! UPDATE FRONTEND ON INVITE REJECTION
            // ! EAF - Redirect to game if accepted
            if (!accepted) this.toggleInviteMsg();
            console.log(`Invitation accepted : ${accepted} by ${invitedId}`); // DEBUG
        });
    }

    private initPopupListeners(inviterId: string) {
        const closeBtn = document.getElementById("close-popup-btn");
        const playBtn = document.getElementById("play-btn");
        const popup = document.getElementById("game-invite-popup");
        const targetId = this.chatClient.getUserManager().getTargetId();
        if (!closeBtn || !playBtn || !popup) return;

        closeBtn.addEventListener("click", () => {
            popup.remove();
            this.socket.emit("respondToGameInvite", inviterId, false);
        });

        playBtn.addEventListener("click", () => {
            popup.remove();
            this.socket.emit("respondToGameInvite", inviterId, true);
            console.log("Play game button clicked"); // DEBUG
        });
    }

    private async showInvitePopup(inviterUsername: string, inviterId: string) { // ! FIX - maybe hide/unhihde and leave in chat.html ?
        const mainDiv = document.getElementById("main_content");
        if (!mainDiv) console.error("Main content div not found.");
        const popup = await this.chatClient.getBubbleHandler().loadTemplate("/chat/chat-popup.html");
        if (!mainDiv || !popup) return;
        mainDiv.appendChild(popup);
        const inviterName = document.getElementById("inviter-name");
        if (!inviterName) return;
        inviterName.textContent = inviterUsername;
        this.initPopupListeners(inviterId);
    }

    private toggleInviteMsg() {
        const btn = document.querySelector('[data-action="invite-game"]') as HTMLElement;
        if (this.targetInvited) {
            btn.textContent = "Invitation sent";
            btn.classList.add("text-gray-500", "pointer-events-none");
            btn.classList.remove("text-gray-900", "pointer-events-auto");
        }
        else {
            btn.textContent = "Invite to game";
            btn.classList.remove("text-gray-500");
            btn.classList.add("hover:bg-blue-200", "text-gray-900");
        }
    }
    
    inviteToGame() {
        const targetId = this.chatClient.getUserManager().getTargetId();
        this.socket.emit("inviteToGame", targetId);
        this.targetInvited = !this.targetInvited;
        this.toggleInviteMsg();
    }
}
