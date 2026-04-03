const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

import {
    getMergedWizardData,
    persistWizardData,
    validateFas1Finish,
    validateFolkslagWizardForFinish,
    applyCharacterCreationFinish,
    ensureRollperson5StartingItems,
    EON_CCW_FLAG_SCOPE,
    collectWizardDraftFromRoot,
    syncWizardOvrigFardighetItemNamesFromForm,
    syncWizardSprakItemsFromForm,
    syncPairedWizardField,
    mirrorWizardFardighetPoolDisplay,
    applyPrimaryFolkslagAttributToMergedDraft,
    wizardHarleddTotaltDisplayText,
    emptyHandelseResultRow,
    emptyFardighetFordelningRow,
    clampWizardFardighetPoangValue,
    clampWizardFardighetGrundvardeForInkompetentValue,
    clampWizardFardighetPoangValueForRow,
    getWizardFardighetPoangCapForRow,
    defaultWizardFardighetGrundForCcwDraft,
    getWizardFardighetPoangCap,
    formatWizardFardighetRowSlutligT6,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    WIZARD_OVRIGA_ENHET_KEYS,
    createWizardOvrigFardighetItem,
    createWizardMystikFardighetItem,
    HARLEDDA_KEYS,
    ENHETER_KEYS,
    clampWizardFieldToNonNegativeIntStr,
    HANDELSE_SIDEBAR_SLAG_KEYS,
    UTRUSTNING_PKT_KEYS,
    CCW_WIZARD_CREATED_FARDIGHET_ROW,
    emptySprakFordelningRow,
    emptyKaraktarsdragRow
} from "./character-creation-helper.js";
import ItemHelper from "../item-helper.js";
import {
    CCW_EGENSKAP_SOURCE_UUID_FLAG,
    CCW_FOLKSLAG_MANAGED_FLAG,
    getFolkslagPrimaryChangeResetPatch,
    loadFolkslag5Doc,
    partitionFolkslagEgenskaper
} from "./folkslag-wizard-helper.js";
import { buildCharacterCreationWizardContext } from "./ccw/ccw-wizard-context.js";

/**
 * Karaktärsskapande-wizard (UI): ApplicationV2 + formulär/DOM. Domänlogik ligger i `character-creation-helper.js` / `./ccw/*`.
 * Dataflöde: `getMergedWizardData` → template-context (`buildCharacterCreationWizardContext`) → sparning via `collectWizardDraftFromRoot` / `persistWizardData`.
 */

/** @type {Record<string, string>} */
const ENHET_LABEL_KEYS = {
    valfria: "eon.wizard.fardighetsenheterValfriaUtomFormagor",
    strid: "eon.config.fardighetgrupper.strid",
    rorelse: "eon.config.fardighetgrupper.rorelse",
    mystik: "eon.config.fardighetgrupper.mystik",
    social: "eon.config.fardighetgrupper.social",
    kunskap: "eon.config.fardighetgrupper.kunskap",
    sprak: "eon.config.fardighetgrupper.sprak",
    vildmark: "eon.config.fardighetgrupper.vildmark",
    eExpertiser: "eon.sheets.actor.gruppExpertisKort",
    fFormagor: "eon.sheets.actor.gruppFormagorKort",
    hHantverk: "eon.sheets.actor.gruppHantverkKort",
    kKannetecken: "eon.sheets.actor.gruppKanneteckenKort"
};

/** @type {Record<string, string>} */
const HANDELSE_LABEL_KEYS = {
    valfri: "eon.wizard.htValfri",
    farder: "eon.wizard.htFarder",
    intriger: "eon.wizard.htIntriger",
    mirakel: "eon.wizard.htMirakel",
    strider: "eon.wizard.htStrider",
    studier: "eon.wizard.htStudier",
    trolldom: "eon.wizard.htTrolldom"
};

const CCW_UTRUSTNING_ALLOWED_TYPES = new Set(["Närstridsvapen", "Avståndsvapen", "Sköld", "Utrustning", "Rustning"]);
const CCW_MYSTIK_ALLOWED_TYPES = new Set(["Mysterie", "Besvärjelse"]);

/** @type {Record<string, string>} */
const PAKET_LABEL_KEYS = {
    valfritt: "eon.sheets.actor.utrustningspaketValfritt",
    djur: "eon.sheets.actor.utrustningspaketDjur",
    fiske: "eon.sheets.actor.utrustningspaketFiske",
    forskning: "eon.sheets.actor.utrustningspaketForskning",
    hantverk: "eon.sheets.actor.utrustningspaketHantverk",
    jakt: "eon.sheets.actor.utrustningspaketJakt",
    medicinsk: "eon.sheets.actor.utrustningspaketMedicinsk",
    musik: "eon.sheets.actor.utrustningspaketMusik",
    mystikUtrustning: "eon.sheets.actor.utrustningspaketMystik",
    skriv: "eon.sheets.actor.utrustningspaketSkriv",
    skonhet: "eon.sheets.actor.utrustningspaketSkonhet",
    tjuv: "eon.sheets.actor.utrustningspaketTjuv",
    underhallning: "eon.sheets.actor.utrustningspaketUnderhallning",
    vildmark: "eon.sheets.actor.utrustningspaketVildmark",
    vapenvar: "eon.sheets.actor.utrustningspaketVapenvar"
};

/**
 * Karaktärsskapande för Rollperson5.
 * @extends {ApplicationV2}
 */
export class CharacterCreationWizard extends HandlebarsApplicationMixin(ApplicationV2) {
    /** Ignorera ccw_valfri change under programmatisk avmarkering och under sync+render (annars evighetsloop). */
    #ccwSuppressValfriCheckbox = false;
    /** Undvik nästlade prose-mirror persist → update → render → change. */
    #ccwProseMirrorPersistBusy = false;
    /** Scrollpositioner innan render (återställs i _onRender så användaren inte hoppar till toppen). */
    #ccwScrollWindow = 0;
    #ccwScrollMain = 0;
    #ccwScrollSidebar = 0;
    /** Spara scroll synkront före await i handlers — undviker 0-värden om render/capture sker i fel ordning. */
    #ccwScrollPendingMerge = null;
    /** @type {ResizeObserver|null} */
    #ccwScrollStabilizerRo = null;
    /** @type {ReturnType<typeof setTimeout>|null} */
    #ccwScrollStabilizerTimer = null;
    /** Senast öppnade item-sheet från flik 13 (hålls ovanför wizardn). */
    _ccwPinnedEditItemId = "";
    /** Periodisk vakt som håller pinnat item-sheet över wizardn. */
    _ccwPinnedRaiseTimer = null;
    /** Central vakt för dialogs + popup-fönster ovanför wizardn. */
    _ccwPopupGuardTimer = null;
    /** Senast kända fönsterplacering (left/top/width/height) för att undvika centrerings-hopp vid render. */
    _ccwWindowPlacement = null;
    /** Observerar host-style för att fånga manuella flyttar av wizardfönstret. */
    _ccwWindowPlacementObserver = null;
    /** True när användaren faktiskt har flyttat wizardfönstret. */
    _ccwWindowPlacementUserLocked = false;
    /** True endast under aktiv användardragning av wizardfönstret. */
    _ccwWindowDragActive = false;
    /** @type {((event: PointerEvent) => void)|null} */
    _ccwWindowPointerUpHandler = null;
    /** @type {((event: PointerEvent) => void)|null} */
    _ccwWindowHeaderPointerDownHandler = null;
    /** Förhindra dubbelkörning av Slutför-flödet. */
    _ccwFinishInProgress = false;
    /** Markera att slutför har initierats (blockera change-rerender). */
    _ccwFinishRequested = false;
    /** Markera att "Fortsätt senare" har initierats (blockera change-rerender). */
    _ccwLaterRequested = false;
    /** Förhindra dubbelkörning av "Fortsätt senare". */
    _ccwLaterInProgress = false;
    /** Efter nästa render: kör inte fokusåterställning (t.ex. flikbyte — undvik fokus på dolda fält). */
    _ccwSkipFocusRestoreOnce = false;
    /** Senast fokuserat `ccw_*`-fält (name-attribut) för återställning efter render. */
    #ccwLastFocusedCcwFieldName = "";
    #ccwLastFocusedSelStart = 0;
    #ccwLastFocusedSelEnd = 0;
    /** @type {((event: FocusEvent) => void)|null} */
    _boundOnCcwFocusIn = null;

    /** @param {{ actor: Actor }} options */
    constructor(options = {}) {
        if (!options.actor) {
            throw new Error("CharacterCreationWizard requires { actor }");
        }
        super(options);
        this.actor = options.actor;
        this.options.window.title = game.i18n.localize("eon.sheets.actor.karaktarSkapande");
    }

    /** @param {Actor} actor */
    static isOpenFor(actor) {
        return Object.values(ui.windows).some(
            (openWindow) => openWindow instanceof CharacterCreationWizard && openWindow.actor?.id === actor.id
        );
    }

    /** @param {Actor} actor */
    static async open(actor) {
        if (CharacterCreationWizard.isOpenFor(actor)) {
            const existingWizard = Object.values(ui.windows).find(
                (openWindow) => openWindow instanceof CharacterCreationWizard && openWindow.actor?.id === actor.id
            );
            existingWizard?.bringToFront?.();
            return existingWizard;
        }
        const wizardApplication = new CharacterCreationWizard({ actor });
        await wizardApplication.render(true);
        wizardApplication.bringToFront?.();
        return wizardApplication;
    }

