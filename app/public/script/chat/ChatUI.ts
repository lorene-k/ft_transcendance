import ChatClient from "./ChatClient.js";
import { dropdownTransition } from "../animateUtils.js";
import { account_setup } from "../account.js";

export default class ChatUI {
    private chatClient: ChatClient;
    private displayedPreviews: Set<string> | null = null;
    private card: HTMLElement | null = null;
    private targetName: HTMLElement | null = null;
    private input: HTMLTextAreaElement | null = null;
    private sendBtn: HTMLButtonElement | null = null;

    constructor(chatClient: ChatClient) {
        this.chatClient = chatClient;
        this.displayedPreviews = new Set();
        this.setCardTemplate();
        this.initInputListeners();
    }

    destroy() {
        if (this.targetName) this.targetName.removeEventListener("click", this.handleProfileLink);
        if (this.input) this.input.removeEventListener("keydown", this.handleInputKeydown);
        if (this.sendBtn) this.sendBtn.onclick = null;
        if (this.displayedPreviews) this.displayedPreviews.clear();
        this.displayedPreviews = null;
    }

    // Fetch user profile view
    private async getProfileLink(accountContainer: HTMLElement, userId: string) {
        try {
            const res = await fetch(`/api/account?id=${userId}`, {
                method: "GET",
            });
            if (!res.ok) throw new Error("Failed to load account page");
            const html = await res.text();
            const parser = new DOMParser();
            const view = parser.parseFromString(html, "text/html");
            const wrapper = document.createElement("div");
            const mainDiv = view.getElementById("main_content");
            if (!mainDiv) throw new Error("Main div not found.");
            wrapper.setAttribute("class", mainDiv.getAttribute("class") || "");
            wrapper.innerHTML = mainDiv.innerHTML;
            wrapper.classList.remove("mt-16", "p-6");
            wrapper.classList.add("px-2", "max-h-50");
            accountContainer.innerHTML = "";
            accountContainer.appendChild(wrapper);
            account_setup(Number(userId));
        } catch (err) {
            console.error("Error loading account view:", err);
        }
    }

    // Open account view on click
    private handleProfileLink = async (e: MouseEvent) => {
        e.preventDefault();
        const accountContainer = document.getElementById("account-container");
        if (!accountContainer) return;
        await this.getProfileLink(accountContainer, this.chatClient.getUserManager()!.getTargetId()!);
        dropdownTransition(accountContainer, "max-h-full", "min-h-40");
    };

    // Handle send with Ctrl+Enter / Cmd+Enter
    private handleInputKeydown = (e: KeyboardEvent) => {
        const isMac = navigator.userAgent.toUpperCase().includes("MAC");
        if (e.key === "Enter" && (isMac ? e.metaKey : e.ctrlKey)) {
            e.preventDefault();
            if (this.input) this.sendInput(this.input);
        }
    };

    // Send collected input
    private sendInput(input: HTMLTextAreaElement) {
        if (!input.value.trim()) return;
        this.chatClient.sendMessage(input.value);
        input.value = "";
    }

    // Init listeners for chat window
    initInputListeners() {
        this.input = document.querySelector("textarea") as HTMLTextAreaElement;
        this.sendBtn = document.getElementById("send-btn") as HTMLButtonElement;
        this.targetName = document.getElementById("recipient-name");
        this.targetName!.addEventListener("click", this.handleProfileLink);
        this.input!.addEventListener("keydown", this.handleInputKeydown);
        this.sendBtn.onclick = (e) => {
            e.preventDefault();
            this.sendInput(this.input!);
        };
    }

    // Load profile picture
    async loadImage(userId: string): Promise<string> {
        try {
            const response = await fetch(`/api/account/picture/get/${userId}`);
            if (!response.ok) throw new Error("Failed to load profile picture");
            const blob = await response.blob();
            return (URL.createObjectURL(blob));
        } catch (err) {
            console.warn(err);
            return ("");
        }
    }

    // Load conversation preview card template
    private setCardTemplate() {
        const cardHtml = `
        <div class="mx-auto flex items-center h-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg 
            hover:bg-gray-100 gap-2 rounded-xl cursor-pointer overflow-auto no-scrollbar hover-transition">
            <img class="ml-1 shadow-sm w-8 h-8 rounded-xl user-avatar" alt="Profile Picture">
            <p class="text-sm font-normal text-gray-800">Username</p>
        </div>`;
        const template = document.createElement("template");
        template.innerHTML = cardHtml.trim();
        this.card = template.content.firstElementChild as HTMLElement;
    }

    // Add conv preview card
    private async addConvPreview(targetId: string, targetName: string, allMessages: HTMLElement):
        Promise<{ card: HTMLElement | null, allMessages: HTMLElement | null } | null> {
        const newCard = this.card!.cloneNode(true) as HTMLElement;
        const name = newCard.querySelector("p");
        const img = newCard.querySelector("img.user-avatar") as HTMLImageElement;
        newCard.setAttribute("data-user-id", targetId);
        if (name) name.textContent = targetName;
        if (img) img.src = await this.loadImage(targetId);
        this.displayedPreviews!.add(targetId);
        allMessages.prepend(newCard);
        return ({ card: newCard, allMessages });
    }

    // Prepend existing preview
    private prependPreview(targetId: string, allMessages: HTMLElement) {
        const displayed = allMessages.querySelector(`[data-user-id="${targetId}"]`);
        if (displayed) {
            displayed.classList.add("transition-all", "duration-300");
            allMessages.prepend(displayed);
        }
    }

    // Update conv preview : add card or prepend if displayed
    async updateConvPreviewUI(targetId: string, targetName: string):
        Promise<{ card: HTMLElement | null, allMessages: HTMLElement | null } | null> {
        const allMessages = document.getElementById("all-messages");
        if (!allMessages) return (null);
        if (this.displayedPreviews && this.displayedPreviews.has(targetId)) {
            this.prependPreview(targetId, allMessages);
            return (null);
        } else {
            return (await this.addConvPreview(targetId, targetName, allMessages));
        }
    }
}