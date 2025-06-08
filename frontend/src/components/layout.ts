import { renderApp } from "../app.ts";

export const handleLogoClick = () => {
    const logoBtn = document.getElementById("logo");
    logoBtn?.classList.add("cursor-pointer");
    logoBtn?.addEventListener("click", renderApp);
  };

async function setHeader({ header, view }: {
    header: HTMLElement; view: string; }) {
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
            console.error("Failed to fecth header.html");
        }
    }
}

async function setFooter({ footer, view }: {
    footer: HTMLElement; view: string; }) {
    if (view === "login.html" || view === "signup.html")
        footer.innerHTML = ``;
    else {
        try {
            const footerResponse = await fetch("footer.html");
            const footerHtml = await footerResponse.text();
            footer.innerHTML = footerHtml;
        } catch (e) {
            console.error("Failed to fecth footer.html");
        }
    }
}

export async function setContent({ content, header, footer, view }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; view: string; }) {
    setHeader({ header, view });
    setFooter({ footer, view });
    try {
      const response = await fetch(view);
      const html = await response.text();
      content.innerHTML = html;
    } catch (e) {
      content.innerHTML = "<p>Failed to load login form.</p>";
      console.error("Failed to fetch login.html:", e);
    }
}