import { WIZARD_OVRIGA_ENHET_KEYS, CCW_FARDIGHET_ENHETER_MAX } from "./ccw-constants-keys.js";

export function wizardEnhetKeyToFardighetItemGrupp(enhetKey) {
    const enhetKeyStr = (enhetKey ?? "").toString();
    if (WIZARD_OVRIGA_ENHET_KEYS.includes(enhetKeyStr)) return "ovriga";
    return enhetKeyStr;
}

/**
 * Om ett embedded item tillhör en given wizard-rad (inkl. ovriga + exakt typ).
 * @param {string} enhetKey
 * @param {Item | null | undefined} item
 * @returns {boolean}
 */
export function wizardFardighetItemMatchesWizardKey(enhetKey, item) {
    if (!item) return false;
    const wizardKeyStr = (enhetKey ?? "").toString();
    const grupp = wizardEnhetKeyToFardighetItemGrupp(wizardKeyStr);
    if (item.type !== "Färdighet") return false;
    if ((item.system?.grupp ?? "").toString() !== grupp) return false;
    if (grupp !== "ovriga") return true;
    if (wizardKeyStr === "eExpertiser") return !!item.system?.expertis;
    if (wizardKeyStr === "fFormagor") return !!item.system?.formaga;
    if (wizardKeyStr === "hHantverk") return !!item.system?.hantverk;
    if (wizardKeyStr === "kKannetecken") return !!item.system?.kannetecken;
    return false;
}

/**
 * Booleska typ-flaggor för ny övrig färdighet (exakt en sann).
 * @param {string} wizardKey {@link WIZARD_OVRIGA_ENHET_KEYS}
 * @returns {{ expertis: boolean, formaga: boolean, hantverk: boolean, kannetecken: boolean } | null}
 */
export function getWizardOvrigFardighetTypeFlags(wizardKey) {
    const wizardKeyStr = (wizardKey ?? "").toString();
    if (wizardKeyStr === "eExpertiser") return { expertis: true, formaga: false, hantverk: false, kannetecken: false };
    if (wizardKeyStr === "fFormagor") return { expertis: false, formaga: true, hantverk: false, kannetecken: false };
    if (wizardKeyStr === "hHantverk") return { expertis: false, formaga: false, hantverk: true, kannetecken: false };
    if (wizardKeyStr === "kKannetecken") return { expertis: false, formaga: false, hantverk: false, kannetecken: true };
    return null;
}

/**
 * Skapar ett nytt embedded Färdighet (ovriga + typ) för karaktärsskapande-wizarden.
 * @param {Actor} actor
 * @param {string} wizardKey {@link WIZARD_OVRIGA_ENHET_KEYS}
 * @returns {Promise<string|null>} item id
 */
export async function createWizardOvrigFardighetItem(actor, wizardKey) {
    const flags = getWizardOvrigFardighetTypeFlags(wizardKey);
    if (!flags || !actor?.createEmbeddedDocuments) return null;
    const version = game.system.version;
    const itemData = {
        name: game.i18n.localize("eon.items.nyFardighet"),
        type: "Färdighet",
        system: {
            installningar: {
                skapad: true,
                eon: "eon5",
                version,
                kantabort: true,
                talang: false,
                inkompetent: false,
                blockering: false
            },
            grupp: "ovriga",
            expertis: flags.expertis,
            formaga: flags.formaga,
            hantverk: flags.hantverk,
            kannetecken: flags.kannetecken,
            varde: {
                tvarde: 0,
                bonus: 0,
                bonuslista: []
            }
        }
    };
    const docs = await actor.createEmbeddedDocuments("Item", [itemData]);
    return (docs[0]?.id ?? docs[0]?._id ?? null)?.toString?.() ?? null;
}

/**
 * Skapar ett nytt embedded Färdighet med `system.grupp === "mystik"` (karaktärsskapande-wizarden).
 * @param {Actor} actor
 * @returns {Promise<string|null>} item id
 */
export async function createWizardMystikFardighetItem(actor) {
    if (!actor?.createEmbeddedDocuments) return null;
    const version = game.system.version;
    const itemData = {
        name: game.i18n.localize("eon.items.nyFardighet"),
        type: "Färdighet",
        system: {
            installningar: {
                skapad: true,
                eon: "eon5",
                version,
                kantabort: true,
                talang: false,
                inkompetent: false,
                blockering: false
            },
            grupp: "mystik",
            expertis: false,
            formaga: false,
            hantverk: false,
            kannetecken: false,
            aspekt: false,
            varde: {
                tvarde: 0,
                bonus: 0,
                bonuslista: []
            }
        }
    };
    const docs = await actor.createEmbeddedDocuments("Item", [itemData]);
    return (docs[0]?.id ?? docs[0]?._id ?? null)?.toString?.() ?? null;
}

