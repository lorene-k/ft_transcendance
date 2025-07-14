import { currentSessionId, targetToConvId } from "./chat.js";
import { openChat } from "./chatHistory.js";
import { loadTemplate } from "./chatBubbles.js";
export let activeUsers = []; // !Active users only - useless ??
export let targetId = null;
export let currConvId = null;
// ******************************************************* List active users */
// Add user to active users list
function addActiveUser(userList, user) {
    const li = document.createElement("li");
    li.textContent = user.username;
    if (user.self)
        return;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
        targetId = user.userId;
        console.log("Target set to:", targetId); // ! DEBUG
        currConvId = targetToConvId.get(targetId);
        openChat(user);
    });
    userList.appendChild(li);
}
// Display connected users
function displayConnectedUsers() {
    const userList = document.getElementById("user-list");
    if (!userList)
        return;
    userList.innerHTML = "";
    activeUsers.forEach((user) => {
        // console.log(`User: ${user.username} (${user.userId})`); // ! DEBUG
        addActiveUser(userList, user);
    });
}
// ***************************************************** Get connected users */
export function getConnectedUsers(socket) {
    // Get active users list
    socket.on("users", (newUsers) => {
        newUsers.forEach((user) => {
            // console.log(`User connected: ${user.username} (${user.userId})`); // ! DEBUG
            if (user.userId === currentSessionId)
                user.self = true;
        });
        newUsers = newUsers.sort((a, b) => {
            if (a.self)
                return -1;
            if (b.self)
                return 1;
            if (a.username < b.username)
                return -1;
            return a.username > b.username ? 1 : 0;
        });
        activeUsers = newUsers;
        displayConnectedUsers();
    });
    // Add user to list
    socket.on("user connected", (user) => {
        activeUsers.push(user);
        displayConnectedUsers();
    });
}
// ********************************************* Update conversation preview */
export async function updateConvPreview(userId, targetName) {
    const allMessages = document.getElementById("all-messages");
    if (!allMessages)
        return;
    const displayed = allMessages.querySelector(`[data-user-id="${userId}"]`);
    if (displayed) {
        displayed.classList.add("transition-all", "duration-300");
        allMessages.prepend(displayed);
    }
    else {
        const card = await loadTemplate("/chat/conv-preview.html");
        if (!card)
            return;
        card.setAttribute("data-user-id", userId);
        const name = card.querySelector("p");
        if (name)
            name.textContent = targetName;
        card.addEventListener("click", () => {
            targetId = userId;
            console.log("Target set to:", targetId); // ! DEBUG
            currConvId = targetToConvId.get(targetId);
            openChat({ userId: userId, username: targetName, self: false });
        });
        allMessages.prepend(card);
    }
}
