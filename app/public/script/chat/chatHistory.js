import { currentSessionId } from "./chat.js";
import { addChatBubble } from "./chatBubbles.js";
// Get conversation ID
async function getConversationId(user1, user2) {
    const res = await fetch(`/api/chat/conversation?userA=${user1}&userB=${user2}`);
    if (res.status === 204 || res.status === 500)
        return (null);
    const data = await res.json();
    if (!data)
        return (null);
    console.log("Conversation res.json = ", data); // ! DEBUG
    return (data.id);
}
// Get message history
async function getMessages(conversationId) {
    const res = await fetch(`/api/chat/${conversationId}/messages`);
    if (res.status === 500)
        return (null);
    const messages = await res.json();
    console.log("Messages res.json = ", messages); // ! DEBUG
    return (messages);
}
// Open conversation
export async function openChat(user) {
    const chatBox = document.getElementById("conversation-box");
    const recipientName = document.getElementById("recipient-name");
    if (!chatBox || !recipientName)
        return;
    recipientName.textContent = user.username;
    const conversationId = await getConversationId(currentSessionId, user.userId);
    if (!conversationId) {
        console.log("No existing conversation found.");
        chatBox.innerHTML = "";
        return;
    }
    const messages = await getMessages(conversationId);
    if (messages) {
        for (const message of messages) {
            const isSent = message.sender_id === currentSessionId;
            await addChatBubble(message.content, isSent, currentSessionId);
        }
    }
    else
        console.error("Failed to fetch messages for conversation ID:", conversationId);
}
// ! Load profile picture
// ! Cache Last Messages
// >> GET /api/chat/:conversationId/messages?since=123
