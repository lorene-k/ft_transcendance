import { renderSignupForm } from "./signupForm.ts";
import loginFormHtml from "./views/login.html?raw"

function setContent({ content, header, footer}: {
  content: HTMLElement; header: HTMLElement; footer: HTMLElement}){
  header.classList.remove("shadow-lg", "bg-white");
  header.innerHTML = `<img id="logo" class="max-w-sm mx-auto" src="assets/logo.png" alt="Pong wordmark">`
  content.innerHTML = loginFormHtml;
  footer.innerHTML = ``;
}

function testLogin({ username, password, onLoginSuccess }: { // ! TEST
    username: string, password: string, onLoginSuccess: () => void; }) {
    if (username === "test" && password === "test") {
      onLoginSuccess();
    } else {
      alert("Invalid credentials");
    }
}

export function renderLoginForm({ header, content, footer, onLoginSuccess }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLoginSuccess: () => void; }) {
    const logoBtn = document.getElementById("logo");
    logoBtn?.classList.add("cursor-pointer");
    setContent({content, header, footer});
    const form = document.getElementById("login-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = (document.getElementById("username") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;
      testLogin({ username, password, onLoginSuccess }); // ! TEST
    });

    const signupBtn = document.getElementById("signup-button");
    signupBtn?.addEventListener("click", () => {
    renderSignupForm({ content, header, onSignupSuccess: onLoginSuccess });
  });
}