export function emptyFardighetFordelningRow() {
    return {
        itemId: "",
        /** Färdighetsvärde 0–8 (tabell → T6); tom sträng → standard från item vid merge. */
        grundvarde: "",
        poang: "0",
        talang: false,
        inkompetent: false,
        blockering: false
    };
}

/**
 * Actor-item för mystikfärdigheten Förnimma (Eon 5).
 * @param {Actor | null | undefined} actor
 * @returns {string} embedded item id eller ""
 */
export function getMystikFornimmaItemId(actor) {
    if (!actor?.items) return "";
    const it = actor.items.find(
        (x) =>
            x.type === "Färdighet" &&
            (x.system?.grupp ?? "").toString() === "mystik" &&
            (x.system?.id ?? "").toString() === "fornimma"
    );
    return (it?.id ?? "").toString();
}

/**
 * Omstöpt: lägger till Förnimma under mystik om den saknas. Annars tas Förnimma-rader bort.
 * @param {Actor | null | undefined} actor
 * @param {object} draft
 */
export function applyMystikOmstoptFornimmaFardighetRows(actor, draft) {
    if (!draft?.fardighetFordelning || typeof draft.fardighetFordelning !== "object") return;
    const fid = getMystikFornimmaItemId(actor);
    const mystikRows = Array.isArray(draft.fardighetFordelning.mystik) ? [...draft.fardighetFordelning.mystik] : [];
    if (!draft.mystikOmstopt) {
        if (!fid) {
            draft.fardighetFordelning.mystik = mystikRows;
            return;
        }
        draft.fardighetFordelning.mystik = mystikRows.filter((row) => (row?.itemId ?? "").toString().trim() !== fid);
        return;
    }
    if (!fid) {
        draft.fardighetFordelning.mystik = mystikRows;
        return;
    }
    const has = mystikRows.some((row) => (row?.itemId ?? "").toString().trim() === fid);
    if (!has) {
        mystikRows.push({ ...emptyFardighetFordelningRow(), itemId: fid });
    }
    draft.fardighetFordelning.mystik = mystikRows;
}


/** @param {unknown} rawInput */
export function normalizeWizardNumStr(rawInput) {
    const trimmed = (rawInput ?? "").toString().trim();
    return trimmed === "" ? "0" : trimmed;
}

/** Händelsetabeller (slag) och färdighetsenheter får inte vara negativa. */
export function clampWizardFieldToNonNegativeIntStr(raw) {
    const t = (raw ?? "").toString().trim();
    if (t === "") return "0";
    const n = parseInt(t, 10);
    if (!Number.isFinite(n)) return "0";
    return String(Math.max(0, n));
}

/**
 * Tak för enheter på en rad: vid inkompetens högst 1, annars {@link CCW_FARDIGHET_ENHETER_MAX}.
 * @param {boolean} inkompetent
 * @returns {number}
 */
export function getWizardFardighetPoangCap(inkompetent) {
    return inkompetent ? 1 : CCW_FARDIGHET_ENHETER_MAX;
}

/**
 * Tak för enheter: vid **blockering** 0; vid **inkompetens** får grundvärde+enheter vara högst 1 som färdighetsvärde → enheter ≤ 1−gv.
 * Annars får **färdighetsvärde** (grundvärde + enheter) högst {@link CCW_FARDIGHET_ENHETER_MAX} → enheter ≤ 8−gv.
 * @param {boolean} inkompetent
 * @param {boolean} blockering
 * @param {unknown} grundvardeRaw aktuellt grundvärde (färdighetsvärde), rå sträng eller tal
 * @returns {number}
 */
export function getWizardFardighetPoangCapForRow(inkompetent, blockering, grundvardeRaw) {
    if (blockering) return 0;
    const gv = clampWizardFardighetGrundvardeForInkompetentValue(grundvardeRaw, inkompetent);
    if (inkompetent) return Math.max(0, 1 - gv);
    return Math.max(0, CCW_FARDIGHET_ENHETER_MAX - gv);
}

