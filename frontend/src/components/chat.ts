import { setContent } from "../utils/layout.ts";

export async function renderChat() {
  await setContent("chat.html", true);
  const chatLink = document.getElementById("chat-link");
  if (chatLink)
    chatLink.classList.add("current-page");
}
