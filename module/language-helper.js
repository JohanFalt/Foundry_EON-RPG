/**
 * Per-användar-UI-språk för Eon-världen (Foundry v14 user settings + Localization API).
 */

const SUPPORTED_UI_LANGUAGES = ["sv", "en"];

/** @type {boolean} */
let applyingUiLanguage = false;

/**
 * @returns {string} "sv" | "en" | "" om ej valt / ogiltigt
 */
export function getUiLanguagePreference() {
    const value = game.settings.get("eon-rpg", "uiLanguage");
    return SUPPORTED_UI_LANGUAGES.includes(value) ? value : "";
}

/**
 * @returns {boolean}
 */
export function hasChosenUiLanguage() {
    return Boolean(getUiLanguagePreference());
}

/**
 * Applicera UI-språk via Foundrys API (core.language + game.i18n.setLanguage).
 * @param {string} lang
 * @param {{ reload?: boolean }} [options]
 * @returns {Promise<boolean>} true om språk byttes / reload triggades
 */
export async function applyUiLanguage(lang, { reload = true } = {}) {
    if (applyingUiLanguage) return false;
    if (!SUPPORTED_UI_LANGUAGES.includes(lang)) {
        console.warn(`Eon RPG: unsupported UI language "${lang}"`);
        return false;
    }
    if (CONFIG.supportedLanguages && !(lang in CONFIG.supportedLanguages)) {
        console.warn(`Eon RPG: language "${lang}" is not in CONFIG.supportedLanguages`);
        return false;
    }

    const previousLang = game.i18n.lang;
    const coreLanguage = game.settings.get("core", "language");
    if (previousLang === lang && coreLanguage === lang) {
        return false;
    }

    applyingUiLanguage = true;
    try {
        if (coreLanguage !== lang) {
            await game.settings.set("core", "language", lang);
        }
        if (game.i18n.lang !== lang) {
            await game.i18n.setLanguage(lang);
        }

        if (reload) {
            foundry.utils.debouncedReload();
        }
        return true;
    } finally {
        applyingUiLanguage = false;
    }
}

/**
 * Visa förstaval (svenska förvalt). Sparar user-setting och applicerar.
 * @returns {Promise<void>}
 */
export async function promptUiLanguage() {
    const title = game.i18n.localize("eon.dialogs.uiLanguageTitle");
    const content = `<div class="eon-ui-language-prompt">
        <p>${game.i18n.localize("eon.dialogs.uiLanguageIntro")}</p>
        <p>${game.i18n.localize("eon.dialogs.uiLanguageHint")}</p>
    </div>`;

    let choice;
    try {
        choice = await foundry.applications.api.DialogV2.wait({
            window: { title },
            content,
            modal: true,
            rejectClose: false,
            buttons: [
                {
                    action: "sv",
                    label: "Svenska",
                    icon: "fa-solid fa-check",
                    default: true,
                    callback: () => "sv"
                },
                {
                    action: "en",
                    label: "English",
                    callback: () => "en"
                }
            ]
        });
    } catch (err) {
        console.warn("Eon RPG: language dialog closed unexpectedly", err);
        choice = null;
    }

    const lang = choice === "en" || choice === "sv" ? choice : "sv";
    await game.settings.set("eon-rpg", "uiLanguage", lang);
    await applyUiLanguage(lang, { reload: true });
}

/**
 * Säkerställ att användaren har valt språk och att det är aktivt i denna värld.
 * @returns {Promise<void>}
 */
export async function ensureUiLanguage() {
    if (!hasChosenUiLanguage()) {
        await promptUiLanguage();
        return;
    }

    const preference = getUiLanguagePreference();
    if (preference !== game.i18n.lang || game.settings.get("core", "language") !== preference) {
        await applyUiLanguage(preference, { reload: true });
    }
}
