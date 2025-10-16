export function account_setup(popup_id: number | null = null) {
    const profileUpload = document.getElementById("profile-upload")! as HTMLInputElement;
    const changeEmailButton = document.getElementById("change_email_button")! as HTMLButtonElement | null;
    const changePwdButton = document.getElementById("change_pwd_button")! as HTMLButtonElement | null;
    const changeUsernameButton = document.getElementById("change_username_button")! as HTMLButtonElement | null;
    const addfriendButton = document.getElementById("add_friend") as HTMLButtonElement | null
    const friendsList = document.querySelector("#friends-list");

    if (friendsList) {
        friendsList.addEventListener("click", (event) => {
            const target = event.target as HTMLElement;

            if (target.matches("button")) {
                const li = target.closest("li")!;
                const username = li.querySelector("span.font-medium")?.textContent!.trim();
                fetch(`/api/removefriend/${username}`)
                li.remove();

            }
        });
    }

    if (addfriendButton) {
        addfriendButton.addEventListener('click', async (e) => {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash.split("?")[1]);
            const response = fetch('/api/addfriend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: popup_id ? popup_id : params.get("id"),
                })
            })
            addfriendButton.disabled = true;
            addfriendButton.classList.remove("bg-blue-600", "hover:bg-blue-700");
            addfriendButton.classList.add("bg-green-600", "cursor-not-allowed");
            addfriendButton.textContent = "friend added";
        })
    }

    if (changeEmailButton)
        changeEmailButton.addEventListener('click', async (e) => {
            email_form()
        })
    if (changePwdButton)
        changePwdButton.addEventListener('click', async (e) => {
            password_form()
        })
    if (changeUsernameButton)
        changeUsernameButton.addEventListener('click', async (e) => {
            username_form()
        })

    function email_form() {
        const emailForm = document.getElementById("EmailForm")!
        const cancel = document.getElementById("EmailcloseForm") as HTMLButtonElement

        cancel.addEventListener('click', (target) => {
            emailForm.classList.add('hidden')
        })

        emailForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const form = e.target;
            if (!form) {
                console.error("error: event target is missing")
            }
            const formData = new FormData(form as HTMLFormElement);
            const email = formData.get('email')?.toString();

            const resp = await fetch("/api/account/email", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                })
            })

            if (resp.status != 200) {
                alert("update failed")
            } else {
                const m = document.getElementById('email');
                if (m)
                    m.nodeValue = email as string
                emailForm.classList.add('hidden')
            }
        })

        emailForm?.classList.remove('hidden')
    }

    function username_form() {
        const usernameForm = document.getElementById("UsernameForm")!
        const cancel = document.getElementById("UsernamecloseForm") as HTMLButtonElement

        cancel.addEventListener('click', (target) => {
            usernameForm.classList.add('hidden')
        })

        usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault()
            const form = e.target;
            if (!form) {
                console.error("error: event target is missing")
            }
            const formData = new FormData(form as HTMLFormElement);
            const username = formData.get('username')?.toString();

            const resp = await fetch("/api/account/username", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username,
                })
            })

            if (resp.status != 200) {
                alert("update failed")
            } else {
                const m = document.getElementById('username')!;
                m.innerHTML = username as string
                usernameForm.classList.add('hidden')
            }
        })

        usernameForm?.classList.remove('hidden')
    }

    function password_form() {
        const pwdForm = document.getElementById("PwdForm")
        const cancel = document.getElementById("passwordCloseForm") as HTMLButtonElement

        cancel.addEventListener('click', (target) => {
            pwdForm?.classList.add('hidden')
        })

        pwdForm?.addEventListener('submit', async (e) => {
            e.preventDefault()
            const form = e.target;
            if (!form) {
                console.error("error: event target is missing")
            }
            const formData = new FormData(form as HTMLFormElement);
            const old = formData.get('Old password')?.toString();
            const password = formData.get('password')?.toString();
            const confirm = formData.get('confirm new password')?.toString();

            if (password != confirm) {
                alert("password differents")
                return
            }

            const resp = await fetch("/api/account/password", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old: old,
                    password: password,
                })
            })

            if (resp.status != 200) {
                alert("update failed")
            } else {
                pwdForm.classList.add('hidden')
            }
        })

        pwdForm?.classList.remove('hidden')
    }

    function refreshProfilePicture() {
        const img = document.getElementById("profile-picture") as HTMLImageElement;
        const baseUrl = img.src;
        img.src = `${baseUrl}?t=${new Date().getTime()}`;
    }

    if (profileUpload) {
        profileUpload.addEventListener("change", async function (this: HTMLInputElement) {
            const file = this.files?.[0];
            if (!file) return;

            const formData = new FormData();
            formData.append("profile_picture", file);

            try {
                const res = await fetch("/api/account/picture/set", {
                    method: "POST",
                    body: formData
                });

                if (!res.ok) throw new Error("Upload failed");
                refreshProfilePicture();

            } catch (err) {
                console.error(err);
                alert("Failed to upload profile picture.");
            }
        });
    }
}
