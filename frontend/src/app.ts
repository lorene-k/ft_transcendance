import { renderLoginForm } from "./components/loginForm.ts";
import { renderPlayMenu } from "./components/playMenu.ts";
import { setContent } from "./utils/layout.ts";

export function handleLogin() { // add API call
  localStorage.setItem("isSignedIn", "true");
  renderApp();
}

export function renderApp() {
  let isSignedIn = localStorage.getItem("isSignedIn") === "true";
  isSignedIn ? renderPlayMenu() : renderLoginForm();
}

window.addEventListener("popstate", (event) => {
  const view = event.state?.view;
  if (view) setContent(view, false);
});

document.addEventListener("DOMContentLoaded", () => {
  renderApp();
});
