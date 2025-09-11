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
  // language from localStorage
  const savedLang = localStorage.getItem("lang");
  if (savedLang && savedLang !== currentLang) {
    // If there's a mismatch, reload the correct translations
    await loadTranslations(savedLang);
  }

  // Apply translations to the specified context
  const elements = context.querySelectorAll<HTMLElement>("[data-i18n]");
  elements.forEach(el => {
    const key = el.dataset.i18n!;
    const text = getTranslation(key);
    if (text) {
      el.textContent = text;
    }
  });
}

// Add a synchronous version for when translations are already loaded
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

// export function createTranslatedElement(tagName: string, translationKey: string, fallbackText: string, className?: string): HTMLElement {
//   const element = document.createElement(tagName);
//   if (className) {
//     element.className = className;
//   }
//   element.setAttribute('data-i18n', translationKey);
//   element.textContent = getTranslation(translationKey) || fallbackText;
//   return element;
// }

// Helper for creating translated content that gets applied immediately
export function applyTranslationsToNewContent(element: Element): void {
  requestAnimationFrame(() => {
    applyTranslationsSync(element);
  });
}
// Export getTranslation for direct use in dynamic content
export { getTranslation };
