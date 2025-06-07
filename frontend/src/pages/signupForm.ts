import { handleLogoClick } from "./welcomePage";
import signupFormHtml from "../views/signup.html?raw"

export function setError(element, msg): boolean {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector('.input-error-msg');

  errorDisplay.innerText = msg;
  element.classList.add('ring-2', 'ring-red-500');
  element.classList.remove('focus:ring-indigo-600', 'border-gray-300');
  return (false);
}

export function setSuccess(element): boolean {
  const inputControl = element.parentElement;
  const errorDisplay = inputControl.querySelector('.input-error-msg');

  errorDisplay.innerText = '';
  element.classList.add('border-green-300');
  element.classList.remove('ring-2', 'ring-red-500');
  return (true);
}

function isValidUsername(username) {
  const usernameValue = username.value.trim();
  if (usernameValue === '' || usernameValue.length < 5)
    return (setError(username, "Username should be at least 5 characters long."));
  else
    return (setSuccess(username));
}

function isValidEmail(email) {
  const emailValue = email.value.trim();
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  if (emailValue === '' || !(re.test(emailValue.toLowerCase())))
    return (setError(email, "Invalid email format."));
  else
    return (setSuccess(email));
}

function isValidPassword(password) {
  const passwordValue = password.value.trim();
  const re = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+={}[\]|\\:;"'<>,.?/~`]).+$/;
  if (passwordValue === '' || passwordValue.length < 8)
    return (setError(password, "Password should be at least 8 characters long."));
  else if (!(re.test(passwordValue)))
    return (setError(password, "Password should contain at least 1 letter, 1 number and 1 special character."));
  else
    return (setSuccess(password));
}

function isValidPassword2(password, password2) {
  const password2Value = password2.value.trim();
  const passwordValue = password.value.trim();
  if (password2Value === '' || password2Value !== passwordValue)
    return (setError(password2, "Passwords don't match."));
  else
    return (setSuccess(password2));
}

function validateInputs(content: HTMLElement): boolean {
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

export function renderSignupForm({ content, header, onSignupSuccess }: {
  content: HTMLElement; header: HTMLElement; onSignupSuccess: () => void; }) {
  content.innerHTML = signupFormHtml;
  const form = document.getElementById("signup-form") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (validateInputs(content))
      onSignupSuccess();
  });
  handleLogoClick();
}
