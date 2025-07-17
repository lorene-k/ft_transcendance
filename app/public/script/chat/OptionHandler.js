import { BlockManager } from "./BlockManager.js";
export class OptionHandler {
    constructor(chatClient) {
        this.optionsIcon = document.getElementById("options-icon");
        this.optionsMenu = document.getElementById("options-menu");
        this.blockManager = new BlockManager(chatClient);
    }
    getBlockManager() {
        return (this.blockManager);
    }
    initDropdownListeners(chatClient) {
        const toggleDropdown = (show) => {
            if (show) {
                this.optionsMenu.classList.remove("opacity-0", "scale-20", "pointer-events-none");
                this.optionsMenu.classList.add("opacity-100", "scale-100", "pointer-events-auto");
            }
            else {
                this.optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
                this.optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
            }
        };
        this.optionsIcon.addEventListener("click", () => {
            const show = this.optionsMenu.classList.contains("opacity-0");
            toggleDropdown(show);
        });
        document.addEventListener("click", (e) => {
            const target = e.target;
            if (!this.optionsIcon.contains(target) && !this.optionsMenu.contains(target)) {
                this.optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
                this.optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
            }
        });
        this.optionsMenu.addEventListener("click", (e) => {
            const target = e.target;
            const action = target.dataset.action;
            if (!action)
                return;
            switch (action) {
                // case "add-friend":
                //   addFriend();
                //   break;
                // case "invite-game":
                //   inviteToGame();
                //   break;
                case "block-user":
                    this.blockManager.blockOrUnblockUser(chatClient); // ! BLOCK
                    break;
            }
            toggleDropdown(false);
        });
    }
}
