import { addChatBubble, loadTemplate }from "./chatBubbles.js";

interface User {
  userID: string;
  username: string;
  self?: boolean;
  // Include any other properties you expect on a user
}
let users: User[] = [];
let targetId: string | null = null;
let currentUsername = "";

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

// **************************************************** Handle Convo history */
async function updateConvPreview(userId: string, username: string) {
  const allMessages = document.getElementById("all-messages");
  if (!allMessages) return;
  const displayed = allMessages.querySelector(`[data-user-id="${userId}"]`);
  if (displayed) {
    displayed.classList.add("transition-all", "duration-300");
    allMessages.prepend(displayed);
  } else {
    const card = await loadTemplate("/chat/conversation.html", "conversation");
    if (!card) return;
    card.setAttribute("data-user-id", userId);
    const name = card.querySelector("p");
    if (name) name.textContent = username; // ! Change to targetName ?
    card.addEventListener("click", () => {
      targetId = userId;
      openNewChat({ userID: userId, username, self: false });
    });
    allMessages.prepend(card);
  }
}

// ************************************************************** Handle DMs */   LOAD CONVO HISTORY HERE
function openNewChat(user: User) {
  const chatBox = document.getElementById("conversation-box");
  const recipientName = document.getElementById("recipient-name");
  if (!chatBox || !recipientName) return;
   // ! loadMsgHistoy
  recipientName.textContent = user.username;
  // socket.emit("load_dm", { userId: user.userID });
  // Load profile picture
}
// ! ADD socket.on("load_dm", ...) to fetch messages between the two users

// ******************************************************* List active users */
// Add user to active users list
function addActiveUser(userList: HTMLElement, user: User) {
  const li = document.createElement("li");
  li.textContent = user.username;   // ! If target username needed, get here
  if (user.self) return;
  li.style.cursor = "pointer";
  li.addEventListener("click", () => {
    targetId = user.userID;
    console.log("Target set to:", targetId); // ! DEBUG
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
    if (user.userID === socket.id) {
      user.self = true ;
      currentUsername = socket.auth.username = user.username; // ! Remove user.username ?
    }
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
    console.log(`Sending message to ${targetId} from ${currentUsername}`); // ! DEBUB - get current username
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (!input) return ;
    const msg = input.value;
    if (input.value) {
        // compute unique offset (ensure client delivery after state recovery/temp disconnection)
        const clientOffset = `${socket.id}-${counter++}`;
        socket.emit("message", { target: targetId, msg }, clientOffset);
        input.value = "";
    }
    input.focus();
});

// Listen for messages
socket.on("message", async ({ senderId, msg, serverOffset } :
    { senderId: string; msg: string, serverOffset: string }) => {
    console.log(`Received message from ${senderId}: ${msg}`);     // ! DEBUG
    const isSent = senderId === socket.id;
    localStorage.setItem("serverOffset", serverOffset);
    socket.auth.serverOffset = serverOffset;
    updateConvPreview(senderId, socket.auth.username);
    await addChatBubble(msg, isSent, socket.id);
});

// TODO - persistent messages
// TODO Disconnect
// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// TODO - check msg recovery handling
// >> server side : io.to(session.socketId).emit("event", data);

// TODO "Also explain how i can retreive messages from a specific conversation when i click on it"

// ! call this from frontend to get conversation : GET /api/chat/conversation?userA=1&userB=2