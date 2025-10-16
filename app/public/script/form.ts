import { IOERR } from "sqlite3";
import { navbar } from "./N_nav.js";
import { initGoogle, googleInitialized } from "./google.js";

async function register_value_check(formData: FormData): Promise<[boolean, string | null]> {
    const username = formData.get('username')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    if (password.length < 6) {
        return [false, 'Password must be at least 6 characters'];
    }
    const response = fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username }),
    }).then(async (val) => {
        return await val.json()
    }, (err) => console.error(err));
    let v = await response
    if (v.exists == true)
        return [false, "username already exist"]
    return [true, null]
}

async function register(event: SubmitEvent): Promise<[boolean, string | null]> {
    const form = event.target;
    if (!form) {
        return [false, "Invalid form"]
    }
    const formData = new FormData(form as HTMLFormElement);

    const username = formData.get('username')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();

    const response = fetch("/register", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            email: email,
            password: password,
        })
    }).then(async (val) => { return await val.json() }, (err) => { console.error("fetch error: ", err) })

    var data = await response;
    if (data.registered == true)
        return [true, null];
    else
        return [false, null]

}

async function login(event: SubmitEvent): Promise<[boolean, string | null]> {
    const form = event.target;
    if (!form) {
        return [false, "Invalid form"]
    }
    const formData = new FormData(form as HTMLFormElement);

    const username = formData.get('username')?.toString();
    const password = formData.get('password')?.toString();

    const response = fetch("/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    }).then(async (val) => { return await val.json() }, (err) => { console.error("fetch error: ", err) })

    var data = await response;
    if (data && data.logged == true)
        return [true, data.id];
    else {
        return [false, data.reason]
    }
}

export async function initForm() {
    const loginform = document.getElementById('LoginForm') as HTMLElement;
    const registerform = document.getElementById('RegisterForm') as HTMLElement;

    async function openLogin() {
        loginform?.classList.remove('hidden');

        const googleDiv = document.getElementById('googleSignInButton');
        if (!googleDiv || googleDiv.hasChildNodes()) return;

        await initGoogle();
        if (window.google && googleInitialized) {
            window.google.accounts.id.renderButton(
                googleDiv,
                { theme: 'outline', size: 'large' }
            );
        } else {
            console.warn("Google not initialized yet");
        }
    }

    async function openRegister() {
        registerform?.classList.remove('hidden');

        const googleDiv = document.getElementById('googleRegisterSignInButton');
        if (!googleDiv || googleDiv.hasChildNodes()) return;

        await initGoogle();

        if (window.google && googleInitialized) {
            const res = window.google.accounts.id.renderButton(
                googleDiv,
                { theme: 'outline', size: 'large' }
            );
        } else {
            console.warn("Google not initialized yet");
        }
    }

    function closeRForm() {
        registerform?.classList.add('hidden');
    }

    function closeLForm() {
        loginform?.classList.add('hidden');
    }

    document.getElementById('openLogin')?.addEventListener('click', openLogin);
    document.getElementById('closeLForm')?.addEventListener('click', closeLForm);
    document.getElementById('openRegister')?.addEventListener('click', openRegister);
    document.getElementById('closeRForm')?.addEventListener('click', (e) => {
        e.preventDefault()
        closeRForm()
    });

    // ------------  REGISTER  ----------------
    registerform?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const form = registerform?.querySelector('form') as HTMLFormElement;
        const formData = new FormData(form);

        let check = await register_value_check(formData);
        if (check[0]) {
            const res = await register(event);
            if (res[0] == true) {
                closeRForm();
                return;
            }
            else
                check[1] = res[1];
        }
        const error_msg_form = registerform.querySelector<HTMLElement>("#error_message");
        if (error_msg_form)
            if (error_msg_form.textContent = check[1]) {
                error_msg_form.classList.remove("animate-shake"); // reset
                void error_msg_form.offsetWidth;
                error_msg_form.classList.add("animate-shake"); // marche pas #TODO
            }
            else
                error_msg_form.textContent = check[1];

    });

    // ------------  LOGIN  ----------------
    loginform?.addEventListener('submit', async function (event) {

        event.preventDefault();
        const res = await login(event)
        if (res[0]) {
            await navbar(res[1]!);
            closeLForm();
        }
        else {
            const error_msg_form = loginform.querySelector<HTMLElement>("#error_message");
            if (error_msg_form)
                error_msg_form.textContent = res[1];
        }
    })
}
