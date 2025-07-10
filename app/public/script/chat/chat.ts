import { addChatBubble, loadTemplate }from "./chatBubbles.js";
import { openChat } from "./chatHistory.js";

export interface User {
  userID: string;
  username: string;
  self?: boolean;
}
export let targetId: string | null = null;
let users: User[] = [];

let counter = 0;
const lastOffset = parseInt(localStorage.getItem("serverOffset") || "0");
declare const io: any;
export const socket = io('http://localhost:8080', {
    withCredentials: true,
    transports: ['websocket'],
    auth: {
        serverOffset: lastOffset
      },
    // ackTimeout: 10000, // Use emit with ack to guarantee msg delivery
    // retries: 3
});

// ********************************************* Update conversation preview */
async function updateConvPreview(userId: string, targetName: string) {
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
    if (name) name.textContent = targetName;
    card.addEventListener("click", () => {
      targetId = userId;
      openChat({ userID: userId, username: targetName, self: false });
    });
    allMessages.prepend(card);
  }
}

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
    openChat(user);
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
      socket.auth.username = user.username;
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
    console.log(`Sending message to ${targetId} from ${socket.auth.username}`); // ! DEBUB - get current username
    e.preventDefault();
    const input = document.querySelector('textarea');
    if (!input) return ;
    const msg = input.value;
    if (input.value) {
        // compute unique offset (ensure client delivery after state recovery/temp disconnection)
        const clientOffset = `${socket.id}-${counter++}`;
        socket.emit("message", { targetId: targetId, msg, clientOffset });
        input.value = "";
    }
    input.focus();
});

// Listen for messages
socket.on("message", async ({ senderId, senderUsername, msg, serverOffset } :
    { senderId: string; senderUsername: string, msg: string, serverOffset: string }) => {
    console.log(`Received message from ${senderId}: ${msg}`);     // ! DEBUG
    const isSent = senderId === socket.id;
    localStorage.setItem("serverOffset", serverOffset);       // ! Necessary ??
    socket.auth.serverOffset = serverOffset;
    
    // Update conversation preview
    if (isSent) {
      const targetUser = users.find(u => u.userID === targetId);
      if (targetUser) updateConvPreview(targetId!, targetUser.username!);
    } else updateConvPreview(targetId!, senderUsername!);
      console.log(`TEST : targetId = ${targetId}, senderId = ${senderId}, senderUsername = ${senderUsername}`); // ! DEBUG")
    await addChatBubble(msg, isSent, socket.id);
});

// ? add last_seen in conv to send missed messages in case of disconnect ?
// TODO - check msg recovery handling
// TODO - Disconnect
// TODO - check what happens if same user connected in different tabs (don't create new socket)
// >> check if session.userId exists in map, assign socket.id to it (change map to hold socket.id ARRAY)

// TODO - handle blocked users
// TODO - Announce next tournament (io.emit)
// >> server side : io.to(session.socketId).emit("event", data);

// TODO - create landing page for new chat, otherwise display last conversation
// TODO - friends (search bar w/ db fetch)