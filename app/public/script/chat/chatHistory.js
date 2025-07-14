import { currentSessionId, setSendBtnListener } from "./chat.js";
import { addChatBubble, loadTemplate } from "./chatBubbles.js";
import { handleOptions } from "./chatOptions.js";
// Get conversation ID
async function getConversationId(user1, user2) {
    const res = await fetch(`/api/chat/conversation?userA=${user1}&userB=${user2}`);
    if (res.status === 404 || res.status === 500)
        return (null);
    const data = await res.json();
    if (!data)
        return (null);
    return (data.id);
}
// Get message history
async function getMessageHistory(conversationId) {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.status === 500)
        return (null);
    const messages = await res.json();
    return (messages);
}
// Load chat window
async function openFirstConv() {
    const convContainer = document.getElementById("conversation-container");
    const chatWindow = await loadTemplate("/chat/chat-window.html");
    if (!chatWindow || !convContainer)
        return;
    const p = document.getElementById("conv-placeholder");
    if (p)
        p.remove();
    convContainer.appendChild(chatWindow);
    setSendBtnListener();
    handleOptions(); // ! TODO 
}
// Display all messages
async function displayMessageHistory(conversationId) {
    const messages = await getMessageHistory(conversationId);
    if (messages) {
        for (const entry of messages) {
            const message = {
                content: entry.content,
                senderId: entry.sender_id.toString(),
                sentAt: new Date(entry.sent_at)
            };
            await addChatBubble(currentSessionId, message);
        }
    }
    else
        console.error("Failed to fetch messages for conversation ID:", conversationId);
}
// Open conversation
export async function openChat(user) {
    if (!document.getElementById("chat-window"))
        await openFirstConv();
    const chatBox = document.getElementById("conversation-box");
    const recipientName = document.getElementById("recipient-name");
    if (!chatBox || !recipientName)
        return;
    chatBox.innerHTML = "";
    recipientName.textContent = user.username;
    const conversationId = await getConversationId(currentSessionId, user.userId);
    if (!conversationId) {
        console.log("No existing conversation found.");
        return;
    }
    displayMessageHistory(conversationId);
}
// TODO - ADD DATES 
// TODO - Load profile picture
// ? Cache Last Messages
// ? GET /api/chat/:conversationId/messages?since=123
