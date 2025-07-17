import { ChatClient } from "./ChatClient.js";
import { BlockManager } from "./BlockManager.js";

export class OptionHandler {
  private blockManager: BlockManager | null = null;

  constructor() {}

  getBlockManager() {
    return (this.blockManager!);
  }

  initDropdownListeners(chatClient: ChatClient) {
    const optionsIcon = document.getElementById("options-icon") as HTMLElement;
    const optionsMenu = document.getElementById("options-menu") as HTMLElement;
    this.blockManager = new BlockManager(chatClient);
      
    const toggleDropdown = (show: boolean) => {
      if (show) {
        optionsMenu.classList.remove("opacity-0", "scale-20", "pointer-events-none");
        optionsMenu.classList.add("opacity-100", "scale-100", "pointer-events-auto");
      } else {
        optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
        optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
      }
    };
  
    optionsIcon.addEventListener("click", () => {
      const show = optionsMenu.classList.contains("opacity-0");
      toggleDropdown(show);
      });
  
    document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!optionsIcon.contains(target) && !optionsMenu.contains(target)) {
          optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
          optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
      }
    });
  
    optionsMenu.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;
        if (!action) return;    
        switch(action) {
          // case "add-friend":
          //   addFriend();
          //   break;
          // case "invite-game":
          //   inviteToGame();
          //   break;
          case "block-user":
            this.blockManager!.blockOrUnblockUser(chatClient); // ! BLOCK
            break;
        }
        toggleDropdown(false);
    });
  }
}