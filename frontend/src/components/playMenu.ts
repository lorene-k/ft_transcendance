import { handleLogoClick } from "../utils/layout.ts";
import { setContent } from "../utils/layout.ts";
import { handleLogout } from "../app.ts";

// async function fetchMsg() { // ! TEST
//   try {
//     const response = await fetch("http://localhost:8080/");
//     // const text = await response.text(); // TEST
//     // console.log(text);
//     const data = await response.json();
//     const messageDiv = document.getElementById("msg");
//     if (messageDiv) messageDiv.textContent = data.message;
//   } catch (err) {
//     console.error("Fetch error:", err);
//   }
// }

// function testBackend() {
//   const btn = document.getElementById("test-btn");
//   btn?.addEventListener("click", () => {
//     btn.classList.add("animate-ping");
//     setTimeout(() => {
//       btn.style.opacity = "0";
//       btn.style.pointerEvents = "none";
//     }, 1000);
//     fetchMsg();
//   });
// }

export async function renderPlayMenu() {
  await setContent("play.html", true);
  handleLogoClick();
  document.getElementById("logout")?.addEventListener("click", () => {
    handleLogout();
  });
  const buttons = document.querySelectorAll(".btn-selection");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
    });
  });
}