/**
 * Grundvärde (färdighetsvärde): vid inkompetens högst 1, annars 0–8.
 * @param {unknown} raw
 * @param {boolean} inkompetent
 * @returns {number}
 */
export function clampWizardFardighetGrundvardeForInkompetentValue(raw, inkompetent) {
    let n = parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(n)) n = 0;
    const cap = inkompetent ? 1 : CCW_FARDIGHET_ENHETER_MAX;
    return Math.max(0, Math.min(cap, n));
}

/**
 * @param {unknown} raw
 * @param {boolean} inkompetent
 * @returns {string}
 */
export function clampWizardFardighetGrundvardeForInkompetentStr(raw, inkompetent) {
    return String(clampWizardFardighetGrundvardeForInkompetentValue(raw, inkompetent));
}

/**
 * @param {unknown} raw
 * @param {boolean} inkompetent
 * @param {boolean} blockering
 * @param {unknown} grundvardeRaw för taket 1−gv vid inkompetens
 * @returns {number}
 */
export function clampWizardFardighetPoangValueForRow(raw, inkompetent, blockering, grundvardeRaw) {
    let n = parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(n)) n = 0;
    const cap = getWizardFardighetPoangCapForRow(!!inkompetent, !!blockering, grundvardeRaw);
    return Math.max(0, Math.min(cap, n));
}

/**
 * @param {unknown} raw
 * @param {boolean} inkompetent
 * @param {boolean} blockering
 * @param {unknown} grundvardeRaw
 * @returns {string}
 */
export function clampWizardFardighetPoangStrForRow(raw, inkompetent, blockering, grundvardeRaw) {
    return String(clampWizardFardighetPoangValueForRow(raw, inkompetent, blockering, grundvardeRaw));
}

/**
 * @param {unknown} raw
 * @param {boolean} [inkompetent]
 * @returns {number}
 */
export function clampWizardFardighetPoangValue(raw, inkompetent = false) {
    let n = parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(n)) n = 0;
    const cap = getWizardFardighetPoangCap(!!inkompetent);
    return Math.max(0, Math.min(cap, n));
}

/**
 * @param {unknown} raw
 * @param {boolean} [inkompetent]
 * @returns {string}
 */
export function clampWizardFardighetPoangStr(raw, inkompetent = false) {
    return String(clampWizardFardighetPoangValue(raw, inkompetent));
}

/**
 * Eon 5 färdighetsvärde 0–8 → `system.varde` (antal T6 + bonus).
 * Tabell: 0→0, 1→2T6, 2→3T6, 3→3T6+2, 4→4T6, 5→4T6+1, 6→4T6+2, 7→4T6+3, 8→5T6.
 * Mappning till item: t.ex. 2T6 = tvarde 2 bonus 0 (FV 1); **3T6+2 = tvarde 3 bonus 2** (FV 3).
 * @type {readonly { tvarde: number, bonus: number }[]}
 */
const FARDIGHETSVARDE_TILL_TVARDE_TABELL = Object.freeze([
    { tvarde: 0, bonus: 0 },
    { tvarde: 2, bonus: 0 },
    { tvarde: 3, bonus: 0 },
    { tvarde: 3, bonus: 2 },
    { tvarde: 4, bonus: 0 },
    { tvarde: 4, bonus: 1 },
    { tvarde: 4, bonus: 2 },
    { tvarde: 4, bonus: 3 },
    { tvarde: 5, bonus: 0 }
]);

/** @param {unknown} fardighetsvarde */
export function fardighetsvardeToTvardeBonus(fardighetsvarde) {
    let fv = Math.floor(Number(fardighetsvarde));
    if (!Number.isFinite(fv)) fv = 0;
    fv = Math.max(0, Math.min(CCW_FARDIGHET_ENHETER_MAX, fv));
    const p = FARDIGHETSVARDE_TILL_TVARDE_TABELL[fv];
    return { tvarde: p.tvarde, bonus: p.bonus };
}

/**
 * Färdighetsvärde (grundvärde + enheter) för en wizard-rad; samma clamp som vid Slutför när en färdighet bara förekommer i en rad.
 * @param {unknown} grundvardeRaw
 * @param {unknown} poangRaw
 * @param {{ sprak?: boolean, inkompetent?: boolean, blockering?: boolean, ovrigWizardTyp?: boolean }} [opts]
 */
