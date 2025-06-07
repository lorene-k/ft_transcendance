import { renderSignupForm, setSuccess, setError } from "./signupForm.ts";
import loginFormHtml from "../views/login.html?raw"

function setContent({ content, header, footer}: {
  content: HTMLElement; header: HTMLElement; footer: HTMLElement}){
  header.classList.remove("shadow-lg");
  header.innerHTML = `<img id="logo" class="max-w-sm mx-auto" src="assets/logo.png" alt="Pong wordmark">`
  content.innerHTML = loginFormHtml;
  footer.innerHTML = ``;
}

function testLogin({ onLoginSuccess }: { onLoginSuccess: () => void; }) { // ! TEST
    const username = (document.getElementById("username") as HTMLInputElement);
    const password = (document.getElementById("password") as HTMLInputElement);
    username.value !== "test" ? setError(username, "Invalid username") : setSuccess(username);
  password.value !== "test" ? setError(password, "Invalid password") : setSuccess(password);
    if (username.value === "test" && password.value === "test")
      onLoginSuccess();
}

export function renderLoginForm({ header, content, footer, onLoginSuccess }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLoginSuccess: () => void; }) {
    const logoBtn = document.getElementById("logo");
    logoBtn?.classList.add("cursor-pointer");
    setContent({content, header, footer});
    const form = document.getElementById("login-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      testLogin({ onLoginSuccess }); // ! TEST
    });

    const signupBtn = document.getElementById("signup-button");
    signupBtn?.addEventListener("click", () => {
    renderSignupForm({ content, header, onSignupSuccess: onLoginSuccess });
  });
}
