let lastSenderId = "";
let lastTargetId = "";
let lastMsgTime = "";
const offsetMin = (new Date()).getTimezoneOffset();
// Load html templates
export async function loadTemplate(templatePath) {
    try {
        const res = await fetch(templatePath);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        return (doc.body.firstElementChild);
    }
    catch (e) {
        console.error("Failed to fetch html:", e);
    }
}
// Format current message time to "YYYY-MM-DD-HH-MM"
function getTimeString(utcDate) {
    const utcDateObj = new Date(utcDate);
    const date = new Date(utcDateObj.getTime() - offsetMin * 60000);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return (`${year}-${month}-${day}-${hours}:${minutes}`);
}
// Update bubble header with time
function updateBubbleHeader(bubble, message, targetId) {
    const timeElem = bubble?.querySelector(".chat-time");
    const headerElem = bubble?.querySelector(".chat-bubble-header");
    const currMsgTime = getTimeString(message.sentAt);
    const isSameSender = message.senderId === lastSenderId;
    const isSameTarget = targetId === lastTargetId;
    const isSameMinute = message.sentAt === lastMsgTime;
    if (timeElem)
        timeElem.textContent = currMsgTime.slice(11, 16);
    if (isSameSender && isSameTarget && isSameMinute && headerElem)
        headerElem.remove();
    lastSenderId = message.senderId;
    lastMsgTime = message.sentAt;
    lastTargetId = targetId;
}
// Add chat bubble to conversation box
export async function addChatBubble(currentSessionId, message, targetId) {
    const isSent = message.senderId === currentSessionId;
    const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
    const bubble = await loadTemplate(templatePath);
    if (!bubble) {
        console.error("Failed to load chat bubble template:", templatePath);
        return;
    }
    updateBubbleHeader(bubble, message, targetId);
    const textElem = bubble?.querySelector("p");
    if (textElem)
        textElem.textContent = message.content;
    const conversation = document.getElementById("conversation-box");
    if (!conversation)
        return;
    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
}
