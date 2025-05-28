import { renderApp } from "./app.ts";
import navBar from "./views/navbar.html?raw"
import footerHtml from "./views/footer.html?raw"
import testHtml from "./views/test.html?raw"

function setHeader(header: HTMLElement) {
  header.classList.add("shadow-lg", "bg-white");
  header.innerHTML = navBar;
}

function setContent({ content, footer } : {
  content: HTMLElement; footer: HTMLElement}) {
    content.innerHTML = testHtml;
    footer.innerHTML = footerHtml;
}

export const handleLogoClick = () => {
  const logoBtn = document.getElementById("logo");
  logoBtn?.classList.add("cursor-pointer");
  logoBtn?.addEventListener("click", renderApp);
};

async function fetchMsg() {  // ! TEST
  try {
    const response = await fetch(('http://localhost:8080/'));
    // const text = await response.text();
    // console.log(text);
    const data = await response.json();
    const messageDiv = document.getElementById('msg');
    if (messageDiv)
      messageDiv.textContent = data.message;
  } catch (err) {
    console.error("Fetch error:", err);
  }
}

function testBackend() {
  const btn = document.getElementById('test-btn');
  btn?.addEventListener("click", () => {
    btn.classList.add('animate-ping');
    setTimeout(() => {
      btn.style.opacity = '0';
      btn.style.pointerEvents = "none";
    }, 1000);
    fetchMsg();
  });
}

export function renderWelcomePage({ content, header, footer, onLogout }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLogout: () => void; }) {
    setHeader(header);
    setContent({content, footer});
    handleLogoClick();
    testBackend();
    document.getElementById("logout")?.addEventListener("click", () => {
      onLogout();
    });
  }