export function wizardFardighetRowCombinedFardighetsvarde(grundvardeRaw, poangRaw, opts = {}) {
    if (opts.ovrigWizardTyp === true) {
        const p = clampWizardFardighetPoangValue(poangRaw, false);
        return Math.min(CCW_FARDIGHET_ENHETER_MAX, p);
    }
    const sprak = opts.sprak === true;
    const ink = opts.inkompetent === true;
    const block = opts.blockering === true;
    const g0 = sprak
        ? clampWizardFardighetGrundTvardeValue(grundvardeRaw)
        : clampWizardFardighetGrundvardeForInkompetentValue(grundvardeRaw, ink);
    const p = sprak
        ? clampWizardFardighetPoangValue(poangRaw, false)
        : clampWizardFardighetPoangValueForRow(poangRaw, ink, block, g0);
    const capFv = ink ? 1 : CCW_FARDIGHET_ENHETER_MAX;
    return Math.min(capFv, g0 + p);
}

/**
 * Visningssträng för slutlig T6-pool (GV + enheter via färdighetsvärdetabellen).
 * @param {unknown} grundvardeRaw
 * @param {unknown} poangRaw
 * @param {{ sprak?: boolean, inkompetent?: boolean, blockering?: boolean, ovrigWizardTyp?: boolean }} [opts]
 */
export function formatWizardFardighetRowSlutligT6(grundvardeRaw, poangRaw, opts = {}) {
    const fv = wizardFardighetRowCombinedFardighetsvarde(grundvardeRaw, poangRaw, opts);
    return formatHarleddT6PoolDisplay(fardighetsvardeToTvardeBonus(fv));
}

/**
 * Om exakt tabellrad finns; annars 0. T.ex. tvarde 2 bonus 0 → FV 1; tvarde 3 bonus 2 (3T6+2) → FV 3.
 * @param {unknown} tvardeRaw
 * @param {unknown} bonusRaw
 * @returns {number} 0–8
 */
export function tvardeBonusToFardighetsvarde(tvardeRaw, bonusRaw) {
    const t = Math.floor(parseInt(String(tvardeRaw ?? 0), 10)) || 0;
    const b = Math.floor(parseInt(String(bonusRaw ?? 0), 10)) || 0;
    for (let tableIndex = 0; tableIndex < FARDIGHETSVARDE_TILL_TVARDE_TABELL.length; tableIndex++) {
        const p = FARDIGHETSVARDE_TILL_TVARDE_TABELL[tableIndex];
        if (p.tvarde === t && p.bonus === b) return tableIndex;
    }
    return 0;
}

/**
 * Förval för grundvärde = färdighetsvärde (0–8) enligt tabell ovan, härlett från itemets varde.
 * Förnimma + omstöpt: 1 (2T6) om item saknar grund enligt tabellen.
 * @param {Item | null | undefined} itemDoc
 * @param {string} enhetKey
 * @param {boolean} mystikOmstopt
 * @returns {number}
 */
export function defaultWizardFardighetGrundFardighetsvarde(itemDoc, enhetKey, mystikOmstopt) {
    const enhetKeyStr = (enhetKey ?? "").toString();
    if (
        enhetKeyStr === "mystik" &&
        itemDoc?.type === "Färdighet" &&
        (itemDoc.system?.id ?? "").toString() === "fornimma" &&
        mystikOmstopt === true
    ) {
        const t = parseInt(String(itemDoc.system?.varde?.tvarde ?? 0), 10);
        const b = parseInt(String(itemDoc.system?.varde?.bonus ?? 0), 10);
        const mapped = Number.isFinite(t) ? tvardeBonusToFardighetsvarde(t, b) : 0;
        if (mapped > 0) return Math.min(CCW_FARDIGHET_ENHETER_MAX, mapped);
        return 1;
    }
    if (enhetKeyStr === "sprak" && itemDoc?.type === "Språk") {
        const t = parseInt(String(itemDoc.system?.varde?.tvarde ?? 0), 10);
        const b = parseInt(String(itemDoc.system?.varde?.bonus ?? 0), 10);
        if (!Number.isFinite(t) || t < 0) return 0;
        return Math.min(CCW_FARDIGHET_ENHETER_MAX, tvardeBonusToFardighetsvarde(t, b));
    }
    if (!itemDoc || itemDoc.type !== "Färdighet") return 0;
    const t = parseInt(String(itemDoc.system?.varde?.tvarde ?? 0), 10);
    const b = parseInt(String(itemDoc.system?.varde?.bonus ?? 0), 10);
    if (!Number.isFinite(t) || t < 0) return 0;
    return Math.min(CCW_FARDIGHET_ENHETER_MAX, tvardeBonusToFardighetsvarde(t, b));
}

