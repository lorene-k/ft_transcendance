import { initForm } from "./form.js";
import { index_setup } from "./Index.js";
import { move_to, navbar, footer } from "./N_nav.js";
import { applyTranslations, initI18n, setLanguage } from "../translate.js";

await initI18n();
await navbar();
await footer();
initForm();
index_setup()

const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
const pageAccessedByReload = navEntries.some(nav => nav.type === 'reload');

window.addEventListener("DOMContentLoaded", async () => {
    const langSwitcher = document.getElementById("langSwitcher") as HTMLSelectElement;
    if (langSwitcher) {
        langSwitcher.value = localStorage.getItem("lang") || "en";
        langSwitcher.addEventListener("change", async (event) => {
            const newLang = langSwitcher.value;
            await setLanguage(newLang);
        });
    }
    await applyTranslations();
});

window.addEventListener("popstate", () => {
    const target = window.location.hash.replace("#", "") || "home";
    move_to(target, true);
});

if (pageAccessedByReload) {
    const target = window.location.hash.replace("#", "");
    move_to(target, true)
}
