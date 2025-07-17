async function openFirstConv(chatClient) {
    const convContainer = document.getElementById("conversation-container");
    const chatWindow = await chatClient.getBubbleHandler().loadTemplate("/chat/chat-window.html");
    if (!chatWindow || !convContainer)
        return;
    const p = document.getElementById("conv-placeholder");
    if (p)
        p.remove();
    convContainer.appendChild(chatWindow);
    const input = document.querySelector('textarea');
    chatClient.setInputListeners();
    chatClient.getOptionHandler().initDropdownListeners(chatClient); // ! ONGOING
}
async function fetchConversationId(user1, user2) {
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
async function fetchMessageHistory(conversationId) {
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
async function displayMessageHistory(conversationId, chatClient) {
    const sessionId = chatClient.getSessionId();
    const targetId = chatClient.getUserManager().getTargetId();
    const messages = await fetchMessageHistory(conversationId);
    if (messages) {
        for (const entry of messages) {
            const message = {
                content: entry.content,
                senderId: entry.sender_id.toString(),
                sentAt: entry.sent_at
            };
            await chatClient.getBubbleHandler().addChatBubble(sessionId, message, targetId);
        }
    }
    else
        console.error("Failed to fetch messages for conversation ID:", conversationId);
}
export async function openChat(user, chatClient) {
    const currentSessionId = chatClient.getSessionId();
    if (!document.getElementById("chat-window"))
        await openFirstConv(chatClient);
    const chatBox = document.getElementById("conversation-box");
    const recipientName = document.getElementById("recipient-name");
    if (!chatBox || !recipientName)
        return;
    chatBox.innerHTML = "";
    recipientName.textContent = user.username;
    const conversationId = await fetchConversationId(currentSessionId, user.userId);
    if (!conversationId)
        return;
    displayMessageHistory(conversationId, chatClient);
    chatClient.getOptionHandler().getBlockManager().checkBlockedTarget();
}
