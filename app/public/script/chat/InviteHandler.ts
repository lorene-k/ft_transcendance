import ChatClient from "./ChatClient.js";
import { move_to } from "../N_nav.js";
import { animatePopup } from "../animateUtils.js";
import { Invite } from "./chatTypes.js";

export default class InviteHandler {
    private socket;
    private chatClient: ChatClient;
    private invitedId: string = "";
    private inviter = { id: "", username: "" };
    private closeInviter: HTMLElement | null = null;
    private closeInvited: HTMLElement | null = null;
    private playBtn: HTMLElement | null = null;
    private inviterNameElem: HTMLElement | null = null;
    private inviterPopup: HTMLElement | null = null;
    private invitedPopup: HTMLElement | null = null;
    private cancelInviteBtn: HTMLElement | null = null;
    private popupContent: NodeListOf<HTMLElement> | null = null;
    private inviteRefusedMsg: HTMLElement | null = null;
    private inviteQueue: Invite[] = [];
    private currentInvite: Invite | null = null;
    private inviteSent: boolean = false;

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        this.socket = chatClient.getSocket();
        this.getElems();
        this.initPopupListeners();
        this.initInviteResponseListener();
    }

    destroy() {
        this.closeInviter?.removeEventListener("click", this.cancelInvite);
        this.cancelInviteBtn?.removeEventListener("click", this.cancelInvite);
        this.closeInvited?.removeEventListener("click", this.handleClosePopup);
        this.playBtn?.removeEventListener("click", this.handlePlayBtn);
    }

    // ***************************************************** Invited *//
    // Invited : send response
    private sendResponse(accepted: boolean) {
        if (!this.currentInvite) return;
        animatePopup(this.invitedPopup!, false);
        this.socket.emit("respondToGameInvite", this.inviter.id, accepted, (ack: { success: boolean, error?: string }) => {
            if (ack && ack.error) console.error("Failed to cancel invite:", ack.error);
        });
        if (accepted) move_to("play", false, { mode: "invite", player1: this.inviter.id, player2: this.invitedId});
        this.showNextInvite();
    }

    // Invited : accept or refuse invite
    private handleClosePopup = (e: MouseEvent) => {
        this.toggleInviteMsg(false, "Invitation received");
        this.sendResponse(false);
    }
    private handlePlayBtn = (e: MouseEvent) => {
        this.toggleInviteMsg(false, "Invitation received");
        this.sendResponse(true);
    }

    // Invited : cancellation - hide popup
    setCancelledInvite(inviterId?: string) {
        if (this.currentInvite?.inviterId === inviterId) {
          animatePopup(this.invitedPopup!, false);
          this.toggleInviteMsg(false, "Invitation received");
          this.showNextInvite();
        } else {
          this.inviteQueue = this.inviteQueue.filter(inv => inv.inviterId !== inviterId);
        }
      }

    // Invited : show next invite in queue
    private showNextInvite() {
        if (this.inviteQueue.length === 0) {
          this.currentInvite = null;
          return;
        }
        this.currentInvite = this.inviteQueue.shift()!;
        this.inviterNameElem!.textContent = this.currentInvite.inviterUsername;
        animatePopup(this.invitedPopup!, true);
        const targetId = this.chatClient.getUserManager()!.getTargetId();
        this.toggleInviteMsg(true, "Invitation received");
    }

    // Invited : receive invite
    setInviteInfo(inviterUsername: string, inviterId: string, invitedId: string) {
        const invite: Invite = { inviterId, inviterUsername, invitedId };
        this.inviter.id = inviterId;
        this.invitedId = invitedId;
        this.inviteQueue.push(invite);
        if (!this.currentInvite) this.showNextInvite();
    }

    // ***************************************************** Inviter *//
    // Update inviter UI
    private displayInviterPopup(state: boolean) {
        this.inviteSent = state;
        this.toggleInviteMsg(state);
        animatePopup(this.inviterPopup!, state);
    }

    // Inviter : refusal - update popup
    private showInviteRefused(msTimeout: number = 0) {
        this.popupContent!.forEach((el) => {
            el.classList.add("hidden");
        });
        this.inviteRefusedMsg!.classList.remove("hidden");
        setTimeout(() => {
            this.popupContent!.forEach((el) => {
                el.classList.remove("hidden");
            });
            this.inviteRefusedMsg!.classList.add("hidden");
            this.displayInviterPopup(false);
        }, msTimeout);
      }

    // Inviter : listen for response
    private initInviteResponseListener() {
        this.socket.on("respondToGameInvite", (invitedId: string, inviterId: string, accepted: boolean) => {
            this.invitedId = invitedId;
            this.inviter.id = inviterId;
        if (accepted) move_to("play", false, { mode: "invite", player1: this.inviter.id, player2: this.invitedId});
        else this.showInviteRefused(5000);
        });
    }

    // Inviter : cancel invite
    private cancelInvite = () => {
        this.socket.emit("cancelGameInvite", this.invitedId, (ack: { success: boolean, error?: string }) => {
            if (ack && ack.success) console.log("Invite cancelled successfully on server");
            else if (ack && ack.error) console.error("Failed to cancel invite:", ack.error);
        });
        this.displayInviterPopup(false);
    }
    
    // Inviter : send invite
    inviteToGame() {
        const targetId = this.chatClient.getUserManager()!.getTargetId();
        if (!targetId) return;
        this.invitedId = targetId;
        this.displayInviterPopup(true);
        this.socket.emit("inviteToGame", targetId);
        window.setTimeout(() => {
            if (this.inviteSent) this.cancelInvite();
        }, 30_000);
    }

    // ***************************************************** Listeners *//
    // Listen for popup events
    private initPopupListeners() {
        this.cancelInviteBtn!.addEventListener("click", this.cancelInvite);
        this.closeInviter!.addEventListener("click", this.cancelInvite);
        this.closeInvited!.addEventListener("click", this.handleClosePopup);
        this.playBtn!.addEventListener("click", this.handlePlayBtn);
    }

    // Get popup elements
    private getElems() {
        this.closeInviter = document.getElementById("close-inviter-popup");
        this.closeInvited = document.getElementById("close-invited-popup");
        this.playBtn = document.getElementById("play-btn");
        this.inviterNameElem = document.getElementById("inviter-name");
        this.inviterPopup = document.getElementById("inviter-popup");
        this.invitedPopup = document.getElementById("invited-popup");
        this.cancelInviteBtn = document.getElementById("cancel-invite-btn");
        this.popupContent = document.querySelectorAll(".popup-content");
        this.inviteRefusedMsg = document.getElementById("invite-refused-msg");
    }

    // ***************************************************** UI *//
    // Update UI
    private toggleInviteMsg(set: boolean, text: string = "Invitation sent") {
        const btn = document.querySelector('[data-action="invite-game"]') as HTMLElement;
        if (!btn) return;
        if (set) {
            const savedLang = localStorage.getItem("lang");
            switch(savedLang) {
                case 'es' :
                    btn.textContent = `Invitacion enviada`;
                    break;
                case 'fr':
                    btn.textContent = `Invitation envoye`;
                    break;
                default :
                    btn.textContent = `Invitation sent`;
                    break;
            }
            // btn.textContent = text;
            btn.classList.add("text-gray-500", "pointer-events-none");
            btn.classList.remove("text-gray-900", "pointer-events-auto");
        } else if (!set) {
            const savedLang = localStorage.getItem("lang");
            switch(savedLang) {
                case 'es' :
                    btn.textContent = `Invite a jouer`;
                    break;
                case 'fr':
                    btn.textContent = `Invitación de juego`;
                    break;
                default :
                    btn.textContent = `Invite to game`;
                    break;
            }
            // btn.textContent = "Invite to game";
            btn.classList.remove("text-gray-500", "pointer-events-none");
            btn.classList.add("hover:bg-blue-200", "text-gray-900", "pointer-events-auto");
        }
    }
}
