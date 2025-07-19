import { navbar } from "./N_nav.js";
async function register_value_check(formData) {
    const username = formData.get('username')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    // Basic validation
    if (password.length < 6) {
        return [false, 'Password must be at least 6 characters'];
    }
    const response = fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username }),
    }).then(async (val) => {
        return await val.json();
    }, (err) => console.error(err));
    let v = await response;
    if (v.exists == true)
        return [false, "username already exist"];
    return [true, null];
}
async function register(event) {
    const form = event.target;
    if (!form) {
        console.error("error: event target is missing");
        return [false, "Invalid form"];
    }
    const formData = new FormData(form);
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
    }).then(async (val) => { return await val.json(); }, (err) => { console.error("fetch error: ", err); });
    var data = await response;
    if (data.registered == true)
        return [true, null];
    else
        return [false, null];
}
async function login(event) {
    const form = event.target;
    if (!form) {
        console.error("error: event target is missing");
        return [false, "Invalid form"];
    }
    const formData = new FormData(form);
    const username = formData.get('username')?.toString();
    const email = formData.get('email')?.toString();
    const password = formData.get('password')?.toString();
    const response = fetch("/login", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    }).then(async (val) => { return await val.json(); }, (err) => { console.error("fetch error: ", err); });
    var data = await response;
    if (data && data.logged == true)
        return [true, null];
    else {
        return [false, data.reason];
    }
}
export async function initForm() {
    const loginform = document.getElementById('LoginForm');
    const registerform = document.getElementById('RegisterForm');
    function openLogin() {
        loginform?.classList.remove('hidden');
    }
    function openRegister() {
        registerform?.classList.remove('hidden');
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
    document.getElementById('closeRForm')?.addEventListener('click', closeRForm);
    // ------------  REGISTER  ----------------
    registerform?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const form = registerform?.querySelector('form');
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
        const error_msg_form = registerform.querySelector("#error_message");
        if (error_msg_form)
            if (error_msg_form.textContent = check[1]) {
                error_msg_form.classList.remove("animate-shake"); // reset
                void error_msg_form.offsetWidth;
                error_msg_form.classList.add("animate-shake"); // marche pas #TODO
            }
            else
                error_msg_form.textContent = check[1];
    });
    // ------------  login  ----------------
    loginform?.addEventListener('submit', async function (event) {
        event.preventDefault();
        const res = await login(event);
        if (res[0]) {
            await navbar();
            closeLForm();
        }
        else {
            const error_msg_form = loginform.querySelector("#error_message");
            if (error_msg_form)
                error_msg_form.textContent = res[1];
        }
    });
}
