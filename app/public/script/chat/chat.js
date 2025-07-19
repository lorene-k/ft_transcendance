import ChatClient from "./ChatClient.js";
function initChat() {
    const chatClient = new ChatClient();
    if (!chatClient)
        console.error("Failed to initialize chatClient.");
}
document.addEventListener("DOMContentLoaded", initChat);
// TODO - tournament notifs
// TODO - game invites
// TODO - add profile picture
// TODO - add link to profile
// ! call in login