    /** @returns {HTMLElement|null} */
    #ccwScrollScopeRoot() {
        const direct = this._rootEl();
        if (direct) return direct;
        const wid = this.id ?? CharacterCreationWizard.DEFAULT_OPTIONS.id;
        if (typeof document !== "undefined" && wid) {
            const byId = document.getElementById(wid);
            if (byId instanceof HTMLElement) return byId;
        }
        return null;
    }

    #ccwApplyScrollTop(el, value) {
        if (!(el instanceof HTMLElement) || typeof value !== "number") return;
        const max = Math.max(0, el.scrollHeight - el.clientHeight);
        el.scrollTop = Math.min(Math.max(0, value), max);
    }

    #ccwCaptureScrollPositions() {
        const pending = this.#ccwScrollPendingMerge;
        if (pending) {
            this.#ccwScrollPendingMerge = null;
            this.#ccwScrollWindow = pending.window;
            this.#ccwScrollMain = pending.main;
            this.#ccwScrollSidebar = pending.sidebar;
            return;
        }
        const root = this.#ccwScrollScopeRoot();
        if (!root) return;
        const windowHost = root.querySelector(".window-content");
        const main = root.querySelector(".eon-ccw-content");
        const sidebar = root.querySelector(".eon-ccw-sidebar");
        this.#ccwScrollWindow = windowHost instanceof HTMLElement ? windowHost.scrollTop : 0;
        this.#ccwScrollMain = main instanceof HTMLElement ? main.scrollTop : 0;
        this.#ccwScrollSidebar = sidebar instanceof HTMLElement ? sidebar.scrollTop : 0;
    }

    /** Läser DOM direkt — anropar inte #ccwCaptureScrollPositions (som tömmer pending). */
    #ccwSnapshotScrollForPendingRender() {
        const root = this.#ccwScrollScopeRoot();
        if (!root) {
            this.#ccwScrollPendingMerge = { window: 0, main: 0, sidebar: 0 };
            return;
        }
        const windowHost = root.querySelector(".window-content");
        const main = root.querySelector(".eon-ccw-content");
        const sidebar = root.querySelector(".eon-ccw-sidebar");
        this.#ccwScrollPendingMerge = {
            window: windowHost instanceof HTMLElement ? windowHost.scrollTop : 0,
            main: main instanceof HTMLElement ? main.scrollTop : 0,
            sidebar: sidebar instanceof HTMLElement ? sidebar.scrollTop : 0
        };
    }

    #ccwDisarmScrollStabilizers() {
        if (this.#ccwScrollStabilizerRo) {
            this.#ccwScrollStabilizerRo.disconnect();
            this.#ccwScrollStabilizerRo = null;
        }
        if (this.#ccwScrollStabilizerTimer) {
            clearTimeout(this.#ccwScrollStabilizerTimer);
            this.#ccwScrollStabilizerTimer = null;
        }
    }

    /**
     * `.eon-ccw-content` har ofta fast höjd (flex) medan innehållet växer — ResizeObserver på bara den
     * triggas då inte när ProseMirror expanderar. Observera aktiva panelen (+ ev. inre listor).
     */
    #ccwArmScrollStabilizers() {
        this.#ccwDisarmScrollStabilizers();
        const w = this.#ccwScrollWindow;
        const m = this.#ccwScrollMain;
        const s = this.#ccwScrollSidebar;
        if (w === 0 && m === 0 && s === 0) return;
        if (typeof ResizeObserver === "undefined") return;

        const apply = () => {
            const rootNow = this.#ccwScrollScopeRoot();
            if (!rootNow) return;
            const windowHost = rootNow.querySelector(".window-content");
            const main = rootNow.querySelector(".eon-ccw-content");
            const sidebar = rootNow.querySelector(".eon-ccw-sidebar");
            this.#ccwApplyScrollTop(windowHost, w);
            this.#ccwApplyScrollTop(main, m);
            this.#ccwApplyScrollTop(sidebar, s);
        };

        const root = this.#ccwScrollScopeRoot();
        if (!root) return;
        const main = root.querySelector(".eon-ccw-content");
        const panel = main?.querySelector?.(".eon-ccw-panel") ?? null;
        const valfriaList = main?.querySelector?.(".eon-ccw-folk-valfria-checks") ?? null;
        const targets = /** @type {HTMLElement[]} */ ([]);
        for (const el of [main, panel, valfriaList]) {
            if (el instanceof HTMLElement && !targets.includes(el)) targets.push(el);
        }

        const ro = new ResizeObserver(() => {
            apply();
        });
        for (const t of targets) ro.observe(t);
        this.#ccwScrollStabilizerRo = ro;
        this.#ccwScrollStabilizerTimer = setTimeout(() => {
            this.#ccwDisarmScrollStabilizers();
        }, 900);
    }

    #ccwRestoreScrollPositions() {
        const root = this.#ccwScrollScopeRoot();
        if (!root) return;
        const w = this.#ccwScrollWindow;
        const m = this.#ccwScrollMain;
        const s = this.#ccwScrollSidebar;
        const windowHost = root.querySelector(".window-content");
        const main = root.querySelector(".eon-ccw-content");
        const sidebar = root.querySelector(".eon-ccw-sidebar");
        const apply = () => {
            const rootNow = this.#ccwScrollScopeRoot();
            const mainEl = rootNow?.querySelector?.(".eon-ccw-content") ?? main;
            const windowHostEl = rootNow?.querySelector?.(".window-content") ?? windowHost;
            const sidebarEl = rootNow?.querySelector?.(".eon-ccw-sidebar") ?? sidebar;
            this.#ccwApplyScrollTop(windowHostEl, w);
            this.#ccwApplyScrollTop(mainEl, m);
            this.#ccwApplyScrollTop(sidebarEl, s);
        };
        const scheduleProseRetries = () => {
            if (typeof customElements === "undefined") return;
            const def = customElements.whenDefined?.("prose-mirror");
            if (def?.then) {
                def.then(() => {
                    apply();
                    setTimeout(apply, 32);
                }).catch(() => {});
            }
        };
        requestAnimationFrame(() => {
            apply();
            scheduleProseRetries();
            requestAnimationFrame(() => {
                apply();
                setTimeout(apply, 0);
                setTimeout(apply, 64);
            });
        });
        this.#ccwArmScrollStabilizers();
    }

    /** @override */
    render(...args) {
        this.#ccwDisarmScrollStabilizers();
        if (this._ccwSkipScrollCaptureOnce) {
            this._ccwSkipScrollCaptureOnce = false;
            this.#ccwScrollWindow = 0;
            this.#ccwScrollMain = 0;
            this.#ccwScrollSidebar = 0;
        } else {
            this.#ccwCaptureScrollPositions();
        }
        return super.render(...args);
    }

    static DEFAULT_OPTIONS = {
        id: "eon-character-creation-wizard",
        tag: "div",
        classes: ["eon-character-creation-wizard"],
        position: {
            width: 1250,
            height: 900
        },
        window: {
            title: "Eon 5",
            resizable: true,
            minimizable: true
        },
        actions: {
            ccwTab: CharacterCreationWizard.#onTab,
            ccwLater: CharacterCreationWizard.#onLater,
            ccwFinish: CharacterCreationWizard.#onFinish,
            ccwHandelseAddRow: CharacterCreationWizard.#onHandelseAddRow,
            ccwHandelseRemoveRow: CharacterCreationWizard.#onHandelseRemoveRow,
            ccwFardighetAddRow: CharacterCreationWizard.#onFardighetAddRow,
            ccwFardighetCreateMystik: CharacterCreationWizard.#onFardighetCreateMystik,
            ccwFardighetRemoveRow: CharacterCreationWizard.#onFardighetRemoveRow,
            ccwSprakAddRow: CharacterCreationWizard.#onSprakAddRow,
            ccwSprakRemoveRow: CharacterCreationWizard.#onSprakRemoveRow,
            ccwKretsAddRow: CharacterCreationWizard.#onKretsAddRow,
            ccwKretsRemoveRow: CharacterCreationWizard.#onKretsRemoveRow,
            ccwFoljeAddRow: CharacterCreationWizard.#onFoljeAddRow,
            ccwFoljeRemoveRow: CharacterCreationWizard.#onFoljeRemoveRow,
            ccwKaraktarsdragAddRow: CharacterCreationWizard.#onKaraktarsdragAddRow,
            ccwKaraktarsdragRemoveRow: CharacterCreationWizard.#onKaraktarsdragRemoveRow,
            ccwUtrustningEditItem: CharacterCreationWizard.#onUtrustningEditItem,
            ccwUtrustningDeleteItem: CharacterCreationWizard.#onUtrustningDeleteItem,
            ccwUtrustningStepCount: CharacterCreationWizard.#onUtrustningStepCount,
            ccwMystikStepAntal: CharacterCreationWizard.#onMystikStepAntal,
            ccwVapenarmSlumpa: CharacterCreationWizard.#onVapenarmSlumpa,
            ccwHarleddOvStep: CharacterCreationWizard.#onHarleddOvStep
        }
    };

    static PARTS = {
        body: {
            template: "systems/eon-rpg/templates/wizard/character-creation-wizard.hbs"
        }
    };

    static #onTab(event, target) {
        const tab = target?.dataset?.tab;
        if (!tab) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            await this.actor.setFlag(EON_CCW_FLAG_SCOPE, "wizardActiveTab", tab);
            this._ccwSkipScrollCaptureOnce = true;
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} Returneras så ApplicationV2 väntar på stängning. */
    static #onLater(event, target) {
        return this._onLaterContinue();
    }

    async _onLaterContinue() {
        if (this._ccwLaterInProgress) return;
        this._ccwLaterRequested = true;
        this._ccwLaterInProgress = true;
        try {
            await this._saveFormToFlags();
            await this.close({ animate: false });
            ui.notifications?.info?.(game.i18n.localize("eon.wizard.savedDraft"));
        } finally {
            this._ccwLaterInProgress = false;
            this._ccwLaterRequested = false;
        }
    }

    /** @returns {Promise<void>} Måste returneras så ApplicationV2 väntar på async stängning. */
    static #onFinish(event, target) {
        return this._requestFinishFlow();
    }

    /** @returns {Promise<void>} */
    async _requestFinishFlow() {
        if (this._ccwFinishInProgress || this._ccwFinishRequested) return;
        this._ccwFinishRequested = true;
        const confirmed = await this._ccwConfirmWithRaisedDialog({
            title: game.i18n.localize("eon.wizard.finishConfirmTitle"),
            content: `<p>${game.i18n.localize("eon.wizard.finishConfirmContent")}</p>`,
            yes: () => true,
            no: () => false,
            defaultYes: false
        });
        if (!confirmed) {
            this._ccwFinishRequested = false;
            return;
        }
        await this._finish();
    }

    /** @returns {Promise<void>} */
    static #onHandelseAddRow() {
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.handelseResultat) ? [...merged.handelseResultat] : [];
            rows.push(emptyHandelseResultRow());
            await persistWizardData(this.actor, { handelseResultat: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onHandelseRemoveRow(event, target) {
        const idx = parseInt((target?.dataset?.handelseIndex ?? "").toString(), 10);
        if (!Number.isFinite(idx) || idx < 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.handelseResultat) ? [...merged.handelseResultat] : [];
            if (idx >= rows.length) return;
            rows.splice(idx, 1);
            await persistWizardData(this.actor, { handelseResultat: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} */
    static #onFardighetAddRow(event, target) {
        const grupp = (target?.dataset?.ccwFardighetGrupp ?? "").toString().trim();
        if (!grupp || !ENHETER_FARDIGHET_GRUPP_KEYS.includes(grupp)) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const fd = { ...(merged.fardighetFordelning ?? {}) };
            const rows = Array.isArray(fd[grupp]) ? [...fd[grupp]] : [];
            if (WIZARD_OVRIGA_ENHET_KEYS.includes(grupp)) {
                const itemId = await createWizardOvrigFardighetItem(this.actor, grupp);
                if (!itemId) {
                    ui.notifications?.error?.(game.i18n.localize("eon.messages.typSaknarFunktion"));
                    return;
                }
                rows.push({
                    ...emptyFardighetFordelningRow(),
                    itemId,
                    grundvarde: "0",
                    poang: "0",
                    [CCW_WIZARD_CREATED_FARDIGHET_ROW]: true
                });
            } else {
                rows.push(emptyFardighetFordelningRow());
            }
            fd[grupp] = rows;
            await persistWizardData(this.actor, { fardighetFordelning: fd });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /**
     * Skapa inbäddad mystikfärdighet (`system.grupp === "mystik"`, GV 0) med redigerbart namn.
     * @returns {Promise<void>}
     */
    static #onFardighetCreateMystik(event, target) {
        const grupp = (target?.dataset?.ccwFardighetGrupp ?? "").toString().trim();
        if (grupp !== "mystik") return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const fd = { ...(merged.fardighetFordelning ?? {}) };
            const rows = Array.isArray(fd.mystik) ? [...fd.mystik] : [];
            const itemId = await createWizardMystikFardighetItem(this.actor);
            if (!itemId) {
                ui.notifications?.error?.(game.i18n.localize("eon.messages.typSaknarFunktion"));
                return;
            }
            rows.push({
                ...emptyFardighetFordelningRow(),
                itemId,
                grundvarde: "0",
                poang: "0",
                [CCW_WIZARD_CREATED_FARDIGHET_ROW]: true
            });
            fd.mystik = rows;
            await persistWizardData(this.actor, { fardighetFordelning: fd });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onFardighetRemoveRow(event, target) {
        const grupp = (target?.dataset?.ccwFardighetGrupp ?? "").toString().trim();
        const idx = parseInt((target?.dataset?.ccwFardighetIndex ?? "").toString(), 10);
        if (!grupp || !ENHETER_FARDIGHET_GRUPP_KEYS.includes(grupp)) return undefined;
        if (!Number.isFinite(idx) || idx < 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const fd = { ...(merged.fardighetFordelning ?? {}) };
            const rows = Array.isArray(fd[grupp]) ? [...fd[grupp]] : [];
            if (idx >= rows.length) return;
            const removed = rows[idx];
            if (
                (grupp === "mystik" || WIZARD_OVRIGA_ENHET_KEYS.includes(grupp)) &&
                removed?.[CCW_WIZARD_CREATED_FARDIGHET_ROW] === true
            ) {
                const delId = (removed?.itemId ?? "").toString().trim();
                if (delId && this.actor.items?.get?.(delId)) {
                    await this.actor.deleteEmbeddedDocuments("Item", [delId]);
                }
            }
            const poangRaw = parseInt(String(removed?.poang ?? "0").trim(), 10);
            const poangTillbaka = Number.isFinite(poangRaw) ? Math.max(0, poangRaw) : 0;
            rows.splice(idx, 1);
            fd[grupp] = rows;
            const curPool = parseInt(String(merged.enheter?.[grupp] ?? "0").trim(), 10);
            const curSafe = Number.isFinite(curPool) ? Math.max(0, curPool) : 0;
            const enheter = { ...(merged.enheter ?? {}) };
            enheter[grupp] = clampWizardFieldToNonNegativeIntStr(String(curSafe + poangTillbaka));
            await persistWizardData(this.actor, { fardighetFordelning: fd, enheter });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} */
    static #onSprakAddRow() {
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.sprakFordelning) ? [...merged.sprakFordelning] : [];
            rows.push(emptySprakFordelningRow());
            await persistWizardData(this.actor, { sprakFordelning: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onSprakRemoveRow(event, target) {
        const idx = parseInt((target?.dataset?.ccwSprakIndex ?? "").toString(), 10);
        if (!Number.isFinite(idx) || idx < 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.sprakFordelning) ? [...merged.sprakFordelning] : [];
            if (idx >= rows.length) return;
            const removed = rows[idx];
            const delId = (removed?.itemId ?? "").toString().trim();
            const delItem = delId ? this.actor.items?.get?.(delId) : null;
            if (
                delItem?.type === "Språk" &&
                delItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) !== true
            ) {
                await this.actor.deleteEmbeddedDocuments("Item", [delId]);
            }
            rows.splice(idx, 1);
            await persistWizardData(this.actor, { sprakFordelning: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} */
    static #onKretsAddRow() {
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.kretsarRader) ? [...merged.kretsarRader] : [];
            rows.push({ namn: "", anteckning: "" });
            await persistWizardData(this.actor, { kretsarRader: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onKretsRemoveRow(event, target) {
        const idx = parseInt((target?.dataset?.ccwKretsIndex ?? "").toString(), 10);
        if (!Number.isFinite(idx) || idx < 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.kretsarRader) ? [...merged.kretsarRader] : [];
            if (idx >= rows.length) return;
            rows.splice(idx, 1);
            await persistWizardData(this.actor, { kretsarRader: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} */
    static #onFoljeAddRow() {
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.foljeslagareRader) ? [...merged.foljeslagareRader] : [];
            rows.push({ namn: "", anteckning: "" });
            await persistWizardData(this.actor, { foljeslagareRader: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onFoljeRemoveRow(event, target) {
        const idx = parseInt((target?.dataset?.ccwFoljeIndex ?? "").toString(), 10);
        if (!Number.isFinite(idx) || idx < 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.foljeslagareRader) ? [...merged.foljeslagareRader] : [];
            if (idx >= rows.length) return;
            rows.splice(idx, 1);
            await persistWizardData(this.actor, { foljeslagareRader: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>} */
    static #onKaraktarsdragAddRow() {
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.karaktarsdrag) ? [...merged.karaktarsdrag] : [];
            rows.push({ ...emptyKaraktarsdragRow() });
            await persistWizardData(this.actor, { karaktarsdrag: rows });
            this._ccwSkipFocusRestoreOnce = true;
            const newRowIndex = rows.length - 1;
            await this.render(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const rootNow = this._rootEl();
                    const el = rootNow?.querySelector(`[name="ccw_kd_${newRowIndex}_namn"]`);
                    if (el instanceof HTMLElement) el.focus({ preventScroll: true });
                });
            });
        })();
    }

    /** Slumpa vapenarm enligt regelboken: 1T10, 10 = vänster, annars höger. */
    static #onVapenarmSlumpa() {
        return (async () => {
            await this._saveFormToFlags();
            const roll = new Roll("1d10");
            await roll.evaluate();
            const t = Number(roll.total);
            const v = t === 10 ? "vanster" : "hoger";
            await persistWizardData(this.actor, { vapenarm: v });
            const valLabel = game.i18n.localize(`eon.wizard.vapenarmVal_${v}`);
            ui.notifications?.info?.(
                `${game.i18n.localize("eon.wizard.vapenarmSlumpa")}: ${t} → ${valLabel}`
            );
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onKaraktarsdragRemoveRow(event, target) {
        const idx = parseInt((target?.dataset?.ccwKdIndex ?? "").toString(), 10);
        if (!Number.isFinite(idx) || idx < 2) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const merged = getMergedWizardData(this.actor);
            const rows = Array.isArray(merged.karaktarsdrag) ? [...merged.karaktarsdrag] : [];
            if (idx >= rows.length) return;
            rows.splice(idx, 1);
            await persistWizardData(this.actor, { karaktarsdrag: rows });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onUtrustningEditItem(event, target) {
        const itemId = (target?.dataset?.ccwItemId ?? "").toString().trim();
        if (!itemId) return undefined;
        const itemDoc = this.actor?.items?.get?.(itemId);
        if (!itemDoc) return undefined;
        this._ccwPinnedEditItemId = itemId;
        return (async () => {
            const desiredItemZ = this._ccwStableItemSheetZIndex();
            if (itemDoc.sheet?.options) {
                itemDoc.sheet.options.closeOnSubmit = false;
                itemDoc.sheet.options.submitOnChange = true;
                itemDoc.sheet.options.zIndex = desiredItemZ;
            }
            await itemDoc.sheet?.render?.(true);
            this._ccwRaisePinnedEditItemSheet();
            this._ccwStartPinnedSheetGuard();
            // Item-sheet renderas ofta om på change; lyft det igen efter korta fördröjningar.
            for (const delayMs of [40, 140, 320, 700]) {
                setTimeout(() => this._ccwRaisePinnedEditItemSheet(), delayMs);
            }
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onUtrustningDeleteItem(event, target) {
        const itemId = (target?.dataset?.ccwItemId ?? "").toString().trim();
        if (!itemId) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const itemDoc = this.actor?.items?.get?.(itemId);
            if (!itemDoc) return;
            await this.actor.deleteEmbeddedDocuments("Item", [itemId]);
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onUtrustningStepCount(event, target) {
        const itemId = (target?.dataset?.ccwItemId ?? "").toString().trim();
        const delta = parseInt((target?.dataset?.ccwDelta ?? "").toString(), 10);
        if (!itemId || !Number.isFinite(delta) || delta === 0) return undefined;
        return (async () => {
            await this._saveFormToFlags();
            const itemDoc = this.actor?.items?.get?.(itemId);
            if (!itemDoc) return;
            const currentRaw = parseInt(String(itemDoc.system?.antal ?? "0").trim(), 10);
            const current = Number.isFinite(currentRaw) ? currentRaw : 0;
            const next = Math.max(0, current + delta);
            await itemDoc.update({ "system.antal": next });
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    static #onUtrustningDropDragOver(event, target) {
        event?.preventDefault?.();
        if (target instanceof HTMLElement) target.classList.add("is-dragover");
    }

    static #onUtrustningDropDragLeave(event, target) {
        event?.preventDefault?.();
        if (target instanceof HTMLElement) target.classList.remove("is-dragover");
    }

    static #onUtrustningDrop(event, target) {
        return (async () => {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            if (target instanceof HTMLElement) target.classList.remove("is-dragover");
            const raw = event?.dataTransfer?.getData?.("text/plain");
            if (!raw) return;
            /** @type {unknown} */
            let dropData;
            try {
                dropData = JSON.parse(raw);
            } catch {
                return;
            }
            /** @type {Item|null} */
            let droppedItem = null;
            try {
                droppedItem = await Item.implementation.fromDropData(dropData);
            } catch {
                droppedItem = null;
            }
            if (!droppedItem || !CCW_UTRUSTNING_ALLOWED_TYPES.has(droppedItem.type)) {
                ui.notifications?.warn?.("Endast vapen, rustning och utrustning kan läggas till här.");
                return;
            }
            await this._saveFormToFlags();
            const itemData = foundry.utils.duplicate(droppedItem);
            delete itemData._id;
            itemData.system = itemData.system ?? {};
            itemData.system.installningar = itemData.system.installningar ?? {};
            itemData.system.installningar.eon = "eon5";
            await this.actor.createEmbeddedDocuments("Item", [itemData]);
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** @returns {Promise<void>|undefined} */
    static #onMystikStepAntal(event, target) {
        event?.preventDefault?.();
        const root = this._rootEl();
        if (!root) return undefined;
        const input = root.querySelector('[name="ccw_mystik_antal"]');
        if (!(input instanceof HTMLInputElement) || input.type !== "number") return undefined;
        const delta = parseInt(String(target?.dataset?.ccwDelta ?? "0"), 10);
        if (!Number.isFinite(delta) || delta === 0) return undefined;
        const current = parseInt(input.value, 10);
        const base = Number.isFinite(current) ? current : 0;
        input.value = String(Math.max(0, base + delta));
        void this._saveFormToFlags();
        return undefined;
    }

    static #onMystikDropDragOver(event, target) {
        event?.preventDefault?.();
        if (target instanceof HTMLElement) target.classList.add("is-dragover");
    }

    static #onMystikDropDragLeave(event, target) {
        event?.preventDefault?.();
        if (target instanceof HTMLElement) target.classList.remove("is-dragover");
    }

    static #onMystikDrop(event, target) {
        return (async () => {
            event?.preventDefault?.();
            event?.stopPropagation?.();
            if (target instanceof HTMLElement) target.classList.remove("is-dragover");
            const raw = event?.dataTransfer?.getData?.("text/plain");
            if (!raw) return;
            /** @type {unknown} */
            let dropData;
            try {
                dropData = JSON.parse(raw);
            } catch {
                return;
            }
            /** @type {Item|null} */
            let droppedItem = null;
            try {
                droppedItem = await Item.implementation.fromDropData(dropData);
            } catch {
                droppedItem = null;
            }
            if (!droppedItem || !CCW_MYSTIK_ALLOWED_TYPES.has(droppedItem.type)) {
                ui.notifications?.warn?.("Endast mysterier och besvärjelser kan läggas till här.");
                return;
            }
            await this._saveFormToFlags();
            const itemData = foundry.utils.duplicate(droppedItem);
            delete itemData._id;
            itemData.system = itemData.system ?? {};
            itemData.system.installningar = itemData.system.installningar ?? {};
            itemData.system.installningar.eon = "eon5";
            await this.actor.createEmbeddedDocuments("Item", [itemData]);
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        })();
    }

    /** ±-steg: sidopanel (härledd G/B, valfria poäng, färdighetsenheter), flik 8 bonus. */
    static #onHarleddOvStep(event, target) {
        event?.preventDefault?.();
        const inputName = (target?.dataset?.ccwStepTarget ?? "").toString().trim();
        const delta = parseInt(String(target?.dataset?.ccwStepDelta ?? "0"), 10);
        if (!inputName || !Number.isFinite(delta) || delta === 0) return undefined;
        const root = this._rootEl();
        if (!root) return undefined;
        const esc =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(inputName)
                : inputName.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const input = root.querySelector(`[name="${esc}"]`);
        if (!(input instanceof HTMLInputElement) || input.type !== "number") return undefined;
        const cur = parseInt(input.value, 10);
        const base = Number.isFinite(cur) ? cur : 0;
        let next = base + delta;
        if (
            /^ccw_(?:ov|tf)_e_/.test(input.name) ||
            /^ccw_ht_/.test(input.name) ||
            /^ccw_pkt_/.test(input.name) ||
            /^ccw_avt_/.test(input.name) ||
            /^ccw_tf_.+_rf_\d+_(?:poang|grundvarde)$/.test(input.name) ||
            input.name === "ccw_mystik_antal"
        ) {
            next = Math.max(0, next);
        }
        input.value = String(next);
        syncPairedWizardField(root, input.name, input.value);
        if (/^ccw_(?:ov|tf)_e_/.test(input.name)) {
            mirrorWizardFardighetPoolDisplay(root, input.name, input.value);
        }
        const m = input.name.match(/^ccw_(?:ov_attr|t8_attr)_([^_]+)_[gb]$/);
        if (m?.[1]) CharacterCreationWizard.updateHarleddTotaltDisplayForKey(root, m[1]);
        const fm = input.name.match(/^ccw_tf_(.+)_rf_(\d+)_(?:poang|grundvarde)$/);
        if (fm) {
            CharacterCreationWizard.syncFardighetRowDomControls(root, fm[1], parseInt(fm[2], 10));
        }
        void this._saveFormToFlags();
        input.focus({ preventScroll: true });
        return undefined;
    }

    /**
     * Uppdaterar visning av beräknad Totalt (T6 / visdomsumma) när G eller B ändras.
     * @param {HTMLElement} root
     * @param {string} key
     */
    static updateHarleddTotaltDisplayForKey(root, key) {
        if (!root || !key) return;
        let gEl = root.querySelector(`[name="ccw_t8_attr_${key}_g"]`);
        let bEl = root.querySelector(`[name="ccw_t8_attr_${key}_b"]`);
        if (!(gEl instanceof HTMLInputElement)) gEl = root.querySelector(`[name="ccw_ov_attr_${key}_g"]`);
        if (!(bEl instanceof HTMLInputElement)) bEl = root.querySelector(`[name="ccw_ov_attr_${key}_b"]`);
        const out = root.querySelector(`[data-ccw-harledd-totalt="${key}"]`);
        if (!(out instanceof HTMLElement)) return;
        const g = gEl instanceof HTMLInputElement ? gEl.value : "0";
        const b = bEl instanceof HTMLInputElement ? bEl.value : "0";
        out.textContent = wizardHarleddTotaltDisplayText(key, g, b);
    }

    /**
     * @param {HTMLElement|null} root
     * @param {string} poangFieldName t.ex. ccw_tf_strid_rf_0_poang
     */
    static #ccwInkompetentForFardighetPoangName(root, poangFieldName) {
        const m = (poangFieldName ?? "").toString().match(/^ccw_tf_(.+)_rf_(\d+)_poang$/);
        if (!m || !root) return false;
        const ink = root.querySelector(`[name="ccw_tf_${m[1]}_rf_${m[2]}_inkompetent"]`);
        return ink instanceof HTMLInputElement && ink.checked;
    }

    /**
     * Inkompetens: grundvärde+enheter högst 1 (färdighetsvärde). Blockering: inga enheter (fält inaktiverat, värde 0).
     * @param {HTMLElement|null} root
     * @param {string} gKey
     * @param {number} idx
     */
    static syncFardighetRowDomControls(root, gKey, idx) {
        if (!root || !Number.isFinite(idx)) return;
        if (WIZARD_OVRIGA_ENHET_KEYS.includes(gKey)) {
            const gvEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_grundvarde"]`);
            if (gvEl instanceof HTMLInputElement) gvEl.value = "0";
            const poangEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_poang"]`);
            if (poangEl instanceof HTMLInputElement) {
                poangEl.disabled = false;
                poangEl.max = "8";
                const pc = clampWizardFardighetPoangValue(poangEl.value, false);
                if (poangEl.value !== "" && String(pc) !== poangEl.value) poangEl.value = String(pc);
            }
            CharacterCreationWizard.updateFardighetSlutligT6Display(root, gKey, idx);
            return;
        }
        const inkEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_inkompetent"]`);
        const blockEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_blockering"]`);
        const gvEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_grundvarde"]`);
        const poangEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_poang"]`);
        const ink = inkEl instanceof HTMLInputElement && inkEl.type === "checkbox" && inkEl.checked;
        const block = blockEl instanceof HTMLInputElement && blockEl.type === "checkbox" && blockEl.checked;
        if (gvEl instanceof HTMLInputElement) {
            gvEl.max = String(ink ? 1 : 8);
            const gvc = clampWizardFardighetGrundvardeForInkompetentValue(gvEl.value, ink);
            if (gvEl.value !== "" && String(gvc) !== gvEl.value) gvEl.value = String(gvc);
        }
        const gvNum = gvEl instanceof HTMLInputElement ? clampWizardFardighetGrundvardeForInkompetentValue(gvEl.value, ink) : 0;
        if (poangEl instanceof HTMLInputElement) {
            poangEl.disabled = block;
            const cap = getWizardFardighetPoangCapForRow(ink, block, gvNum);
            poangEl.max = String(cap);
            if (block) {
                poangEl.value = "0";
            } else {
                const pc = clampWizardFardighetPoangValueForRow(poangEl.value, ink, block, gvNum);
                if (poangEl.value !== "" && String(pc) !== poangEl.value) poangEl.value = String(pc);
            }
        }
        CharacterCreationWizard.updateFardighetSlutligT6Display(root, gKey, idx);
    }

    /**
     * Uppdaterar visningen av slutlig T6 (GV+enheter) för en färdighetsrad.
     * @param {HTMLElement|null} root
     * @param {string} gKey
     * @param {number} idx
     */
    static updateFardighetSlutligT6Display(root, gKey, idx) {
        if (!root || !gKey || !Number.isFinite(idx)) return;
        const esc =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(gKey)
                : gKey.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const cell = root.querySelector(`[data-ccw-fardighet-slutlig-t6][data-ccw-tf-g="${esc}"][data-ccw-tf-i="${idx}"]`);
        if (!(cell instanceof HTMLElement)) return;
        const gvEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_grundvarde"]`);
        const pEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_poang"]`);
        const inkEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_inkompetent"]`);
        const blockEl = root.querySelector(`[name="ccw_tf_${gKey}_rf_${idx}_blockering"]`);
        const gv = gvEl instanceof HTMLInputElement ? gvEl.value : "0";
        const pv = pEl instanceof HTMLInputElement ? pEl.value : "0";
        const ovrig = WIZARD_OVRIGA_ENHET_KEYS.includes(gKey);
        const isSprak = gKey === "sprak";
        cell.textContent = formatWizardFardighetRowSlutligT6(gv, pv, {
            ovrigWizardTyp: ovrig,
            sprak: isSprak,
            inkompetent: ovrig || isSprak ? false : inkEl instanceof HTMLInputElement && inkEl.checked,
            blockering: ovrig || isSprak ? false : blockEl instanceof HTMLInputElement && blockEl.checked
        });
    }

    /** @param {HTMLElement|null} root */
    static syncAllFardighetSkillRows(root) {
        if (!root) return;
        for (const gKey of ENHETER_FARDIGHET_GRUPP_KEYS) {
            let i = 0;
            while (root.querySelector(`[name="ccw_tf_${gKey}_rf_${i}_item"]`)) {
                CharacterCreationWizard.syncFardighetRowDomControls(root, gKey, i);
                i += 1;
            }
        }
    }

    /** @returns {HTMLElement|null} */
    _rootEl() {
        const rootElement = this.element;
        if (!rootElement) return null;
        return rootElement instanceof HTMLElement ? rootElement : rootElement[0] ?? null;
    }

    /** @returns {number} */
    _ccwStableWizardZIndex() {
        const base = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--z-index-window") || "0", 10) || 100;
        return base + 50;
    }

    /** @returns {number} */
    _ccwStableItemSheetZIndex() {
        return this._ccwStableWizardZIndex() + 200;
    }

    /** @returns {HTMLElement|null} */
    _ccwWindowHostEl() {
        const byAppId = this.appId
            ? document.querySelector(`.application[data-appid="${this.appId}"], .window-app[data-appid="${this.appId}"]`)
            : null;
        if (byAppId instanceof HTMLElement) return byAppId;
        const root = this._rootEl();
        return root?.closest?.(".application, .window-app") ?? null;
    }

    _ccwSnapshotWindowPlacementFromHost() {
        const host = this._ccwWindowHostEl();
        if (!(host instanceof HTMLElement)) return;
        const rect = host.getBoundingClientRect();
        if (!Number.isFinite(rect.left) || !Number.isFinite(rect.top) || rect.width <= 0 || rect.height <= 0) return;
        this._ccwWindowPlacement = {
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height
        };
    }

    _ccwApplyWindowPlacementFromCache() {
        const placement = this._ccwWindowPlacement;
        if (!placement) return;
        const left = Number(placement.left);
        const top = Number(placement.top);
        const width = Number(placement.width);
        const height = Number(placement.height);
        if (![left, top, width, height].every((n) => Number.isFinite(n))) return;
        try {
            this.setPosition?.({
                left: Math.round(left),
                top: Math.round(top),
                width: Math.round(width),
                height: Math.round(height)
            });
        } catch {
            // no-op
        }
    }

    async _ccwPersistWindowPlacementFlag() {
        const p = this._ccwWindowPlacement;
        if (!p) return;
        const left = Number(p.left);
        const top = Number(p.top);
        const width = Number(p.width);
        const height = Number(p.height);
        if (![left, top, width, height].every((n) => Number.isFinite(n))) return;
        try {
            await this.actor.setFlag(EON_CCW_FLAG_SCOPE, "wizardWindowPlacement", { left, top, width, height });
        } catch {
            // no-op
        }
    }

    _ccwLoadWindowPlacementFromFlag() {
        const raw = this.actor?.getFlag?.(EON_CCW_FLAG_SCOPE, "wizardWindowPlacement");
        if (!raw || typeof raw !== "object") return false;
        const left = Number(raw.left);
        const top = Number(raw.top);
        const width = Number(raw.width);
        const height = Number(raw.height);
        if (![left, top, width, height].every((n) => Number.isFinite(n))) return false;
        this._ccwWindowPlacement = { left, top, width, height };
        return true;
    }

    /**
     * Utan sparad `wizardWindowPlacement`: första snapshot från DOM kan vara mindre än `DEFAULT_OPTIONS.position`
     * innan Foundry hunnit sätta bredd/höjd — matcha minst default, begränsat av viewport.
     * (Med sparad flagga behålls användarens valda storlek.)
     */
    _ccwBumpPlacementToDefaultMinIfFreshSnapshot() {
        const p = this._ccwWindowPlacement;
        if (!p) return;
        const def = CharacterCreationWizard.DEFAULT_OPTIONS.position;
        const defW = Number(def?.width);
        const defH = Number(def?.height);
        if (!Number.isFinite(defW) || !Number.isFinite(defH)) return;
        const margin = 40;
        const vw = typeof window !== "undefined" ? window.innerWidth : defW + margin;
        const vh = typeof window !== "undefined" ? window.innerHeight : defH + margin;
        const maxW = Math.max(320, vw - margin);
        const maxH = Math.max(240, vh - margin);
        const targetW = Math.min(defW, maxW);
        const targetH = Math.min(defH, maxH);
        let w = Number(p.width);
        let h = Number(p.height);
        if (!Number.isFinite(w)) w = targetW;
        if (!Number.isFinite(h)) h = targetH;
        if (w < targetW) w = targetW;
        if (h < targetH) h = targetH;
        p.width = w;
        p.height = h;
    }

    _ccwArmWindowPlacementObserver() {
        if (this._ccwWindowPlacementObserver) return;
        const host = this._ccwWindowHostEl();
        if (!(host instanceof HTMLElement) || typeof MutationObserver === "undefined") return;
        const observer = new MutationObserver(() => {
            this._ccwSnapshotWindowPlacementFromHost();
        });
        observer.observe(host, { attributes: true, attributeFilter: ["style"] });
        this._ccwWindowPlacementObserver = observer;
    }

    _ccwDisarmWindowPlacementObserver() {
        if (!this._ccwWindowPlacementObserver) return;
        this._ccwWindowPlacementObserver.disconnect();
        this._ccwWindowPlacementObserver = null;
    }

    _ccwArmWindowDragTracking() {
        const host = this._ccwWindowHostEl();
        if (!(host instanceof HTMLElement)) return;
        const header = host.querySelector(".window-header");
        if (!(header instanceof HTMLElement)) return;
        if (this._ccwWindowHeaderPointerDownHandler) {
            header.removeEventListener("pointerdown", this._ccwWindowHeaderPointerDownHandler, true);
        }
        this._ccwWindowHeaderPointerDownHandler = () => {
            this._ccwWindowDragActive = true;
        };
        header.addEventListener("pointerdown", this._ccwWindowHeaderPointerDownHandler, true);

        if (this._ccwWindowPointerUpHandler) {
            window.removeEventListener("pointerup", this._ccwWindowPointerUpHandler, true);
        }
        this._ccwWindowPointerUpHandler = () => {
            if (!this._ccwWindowDragActive) return;
            this._ccwWindowDragActive = false;
            this._ccwWindowPlacementUserLocked = true;
            this._ccwSnapshotWindowPlacementFromHost();
            void this._ccwPersistWindowPlacementFlag();
        };
        window.addEventListener("pointerup", this._ccwWindowPointerUpHandler, true);
    }

    _ccwDisarmWindowDragTracking() {
        const host = this._ccwWindowHostEl();
        const header = host?.querySelector?.(".window-header");
        if (header instanceof HTMLElement && this._ccwWindowHeaderPointerDownHandler) {
            header.removeEventListener("pointerdown", this._ccwWindowHeaderPointerDownHandler, true);
        }
        if (this._ccwWindowPointerUpHandler) {
            window.removeEventListener("pointerup", this._ccwWindowPointerUpHandler, true);
        }
        this._ccwWindowHeaderPointerDownHandler = null;
        this._ccwWindowPointerUpHandler = null;
        this._ccwWindowDragActive = false;
    }

    _ccwRememberWindowPosition(position) {
        const left = Number(position?.left);
        const top = Number(position?.top);
        const width = Number(position?.width);
        const height = Number(position?.height);
        if (![left, top, width, height].every((n) => Number.isFinite(n))) return;
        this._ccwWindowPlacement = { left, top, width, height };
    }

    /** @override */
    _onPosition(position) {
        if (typeof super._onPosition === "function") super._onPosition(position);
        if (this._ccwWindowDragActive) {
            this._ccwWindowPlacementUserLocked = true;
            this._ccwRememberWindowPosition(position);
        }
    }

    /** @param {ApplicationV2|DocumentSheetV2|null|undefined} app */
    _ccwHostForApp(app) {
        const appId = app?.appId;
        if (!appId) return null;
        const host = document.querySelector(`.application[data-appid="${appId}"], .window-app[data-appid="${appId}"]`);
        return host instanceof HTMLElement ? host : null;
    }

    /** @param {unknown} sheet */
    _ccwSheetHostEls(sheet) {
        const hosts = [];
        const hostByAppId = this._ccwHostForApp(sheet);
        if (hostByAppId) hosts.push(hostByAppId);
        const rootRaw = sheet?.element;
        const rootEl = rootRaw instanceof HTMLElement ? rootRaw : rootRaw?.[0] ?? null;
        if (rootEl instanceof HTMLElement) {
            hosts.push(rootEl);
            const closestHost = rootEl.closest?.(".application, .window-app");
            if (closestHost instanceof HTMLElement) hosts.push(closestHost);
            if (rootEl.parentElement instanceof HTMLElement) hosts.push(rootEl.parentElement);
        }
        return [...new Set(hosts)];
    }

    /** @param {HTMLElement} root */
    _ensureWizardZIndex(root) {
        const win = this._ccwWindowHostEl() ?? root.closest(".application");
        if (win instanceof HTMLElement) {
            // Håll wizardn på en stabil nivå; undvik "z-index creep" vid återrender.
            const stableZ = this._ccwStableWizardZIndex();
            win.style.zIndex = String(stableZ);
        }
    }

    /** @override */
    bringToFront(options = {}) {
        const result = super.bringToFront(options);
        const win = this._ccwWindowHostEl();
        if (win instanceof HTMLElement) {
            const stableZ = this._ccwStableWizardZIndex();
            win.style.zIndex = String(stableZ);
        }
        return result;
    }

    /** Håller senast editerat item-sheet ovanför wizardn även efter wizard-render. */
    _ccwRaisePinnedEditItemSheet() {
        const itemId = (this._ccwPinnedEditItemId ?? "").toString().trim();
        if (!itemId) return;
        const itemDoc = this.actor?.items?.get?.(itemId);
        const sheet = itemDoc?.sheet;
        if (!sheet) return;
        const nextZ = this._ccwStableItemSheetZIndex();
        if (sheet.options) sheet.options.zIndex = nextZ;
        for (const host of this._ccwSheetHostEls(sheet)) {
            host.style.zIndex = String(nextZ);
        }
    }

    /** Håller öppna dialoger ovanför wizardn (t.ex. Slutför-bekräftelse). */
    _ccwRaiseOpenDialogsAboveWizard() {
        const nextZ = this._ccwStableItemSheetZIndex() + 20;
        for (const openWindow of Object.values(ui.windows ?? {})) {
            if (!openWindow || openWindow.appId === this.appId) continue;
            const ctorName = (openWindow.constructor?.name ?? "").toString().toLowerCase();
            const optionClasses = Array.isArray(openWindow.options?.classes)
                ? openWindow.options.classes.map((v) => String(v).toLowerCase())
                : [];
            const isDialogLike = ctorName.includes("dialog") || optionClasses.some((cls) => cls.includes("dialog"));
            if (!isDialogLike) continue;
            const host = this._ccwHostForApp(openWindow);
            if (!(host instanceof HTMLElement)) continue;
            host.style.zIndex = String(nextZ);
            if (openWindow.options) openWindow.options.zIndex = nextZ;
        }
    }

    /** Startar central popup-vakt för allt wizardn öppnar. */
    _ccwStartPopupGuard() {
        if (this._ccwPopupGuardTimer) return;
        this._ccwPopupGuardTimer = setInterval(() => {
            this._ccwRaisePinnedEditItemSheet();
            this._ccwRaiseOpenDialogsAboveWizard();
        }, 120);
    }

    /** Stoppar central popup-vakt. */
    _ccwStopPopupGuard() {
        if (!this._ccwPopupGuardTimer) return;
        clearInterval(this._ccwPopupGuardTimer);
        this._ccwPopupGuardTimer = null;
    }

    /**
     * Öppna Foundry-dialog och håll den ovanför wizardn under hela dess livstid.
     * @param {Parameters<typeof Dialog.confirm>[0]} confirmOptions
     * @returns {Promise<boolean>}
     */
    async _ccwConfirmWithRaisedDialog(confirmOptions) {
        this._ccwStartPopupGuard();
        this._ccwRaiseOpenDialogsAboveWizard();
        for (const delayMs of [30, 90, 180, 350]) {
            setTimeout(() => this._ccwRaiseOpenDialogsAboveWizard(), delayMs);
        }
        try {
            return await Dialog.confirm(confirmOptions);
        } finally {
            this._ccwRaiseOpenDialogsAboveWizard();
        }
    }

    /** Startar en kort intervallvakt som åter-lyfter item-sheet vid rerenders. */
    _ccwStartPinnedSheetGuard() {
        if (this._ccwPinnedRaiseTimer) return;
        this._ccwPinnedRaiseTimer = setInterval(() => {
            const itemId = (this._ccwPinnedEditItemId ?? "").toString().trim();
            const itemDoc = itemId ? this.actor?.items?.get?.(itemId) : null;
            if (!itemDoc?.sheet) {
                if (this._ccwPinnedRaiseTimer) clearInterval(this._ccwPinnedRaiseTimer);
                this._ccwPinnedRaiseTimer = null;
                return;
            }
            if (!itemDoc.sheet.rendered) return;
            this._ccwRaisePinnedEditItemSheet();
        }, 120);
    }

    /**
     * Läs formulärfält från DOM och spara till flags.
     */
    async _saveFormToFlags() {
        const root = this._rootEl();
        if (!root) return false;

        const inner = root.querySelector(".eon-ccw-wrapper") ?? root;
        const trimmedActorName = inner.querySelector(`[name="ccw_actor_name"]`)?.value?.trim?.() ?? "";
        const actorNameTrimmed = (this.actor.name ?? "").toString().trim();
        if (trimmedActorName && trimmedActorName !== actorNameTrimmed) {
            await this.actor.update({ name: trimmedActorName });
        }

        if (this.actor?.type === "Rollperson5") {
            await ensureRollperson5StartingItems(this.actor);
        }

        const draft = collectWizardDraftFromRoot(inner, this.actor);
        await syncWizardSprakItemsFromForm(inner, this.actor, draft);
        await syncWizardOvrigFardighetItemNamesFromForm(inner, this.actor, draft);
        await persistWizardData(this.actor, draft);
        return true;
    }

    /**
     * Lägg till/ta bort doktrinrad (fri beskrivning) under religion i hjälpformuläret.
     * @param {Event} event
     */
    async _onDoktrinClick(event) {
        const target = event.target;
        const btn = target instanceof Element ? target.closest(".eon-ccw-doktrin-add, .eon-ccw-doktrin-del") : null;
        if (!btn) return;
        event.preventDefault();
        const root = this._rootEl();
        const inner = root?.querySelector(".eon-ccw-wrapper") ?? root;
        if (!inner) return;
        await this._saveFormToFlags();
        const draft = getMergedWizardData(this.actor);
        let rows = Array.isArray(draft.doktrinRader) ? draft.doktrinRader.map((r) => ({ beskrivning: (r?.beskrivning ?? "").toString() })) : [];
        if (btn.classList.contains("eon-ccw-doktrin-add")) {
            rows.push({ beskrivning: "" });
        } else if (btn.classList.contains("eon-ccw-doktrin-del")) {
            const idx = Number(btn.dataset.index);
            if (Number.isFinite(idx) && idx >= 0 && idx < rows.length) rows.splice(idx, 1);
        }
        await persistWizardData(this.actor, { doktrinRader: rows });
        this._ccwSkipFocusRestoreOnce = true;
        await this.render(true);
    }

    async _finish() {
        if (this._ccwFinishInProgress) return;
        this._ccwFinishRequested = true;
        this._ccwFinishInProgress = true;
        try {
            await this.actor.setFlag(EON_CCW_FLAG_SCOPE, "wizardFinishing", true);
            let saved = false;
            for (const delayMs of [0, 40, 120, 260]) {
                if (delayMs > 0) {
                    await new Promise((resolve) => setTimeout(resolve, delayMs));
                }
                // Vid blur/change kan wizarden vara i tillfällig omrender; försök igen tills root finns.
                saved = await this._saveFormToFlags();
                if (saved) break;
            }
            const wizardDraft = getMergedWizardData(this.actor);
            const check = validateFas1Finish(this.actor, wizardDraft);
            if (!check.ok) {
                ui.notifications?.warn?.(check.message);
                return;
            }
            const folkCheck = await validateFolkslagWizardForFinish(wizardDraft);
            if (!folkCheck.ok) {
                ui.notifications?.warn?.(folkCheck.message ?? "");
                return;
            }
            try {
                await applyCharacterCreationFinish(this.actor, wizardDraft);
                await this.close({ animate: false });
                // Vid hot-reload kan flera wizard-instanser ligga öppna; stäng alla för samma actor.
                const ownAppId = this.appId;
                const wizardId = CharacterCreationWizard.DEFAULT_OPTIONS?.id ?? "eon-character-creation-wizard";
                const siblings = Object.values(ui.windows ?? {}).filter((openWindow) => {
                    if (!openWindow || openWindow.appId === ownAppId) return false;
                    const sameActor = openWindow.actor?.id === this.actor?.id;
                    const sameWizardId = (openWindow.options?.id ?? "") === wizardId;
                    return sameActor && sameWizardId;
                });
                for (const siblingWindow of siblings) {
                    try {
                        await siblingWindow.close?.({ animate: false });
                    } catch {
                        // no-op
                    }
                }
                ui.notifications?.info?.(game.i18n.localize("eon.wizard.finishSuccess"));
                this.actor.sheet?.render?.(false);
            } catch (finishError) {
                console.error(finishError);
                ui.notifications?.error?.(game.i18n.localize("eon.wizard.finishError"));
            }
        } finally {
            try {
                await this.actor.unsetFlag(EON_CCW_FLAG_SCOPE, "wizardFinishing");
            } catch {
                // no-op
            }
            this._ccwFinishInProgress = false;
            this._ccwFinishRequested = false;
        }
    }

    /**
     * @param {object} wizardDraft
     */
    _buildRowContext(wizardDraft) {
        const harleddaRowsOv = HARLEDDA_KEYS.map((key) => ({
            key,
            label: game.i18n.localize(`eon.config.harleddegenskaper.${key}.namn`),
            grund: wizardDraft.harledd[key]?.grund ?? "",
            bonus: wizardDraft.harledd[key]?.bonus ?? ""
        }));
        const harleddaRowsT8 = HARLEDDA_KEYS.map((key) => ({
            key,
            label: game.i18n.localize(`eon.config.harleddegenskaper.${key}.namn`),
            grund: wizardDraft.harledd[key]?.grund ?? "",
            bonus: wizardDraft.harledd[key]?.bonus ?? "",
            totaltDisplay: wizardHarleddTotaltDisplayText(
                key,
                wizardDraft.harledd[key]?.grund ?? "",
                wizardDraft.harledd[key]?.bonus ?? ""
            )
        }));
        const enhetRowsOv = ENHETER_KEYS.map((key) => ({
            key,
            label: game.i18n.localize(ENHET_LABEL_KEYS[key] ?? key),
            value: wizardDraft.enheter[key] ?? ""
        }));
        const handelseOvRows = HANDELSE_SIDEBAR_SLAG_KEYS.map((key) => ({
            key,
            label: game.i18n.localize(HANDELSE_LABEL_KEYS[key] ?? key),
            value: wizardDraft.handelseSlag[key] ?? ""
        }));
        const paketRows = UTRUSTNING_PKT_KEYS.map((key) => ({
            key,
            label: game.i18n.localize(PAKET_LABEL_KEYS[key] ?? key),
            value: wizardDraft.utrustningPaket?.[key] ?? "0"
        }));

        return {
            harleddaRowsOv,
            harleddaRowsT8,
            enhetRowsOv,
            handelseOvRows,
            paketRows
        };
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        return buildCharacterCreationWizardContext(this, context, options);
    }

    /**
     * Uppdaterar embedded Egenskap.system.beskrivning när prose-mirror sparar (change/close, capture).
     * @param {Event} proseMirrorEvent
     */
    async _onProseMirrorPersistItem(proseMirrorEvent) {
        if (this.#ccwProseMirrorPersistBusy) return;

        const proseMirrorElement = proseMirrorEvent.target;
        if (!(proseMirrorElement instanceof HTMLElement)) return;
        if (proseMirrorElement.tagName.toLowerCase() !== "prose-mirror") return;

        const fieldName = (proseMirrorElement.getAttribute("name") ?? "").toString();
        if (!fieldName.startsWith("ccw_folk_edit_")) return;

        const itemId = fieldName.replace("ccw_folk_edit_", "").trim();
        if (!itemId) return;

        const itemDoc = this.actor.items.get(itemId);
        if (!itemDoc || itemDoc.type !== "Egenskap") return;
        if (itemDoc.getFlag(EON_CCW_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) !== true) return;

        const nyttInnehall = String(proseMirrorElement.value ?? "").trim();
        const befintlig = String(itemDoc.system?.beskrivning ?? "").trim();
        if (nyttInnehall === befintlig) return;

        this.#ccwProseMirrorPersistBusy = true;
        try {
            await itemDoc.update({ "system.beskrivning": nyttInnehall });
        } finally {
            this.#ccwProseMirrorPersistBusy = false;
        }
    }

    /**
     * Byte av primärt folkslag: nollställ härledt, attribut från Folkslag5, dialog om kultur.
     * @param {HTMLSelectElement} selectEl
     */
    async _handleFolkslagChange(selectEl) {
        const newId = (selectEl.value ?? "").toString().trim();
        const merged = getMergedWizardData(this.actor);
        const prevId = (merged.folkslag ?? "").toString().trim();
        if (newId === prevId) return;

        this.#ccwSnapshotScrollForPendingRender();
        const reset = getFolkslagPrimaryChangeResetPatch();
        let next = foundry.utils.mergeObject(merged, { folkslag: newId, ...reset }, { inplace: false, recursive: true });
        const primarFolkslagDoc = await loadFolkslag5Doc(newId);
        if (primarFolkslagDoc) {
            applyPrimaryFolkslagAttributToMergedDraft(primarFolkslagDoc, next);
            const valfriaAttrPoang = primarFolkslagDoc.system?.attribut?.valfria;
            next.extraAttributPoang =
                valfriaAttrPoang !== undefined && valfriaAttrPoang !== null ? String(valfriaAttrPoang) : "0";
        } else {
            next.extraAttributPoang = "0";
        }

        const wantKultur = await this._ccwConfirmWithRaisedDialog({
            title: game.i18n.localize("eon.wizard.folkKulturDialogTitle"),
            content: `<p>${game.i18n.localize("eon.wizard.folkKulturDialogContent")}</p>`,
            defaultYes: false
        });

        if (wantKultur) {
            next.harKulturfolkslag = true;
            next.kulturfolkslag = "";
            next.kulturfolkslagSelectEnabled = true;
            next.folkslagKulturDialogBesvarad = true;
        } else {
            next.harKulturfolkslag = false;
            next.kulturfolkslag = "";
            next.kulturfolkslagSelectEnabled = false;
            next.folkslagKulturDialogBesvarad = true;
        }
        next.folkValfriaValda = [];
        const kulturFolkslagDoc =
            next.harKulturfolkslag && next.kulturfolkslag ? await loadFolkslag5Doc(next.kulturfolkslag) : null;
        const harKulturfolkslagEffektivt = !!(next.harKulturfolkslag && kulturFolkslagDoc);
        const { valfriaPoolRefs } = partitionFolkslagEgenskaper(
            primarFolkslagDoc,
            kulturFolkslagDoc,
            harKulturfolkslagEffektivt
        );
        next.folkValfriaPoolUuids = valfriaPoolRefs
            .map((poolRef) => (poolRef.uuid ?? "").toString())
            .filter(Boolean);

        await persistWizardData(this.actor, next);
        await ItemHelper.syncCcwFolkslagItemsFromDraft(this.actor, getMergedWizardData(this.actor));
        this._ccwSkipFocusRestoreOnce = true;
        await this.render(true);
    }

    /**
     * @param {HTMLSelectElement} selectEl
     */
    async _handleKulturfolkslagChange(selectEl) {
        this.#ccwSnapshotScrollForPendingRender();
        const merged = getMergedWizardData(this.actor);
        const kulturFolkslagId = (selectEl.value ?? "").toString().trim();
        let next = foundry.utils.mergeObject(
            merged,
            {
                kulturfolkslag: kulturFolkslagId,
                folkValfriaValda: []
            },
            { inplace: false, recursive: true }
        );
        const primarFolkslagDoc = await loadFolkslag5Doc(next.folkslag);
        const kulturFolkslagDoc = kulturFolkslagId ? await loadFolkslag5Doc(kulturFolkslagId) : null;
        const harKulturfolkslagEffektivt = !!(next.harKulturfolkslag && kulturFolkslagDoc);
        const { valfriaPoolRefs } = partitionFolkslagEgenskaper(
            primarFolkslagDoc,
            kulturFolkslagDoc,
            harKulturfolkslagEffektivt
        );
        next.folkValfriaPoolUuids = valfriaPoolRefs
            .map((poolRef) => (poolRef.uuid ?? "").toString())
            .filter(Boolean);
        await persistWizardData(this.actor, next);
        await ItemHelper.syncCcwFolkslagItemsFromDraft(this.actor, getMergedWizardData(this.actor));
        this._ccwSkipFocusRestoreOnce = true;
        await this.render(true);
    }

    async _handleValfriaEgenskapCheckboxesChanged() {
        this.#ccwSuppressValfriCheckbox = true;
        this.#ccwProseMirrorPersistBusy = true;
        try {
            await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
            this.#ccwSnapshotScrollForPendingRender();
            const root = this._rootEl();
            if (root) {
                const poolField = root.querySelector('[name="ccw_folk_valfri_pool"]');
                const poolCsv = poolField instanceof HTMLInputElement ? poolField.value.toString() : "";
                const poolSize = poolCsv ? poolCsv.split(",").map((s) => s.trim()).filter(Boolean).length : 0;
                if (poolSize > 2) {
                    let checkedNodes = [...root.querySelectorAll('input[name="ccw_valfri"]:checked')];
                    while (checkedNodes.length > 2) {
                        const first = checkedNodes.shift();
                        if (first instanceof HTMLInputElement) first.checked = false;
                        checkedNodes = [...root.querySelectorAll('input[name="ccw_valfri"]:checked')];
                    }
                }
            }
            await this._saveFormToFlags();
            await ItemHelper.syncCcwFolkslagItemsFromDraft(this.actor, getMergedWizardData(this.actor));
            this._ccwSkipFocusRestoreOnce = true;
            await this.render(true);
        } 
        finally {
            this.#ccwSuppressValfriCheckbox = false;
            this.#ccwProseMirrorPersistBusy = false;
        }
    }

    /**
     * @param {FocusEvent} event
     */
    #ccwOnFocusIn(event) {
        const t = event.target;
        if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement || t instanceof HTMLSelectElement)) return;
        const n = (t.name ?? "").toString();
        if (!n.startsWith("ccw_")) return;
        this.#ccwLastFocusedCcwFieldName = n;
        if (t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement) {
            this.#ccwLastFocusedSelStart = t.selectionStart ?? 0;
            this.#ccwLastFocusedSelEnd = t.selectionEnd ?? 0;
        } else {
            this.#ccwLastFocusedSelStart = 0;
            this.#ccwLastFocusedSelEnd = 0;
        }
    }

    /**
     * @param {HTMLElement} el
     * @param {HTMLElement} root
     */
    #ccwCcwFieldLikelyVisible(el, root) {
        if (!(el instanceof HTMLElement)) return false;
        if (typeof el.checkVisibility === "function") {
            try {
                return el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true });
            } catch {
                // no-op
            }
        }
        for (let n = el; n && n !== root; n = n.parentElement) {
            const st = getComputedStyle(n);
            if (st.display === "none" || st.visibility === "hidden") return false;
        }
        return true;
    }

    /** @param {HTMLElement|null} root */
    #ccwTryRestoreFocusAfterRender(root) {
        if (this._ccwSkipFocusRestoreOnce) {
            this._ccwSkipFocusRestoreOnce = false;
            return;
        }
        const name = this.#ccwLastFocusedCcwFieldName;
        if (!name || !root) return;
        const esc =
            typeof CSS !== "undefined" && typeof CSS.escape === "function"
                ? CSS.escape(name)
                : name.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
        const el = root.querySelector(`[name="${esc}"]`);
        if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) return;
        if (!this.#ccwCcwFieldLikelyVisible(el, root)) return;
        el.focus({ preventScroll: true });
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
            const maxLen = (el.value ?? "").length;
            const start = Math.min(this.#ccwLastFocusedSelStart, maxLen);
            const end = Math.min(this.#ccwLastFocusedSelEnd, maxLen);
            try {
                el.setSelectionRange(start, end);
            } catch {
                // no-op
            }
        }
    }

    /** @param {HTMLElement|null} root */
    #ccwScheduleFocusRestore(root) {
        if (!root) return;
        const run = () => this.#ccwTryRestoreFocusAfterRender(root);
        requestAnimationFrame(() => {
            requestAnimationFrame(run);
        });
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        const root = this._rootEl();
        if (!root) return;
        if (!this._ccwWindowPlacement) {
            const loaded = this._ccwLoadWindowPlacementFromFlag();
            if (!loaded) {
                this._ccwSnapshotWindowPlacementFromHost();
                this._ccwBumpPlacementToDefaultMinIfFreshSnapshot();
            }
        }
        this._ccwApplyWindowPlacementFromCache();
        // Återapplicera efter layout (Foundry); kan teoretiskt påverka fokus. Strukturella re-renders sätter `_ccwSkipFocusRestoreOnce`.
        // Vid kvarstående fokusproblem: prova tillfälligt att ta bort denna loop.
        for (const delayMs of [30, 90, 180]) {
            setTimeout(() => this._ccwApplyWindowPlacementFromCache(), delayMs);
        }
        this._ccwArmWindowDragTracking();
        this._ccwStartPopupGuard();
        this._ensureWizardZIndex(root);
        this._ccwRaisePinnedEditItemSheet();
        this._ccwRaiseOpenDialogsAboveWizard();

        const proseMirrorHost = root.querySelector(".window-content") ?? root;

        root.removeEventListener("change", this._boundOnFormChange);
        root.removeEventListener("input", this._boundOnFormInput);
        if (this._boundOnCcwFocusIn) {
            root.removeEventListener("focusin", this._boundOnCcwFocusIn);
        }
        if (this._boundOnUtrustningDropOver) {
            for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="utrustning"]')) {
                dropEl.removeEventListener("dragover", this._boundOnUtrustningDropOver);
                dropEl.removeEventListener("dragleave", this._boundOnUtrustningDropLeave);
                dropEl.removeEventListener("drop", this._boundOnUtrustningDrop);
            }
        }
        if (this._boundOnMystikDropOver) {
            for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="mystik"]')) {
                dropEl.removeEventListener("dragover", this._boundOnMystikDropOver);
                dropEl.removeEventListener("dragleave", this._boundOnMystikDropLeave);
                dropEl.removeEventListener("drop", this._boundOnMystikDrop);
            }
        }
        proseMirrorHost.removeEventListener("change", this._boundOnProseMirrorPersistItem, true);
        proseMirrorHost.removeEventListener("close", this._boundOnProseMirrorPersistItem, true);

        this._boundOnFormChange = this._onFormChange.bind(this);
        this._boundOnFormInput = this._onFormInput.bind(this);
        this._boundOnProseMirrorPersistItem = this._onProseMirrorPersistItem.bind(this);
        this._boundOnUtrustningDropOver = (event) =>
            CharacterCreationWizard.#onUtrustningDropDragOver(event, event.currentTarget);
        this._boundOnUtrustningDropLeave = (event) =>
            CharacterCreationWizard.#onUtrustningDropDragLeave(event, event.currentTarget);
        this._boundOnUtrustningDrop = (event) =>
            CharacterCreationWizard.#onUtrustningDrop.call(this, event, event.currentTarget);
        this._boundOnMystikDropOver = (event) =>
            CharacterCreationWizard.#onMystikDropDragOver(event, event.currentTarget);
        this._boundOnMystikDropLeave = (event) =>
            CharacterCreationWizard.#onMystikDropDragLeave(event, event.currentTarget);
        this._boundOnMystikDrop = (event) =>
            CharacterCreationWizard.#onMystikDrop.call(this, event, event.currentTarget);

        root.addEventListener("change", this._boundOnFormChange);
        root.addEventListener("input", this._boundOnFormInput);
        this._boundOnCcwFocusIn = this.#ccwOnFocusIn.bind(this);
        root.addEventListener("focusin", this._boundOnCcwFocusIn);

        if (this._boundOnFinishPointerDown) {
            root.removeEventListener("pointerdown", this._boundOnFinishPointerDown, true);
        }

        this._boundOnFinishPointerDown = (event) => {
            const targetEl = event?.target;
            if (!(targetEl instanceof Element)) return;
            const laterBtn = targetEl.closest?.('[data-action="ccwLater"]');
            if (laterBtn instanceof HTMLElement) {
                event.preventDefault();
                event.stopPropagation();
                this._ccwLaterRequested = true;
                void this._onLaterContinue();
                return;
            }
            const finishBtn = targetEl.closest?.('[data-action="ccwFinish"]');
            if (!(finishBtn instanceof HTMLElement)) return;
            event.preventDefault();
            event.stopPropagation();
            void this._requestFinishFlow();
        };
        root.addEventListener("pointerdown", this._boundOnFinishPointerDown, true);

        for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="utrustning"]')) {
            dropEl.addEventListener("dragover", this._boundOnUtrustningDropOver);
            dropEl.addEventListener("dragleave", this._boundOnUtrustningDropLeave);
            dropEl.addEventListener("drop", this._boundOnUtrustningDrop);
        }
        for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="mystik"]')) {
            dropEl.addEventListener("dragover", this._boundOnMystikDropOver);
            dropEl.addEventListener("dragleave", this._boundOnMystikDropLeave);
            dropEl.addEventListener("drop", this._boundOnMystikDrop);
        }

        if (this._boundOnDoktrinClick) {
            root.removeEventListener("click", this._boundOnDoktrinClick);
        }

        this._boundOnDoktrinClick = this._onDoktrinClick.bind(this);
        root.addEventListener("click", this._boundOnDoktrinClick);
        proseMirrorHost.addEventListener("change", this._boundOnProseMirrorPersistItem, true);
        proseMirrorHost.addEventListener("close", this._boundOnProseMirrorPersistItem, true);

        const kulturfolkslagSelect = root.querySelector("#ccw_kulturfolkslag");
        const mergedWizardDraft = getMergedWizardData(this.actor);

        if (kulturfolkslagSelect instanceof HTMLSelectElement) {
            kulturfolkslagSelect.disabled = !mergedWizardDraft.kulturfolkslagSelectEnabled;
        }

        for (const k of HARLEDDA_KEYS) {
            CharacterCreationWizard.updateHarleddTotaltDisplayForKey(root, k);
        }

        CharacterCreationWizard.syncAllFardighetSkillRows(root);

        this.#ccwRestoreScrollPositions();
        this._ccwRaisePinnedEditItemSheet();
        this.#ccwScheduleFocusRestore(root);
    }

    /** @override */
    async close(options = {}) {
        this.#ccwDisarmScrollStabilizers();
        this._ccwDisarmWindowPlacementObserver();
        this._ccwDisarmWindowDragTracking();
        this._ccwStopPopupGuard();

        if (this._ccwPinnedRaiseTimer) {
            clearInterval(this._ccwPinnedRaiseTimer);
            this._ccwPinnedRaiseTimer = null;
        }

        const root = this._rootEl();

        if (root && this._boundOnFormChange) {
            root.removeEventListener("change", this._boundOnFormChange);
            this._boundOnFormChange = null;
        }
        if (root && this._boundOnFormInput) {
            root.removeEventListener("input", this._boundOnFormInput);
            this._boundOnFormInput = null;
        }
        if (root && this._boundOnCcwFocusIn) {
            root.removeEventListener("focusin", this._boundOnCcwFocusIn);
            this._boundOnCcwFocusIn = null;
        }
        this.#ccwLastFocusedCcwFieldName = "";
        if (root && this._boundOnFinishPointerDown) {
            root.removeEventListener("pointerdown", this._boundOnFinishPointerDown, true);
            this._boundOnFinishPointerDown = null;
        }
        if (root && this._boundOnDoktrinClick) {
            root.removeEventListener("click", this._boundOnDoktrinClick);
            this._boundOnDoktrinClick = null;
        }
        if (root && this._boundOnUtrustningDropOver) {
            for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="utrustning"]')) {
                dropEl.removeEventListener("dragover", this._boundOnUtrustningDropOver);
                dropEl.removeEventListener("dragleave", this._boundOnUtrustningDropLeave);
                dropEl.removeEventListener("drop", this._boundOnUtrustningDrop);
            }
            this._boundOnUtrustningDropOver = null;
            this._boundOnUtrustningDropLeave = null;
            this._boundOnUtrustningDrop = null;
        }
        if (root && this._boundOnMystikDropOver) {
            for (const dropEl of root.querySelectorAll('[data-ccw-drop-zone="mystik"]')) {
                dropEl.removeEventListener("dragover", this._boundOnMystikDropOver);
                dropEl.removeEventListener("dragleave", this._boundOnMystikDropLeave);
                dropEl.removeEventListener("drop", this._boundOnMystikDrop);
            }
            this._boundOnMystikDropOver = null;
            this._boundOnMystikDropLeave = null;
            this._boundOnMystikDrop = null;
        }
        if (root && this._boundOnProseMirrorPersistItem) {
            const proseMirrorHost = root.querySelector(".window-content") ?? root;
            proseMirrorHost.removeEventListener("change", this._boundOnProseMirrorPersistItem, true);
            proseMirrorHost.removeEventListener("close", this._boundOnProseMirrorPersistItem, true);
            this._boundOnProseMirrorPersistItem = null;
        }

        return super.close(options);
    }

    _onFormInput(event) {
        const targetElement = event.target;
        if (!(targetElement instanceof HTMLInputElement || targetElement instanceof HTMLTextAreaElement)) return;
        if (!targetElement.name?.startsWith?.("ccw_")) return;
        if (targetElement instanceof HTMLInputElement && /^ccw_tf_.+_rf_\d+_poang$/.test(targetElement.name)) {
            const rootNow = this._rootEl();
            const pm = targetElement.name.match(/^ccw_tf_(.+)_rf_(\d+)_poang$/);
            if (!rootNow || !pm) return;
            const inkEl = rootNow.querySelector(`[name="ccw_tf_${pm[1]}_rf_${pm[2]}_inkompetent"]`);
            const blockEl = rootNow.querySelector(`[name="ccw_tf_${pm[1]}_rf_${pm[2]}_blockering"]`);
            const ink = inkEl instanceof HTMLInputElement && inkEl.checked;
            const block = blockEl instanceof HTMLInputElement && blockEl.checked;
            const gvEl = rootNow.querySelector(`[name="ccw_tf_${pm[1]}_rf_${pm[2]}_grundvarde"]`);
            const gvRaw = gvEl instanceof HTMLInputElement ? gvEl.value : "0";
            targetElement.max = String(getWizardFardighetPoangCapForRow(ink, block, gvRaw));
            const c = clampWizardFardighetPoangValueForRow(targetElement.value, ink, block, gvRaw);
            if (targetElement.value !== "" && String(c) !== targetElement.value) {
                targetElement.value = String(c);
            }
            CharacterCreationWizard.updateFardighetSlutligT6Display(rootNow, pm[1], parseInt(pm[2], 10));
            return;
        }
        if (targetElement instanceof HTMLInputElement && /^ccw_tf_.+_rf_\d+_grundvarde$/.test(targetElement.name)) {
            const rootNow = this._rootEl();
            const gm = targetElement.name.match(/^ccw_tf_(.+)_rf_(\d+)_grundvarde$/);
            if (!rootNow || !gm) return;
            const inkElG = rootNow.querySelector(`[name="ccw_tf_${gm[1]}_rf_${gm[2]}_inkompetent"]`);
            const ink = inkElG instanceof HTMLInputElement && inkElG.checked;
            const c = clampWizardFardighetGrundvardeForInkompetentValue(targetElement.value, ink);
            targetElement.max = String(ink ? 1 : 8);
            if (targetElement.value !== "" && String(c) !== targetElement.value) {
                targetElement.value = String(c);
            }
            CharacterCreationWizard.syncFardighetRowDomControls(rootNow, gm[1], parseInt(gm[2], 10));
            return;
        }
        if (!/ccw_ov_attr_|ccw_t8_attr_|ccw_ov_e_|ccw_tf_e_/.test(targetElement.name)) return;
        const root = this._rootEl();
        if (!root) return;
        syncPairedWizardField(root, targetElement.name, targetElement.value);
        if (/^ccw_(?:ov|tf)_e_/.test(targetElement.name)) {
            mirrorWizardFardighetPoolDisplay(root, targetElement.name, targetElement.value);
        }
        const harleddMatch = targetElement.name.match(/^ccw_(?:ov_attr|t8_attr)_([^_]+)_[gb]$/);
        if (harleddMatch?.[1]) CharacterCreationWizard.updateHarleddTotaltDisplayForKey(root, harleddMatch[1]);
    }

    _onFormChange(event) {
        if (this._ccwFinishInProgress || this._ccwFinishRequested || this._ccwLaterInProgress || this._ccwLaterRequested) return;
        const targetElement = event.target;
        const isSupportedElement =
            targetElement instanceof HTMLInputElement ||
            targetElement instanceof HTMLTextAreaElement ||
            targetElement instanceof HTMLSelectElement;
        if (!isSupportedElement) return;
        const fieldName = (targetElement.name ?? "").toString();
        if (!fieldName.startsWith("ccw_")) return;

        const root = this._rootEl();
        const syncFardighetRowFromName = (pattern) => {
            if (!(root instanceof HTMLElement) || !(targetElement instanceof HTMLInputElement)) return;
            const match = fieldName.match(pattern);
            if (!match) return;
            CharacterCreationWizard.syncFardighetRowDomControls(root, match[1], parseInt(match[2], 10));
        };

        // Specialfall som kräver direkt async-flöde + tidig exit.
        if (targetElement instanceof HTMLInputElement && targetElement.type === "checkbox" && fieldName === "ccw_mystik_omstopt") {
            void (async () => {
                await this._saveFormToFlags();
                this._ccwSkipFocusRestoreOnce = true;
                await this.render(true);
            })();
            return;
        }
        if (targetElement instanceof HTMLSelectElement && fieldName === "ccw_folkslag") {
            void this._handleFolkslagChange(targetElement);
            return;
        }
        if (targetElement instanceof HTMLSelectElement && fieldName === "ccw_kulturfolkslag") {
            void this._handleKulturfolkslagChange(targetElement);
            return;
        }
        if (targetElement instanceof HTMLInputElement && targetElement.type === "checkbox" && fieldName === "ccw_valfri") {
            if (this.#ccwSuppressValfriCheckbox) return;
            void this._handleValfriaEgenskapCheckboxesChanged();
            return;
        }
        if (targetElement instanceof HTMLSelectElement && /^ccw_tf_.+_rf_\d+_item$/.test(fieldName)) {
            const match = fieldName.match(/^ccw_tf_(.+)_rf_(\d+)_item$/);
            if (root && match && match[1] !== "sprak") {
                const grupp = match[1];
                const rowIndex = parseInt(match[2], 10);
                const gvEl = root.querySelector(`[name="ccw_tf_${grupp}_rf_${rowIndex}_grundvarde"]`);
                const selected = targetElement.selectedOptions[0];
                const grundRaw = (selected?.dataset?.ccwGrundvarde ?? "0").toString();
                if (gvEl instanceof HTMLInputElement) {
                    const inkompetentEl = root.querySelector(`[name="ccw_tf_${grupp}_rf_${rowIndex}_inkompetent"]`);
                    const inkompetent = inkompetentEl instanceof HTMLInputElement && inkompetentEl.checked;
                    gvEl.value = String(clampWizardFardighetGrundvardeForInkompetentValue(grundRaw, inkompetent));
                }
                CharacterCreationWizard.syncFardighetRowDomControls(root, grupp, rowIndex);
            }
            this.#ccwSnapshotScrollForPendingRender();
            void (async () => {
                await this._saveFormToFlags();
                this._ccwSkipFocusRestoreOnce = true;
                await this.render(true);
            })();
            return;
        }

        // Färdighetsrader: håll beroendefält i synk.
        if (targetElement instanceof HTMLInputElement && targetElement.type === "checkbox") {
            syncFardighetRowFromName(/^ccw_tf_(.+)_rf_(\d+)_inkompetent$/);
            syncFardighetRowFromName(/^ccw_tf_(.+)_rf_(\d+)_blockering$/);
        }
        if (targetElement instanceof HTMLInputElement && /^ccw_tf_.+_rf_\d+_poang$/.test(fieldName)) {
            syncFardighetRowFromName(/^ccw_tf_(.+)_rf_(\d+)_poang$/);
        }
        if (targetElement instanceof HTMLInputElement && /^ccw_tf_.+_rf_\d+_grundvarde$/.test(fieldName)) {
            const match = fieldName.match(/^ccw_tf_(.+)_rf_(\d+)_grundvarde$/);
            if (root && match) {
                const grupp = match[1];
                const rowIndex = parseInt(match[2], 10);
                const inkEl = root.querySelector(`[name="ccw_tf_${grupp}_rf_${rowIndex}_inkompetent"]`);
                const ink = inkEl instanceof HTMLInputElement && inkEl.checked;
                const clamped = clampWizardFardighetGrundvardeForInkompetentValue(targetElement.value, ink);
                if (targetElement.value !== "" && String(clamped) !== targetElement.value) {
                    targetElement.value = String(clamped);
                }
                CharacterCreationWizard.syncFardighetRowDomControls(root, grupp, rowIndex);
            }
        }

        // Numeriska fält som inte får bli negativa.
        if (
            root &&
            targetElement instanceof HTMLInputElement &&
            targetElement.type === "number" &&
            (/^ccw_ht_/.test(fieldName) ||
                /^ccw_(?:ov|tf)_e_/.test(fieldName) ||
                /^ccw_pkt_/.test(fieldName) ||
                /^ccw_avt_/.test(fieldName) ||
                fieldName === "ccw_mystik_antal")
        ) {
            const value = parseInt(targetElement.value, 10);
            if (Number.isFinite(value) && value < 0) targetElement.value = "0";
        }

        // Spegling mellan sidopanel/flik och live-visning.
        if (root) {
            syncPairedWizardField(root, fieldName, targetElement.value);
            if (/^ccw_(?:ov|tf)_e_/.test(fieldName)) {
                mirrorWizardFardighetPoolDisplay(root, fieldName, targetElement.value);
            }
        }

        void this._saveFormToFlags();
    }
}
