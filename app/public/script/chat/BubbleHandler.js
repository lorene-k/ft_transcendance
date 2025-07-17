export default class BubbleHandler {
    constructor() {
        this.lastSenderId = "";
        this.lastTargetId = "";
        this.lastMsgTime = "";
        this.offsetMin = (new Date()).getTimezoneOffset();
    }
    getTimeString(utcDate) {
        const utcDateObj = new Date(utcDate);
        const date = new Date(utcDateObj.getTime() - this.offsetMin * 60000);
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return (`${year}-${month}-${day}-${hours}:${minutes}`);
    }
    updateBubbleHeader(bubble, message, targetId) {
        const timeElem = bubble?.querySelector(".chat-time");
        const dateElem = bubble?.querySelector(".chat-date");
        const headerElem = bubble?.querySelector(".chat-bubble-header");
        const msgTimeDate = this.getTimeString(message.sentAt);
        const msgDate = msgTimeDate.slice(5, 10);
        const isSameSender = message.senderId === this.lastSenderId;
        const isSameTarget = targetId === this.lastTargetId;
        const isSameMinute = message.sentAt === this.lastMsgTime;
        const isSameDay = msgTimeDate.slice(0, 10) === this.lastMsgTime.slice(0, 10);
        if (!(isSameSender && isSameTarget && isSameMinute && headerElem)) {
            if (dateElem && !isSameDay)
                dateElem.textContent = msgTimeDate.slice(0, 10);
            if (timeElem)
                timeElem.textContent = msgTimeDate.slice(11, 16);
        }
        this.lastSenderId = message.senderId;
        this.lastMsgTime = message.sentAt;
        this.lastTargetId = targetId;
    }
    async loadTemplate(templatePath) {
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
    async addChatBubble(currentSessionId, message, targetId) {
        const isSent = message.senderId === currentSessionId;
        const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
        const bubble = await this.loadTemplate(templatePath);
        if (!bubble) {
            console.error("Failed to load chat bubble template:", templatePath);
            return;
        }
        this.updateBubbleHeader(bubble, message, targetId);
        const textElem = bubble?.querySelector("p");
        if (textElem)
            textElem.textContent = message.content;
        const conversation = document.getElementById("conversation-box");
        if (!conversation)
            return;
        conversation.appendChild(bubble);
        conversation.scrollTop = conversation.scrollHeight;
    }
}
