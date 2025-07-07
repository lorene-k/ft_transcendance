import addChatBubble from "./chatBubbles.js";

interface User {
  userID: string;
  username: string;
  self?: boolean;
  // Include any other properties you expect on a user
}
let users: User[] = [];
let targetId: string | null = null;

let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");
declare const io: any;
const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
        serverOffset: lastOffset
      },
    // ackTimeout: 10000, // Use emit with ack to guarantee msg delivery
    // retries: 3
});

// ************************************************************** Handle DMs */
function openNewChat(user: User) {
  const chatBox = document.getElementById("conversation-box");
  const recipientName = document.getElementById("recipient-name");
  if (!chatBox || !recipientName) return;
  chatBox.innerHTML = "";
  recipientName.textContent = user.username;
  // socket.emit("load_dm", { userId: user.userID });
  // Load profile picture
}
// ! ADD socket.on("load_dm", ...) to fetch messages between the two users

// ******************************************************* List active users */
// Add user to active users list
function addActiveUser(userList: HTMLElement, user: User) {
  const li = document.createElement("li");
  li.textContent = user.username;
  if (user.self) return;
  li.style.cursor = "pointer";
  li.addEventListener("click", () => {
    targetId = user.userID;
    console.log("DM target set to:", targetId); // ! DEBUG
    openNewChat(user);
  });
  userList.appendChild(li);
}

// Display connected users
function displayConnectedUsers() {
  const userList = document.getElementById("user-list");
  if (!userList) return;
  userList.innerHTML = "";
  users.forEach((user) => {
    addActiveUser(userList, user);
  });
}

// Get connected users
socket.on("users", (newUsers: User[]) => {
  newUsers.forEach((user) => {
    user.self = user.userID === socket.id;
  });
  newUsers = newUsers.sort((a, b) => {
    if (a.self) return -1;
    if (b.self) return 1;
    if (a.username < b.username) return -1;
    return a.username > b.username ? 1 : 0;
  });
  users = newUsers;
  displayConnectedUsers();
});

// Add user to list
socket.on("user connected", (user: User) => {
  users.push(user);
  displayConnectedUsers();
});

// ! Add "user disconnected" to update list

// *************************************************** Send/Receive messages */
// Send message
document.querySelector('button')?.addEventListener('click', (e) => {
    console.log(`Sending message to ${targetId}`); // ! DEBUB - get current username
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (!input) return ;
    const msg = input.value;
    if (input.value) {
        // compute unique offset (ensure client delivery after state recovery/temp disconnection)
        const clientOffset = `${socket.id}-${counter++}`; // ! adds loading time ?
        socket.emit("message", { target: targetId, msg }, clientOffset);
        input.value = "";
    }
    input.focus();
});

// Listen for messages
socket.on("message", async ({ senderId, msg, serverOffset } :
    { senderId: string; msg: string, serverOffset: string }) => {
    console.log(`Received message from ${senderId}: ${msg}`); // ! DEBUG
    const isSent = senderId === socket.id; // ! current userId
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    await addChatBubble(msg, isSent, socket.id);
});

// TODO - fix DMs >>> only working one-way
// TODO - fix chatBubbles (disappearing header/isSameSender)
// TODO - persistent messages
// TODO Disconnect
// Announce next tournament (io.emit)
// server side : io.to(session.socketId).emit("event", data);