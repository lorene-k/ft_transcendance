import { setContent } from "../utils/layout.ts";
import { handleClickListeners } from "../utils/handlers.ts";

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

export async function renderGameWindow(push = true) {
  await setContent("game.html", push);
}

function addPlayers() {
  const addPlayerBtn = document.getElementById("add-player-btn");
  const nameInput = document.getElementById("tournament-player-name");
  let playerCount = 1;
  if (addPlayerBtn) {
    addPlayerBtn.addEventListener("click", () => {
      playerCount++;
      const input = document.createElement("input");
      input.type = "text";
      input.placeholder = `Player ${playerCount}`;
      input.classList.add("field-white");
      if (nameInput) nameInput.appendChild(input);
      if (playerCount > 3) {
        addPlayerBtn.classList.add("hidden");
        return;
      }
    });
  }
}

export async function renderTournamentMenu(push = true) { // ! CHANGE
  await setContent("tournament.html", push);
  addPlayers();
  // collectPlayerNames();
  handleClickListeners("start-tournament-btn", renderGameWindow);
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
    handleClickListeners("play-btn", () => {
      if (!mode) return;
      if (mode === "Tournament") renderTournamentMenu();
      else renderGameWindow(); // ! SEND TO BACKEND & LOAD APPROPRIATE GAME MODE
    });
  });
}

export async function renderPlayMenu(push = true) {
  await setContent("play.html", push);
  const playLink = document.getElementById("play-link");
  if (playLink) playLink.classList.add("current-page");
  selectMode();
}
