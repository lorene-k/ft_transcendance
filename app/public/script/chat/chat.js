import { addChatBubble, loadTemplate } from "./chatBubbles.js";
import { openChat } from "./chatHistory.js";
let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");
export const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
        serverOffset: lastOffset
    },
    // ackTimeout: 10000, // Use emit with ack to guarantee msg delivery
    // retries: 3
});
export let currentSessionId = "";
export let targetId = null;
let users = [];
// ********************************************* Update conversation preview */
async function updateConvPreview(userId, targetName) {
    const allMessages = document.getElementById("all-messages");
    if (!allMessages)
        return;
    const displayed = allMessages.querySelector(`[data-user-id="${userId}"]`);
    if (displayed) {
        displayed.classList.add("transition-all", "duration-300");
        allMessages.prepend(displayed);
    }
    else {
        const card = await loadTemplate("/chat/conversation.html");
        if (!card)
            return;
        card.setAttribute("data-user-id", userId);
        const name = card.querySelector("p");
        if (name)
            name.textContent = targetName;
        card.addEventListener("click", () => {
            targetId = userId;
            openChat({ userId: userId, username: targetName, self: false });
        });
        allMessages.prepend(card);
    }
}
// ******************************************************* List active users */
// Add user to active users list
function addActiveUser(userList, user) {
    const li = document.createElement("li");
    li.textContent = user.username;
    if (user.self)
        return;
    li.style.cursor = "pointer";
    li.addEventListener("click", () => {
        targetId = user.userId;
        console.log("Target set to:", targetId); // ! DEBUG
        openChat(user);
    });
    userList.appendChild(li);
}
// Display connected users
function displayConnectedUsers() {
    const userList = document.getElementById("user-list");
    if (!userList)
        return;
    userList.innerHTML = "";
    users.forEach((user) => {
        addActiveUser(userList, user);
    });
}
// Get connected users
socket.on("users", (newUsers) => {
    newUsers.forEach((user) => {
        // console.log(`User connected: ${user.username} (${user.userId})`); // ! DEBUG
        if (user.userId === currentSessionId)
            user.self = true;
    });
    newUsers = newUsers.sort((a, b) => {
        if (a.self)
            return -1;
        if (b.self)
            return 1;
        if (a.username < b.username)
            return -1;
        return a.username > b.username ? 1 : 0;
    });
    users = newUsers;
    if (users[0])
        console.log(`User(0): ${users[0].username}`); // ! DEBUG
    if (users[1])
        console.log(`user[1] = ${users[1].username}`);
    displayConnectedUsers();
});
// Add user to list
socket.on("user connected", (user) => {
    users.push(user);
    displayConnectedUsers();
});
// ! Add "user disconnected" to update list
// *************************************************** Send/Receive messages */
// Get conversation history
socket.on("allConversations", (conversations) => {
    if (!conversations || conversations.length === 0) {
        console.log("No conversations found.");
    }
    else {
        console.log("Received conversations: ", conversations);
        for (const conv of conversations) {
            const otherUser = users.find(u => u.userId === conv.otherUserId.toString());
            if (!otherUser)
                console.error(`User with ID ${conv.id} not found in users list.`); // ! TEST
            if (otherUser)
                updateConvPreview(conv.id, otherUser.username);
        }
    }
});
// Send message
document.getElementById("conversation-container")?.addEventListener('click', (e) => {
    const target = e.target;
    if (target && target.tagName === 'BUTTON') {
        console.log(`Sending message to ${targetId} from ${socket.auth.username}`); // ! DEBUB - get current username
        e.preventDefault();
        const input = document.querySelector('textarea');
        if (!input)
            return;
        const msg = input.value;
        if (input.value) {
            // compute unique offset (ensure client delivery after state recovery/temp disconnection)
            const clientOffset = `${currentSessionId}-${Date.now()}-${counter++}`; // !!!!!!!!! CHECK
            socket.emit("message", { targetId: targetId, msg, clientOffset });
            input.value = "";
        }
        input.focus();
    }
});
// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset }) => {
    console.log(`Received message from ${senderId}: ${msg}`); // ! DEBUG
    const isSent = senderId === currentSessionId;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    // Update conversation preview
    if (isSent) {
        const targetUser = users.find(u => u.userId === targetId);
        if (targetUser)
            updateConvPreview(targetId, targetUser.username);
    }
    else
        updateConvPreview(targetId, senderUsername);
    await addChatBubble(msg, isSent, currentSessionId);
});
socket.on("session", ({ sessionId, username }) => {
    currentSessionId = sessionId;
    socket.auth.username = username;
});
// ! FIX - sending to user null ??
// ! FIX users list - bancal
// ! FIX - load msg history when opening chat-window
// TODO - update landing page
// ? add last_seen in conv to send missed messages in case of disconnect ?
// TODO - handle history
// TODO - check msg recovery handling
// TODO - Disconnect
// TODO - check what happens if same user connected in different tabs (don't create new socket)
// >> check if session.userId exists in map, assign socket.id to it (change map to hold socket.id ARRAY)
// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);
// TODO - create landing page for new chat, otherwise display last conversation
// TODO - friends (search bar w/ db fetch)
