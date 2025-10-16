type Translations = { [key: string]: any };

let translations: Translations = {};
let currentLang = "en";

export async function initI18n(defaultLang: string = "en") {
	const savedLang = localStorage.getItem("lang");
	currentLang = savedLang || defaultLang;
	await loadTranslations(currentLang);
	applyTranslations();
}

export async function loadTranslations(lang: string) {
    try {
        const response = await fetch(`/translate/${lang}.json`);
        translations = await response.json();
        currentLang = lang;
        localStorage.setItem("lang", lang);
    } catch (err) {
        console.error(`Failed to load translations for ${lang}`, err);
    }
}

export async function applyTranslations(context: Document | Element = document) {
    const savedLang = localStorage.getItem("lang");
    if (savedLang && savedLang !== currentLang) {
        await loadTranslations(savedLang);
    }
    const elements = context.querySelectorAll<HTMLElement>("[data-i18n]");
    elements.forEach(el => {
        const key = el.dataset.i18n!;
        const text = getTranslation(key);
        if (text) {
        el.textContent = text;
        }
    });
}

export function applyTranslationsSync(context: Document | Element = document) {
    const elements = context.querySelectorAll<HTMLElement>("[data-i18n]");
    elements.forEach(el => {
        const key = el.dataset.i18n!;
        const text = getTranslation(key);
        if (text) {
            el.textContent = text;
        }
    });
}

export async function setLanguage(lang: string) {
    await loadTranslations(lang);
    applyTranslations();
}

function getTranslation(key: string): string | undefined {
    return key.split(".").reduce((obj: any, k: string) => obj?.[k], translations) as string | undefined;
}

export function applyTranslationsToNewContent(element: Element): void {
    requestAnimationFrame(() => {
        applyTranslationsSync(element);
    });
}

export { getTranslation };