import addChatBubble from "./chatBubbles.js";
let users = [];
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
/*********************** List active users */
// Display connected users
function displayConnectedUsers() {
    console.log("Users: ", users); // ! DEBUG
    const userList = document.getElementById("user-list");
    if (!userList)
        return;
    userList.innerHTML = "";
    users.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = user.username;
        if (!user.self)
            userList.appendChild(li);
        console.log('User connected:', user.username, user.self ? '(self)' : '');
    });
}
// Get connected users
socket.on("users", (newUsers) => {
    newUsers.forEach((user) => {
        user.self = user.userID === socket.id;
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
    displayConnectedUsers();
});
// Add user to list
socket.on("user connected", (user) => {
    users.push(user);
    displayConnectedUsers();
});
// ! Add "user disconnected" to update list
/*********************** Send/Receive messages */
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
