import { renderLoginForm } from "./routes/loginForm.ts";
import { renderPlayMenu, renderTournamentMenu, renderGameWindow } from "./routes/playMenu.ts";
import { renderChat } from "./routes/chat.ts";
import { renderAccount } from "./routes/account.ts";

export function handleLogin() {
  localStorage.setItem("isSignedIn", "true");
  renderApp();
}

export function renderApp(push = true) {
  let isSignedIn = localStorage.getItem("isSignedIn") === "true";
  isSignedIn ? renderPlayMenu(push) : renderLoginForm();
}

function handleRoutes(path: string) {
  switch (path) {
    case "/play":
      renderPlayMenu(false);
      break;
    case "/account":
      renderAccount(false);
      break;
    case "/tournament":
      renderTournamentMenu(false);
      break;
    case "/game":
      renderGameWindow(false);
      break;
    case "/chat":
      renderChat(false);
      break;
    default:
      renderApp(false);
      break;
  }
}

window.addEventListener("popstate", (event) => {
  const path = window.location.pathname;
  handleRoutes(path);
});

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  // renderApp(false);
  handleRoutes(path);
});
