import ChatClient from "./chat/ChatClient.js";
import DashboardManager from "./dashboard/dashboard.js";
function am_i_on_the_page(page) {
    console.log(window.location.href.substring(window.location.href.indexOf('#') + 1));
    return (window.location.href.substring(window.location.href.indexOf('#') + 1) === page);
}
export async function navbar() {
    // create navbar, add event listener on nav, all nav button must be registered here
    let nav = await fetch('/script/nav').then(async (response) => await response.text());
    const user = await fetch('/api/islogged').then(async (response) => await response.json());
    var target = document.body;
    if (user && user.autenticated) {
        nav = nav.replace('PLACEHOLDER_USERNAME', user.username);
    }
    if (target) {
        target.querySelector('nav')?.remove();
        target.insertAdjacentHTML("afterbegin", nav);
        const parser = new DOMParser();
        target.firstChild?.addEventListener("click", async function (e) {
            const target = e.target;
            if (target) {
                e.preventDefault();
                // ---- logout button listener ----
                if (target.id === "logout") {
                    try {
                        await fetch("/logout", {
                            method: "GET",
                            credentials: "include"
                        });
                        window.location.href = "/";
                    }
                    catch (err) {
                        console.error("Logout failed", err);
                    }
                }
                // ---- account button listener ----
                else if (target.id === "account" && !am_i_on_the_page("account")) {
                    try {
                        console.log("account");
                        const response = await fetch("/account", {
                            method: "GET",
                            credentials: "include"
                        });
                        const main = await response.text();
                        let old = document.getElementById("main_content");
                        if (old) {
                            old.innerHTML = "";
                            old.outerHTML = main;
                        }
                        else
                            console.error("main not found");
                        history.pushState(null, "", window.location.href.substring(0, window.location.href.indexOf('#')) + "#account"); // TODO: need more thought
                    }
                    catch (err) {
                        console.error("Logout failed", err);
                    }
                }
                // ---- Home button listener ----
                else if (target.id === "Home" && !am_i_on_the_page("home")) {
                    try {
                        const response = await fetch("/", {
                            method: "GET",
                            credentials: "include"
                        });
                        const main = parser.parseFromString(await response.text(), 'text/html');
                        let old = document.getElementById("main_content");
                        if (old) {
                            old.outerHTML = main.getElementById('main_content').outerHTML;
                        }
                        else
                            console.error("main not found");
                        history.pushState(null, "", window.location.href.substring(0, window.location.href.indexOf('#')) + "#home"); // TODO: need more thought
                    }
                    catch (err) {
                        console.error("Logout failed", err);
                    }
                }
                // ---- Dashboard button listener ----
                else if (target.id === "dashboard" && !am_i_on_the_page("dashboard")) {
                    try {
                        console.log("dashboard");
                        const response = await fetch("/dashboard", {
                            method: "GET",
                            credentials: "include"
                        });
                        const main = await response.text();
                        let old = document.getElementById("main_content");
                        if (old) {
                            old.innerHTML = "";
                            old.outerHTML = main;
                            const dashboardManager = new DashboardManager();
                            if (dashboardManager)
                                dashboardManager.displayDashboard();
                        }
                        else
                            console.error("main not found");
                        history.pushState(null, "", window.location.href.substring(0, window.location.href.indexOf('#')) + "#dashboard"); // TODO: need more thought
                    }
                    catch (err) {
                        console.error("Logout failed", err);
                    }
                    // ---- Chat button listener ----
                }
                else if (target.id === "chat" && !am_i_on_the_page("chat")) {
                    try {
                        console.log("chat");
                        const response = await fetch("/chat", {
                            method: "GET",
                            credentials: "include"
                        });
                        const main = await response.text();
                        let old = document.getElementById("main_content");
                        if (old) {
                            old.innerHTML = "";
                            old.outerHTML = main;
                            const chatClient = new ChatClient();
                            if (!chatClient)
                                console.error("Failed to initialize chatClient.");
                        }
                        else
                            console.error("main not found");
                        history.pushState(null, "", window.location.href.substring(0, window.location.href.indexOf('#')) + "#chat"); // TODO: need more thought
                    }
                    catch (err) {
                        console.error("Logout failed", err);
                    }
                }
            }
        });
    }
    else {
        console.error("Target element not found.");
    }
}
