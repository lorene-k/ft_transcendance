import { setContent } from "../utils/layout.ts";

export async function renderChat(push = true) {
  await setContent("chat.html", push);
  const chatLink = document.getElementById("chat-link");
  if (chatLink)
    chatLink.classList.add("current-page");
}
