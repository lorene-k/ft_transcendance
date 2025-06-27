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
registerform?.addEventListener('submit', function (event) {
    event.preventDefault();
    const form = registerform?.querySelector('form');
    const formData = new FormData(form);
    const username = formData.get('username')?.toString().trim() || '';
    const email = formData.get('email')?.toString().trim() || '';
    const password = formData.get('password')?.toString() || '';
    // Basic validation
    if (password.length < 6) {
        alert('Password must be at least 6 characters');
        return;
    }
    const res = fetch('/api/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username }),
    });
    res.then((res) => {
        console.log(res);
    });
    form.submit();
});
export {};
