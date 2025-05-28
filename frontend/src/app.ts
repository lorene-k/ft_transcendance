import './styles.css';
import { renderLoginForm } from "./loginForm.ts";
import { renderWelcomePage } from "./welcomePage.ts";

function handleLogin() {;
  localStorage.setItem("isSignedIn", "true");
  renderApp();
}

function handleLogout() {
  localStorage.removeItem("isSignedIn");
  renderApp();
}

export function renderApp() {
  const content = document.getElementById("content") as HTMLElement;
  const header = document.getElementById("header") as HTMLElement;
  const footer = document.getElementById("footer") as HTMLElement;

  let isSignedIn = localStorage.getItem("isSignedIn") === "true";

  if (isSignedIn)
    renderWelcomePage({ content, header, footer, onLogout: handleLogout });
  else
    renderLoginForm({ header, content, footer, onLoginSuccess: handleLogin });
}

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});