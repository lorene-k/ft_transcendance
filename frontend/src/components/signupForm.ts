import { handleLogoClick } from "../utils/layout.ts";
import { setContent } from "../utils/layout.ts";
import { setFormSuccess, setFormError } from "../utils/error.ts";
import { handleLogin } from "../app.ts";

function isValidUsername(username) {
  const usernameValue = username.value.trim();
  if (usernameValue === '' || usernameValue.length < 5)
    return (setFormError(username, "Username should be at least 5 characters long."));
  else
    return (setFormSuccess(username));
}

function isValidEmail(email) {
  const emailValue = email.value.trim();
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailValue === '' || !(re.test(emailValue.toLowerCase())))
    return (setFormError(email, "Invalid email format."));
  else
    return (setFormSuccess(email));
}

function isValidPassword(password) {
  const passwordValue = password.value.trim();
  const re = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).+$/;
  if (passwordValue === '' || passwordValue.length < 8)
    return (setFormError(password, "Password should be at least 8 characters long."));
  else if (!(re.test(passwordValue)))
    return (setFormError(password, "Password should contain at least 1 letter, 1 number and 1 special character."));
  else
    return (setFormSuccess(password));
}

function isValidPassword2(password, password2) {
  const password2Value = password2.value.trim();
  const passwordValue = password.value.trim();
  if (password2Value === '' || password2Value !== passwordValue)
    return (setFormError(password2, "Passwords don't match."));
  else
    return (setFormSuccess(password2));
}

function validateInputs(): boolean {
  const username = document.getElementById('username');
  const email = document.getElementById('email');
  const password = document.getElementById('password');
  const password2 = document.getElementById('password2');

  return [ 
    isValidUsername(username),
    isValidEmail(email),
    isValidPassword(password),
    isValidPassword2(password, password2)
  ].every(Boolean);
}

// Frontend input validation - replace handleLogin() by API call
export async function renderSignupForm() {
  await setContent("signup.html", true);
  const form = document.getElementById("signup-form") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateInputs())
      handleLogin();
  });
  handleLogoClick();
}