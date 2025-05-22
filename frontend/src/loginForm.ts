import { renderSignupForm } from "./signupForm.ts";

function setContent(content: HTMLElement, footer: HTMLElement) {
  content.innerHTML = `
      <div class="max-w-sm mx-auto bg-white p-10 rounded">
        <form id="login-form" action="/" class="space-y-4">
          <div>
            <label class="block mb-1" for="username">Username</label>
            <input id="username" class="field" type="text" required>
          </div>
          <div>
            <label class="block mb-1" for="password">Password</label>
            <input id="password" class="field" type="password" required >
          </div>
          <button id="login-button" class="btn-primary" type="submit">Log In</button>
          <p class="text-center text-xs font-bold">Forgot password ?</p>
          <div id="line1" class="outline-1 outline-gray-400 my-6" ></div>
          <div class="max-w-sm mx-auto bg-white p-6 my-8">
              <button id="signup-button" class="w-full bg-white text-black p-2 rounded-full border-2 border-black cursor-pointer" type="button">Sign up</button>
          </div>
          </form>
      </div>
    `;
    footer.innerHTML = ``;
}

function testLogin({ username, password, onLoginSuccess }: {
    username: string, password: string, onLoginSuccess: () => void; }) {
    if (username === "test" && password === "test") {
      onLoginSuccess();
    } else {
      alert("Invalid credentials");
    }
}

export function renderLoginForm({ content, footer, onLoginSuccess }: {
    content: HTMLElement; footer: HTMLElement; onLoginSuccess: () => void; }) {
    setContent(content, footer);
    const form = document.getElementById("login-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      const username = (document.getElementById("username") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;
      testLogin({ username, password, onLoginSuccess }); // ! TEST
    });

    const signupBtn = document.getElementById("signup-button");
    signupBtn?.addEventListener("click", () => {
    renderSignupForm({ content, onSignupSuccess: onLoginSuccess });
  });
}
