export default class InviteHandler {
    constructor(chatClient) {
        this.targetInvited = false;
        this.chatClient = chatClient;
        this.socket = chatClient.getSocket();
        this.initInviteListener();
    }
    initInviteListener() {
        this.socket.on("inviteToGame", (inviterUsername) => {
            this.showInvitePopup(inviterUsername);
            console.log(`Invitation received from user ${inviterUsername}`); // ! DEBUG
        });
    }
    initPopupListeners() {
        const closeBtn = document.getElementById("close-popup-btn");
        const playBtn = document.getElementById("play-btn");
        const popup = document.getElementById("game-invite-popup");
        if (!closeBtn || !playBtn || !popup)
            return;
        closeBtn.addEventListener("click", () => {
            popup.remove();
        });
        playBtn.addEventListener("click", () => {
            popup.remove();
            console.log("Play game button clicked"); // ! DEBUG - Join game here
        });
    }
    async showInvitePopup(inviterUsername) {
        const mainDiv = document.getElementById("main-div");
        const popup = await this.chatClient.getBubbleHandler().loadTemplate("/chat/chat-popup.html");
        if (!mainDiv || !popup)
            return;
        mainDiv.appendChild(popup);
        const inviterName = document.getElementById("inviter-name");
        if (!inviterName)
            return;
        inviterName.textContent = inviterUsername; // ! CHECK ORDER
        this.initPopupListeners();
    }
    toggleInviteMsg() {
        const btn = document.querySelector('[data-action="invite-game"]');
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
// TODO - join game when button clicked
// ! Only active users can receive invites
