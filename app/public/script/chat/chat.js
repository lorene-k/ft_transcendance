import { ChatClient } from "./ChatClient.js";
function initChat() {
    const chatClient = new ChatClient();
    window.chatClient = chatClient; // for dev
}
document.addEventListener("DOMContentLoaded", initChat);
