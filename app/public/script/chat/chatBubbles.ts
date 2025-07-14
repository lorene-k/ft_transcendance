import { Message } from "./chatHistory.js";
import { targetId } from "./chatUsers.js";

let lastSenderId = "";
let lastTargetId = "";
let lastMsgTime: string = "";

// Load html templates
export async function loadTemplate(templatePath : string) {
    try {
    const res = await fetch(templatePath);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return (doc.body.firstElementChild);
    } catch (e) {
        console.error("Failed to fetch html:", e);
    }
}

// Format current message time to "YYYY-MM-DD-HH-MM"
function getTimeString(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return (`${year}-${month}-${day}-${hours}-${minutes}`);
}

// Update bubble header with time
function updateBubbleHeader(bubble: Element, message: Message) {
  const timeElem = bubble?.querySelector(".chat-time");
  const headerElem = bubble?.querySelector(".chat-bubble-header");
  // const currMsgTime = message.sentAt.toISOString().slice(0,16); // Format: "2025-07-11T14:35"
  const currMsgTime = getTimeString(message.sentAt);
  const isSameSender = message.senderId === lastSenderId;
  const isSameTarget = targetId === lastTargetId;
  const isSameMinute = currMsgTime === lastMsgTime;
  if (timeElem) timeElem.textContent = message.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isSameSender && isSameTarget && isSameMinute && headerElem) headerElem.remove();
  lastSenderId = message.senderId;
  lastMsgTime = currMsgTime;
  lastTargetId = targetId!;
}

// Add chat bubble to conversation box
export async function addChatBubble(currentSessionId: string, message: Message) {
  const isSent = message.senderId === currentSessionId;
  const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
  const bubble = await loadTemplate(templatePath);
  if (!bubble) {
    console.error("Failed to load chat bubble template:", templatePath);
    return;
  }
  updateBubbleHeader(bubble, message);
  const textElem = bubble?.querySelector("p");
  if (textElem) textElem.textContent = message.content;
  const conversation = document.getElementById("conversation-box");
  if (!conversation) return;
  conversation.appendChild(bubble);
  conversation.scrollTop = conversation.scrollHeight;
}
