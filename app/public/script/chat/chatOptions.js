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
function blockUser() {
    console.log("Block user clicked");
    // frontend : socket.emit block request
    // BACKEND : insert block status when received
    // API or socket.emit to check if senderId blocked by receiverId before sending msg
}
// ******************************************************* Handle connection */
export function handleOptions() {
    const optionsIcon = document.getElementById("options-icon");
    const optionsMenu = document.getElementById("options-menu");
    // Toggle dropdown menu visibility
    const toggleDropdown = (show) => {
        if (show) {
            optionsMenu.classList.remove("opacity-0", "scale-20", "pointer-events-none");
            optionsMenu.classList.add("opacity-100", "scale-100", "pointer-events-auto");
        }
        else {
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
        const target = e.target;
        if (!optionsIcon.contains(target) && !optionsMenu.contains(target)) {
            optionsMenu.classList.add("opacity-0", "scale-20", "pointer-events-none");
            optionsMenu.classList.remove("opacity-100", "scale-100", "pointer-events-auto");
        }
    });
    // Handle menu actions
    optionsMenu.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.dataset.action;
        if (!action)
            return;
        switch (action) {
            case "add-friend":
                addFriend();
                break;
            case "invite-game":
                inviteToGame();
                break;
            case "block-user":
                blockUser();
                break;
        }
        toggleDropdown(false);
    });
}
