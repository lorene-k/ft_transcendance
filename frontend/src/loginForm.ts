import { renderSignupForm } from "./signupForm.ts";

export function renderLoginForm({ content, footer, onLoginSuccess}: {
    content: HTMLElement; footer: HTMLElement; onLoginSuccess: () => void; }) {
    content.innerHTML = `
    <header class="max-w-sm mx-auto">
      <div id="logo">
        <img src="assets/logo2.png" alt="Pong wordmark"/>
      </div>
    </header>
      <div class="max-w-sm mx-auto bg-white p-10 rounded">
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block mb-1" for="username">Username</label>
            <input class="w-full border border-gray-400 rounded p-2" type="text" id="username" required>
          </div>
          <div>
            <label class="block mb-1" for="password">Password</label>
            <input class="w-full border border-gray-400 rounded p-2" type="password" id="password" required >
          </div>
          <button id="login-button" class="w-full bg-black text-white p-2 rounded-full cursor-pointer" type="submit">Log In</button>
          <p class="text-center text-xs font-bold">Forgot password ?</p>
          <div id="line1" class="outline-1 outline-gray-400 my-6" ></div>
          <div class="max-w-sm mx-auto bg-white p-6 my-8">
              <button id="signup-button" class="w-full bg-white text-black p-2 rounded-full border-2 border-black cursor-pointer" type="button">Sign up</button>
          </div>
          </form>
      </div>
    `;
    footer.innerHTML = `
    `;
  
    const form = document.getElementById("login-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = (document.getElementById("username") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;
  
      if (username === "test" && password === "test") { // ! TEST
        onLoginSuccess();
      } else {
        alert("Invalid credentials"); // ! CHANGE
      }
    });

    const signupBtn = document.getElementById("signup-button");
    signupBtn?.addEventListener("click", () => {
    renderSignupForm({ content, onSignupSuccess: onLoginSuccess });
  });
  }
  