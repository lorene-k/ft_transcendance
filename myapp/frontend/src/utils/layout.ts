import { handleLogoClick, handleNavbarClick, handleLogout } from "./handlers.ts";

async function setHeader(view: string) {
  const header = document.getElementById("header") as HTMLElement;
  if (view === "login.html" || view === "signup.html") {
    header.classList.remove("shadow-lg");
    header.innerHTML = `<img id="logo" class="max-w-sm mx-auto" src="assets/logo.png" alt="Pong wordmark">`;
  } else {
    header.classList.add("shadow-lg");
    try {
      const headerResponse = await fetch("header.html");
      const headerHtml = await headerResponse.text();
      header.innerHTML = headerHtml;
      handleLogoClick();
      handleNavbarClick();
    } catch (e) {
      console.error("Failed to fetch header.html");
    }
  }
}

async function setFooter(view: string) {
  const footer = document.getElementById("footer") as HTMLElement;
  if (view === "login.html" || view === "signup.html") footer.innerHTML = ``;
  else {
    try {
      const footerResponse = await fetch("footer.html");
      const footerHtml = await footerResponse.text();
      footer.innerHTML = footerHtml;
      const logoutBtn = document.getElementById("logout");
      if (logoutBtn) logoutBtn.addEventListener("click", handleLogout);
    } catch (e) {
      console.error("Failed to fetch footer.html");
    }
  }
}

export async function setContent(view: string, push = true) {
  const url = `/${view.replace(/\.html$/, "")}`;
  if (push && window.location.pathname === url)
    push = false;
  setHeader(view);
  setFooter(view);
  const content = document.getElementById("content") as HTMLElement;
  try {
    const response = await fetch(view);
    const html = await response.text();
    content.innerHTML = html;
    if (push) {
      const url = view.replace(/\.html$/, "");
      history.pushState({ view }, "", `/${url}`);
    }
  } catch (e) {
    content.innerHTML = "<p>Failed to load html.</p>";
    console.error("Failed to fetch html:", e);
  }
}
