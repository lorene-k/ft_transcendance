import ChatClient from "./ChatClient.js";
import BlockManager from "./BlockManager.js"
import { toggleCornerDropdown } from "../animateUtils.js";

export default class OptionHandler {
    private chatClient: ChatClient;
    private blockManager: BlockManager | null = null;
    private tournamentText: HTMLElement | null = null;
    private tournamentSection: HTMLElement | null = null;
    private shownTournament: string | null = null;
    private optionsIcon: HTMLElement | null = null;
    private optionsMenu: HTMLElement | null = null;
    private handleDropdownClick: (e: MouseEvent) => void = null!;
    private handleDropdownClose: (e: MouseEvent) => void = null!;
    private handleOptionSelection: (e: MouseEvent) => void = null!;

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        this.tournamentText = document.getElementById("tournament-text");
        this.tournamentSection = document.getElementById("tournament-section");
        this.initTournamentListener();
        this.initDropdownListeners();
    }

    destroy() {
        if (this.optionsIcon) this.optionsIcon.removeEventListener("click", this.handleDropdownClick);
        if (this.optionsMenu) this.optionsMenu.removeEventListener("click", this.handleOptionSelection);
        document.removeEventListener("click", this.handleDropdownClose);
    }

    // Listen for tounrament notifications
    private initTournamentListener() {
        this.chatClient.getSocket().on("newTournament", (players: string[]) => {
            const tournamentKey = players.sort().join(",");
            if (this.shownTournament === tournamentKey) return;
            this.shownTournament = tournamentKey;
            this.tournamentText!.textContent = `New tournament starting with players: ${players.join(", ")}`;
            this.tournamentSection!.classList.remove("opacity-0");
            setTimeout(() => {
                this.tournamentSection!.classList.add("opacity-0");
                const onTransitionEnd = () => {
                    this.tournamentSection!.removeEventListener("transitionend", onTransitionEnd);
                };
                this.tournamentSection!.addEventListener("transitionend", onTransitionEnd);
            }, 5000);
        });
    }

    // Initialize dropdown menu listeners
    initDropdownListeners() {
        this.optionsIcon = document.getElementById("options-icon") as HTMLElement;
        this.optionsMenu = document.getElementById("options-menu") as HTMLElement;
        this.blockManager = this.chatClient.getUserManager()!.getBlockManager();

        this.handleDropdownClick = (e: MouseEvent) => {
            const show = this.optionsMenu!.classList.contains("opacity-0");
            toggleCornerDropdown(show, this.optionsMenu!);
        }
        this.optionsIcon.addEventListener("click", this.handleDropdownClick);

        this.handleDropdownClose = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            if (!this.optionsIcon!.contains(target) && !this.optionsMenu!.contains(target)) {
                toggleCornerDropdown(false, this.optionsMenu!);
            }
        };
        document.addEventListener("click", this.handleDropdownClose);

        this.handleOptionSelection = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const action = target.dataset.action;
            if (!action) return;
            switch (action) {
                case "invite-game":
                    this.chatClient.getInviteManager()!.inviteToGame();
                    break;
                case "block-user":
                    this.blockManager!.blockOrUnblockUser();
                    break;
            }
            toggleCornerDropdown(false, this.optionsMenu!);
        }
        this.optionsMenu!.addEventListener("click", this.handleOptionSelection);
    }
}