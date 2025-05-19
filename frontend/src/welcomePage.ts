export function renderWelcomePage({ content, header, footer, onLogout }: {
    content: HTMLElement; header: HTMLElement; footer: HTMLElement; onLogout: () => void; }) {
    header.innerHTML = `
    <nav id="navbar">
        <ul class="flex space-x-4">
          <li><a href="#" id="home" class="text-white">Play</a></li>
          <li><a href="#" id="about" class="text-white">Chat</a></li>
          <li><a href="#" id="contact" class="text-white">Account</a></li>
        </ul>
      </nav>
    `;
    content.innerHTML = `
    <header class="max-w-sm mx-auto">
        <div id="logo">
          <img src="assets/logo2.png" alt="Pong wordmark"/>
        </div>
      </header>
    <div>
      <h1 class="text-2xl">Welcome !</h1>
      <p>You are now signed in.</p>
    </div>
    `;
    footer.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="text-white text-xl">MyApp</span>
        <nav class="space-x-4">
          <button id="logout" class="font-bold rounded text-black cursor-pointer">Logout</button>
        </nav>
      </div>
    `;
  
    document.getElementById("logout")?.addEventListener("click", () => {
      onLogout();
    });
  }  