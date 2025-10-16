import { navbar } from "./N_nav.js";

// ------------  GOOGLE SIGN IN INITIALIZATION  ----------------
declare global {
    interface Window {
        google?: any;
    }
}
export let googleInitialized = false;
let googleInitPromise: Promise<void> | null = null;

export async function initGoogle() {
    if (googleInitialized) return;
    if (googleInitPromise) return googleInitPromise;

    googleInitPromise = (async () => {
        try {
            const res = await fetch('/api/auth/google-client-id');
            const data = await res.json();
            const clientId = data.clientId;

            if (!window.google) {
                await new Promise(resolve => {
                    const check = () => {
                        if (window.google) return resolve(true);
                        requestAnimationFrame(check);
                    };
                    check();
                });
            }

            if (clientId) {
                window.google.accounts.id.initialize({
                    client_id: clientId,
                    callback: (window as any).handleGoogleCredentialResponse,
                });
                googleInitialized = true;
            } else {
                console.error(" Client ID missing");
            }
        } catch (err) {
            console.error(" Failed to fetch Google Client ID:", err);
        }
    })();

    return googleInitPromise;
}


(window as any).handleGoogleCredentialResponse = function (response: any) {
    fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token: response.credential })
    })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                navbar(data.id);
                document.getElementById('LoginForm')?.classList.add('hidden');
                document.getElementById('RegisterForm')?.classList.add('hidden');
            } else {
                console.error("Google login failed:", data.message);
            }
        });
}

export function resetGoogle() {
    googleInitialized = false;
    googleInitPromise = null;
}

export function hideLangSwitcher() {
    const langSwitcher = document.getElementById("langSwitcher");
    if (langSwitcher) {
        langSwitcher.style.display = "none";
    }
}

export function showLangSwitcher() {
    const langSwitcher = document.getElementById("langSwitcher");
    if (langSwitcher) {
        langSwitcher.style.display = "";
    }
}
