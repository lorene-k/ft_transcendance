import { renderApp } from "../app.ts";
import { renderPlayMenu } from "../routes/playMenu.ts";
import { renderAccount } from "../routes/account.ts";
import { renderChat } from "../routes/chat.ts";

export const handleLogoClick = () => {
  const logoBtn = document.getElementById("logo");
  if (logoBtn) {
    logoBtn.classList.add("cursor-pointer");
    logoBtn.addEventListener("click", function () {
      renderApp(false);
    });
  }
};

export function handleClickListeners(elemId: string, callback: () => void) {
  let elem = document.getElementById(elemId) as HTMLElement;
  if (elem) {
    elem.replaceWith(elem.cloneNode(true));
    elem = document.getElementById(elemId) as HTMLElement;
    elem.addEventListener("click", (e) => {
      e.preventDefault();
      callback();
    });
  }
}

export function handleNavbarClick() {
  const links = ["play-link", "account-link", "chat-link"];
  const functions = [renderPlayMenu, renderAccount, renderChat];
  for (let i = 0; i < 3; i++) {
    handleClickListeners(links[i], functions[i]);
  }
}

export function handleLogout() { // ! add API call
  localStorage.removeItem("isSignedIn");
  renderApp();
}
