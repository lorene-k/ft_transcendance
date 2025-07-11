import { currentSessionId } from "./chat.js";
import { addChatBubble, loadTemplate } from "./chatBubbles.js";
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
async function getMessages(conversationId) {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.status === 500)
        return (null);
    const messages = await res.json();
    return (messages);
}
async function openFirstConv() {
    const convContainer = document.getElementById("conversation-container");
    const chatWindow = await loadTemplate("/chat/chat-window.html");
    if (!chatWindow || !convContainer)
        return;
    convContainer.appendChild(chatWindow);
}
// Open conversation
export async function openChat(user) {
    if (!document.getElementById("chat-window"))
        openFirstConv();
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
    const messages = await getMessages(conversationId); // TODO - fix here (load msg history)
    if (messages) {
        for (const message of messages) {
            const isSent = message.sender_id === currentSessionId; // ! FIX : align retrieved bubbles according to senderID
            await addChatBubble(message.content, isSent, currentSessionId);
        }
    }
    else
        console.error("Failed to fetch messages for conversation ID:", conversationId);
}
// TODO - display all conversations in conv preview after retreiving them from DB (add API call - getAllConversations)
// TODO - add search bar for friends & new conversations
// ! Load profile picture
// ! Cache Last Messages
// >> GET /api/chat/:conversationId/messages?since=123
