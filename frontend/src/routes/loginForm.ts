import { setFormSuccess, setFormError } from "../components/error.ts";
import { renderSignupForm } from "./signupForm.ts";
import { setContent } from "../components/layout.ts";
import { handleLogin } from "../app.ts";

function testLogin() { // ! TEST
    const username = (document.getElementById("username") as HTMLInputElement);
    const password = (document.getElementById("password") as HTMLInputElement);
    username.value !== "test" ? setFormError(username, "Invalid username") : setFormSuccess(username);
    password.value !== "test" ? setFormError(password, "Invalid password") : setFormSuccess(password);
    if (username.value === "test" && password.value === "test")
      handleLogin();
}

export async function renderLoginForm() {
  await setContent("login.html", true);
  const logoBtn = document.getElementById("logo");
  logoBtn?.classList.add("cursor-pointer");
  const form = document.getElementById("login-form") as HTMLFormElement;
  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    testLogin(); // ! TEST
  });
  const signupBtn = document.getElementById("signup-button");
  signupBtn?.addEventListener("click", () => {
    renderSignupForm();
  });
}