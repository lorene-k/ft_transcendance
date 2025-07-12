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
function updateBubbleHeader(bubble, message) {
    const timeElem = bubble?.querySelector(".chat-time");
    const headerElem = bubble?.querySelector(".chat-bubble-header");
    const currMsgTime = message.sentAt.toISOString().slice(0, 16); // Format: "2025-07-11T14:35" (seconds, milliseconds, and timezone removed)
    if (lastSenderId == "" && lastMsgTime === "") {
        lastSenderId = message.senderId;
        lastMsgTime = currMsgTime;
    }
    const isSameSender = message.senderId === lastSenderId;
    const isSameMinute = currMsgTime === lastMsgTime;
    lastSenderId = message.senderId;
    lastMsgTime = currMsgTime;
    if (timeElem)
        timeElem.textContent = message.sentAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isSameSender && isSameMinute && headerElem)
        headerElem.remove();
}
export async function addChatBubble(currentSessionId, message) {
    const isSent = message.senderId === currentSessionId;
    const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
    const bubble = await loadTemplate(templatePath);
    if (!bubble)
        return;
    updateBubbleHeader(bubble, message);
    const textElem = bubble?.querySelector("p");
    if (textElem)
        textElem.textContent = message.content;
    const conversation = document.getElementById("conversation-box");
    if (!conversation)
        return;
    conversation.appendChild(bubble);
    console.debug("Added chat bubble:", message.content, "from", message.senderId); // ! DEBUG
    conversation.scrollTop = conversation.scrollHeight;
}
// - TODO update time if history
