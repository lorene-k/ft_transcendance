import { renderApp } from "./app.ts";

function setHeader(header: HTMLElement) {
  header.classList.add("shadow-lg", "bg-white");
  header.innerHTML = `
    <nav class="flex items-center justify-between p-5 max-w mx-20">
      <div id="logo">
        <img src="assets/logo.png" alt="Pong wordmark" class="w-20 cursor-pointer" />
      </div>
      <ul class="flex space-x-4 ">
        <li><a href="#" id="home" class="text-black hover:text-blue-600">Play</a></li>
        <li><a href="#" id="about" class="text-black hover:text-blue-600">Chat</a></li>
        <li><a href="#" id="contact" class="text-black hover:text-blue-600">Account</a></li>
      </ul>
    </nav>
    `;
}

function setContent({ content, footer } : {
  content: HTMLElement; footer: HTMLElement}) {
    content.innerHTML = `
    <div class="max-w-sm mx-auto mt-10 rounded">
      <h1 class="text-blue-600 font-extrabold text-2xl animate-pulse">Welcome !</h1>
      <p class="mb-10" >You are now signed in.</p>
      <button id="test-btn" class="btn-primary">Test backend</button>
      <p id='msg' class="text-center font-bold my-5 mt-20 text-3xl text-cyan-700 animate-bounce" ></p>
    </div>
    `;
    footer.innerHTML = `
      <div class="w-full text-center bg-white py-2">
          <button id="logout" class="font-bold rounded text-black hover:text-blue-600 cursor-pointer mb-5">Logout</button>
      </div>
    `;
}

export const handleLogoClick = () => {
  const logoBtn = document.getElementById("logo");
  logoBtn?.classList.add("cursor-pointer");
  logoBtn?.addEventListener("click", renderApp);
};

async function fetchMsg() {
  try {
    const response = await fetch(('http://localhost:8080/'));
    // const text = await response.text(); // ! TEST
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