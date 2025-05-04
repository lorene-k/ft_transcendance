const app = document.getElementById("app") as HTMLElement;

const routes: { [key: string]: string } = {
  "#play": `
    <div class="bg-cyan-300/50 p-8">
      <h1 class="text-3xl font-bold mb-6">Play Pong Now!</h1>
      <p>Click the button below to start playing.</p>
      <button class="mt-4 bg-indigo-700 text-white py-2 px-6 rounded-full font-bold hover:bg-black transition">
        Start Game
      </button>
    </div>
  `,
  "#profile": `
    <div class="bg-cyan-300/50 p-8">
      <h1 class="text-3xl font-bold mb-6">Your Profile</h1>
      <p>Player stats and settings.</p>
    </div>
  `,
  "#settings": `
    <div class="bg-cyan-300/50 p-8">
      <h1 class="text-3xl font-bold mb-6">Settings</h1>
      <p>Adjust preferences and game options.</p>
    </div>
  `,
  "": `
    <div class="bg-cyan-300/50 p-8">
      <h1 class="text-3xl font-bold mb-6">Welcome to Best Pong Ever</h1>
      <a href="#play"
         class="inline-block bg-indigo-700 text-white py-4 px-16 rounded-full font-bold hover:bg-black transition">
        Play
      </a>
    </div>
  `
};

function render(): void {
  const hash = window.location.hash;
  app.innerHTML = routes[hash] || `<h1 class="text-red-500">Page not found</h1>`;
}

window.addEventListener("hashchange", render);
window.addEventListener("load", render);
