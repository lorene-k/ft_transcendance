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


async function renderGameWindow() {
  await setContent("game.html", false);
}

async function renderTournamentMenu() {
  await setContent("tournament.html", false);
}

function selectMode() {
  const buttons = document.querySelectorAll(".btn-selection");
  let mode;
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("selected"));
      btn.classList.add("selected");
      const selectedBtn = document.querySelector(".btn-selection.selected") as HTMLButtonElement;
      if (selectedBtn) {
        mode = selectedBtn.dataset.mode;
        console.log("Selected mode:", mode); // ! TEST
      }
    });
    const playBtn = document.getElementById("play-btn");
    playBtn?.addEventListener("click", () => {
      if (!mode) return;
      if (mode === "Tournament") renderTournamentMenu();
      else renderGameWindow(); // ! SEND TO BACKEND & LOAD APPROPRIATE GAME MODE
    });
  });
}

export async function renderPlayMenu() {
  await setContent("play.html", true);
  const playLink = document.getElementById("play-link");
  if (playLink) playLink.classList.add("current-page");
  selectMode();
}
