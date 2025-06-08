import { handleLogoClick } from "../components/layout.ts";
import { setContent } from "../components/layout.ts";

async function fetchMsg() {  // ! TEST
  try {
    const response = await fetch(('http://localhost:8080/'));
    // const text = await response.text(); // TEST
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

export async function renderWelcomePage({ content, header, footer, onLogout }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLogout: () => void; }) {
    await setContent({ content, header, footer, view: "test.html" });
    handleLogoClick();
    testBackend();
    document.getElementById("logout")?.addEventListener("click", () => {
      onLogout();
    });
  }