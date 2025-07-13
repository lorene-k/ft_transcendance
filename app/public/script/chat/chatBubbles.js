let lastSenderId = "";
let lastMsgTime = "";
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
function getTimeString(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return (`${year}-${month}-${day}-${hours}-${minutes}`);
}
function updateBubbleHeader(bubble, message) {
    const timeElem = bubble?.querySelector(".chat-time");
    const headerElem = bubble?.querySelector(".chat-bubble-header");
    // const currMsgTime = message.sentAt.toISOString().slice(0,16); // Format: "2025-07-11T14:35"
    const currMsgTime = getTimeString(message.sentAt);
    const isSameSender = message.senderId === lastSenderId;
    const isSameMinute = currMsgTime === lastMsgTime;
    if (timeElem)
        timeElem.textContent = message.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isSameSender && isSameMinute && headerElem)
        headerElem.remove();
    lastSenderId = message.senderId;
    lastMsgTime = currMsgTime;
}
export async function addChatBubble(currentSessionId, message) {
    const isSent = message.senderId === currentSessionId;
    const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
    const bubble = await loadTemplate(templatePath);
    if (!bubble) {
        console.error("Failed to load chat bubble template:", templatePath);
        return;
    }
    updateBubbleHeader(bubble, message);
    const textElem = bubble?.querySelector("p");
    if (textElem)
        textElem.textContent = message.content;
    const conversation = document.getElementById("conversation-box");
    if (!conversation) {
        console.error("Conversation box element not found.");
        return;
    }
    conversation.appendChild(bubble);
    // console.debug("Added chat bubble:", message.content, "from", message.senderId); // ! DEBUG
    conversation.scrollTop = conversation.scrollHeight;
}
