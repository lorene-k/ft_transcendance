export function renderSignupForm({ content, onSignupSuccess, }: {
    content: HTMLElement; onSignupSuccess: () => void; }) {
    content.innerHTML = `
      <header class="max-w-sm mx-auto">
        <div id="logo">
          <img src="assets/logo2.png" alt="Pong wordmark"/>
        </div>
      </header>
      <div class="max-w-sm mx-auto bg-white p-10 rounded">
        <h2 class="text-xl font-bold mb-4 text-center">Create Account</h2>
        <form id="signup-form" class="space-y-4">
          <div>
            <label class="block mb-1" for="new-email">Email</label>
            <input class="w-full border border-gray-400 rounded p-2" type="text" id="new-username" required>
          </div>
          <div>
            <label class="block mb-1" for="new-username">Username</label>
            <input class="w-full border border-gray-400 rounded p-2" type="text" id="new-username" required>
          </div>
          <div>
            <label class="block mb-1" for="new-password">Password</label>
            <input class="w-full border border-gray-400 rounded p-2" type="password" id="new-password" required>
          </div>
          <button class="w-full bg-black text-white p-2 rounded-full cursor-pointer" type="submit">Sign Up</button>
        </form>
      </div>
  `;

  const form = document.getElementById("signup-form") as HTMLFormElement;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const username = (document.getElementById("new-username") as HTMLInputElement).value;
    const password = (document.getElementById("new-password") as HTMLInputElement).value;
    onSignupSuccess();
  });
}