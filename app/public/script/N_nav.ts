import ChatClient from "./chat/ChatClient.js";
import GameModeManager from "./play/GameModeManager.js";
import DashboardManager from "./dashboard/dashboard.js";
import { index_setup } from "./Index.js";
import { dropdownTransition } from "./animateUtils.js";
import { initI18n } from "../translate.js";
import { setLanguage, applyTranslations } from "../translate.js";
import { initForm } from "./form.js";
import { account_setup } from "./account.js";
import { Socket } from "socket.io";
import { hideLangSwitcher, showLangSwitcher } from "./google.js"

const site_map = ["home", "chat", "account", "dashboard", "play"];
let chatClient: ChatClient | null = null;
let gameManager: GameModeManager | null = null;
let dashboardManager: DashboardManager | null = null;

declare const io: any
let socket: Socket | null = null

window.addEventListener("hashchange", () => {
	let newPage = window.location.hash.substring(1);
	if (!newPage) newPage = "home";
	move_to(newPage, true);
});


function get_page(): string {
	return (window.location.hash.substring(1))
}

export async function move_to(to: string, force = false, inviteInfo?: { mode: string; player1: string; player2: string }) { // { "invite", this.inviter.id, this.invitedId}
	const current = get_page()
	showLangSwitcher() //test
	if (to.length == 0)
		return
	if (!force && current === to)
		return
	else if (!site_map.find((value, index, array) => { return to.startsWith(value) })) {
		return
	}
	try {
		const response = await fetch(to === "home" ? "/" : `/${to}`, {
			method: "GET",
			credentials: "include",
		});
		if (response.status == 401)
			return (move_to("home"))
		const main = await response.text()

		let old = document.getElementById("main_content") || document.body;
		if (old) {
			old.innerHTML = ""
			old.outerHTML = main;
		}
		else {
			console.error("main not found")
			return
		}
		// destination specifics
		if (to === "home") {
			index_setup()
		}
		else if (to.startsWith("account")) {
			account_setup()
		}
		else if (to === "play") {
			gameManager = new GameModeManager(inviteInfo?.mode, inviteInfo?.player1, inviteInfo?.player2);
			hideLangSwitcher()
		}
		else if (to === "dashboard") {
			dashboardManager = null;
			dashboardManager = new DashboardManager();
		}
		else if (to === "chat" && !chatClient) {
			chatClient = new ChatClient();
		}
		if (!(to === "chat") && chatClient) {
			chatClient.destroy();
			chatClient = null;
		}
		if (!(to === "play") && gameManager) {
			gameManager.handleQuitGame(false);
			gameManager = null;
		}
		await new Promise(resolve => setTimeout(resolve, 50));
		await applyTranslations();
		if (!force) {
			history.pushState(null, "", `#${to}`)
		}
	} catch (err) {
		console.error("move failed", err);
	}
}

function friendsconnect(id: string) {
	socket = io("/friends", {
		auth: {
			id: Number(id)
		}
	})
	socket!.on("connect", () => {
	});
}

function friendsdisconnect() {
	if (socket)
		socket.disconnect()
}

export async function navbar(id: string | null = null) {
	// create navbar, add event listener on nav, all nav button must be registered here
	let nav = await fetch('/script/nav').then(async (response) => await response.text());
	const user = await fetch('/api/islogged').then(async (response) => await response.json());
	var target = document.body
	if (user && user.authenticated) {
		nav = nav.replace('PLACEHOLDER_USERNAME', user.username)
		if (id && id != "0")
			friendsconnect(id!)
	}

	if (target) {
		target.querySelector('nav')?.remove();
		target.insertAdjacentHTML("afterbegin", nav);

		applyTranslations();

		const parser = new DOMParser()
		// -------------------- click event navbar ---------------------
		target.firstChild?.addEventListener("click", async function (e) {
			const target = e.target as HTMLElement;
			if (target) {
				e.preventDefault();
				// ---- logout button listener ----
				if (target.id === "logout") {
					try {
						await fetch("/logout", {
							method: "GET",
							credentials: "include"
						});
						friendsdisconnect()
						await navbar();
						await move_to("home");
						initForm();
					} catch (err) {
						console.error("Logout failed", err);
					}
					// ---- dropdown menu listener ----
				} else if (target.closest("#menu-icon") || target.closest("#dropdown-menu")) {
					handleNavbarDropdown(target);
				} else {
					move_to(target.id);
				}
			}
		});
	} else {
		console.error("Target element not found.");
	}
}

function handleNavbarDropdown(target: HTMLElement) {
	const dropdown = document.getElementById("dropdown-menu");
	if (dropdown) dropdownTransition(dropdown, "max-h-100");
	const page = target.id.startsWith("dropdown-") ? target.id.replace("dropdown-", "") : target.id;
	if (target.closest("#dropdown-menu")) move_to(page);
}

export async function footer() {
	let footerHtml = await fetch('/script/footer').then(async (response) => await response.text());
	const target = document.body;

	if (target) {
		target.querySelector('footer')?.remove();
		target.insertAdjacentHTML("beforeend", footerHtml);
		applyTranslations();
		const langSwitcher = document.getElementById("langSwitcher") as HTMLSelectElement;
		if (langSwitcher) {
			langSwitcher.value = localStorage.getItem("lang") || "en";
			langSwitcher.addEventListener("change", () => {
				setLanguage(langSwitcher.value);
			});
		}
	} else {
		console.error("Target element not found.");
	}
}
