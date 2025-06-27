import { setFormSuccess, setFormError } from "../utils/error.ts";
import { renderSignupForm } from "./signupForm.ts";
import { setContent } from "../utils/layout.ts";
import { handleLogin } from "../app.ts";
import { handleClickListeners } from "../utils/handlers.ts";

function testLogin() { // ! TEST
  const username = document.getElementById("username") as HTMLInputElement;
  const password = document.getElementById("password") as HTMLInputElement;
  username.value !== "test" ? setFormError(username, "Invalid username") : setFormSuccess(username);
  password.value !== "12345666" ? setFormError(password, "Invalid password") : setFormSuccess(password);
  if (username.value === "test" && password.value === "12345666") 
    handleLogin();
}

function showPassword() {
  handleClickListeners("show-password-icon", () => {
    let icon = document.getElementById("show-password-icon") as HTMLImageElement;
    let inp = document.getElementById("password") as HTMLInputElement;
    if (inp && icon && inp.type === "password") {
      inp.type = "text";
      icon.src = "/assets/eye-open.png";
    } else if (inp && icon) {
      inp.type = "password";
      icon.src = "/assets/eye-closed.png";
    }
  });
}

// Test - replace testLogin() handleLogin && add API call
export async function renderLoginForm() {
  await setContent("login.html", true);
  const form = document.getElementById("login-form") as HTMLFormElement;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    testLogin(); // ! TEST
  });
  const signupBtn = document.getElementById("signup-button");
  signupBtn?.addEventListener("click", () => {
    renderSignupForm();
  });
  showPassword();
}