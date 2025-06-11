import { renderApp } from "../app.ts";

export const handleLogoClick = () => {
  const logoBtn = document.getElementById("logo");
  // logoBtn?.removeEventListener("click", renderApp);
  // if (logoBtn && view === "login.html")
  //   logoBtn.classList.remove("cursor-pointer");
  // else if (logoBtn && view !== "login.html") {
  logoBtn?.classList.add("cursor-pointer");
  logoBtn?.addEventListener("click", renderApp);
  // }
};

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
    } catch (e) {
      console.error("Failed to fetch footer.html");
    }
  }
}

export async function setContent(view: string, push = true) {
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
    content.innerHTML = "<p>Failed to load login form.</p>";
    console.error("Failed to fetch login.html:", e);
  }
}
