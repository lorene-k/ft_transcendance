import { currentSessionId, setSendListeners } from "./chat.js";
import { addChatBubble, loadTemplate } from "./chatBubbles.js";
// Get conversation ID
async function getConversationId(user1, user2) {
    try {
        const res = await fetch(`/api/chat/conversation?userA=${user1}&userB=${user2}`);
        const data = await res.json();
        if (res.status === 404) {
            console.log(data.message);
            return (null);
        }
        else if (res.status === 500) {
            console.error(data.message);
            return (null);
        }
        return (data.id);
    }
    catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
        return (null);
    }
}
// Get message history
async function getMessageHistory(conversationId) {
    try {
        const res = await fetch(`/api/chat/${conversationId}/messages`);
        const data = await res.json();
        if (res.status === 500) {
            console.error(data.message);
            return (null);
        }
        return (data);
    }
    catch (err) {
        console.error("Failed to fetch or parse JSON:", err);
        return (null);
    }
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
    const input = document.querySelector('textarea');
    setSendListeners();
    // await handleOptions(socket); // !!!!!!!!!!!!!!!! ONGOING 
}
// Display all messages
async function displayMessageHistory(conversationId) {
    const messages = await getMessageHistory(conversationId);
    if (messages) {
        for (const entry of messages) {
            const message = {
                content: entry.content,
                senderId: entry.sender_id.toString(), // Ignore squiggles
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
    if (!conversationId)
        return;
    displayMessageHistory(conversationId);
    //  checkBlockedTarget();
}
// TODO - ADD DATES 
// TODO - Load profile picture
// ? Cache Last Messages
// ? GET /api/chat/:conversationId/messages?since=123
