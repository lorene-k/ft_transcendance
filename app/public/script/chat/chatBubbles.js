let lastSenderId = "";
let lastMessageTime = 0;
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
function updateBubbleHeader(bubble, senderId) {
    const timeElem = bubble?.querySelector(".chat-time");
    const headerElem = bubble?.querySelector(".chat-bubble-header");
    const isSameSender = senderId === lastSenderId;
    const isRecent = Date.now() - lastMessageTime < (60000);
    lastSenderId = senderId;
    lastMessageTime = Date.now();
    if (timeElem)
        timeElem.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (isSameSender && isRecent && headerElem)
        headerElem.remove(); // ! CHANGE IS SAME SENDER
}
export async function addChatBubble(message, isSent, senderId) {
    const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
    const bubble = await loadTemplate(templatePath);
    if (!bubble)
        return;
    updateBubbleHeader(bubble, senderId);
    const textElem = bubble?.querySelector("p");
    if (textElem)
        textElem.textContent = message;
    const conversation = document.getElementById("conversation-box");
    if (!conversation)
        return;
    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
}
