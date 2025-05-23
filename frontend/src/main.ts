import { renderLoginForm } from "./loginForm.ts";
import { renderWelcomePage } from "./welcomePage.ts";

document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content") as HTMLElement;
  const header = document.getElementById("header") as HTMLElement;
  const footer = document.getElementById("footer") as HTMLElement;

  let isSignedIn = localStorage.getItem("isSignedIn") === "true";

  function renderApp() {
    if (isSignedIn) {
      renderWelcomePage({ content, header, footer, onLogout: handleLogout });
    } else {
      header.innerHTML = `
    <header class="max-w-sm mx-auto">
      <div id="logo">
        <img src="assets/logo2.png" alt="Pong wordmark"/>
      </div>
    </header>
    `
      renderLoginForm({ content, footer, onLoginSuccess: handleLogin });
    }
  }

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

  renderApp();
});