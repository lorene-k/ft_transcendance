function setContent(content: HTMLElement) {
  content.innerHTML = `
    <div class="max-w-sm mx-auto bg-white p-10 rounded">
      <h2 class="text-xl font-bold mb-4 text-center">Create Account</h2>
      <form id="signup-form" action="/" class="space-y-4">
        <div class="input-control">
          <label for="new-username" class="block mb-1">Username</label>
          <input id="new-username" class="field" type="text" required>
          <div class="error"></div>
        </div>
        <div class="input-control">
          <label for="new-email" class="block mb-1">Email</label>
          <input id="new-email" class="field" type="text" required>
          <div class="error"></div>
        </div>
        <div class="input-control">
          <label class="block mb-1">Password</label>
          <input for="new-password" class="field" type="password" required>
          <div class="error"></div>
        </div>
        <div class="input-control">
          <label class="block mb-1">Confirm password</label>
          <input id="new-password2" for="new-password2" class="field" type="password" required>
          <div class="error"></div>
        </div>
        <button class="btn-primary" type="submit">Sign Up</button>
      </form>
    </div>
  `;
}

export function renderSignupForm({ content, onSignupSuccess }: {
  content: HTMLElement; onSignupSuccess: () => void; }) {
  setContent(content);
  const form = document.getElementById("signup-form") as HTMLFormElement;
  form.addEventListener("submit", () => {
    const username = (document.getElementById("new-username") as HTMLInputElement).value;
    const password = (document.getElementById("new-password") as HTMLInputElement).value;
    onSignupSuccess();
  });
}