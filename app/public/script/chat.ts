declare const io: any;
let lastSenderId = ""; // Track if the last message was sent by the same user
let lastMessageTime: number = 0;

const socket = io('http://localhost:8080', {
    transports: ['websocket']
  });

function sendMessage(e: Event) {
    e.preventDefault();
    console.log("Sending message");
    const input = document.querySelector('textarea');
    if (input && input.value) {
        socket.emit("message", input.value);
        input.value = "";
    }
    input?.focus();
}

async function loadBubbleTemplate(templatePath : string) {
    try {
    const res = await fetch(templatePath);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    return (doc.body.firstElementChild);
    } catch (e) {
        console.error("Failed to fetch html:", e);
        // conversation.innerHTML = "<p>Failed to load message.</p>"; //add in msg bubble
    }
}

function updateBubbleHeader(bubble: Element, senderId: string) {
  const timeElem = bubble?.querySelector(".chat-time");
  const headerElem = bubble?.querySelector(".chat-bubble-header");
  const isSameSender = senderId === lastSenderId;
  const isRecent = Date.now() - lastMessageTime < (60_000);
  lastSenderId = senderId;
  lastMessageTime = Date.now();
  if (timeElem) timeElem.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (isSameSender && isRecent && headerElem) headerElem.remove();
}

async function addChatBubble(message : string, isSent : boolean, senderId : string) {
  const templatePath = isSent ? "/chat/sent-bubble.html" : "/chat/received-bubble.html";
  const bubble = await loadBubbleTemplate(templatePath);
  if (!bubble) return;
  updateBubbleHeader(bubble, senderId);
  const textElem = bubble?.querySelector("p");
  if (textElem) textElem.textContent = message;
  const conversation = document.getElementById("conversation");
  if (!conversation) return;
  conversation.appendChild(bubble);
  conversation.scrollTop = conversation.scrollHeight;
}

document.querySelector('button')?.addEventListener('click', sendMessage);

// Listen for messages
socket.on("message", async ({ senderId, msg }:
    { senderId: string; msg: string }) => {
    console.log(`Received message from ${senderId}: ${msg}`);
    const isSent = senderId === socket.id;
    await addChatBubble(msg, isSent, senderId);
});

/*You should pass sender info from your server to know if the message is sent by the current user or received.

The timestamps are generated locally for now (new Date().toLocaleTimeString(...)) — you can customize or pass a timestamp from your server.

The CSS classes you use match your HTML snippet to get the right style and alignment.

To avoid duplicate IDs in bubbles, I removed the id="received-content" and id="sent-content" inside generated bubbles (because IDs must be unique).*/

//! dont forget to disconnect