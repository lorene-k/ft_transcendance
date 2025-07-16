import { getBlockedUsers, blockOrUnblockUser } from "./chatBlocks.js";

// ******************************************************************** TODO */
function addFriend() {
    console.log("Add friend");
// Use socket to emit() friend request 
// Listen for socket response to update UI (state : pending / accepted)
// Include friends list with states
// Backend : insert friend request status when received + listen for response to udpate table
}

function inviteToGame() {
  console.log("Invite to game");
// Use socket to emit() game invite
// (push notif on receiver end)
// Listen for socket response to update UI & load game
}

// ******************************************** Handle dropdown menu options */
export async function handleOptions(socket: any) {
    const optionsIcon = document.getElementById("options-icon") as HTMLElement;
    const optionsMenu = document.getElementById("options-menu") as HTMLElement;
    getBlockedUsers();
    
    // Toggle dropdown menu visibility
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

    // Close menu if clicking outside
    document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!optionsIcon.contains(target) && !optionsMenu.contains(target)) {
            optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
            optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
      }
    });

    // Handle menu actions
    optionsMenu.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        const action = target.dataset.action;
        if (!action) return;    
        switch(action) {
          case "add-friend":
            addFriend();
            break;
          case "invite-game":
            inviteToGame();
            break;
          case "block-user":
            blockOrUnblockUser(socket);
            break;
        }
        toggleDropdown(false);
    });
}
