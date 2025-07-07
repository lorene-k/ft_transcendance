let lastSenderId = "";
let lastMessageTime = 0;
let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");
const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
        serverOffset: lastOffset
    },
    // ackTimeout: 10000, // Use emit with ack to guarantee msg delivery
    // retries: 3
});
async function loadBubbleTemplate(templatePath) {
    try {
        const res = await fetch(templatePath);
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        return (doc.body.firstElementChild);
    }
    catch (e) {
        console.error("Failed to fetch html:", e);
        // conversation.innerHTML = "<p>Failed to load message.</p>"; //add in msg bubble
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
        headerElem.remove();
}
async function addChatBubble(message, isSent, senderId) {
    const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
    const bubble = await loadBubbleTemplate(templatePath);
    if (!bubble)
        return;
    updateBubbleHeader(bubble, senderId);
    const textElem = bubble?.querySelector("p");
    if (textElem)
        textElem.textContent = message;
    const conversation = document.getElementById("conversation");
    if (!conversation)
        return;
    conversation.appendChild(bubble);
    conversation.scrollTop = conversation.scrollHeight;
}
// Send message
document.querySelector('button')?.addEventListener('click', (e) => {
    console.log("Sending message...");
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (input && input.value) {
        // compute unique offset (ensure client delivery after state recovery/temp disconnection)
        const clientOffset = `${socket.id}-${counter++}`; // ! adds loading time ?
        socket.emit("message", input.value, clientOffset);
        input.value = "";
    }
    input?.focus();
});
// Listen for messages
socket.on("message", async ({ senderId, msg, serverOffset }) => {
    console.log(`Received message from ${senderId}: ${msg}`);
    const isSent = senderId === socket.id;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    await addChatBubble(msg, isSent, senderId);
});
export {};
// ! Disconnect
// ! Announce next tournament (io.emit)
// server side : io.to(session.socketId).emit("event", data);
/*
! Send DM
socket.emit("private-message", { toUserId: 42, message: "Hey!" });

! Receive DM
socket.on("private-message", ({ from, message }) => {
  console.log(`DM from ${from}: ${message}`);
});
*/
/*
! SEND TO TARGET
socket.emit("private-message", {
  toUsername: "alice",
  message: "Hey Alice!"
});

! RECEIVE DM
socket.on("private-message", ({ fromUsername, message, toUsername }) => {
  console.log(`DM from ${fromUsername}: ${message}`);
});
*/ 
