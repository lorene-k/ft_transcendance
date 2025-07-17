import { ChatClient } from "./ChatClient.js";

function initChat() {
  const chatClient = new ChatClient();

  (window as any).chatClient = chatClient; // for dev
}

document.addEventListener("DOMContentLoaded", initChat);