/**
 * Förval för grundvärde i karaktärsskapande-wizarden från itemets aktuella värde.
 * Undantag: Förnimma vid omstöpt -> 1.
 * @param {Actor | null | undefined} actor
 * @param {Item | null | undefined} itemDoc
 * @param {string} enhetKey
 * @param {boolean} mystikOmstopt
 * @returns {number}
 */
export function defaultWizardFardighetGrundForCcwDraft(actor, itemDoc, enhetKey, mystikOmstopt) {
    const enhetKeyStr = (enhetKey ?? "").toString();
    if (WIZARD_OVRIGA_ENHET_KEYS.includes(enhetKeyStr)) return 0;
    if (
        enhetKeyStr === "mystik" &&
        itemDoc?.type === "Färdighet" &&
        (itemDoc.system?.id ?? "").toString() === "fornimma" &&
        mystikOmstopt === true
    ) {
        return 1;
    }
    return defaultWizardFardighetGrundFardighetsvarde(itemDoc, enhetKey, mystikOmstopt);
}

/**
 * @param {unknown} raw
 * @returns {number}
 */
export function clampWizardFardighetGrundTvardeValue(raw) {
    let n = parseInt(String(raw ?? "").trim(), 10);
    if (!Number.isFinite(n)) n = 0;
    return Math.max(0, Math.min(CCW_FARDIGHET_ENHETER_MAX, n));
}

/**
 * @param {unknown} raw
 * @returns {string}
 */
export function clampWizardFardighetGrundTvardeStr(raw) {
    return String(clampWizardFardighetGrundTvardeValue(raw));
}

/**
 * Tabellen "Uträkningar av Attribut" (Eon 5): kolumn Attribut† från **Attributvärd** (G+B i wizarden).
 * Gäller inte Visdom. Värde &lt; 4: 0 T6 (utanför tabellen).
 * Värde &gt; 24: samma antal T6 som vid 24, +1 på modifikator per steg över 24.
 * @param {unknown} attributVardeRaw heltal (typiskt grund + bonus från utkast)
 * @returns {{ tvarde: number, bonus: number }}
 */
export function attributVardeTillHarleddT6Attribut(attributVardeRaw) {
    let v = Math.floor(parseInt(String(attributVardeRaw ?? "").trim(), 10));
    if (!Number.isFinite(v)) v = 0;
    if (v < 4) return { tvarde: 0, bonus: 0 };
    if (v <= 24) {
        const tvarde = Math.floor((v - 4) / 4) + 1;
        const bonus = (v - 4) % 4;
        return { tvarde, bonus };
    }
    const tvardeVid24 = Math.floor((24 - 4) / 4) + 1;
    const bonusVid24 = (24 - 4) % 4;
    return { tvarde: tvardeVid24, bonus: bonusVid24 + (v - 24) };
}

/**
 * @param {{ tvarde: number, bonus: number }} pool
 * @returns {string}
 */
export function formatHarleddT6PoolDisplay(pool) {
    const t = pool.tvarde;
    const b = pool.bonus;
    if (t === 0 && b === 0) return "0";
    if (b === 0) return `${t}T6`;
    if (b > 0) return `${t}T6+${b}`;
    return `${t}T6${b}`;
}

/**
 * Visningssträng för kolumnen Totalt på flik 8 (T6 för härledda utom visdom).
 * @param {string} key
 * @param {unknown} grundRaw
 * @param {unknown} bonusRaw
 * @returns {string}
 */
export function wizardHarleddTotaltDisplayText(key, grundRaw, bonusRaw) {
    if (key === "visdom") {
        const g = Math.floor(parseInt(String(grundRaw ?? "").trim(), 10)) || 0;
        const b = Math.floor(parseInt(String(bonusRaw ?? "").trim(), 10)) || 0;
        return String(g + b);
    }
    const g = Math.floor(parseInt(String(grundRaw ?? "").trim(), 10)) || 0;
    const b = Math.floor(parseInt(String(bonusRaw ?? "").trim(), 10)) || 0;
    return formatHarleddT6PoolDisplay(attributVardeTillHarleddT6Attribut(g + b));
}