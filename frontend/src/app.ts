import { renderLoginForm } from "./loginForm.ts";
import { renderWelcomePage } from "./welcomePage.ts";

export function renderApp() {
  const content = document.getElementById("content") as HTMLElement;
  const header = document.getElementById("header") as HTMLElement;
  const footer = document.getElementById("footer") as HTMLElement;

  let isSignedIn = localStorage.getItem("isSignedIn") === "true";

  function handleLogin() {
    isSignedIn = true;
    localStorage.setItem("isSignedIn", "true");
    renderApp();
  }

  function handleLogout() {
    isSignedIn = false;
    localStorage.removeItem("isSignedIn");
    renderApp();
  }

  if (isSignedIn)
    renderWelcomePage({ content, header, footer, onLogout: handleLogout });
  else
    renderLoginForm({ header, content, footer, onLoginSuccess: handleLogin });
}

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});
