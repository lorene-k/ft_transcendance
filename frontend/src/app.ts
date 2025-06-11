
import { renderLoginForm } from "./routes/loginForm.ts";
import { renderPlayMenu } from "./routes/playMenu.ts";
import { setContent } from "./components/layout.ts";

export function handleLogin() {;
  localStorage.setItem("isSignedIn", "true");
  renderApp();
}

export function handleLogout() {
  localStorage.removeItem("isSignedIn");
  renderApp();
}

export function renderApp() {
  let isSignedIn = localStorage.getItem("isSignedIn") === "true";
  isSignedIn ? renderPlayMenu() : renderLoginForm();
}

window.addEventListener("popstate", (event) => {
  const view = event.state?.view;
  if (view)
    setContent(view, false);
});

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});