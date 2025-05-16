//   <div class="Homepage w-full max-w-[1440px] h-[750px] relative  overflow-hidden mx-auto"> -->

//    <div class="ConnectionForm" style="width: 274px; left: 583px; top: 270px; position: absolute; flex-direction: column; justify-content: flex-start; align-items: center; gap: 19px; display: inline-flex"> -->
//     <div class="Frame1" style="align-self: stretch; flex-direction: column; justify-content: flex-start; align-items: flex-start; gap: 10px; display: flex">
//       <div class="Emailfield" style="align-self: stretch; height: 53px; padding-left: 30px; padding-right: 30px; border-radius: 20px; outline: 1px #898989 solid; outline-offset: -1px; justify-content: flex-start; align-items: center; gap: 10px; display: inline-flex">
//         <div class="Email" style="color: #9B9B9B; font-size: 15px; font-family: Inter; font-weight: 500; line-height: 28px; word-wrap: break-word">Email</div>
//       </div>
//       <div  class="PasswordField" style="align-self: stretch; height: 53px; padding-left: 30px; padding-right: 30px; border-radius: 20px; outline: 1px #898989 solid; outline-offset: -1px; justify-content: flex-start; align-items: center; gap: 10px; display: inline-flex">
//         <div class="Password" style="color: #9B9B9B; font-size: 15px; font-family: Inter; font-weight: 500; line-height: 28px; word-wrap: break-word">Password</div>
//       </div>
//       <div class="LoginButton" style="align-self: stretch; height: 52px; padding-left: 50px; padding-right: 50px; padding-top: 30px; padding-bottom: 30px; background: black; border-radius: 50px; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
//         <div  class="LogIn" style="width: 250px; text-align: center; color: white; font-size: 20px; font-family: Inter; font-weight: 500; line-height: 28px; word-wrap: break-word">Log In</div>
//       </div>
//       <div  class="ForgotPassword" style="align-self: stretch; text-align: center; color: black; font-size: 13px; font-family: Inter; font-weight: 700; line-height: 28px; word-wrap: break-word">Forgot password ?</div>
//     </div>
//     <div class="Line1" style="align-self: stretch; height: 0px; outline: 1px #898989 solid; outline-offset: -0.50px"></div>
//     <div class="NewAccountButton" style="width: 207px; height: 53px; padding: 30px; border-radius: 50px; outline: 3px black solid; outline-offset: -3px; justify-content: center; align-items: center; gap: 10px; display: inline-flex">
//       <div class="CreateNewAccount" style="color: black; font-size: 15px; font-family: Inter; font-weight: 500; line-height: 28px; word-wrap: break-word">Create new account</div>
//     </div>
//   </div>
// </div>


document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("app") as HTMLElement;
  const header = document.getElementById("header") as HTMLElement;

  let isSignedIn = false;

  function renderLoginForm() {
    content.innerHTML = `
      <div class="max-w-sm mx-auto bg-white p-6 rounded shadow">
        <h2 class="text-xl font-bold mb-4">Login</h2>
        <form id="login-form" class="space-y-4">
          <div>
            <label class="block mb-1" for="username">Username</label>
            <input class="w-full border rounded p-2" type="text" id="username" required>
          </div>
          <div>
            <label class="block mb-1" for="password">Password</label>
            <input class="w-full border rounded p-2" type="password" id="password" required>
          </div>
          <button class="w-full bg-blue-500 text-white p-2 rounded" type="submit">Sign In</button>
        </form>
      </div>
    `;

    const form = document.getElementById("login-form") as HTMLFormElement;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const username = (document.getElementById("username") as HTMLInputElement).value;
      const password = (document.getElementById("password") as HTMLInputElement).value;

      // Simulated login logic
      if (username === "admin" && password === "password") {
        isSignedIn = true;
        localStorage.setItem("isSignedIn", "true");
        renderApp();
      } else {
        alert("Invalid credentials");
      }
    });
  }

  function renderApp() {
    if (isSignedIn) {
      content.innerHTML = `<h1 class="text-2xl">Welcome, admin!</h1><p>You are now signed in.</p>`;
      header.innerHTML = `
        <div class="flex justify-between items-center">
          <span class="text-white text-xl">MyApp</span>
          <nav class="space-x-4">
            <button id="logout" class="bg-red-500 px-3 py-1 rounded text-white">Logout</button>
          </nav>
        </div>
      `;
      document.getElementById("logout")?.addEventListener("click", () => {
        isSignedIn = false;
        localStorage.removeItem("isSignedIn");
        renderLoginForm();
      });
    } else {
      renderLoginForm();
    }
  }

  // Initialize app
  isSignedIn = localStorage.getItem("isSignedIn") === "true";
  renderApp();
});
