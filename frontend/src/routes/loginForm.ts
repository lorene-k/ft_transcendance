import { setFormSuccess, setFormError } from "../components/error.ts";
import { renderSignupForm } from "./signupForm.ts";
import { setContent } from "../components/layout.ts";

function testLogin({ onLoginSuccess }: { onLoginSuccess: () => void; }) { // ! TEST
    const username = (document.getElementById("username") as HTMLInputElement);
    const password = (document.getElementById("password") as HTMLInputElement);
    username.value !== "test" ? setFormError(username, "Invalid username") : setFormSuccess(username);
    password.value !== "test" ? setFormError(password, "Invalid password") : setFormSuccess(password);
    if (username.value === "test" && password.value === "test")
      onLoginSuccess();
}

export async function renderLoginForm({ header, content, footer, onLoginSuccess }: {
  content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLoginSuccess: () => void; }) {
  await setContent({ content, header, footer, view: "login.html" });
  const logoBtn = document.getElementById("logo");
  logoBtn?.classList.add("cursor-pointer");
  const form = document.getElementById("login-form") as HTMLFormElement;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    testLogin({ onLoginSuccess }); // ! TEST
  });
  const signupBtn = document.getElementById("signup-button");
  signupBtn?.addEventListener("click", () => {
    renderSignupForm({ header, content, footer, onSignupSuccess: onLoginSuccess });
  });
}