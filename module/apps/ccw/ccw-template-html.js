/**
 * HTML för dropdowns och listor i karaktärsskapande-wizarden (CCW).
 * @module ccw/ccw-template-html
 */

import { HANDELSE_TABELL_KEYS } from "./ccw-constants-keys.js";
import {
    wizardFardighetItemMatchesWizardKey,
    defaultWizardFardighetGrundForCcwDraft,
    defaultWizardFardighetGrundFardighetsvarde
} from "./ccw-fardighet-rules.js";
import { SPRAK5_PACK } from "../folkslag-wizard-helper.js";

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

/** @returns {Promise<Array<Item>>} */
async function loadFolkslag5Documents() {
    const pack = game.packs.get("eon-rpg.folkslag5");
    if (!pack) return [];
    try {
        return await pack.getDocuments();
    } catch (loadError) {
        console.warn("Eon | CharacterCreationWizard: kunde inte läsa eon-rpg.folkslag5", loadError);
        return [];
    }
}

/**
 * @param {Array<Item>} docs
 * @param {string} currentValue
 * @returns {string}
 */
function resolveFolkslagSelectedId(docs, currentValue = "") {
    const trimmed = (currentValue ?? "").toString().trim();
    if (!trimmed) return "";
    const matchById = docs.find((folkslagsItem) => folkslagsItem.id === trimmed);
    if (matchById?.id) return matchById.id;
    const matchByName = docs.find((folkslagsItem) => (folkslagsItem.name ?? "").toString().trim() === trimmed);
    return matchByName?.id ?? "";
}

/** @param {Item} folkslagsItem */
function getFolkslagGroupLabel(folkslagsItem) {
    const group = folkslagsItem?.system?.folkslag;
    const trimmed = (group ?? "").toString().trim();
    if (!trimmed) return "Ovrigt";
    const groupKey = trimmed.toLowerCase();
    const i18nOrLabel = CONFIG.EON?.folkslag?.[groupKey] ?? trimmed;
    const localized = game.i18n.localize(i18nOrLabel);
    return localized || trimmed;
}

/**
 * @param {Array<Item>} docs
 * @param {string} selectedId
 * @param {string} [excludedId]
 * @returns {string}
 */
function renderFolkslagOptionsHtml(docs, selectedId = "", excludedId = "") {
    const escapeHtml = foundry.utils.escapeHTML;
    const excluded = (excludedId ?? "").toString().trim();
    const sorted = [...docs]
        .filter((folkslagsItem) => folkslagsItem?.id && folkslagsItem.id !== excluded)
        .sort((leftItem, rightItem) => {
            const groupLeft = getFolkslagGroupLabel(leftItem);
            const groupRight = getFolkslagGroupLabel(rightItem);
            const groupCompare = groupLeft.localeCompare(groupRight, "sv", { sensitivity: "base" });
            if (groupCompare !== 0) return groupCompare;
            const nameLeft = (leftItem.name ?? "").toString().trim();
            const nameRight = (rightItem.name ?? "").toString().trim();
            return nameLeft.localeCompare(nameRight, "sv", { sensitivity: "base" });
        });

    const parts = ['<option value=""></option>'];
    let currentGroup = null;
    for (const folkslagsItem of sorted) {
        const folkslagsId = folkslagsItem.id;
        const group = getFolkslagGroupLabel(folkslagsItem);
        const label = (folkslagsItem.name ?? "").toString().trim() || folkslagsId;
        if (group !== currentGroup) {
            if (currentGroup !== null) parts.push("</optgroup>");
            parts.push(`<optgroup label="${escapeHtml(group)}">`);
            currentGroup = group;
        }
        const selected = folkslagsId === selectedId ? " selected" : "";
        parts.push(`<option value="${escapeHtml(folkslagsId)}"${selected}>${escapeHtml(label)}</option>`);
    }
    if (currentGroup !== null) parts.push("</optgroup>");
    return parts.join("");
}

/**
 * Alternativ för folkslag från kompendium eon-rpg.folkslag5, grupperade på system.folkslag.
 * @param {string} [currentValue]
 * @returns {Promise<string>}
 */
export async function buildFolkslag5OptionsHtml(currentValue = "") {
    const docs = await loadFolkslag5Documents();
    const selectedId = resolveFolkslagSelectedId(docs, currentValue);
    return renderFolkslagOptionsHtml(docs, selectedId);
}

/**
 * Folkslag för kultur — samma listning, men exkluderar primärt valt folkslag.
 * @param {string} [primaryId]
 * @param {string} [currentKulturId]
 * @returns {Promise<string>}
 */
export async function buildKulturFolkslag5OptionsHtml(primaryId = "", currentKulturId = "") {
    const docs = await loadFolkslag5Documents();
    const selectedId = resolveFolkslagSelectedId(docs, currentKulturId);
    const excludedId = (primaryId ?? "").toString().trim();
    return renderFolkslagOptionsHtml(docs, selectedId, excludedId);
}

export function buildHandelseTabellOptionsHtml(selectedKey = "", index = 0) {
    const esc = foundry.utils.escapeHTML;
    const sel = (selectedKey ?? "").toString().trim();
    const parts = [
        `<select name="ccw_hr_${index}_tabell" class="eon-ccw-handelse-tabell-select">`,
        `<option value="">${esc(game.i18n.localize("eon.wizard.handelseTabellValj"))}</option>`
    ];
    for (const key of HANDELSE_TABELL_KEYS) {
        const lab = game.i18n.localize(HANDELSE_LABEL_KEYS[key] ?? key);
        const selected = key === sel ? " selected" : "";
        parts.push(`<option value="${esc(key)}"${selected}>${esc(lab)}</option>`);
    }
    parts.push("</select>");
    return parts.join("");
}

/** @param {Item} item */
export function fardighetItemDisplayName(item) {
    const n = (item?.name ?? "").toString();
    if (n.startsWith("eon.")) return game.i18n.localize(n);
    return n;
}

/**
 * @param {Actor} actor
 * @param {string} enhetKey
 * @param {string} [selectedItemId]
 * @param {number} rowIndex
 * @param {boolean} [mystikOmstopt]
 * @param {Set<string>} [itemIdsTakenByOtherRows]
 */
export function buildFardighetItemOptionsHtml(
    actor,
    enhetKey,
    selectedItemId = "",
    rowIndex = 0,
    mystikOmstopt = false,
    itemIdsTakenByOtherRows = null
) {
    const esc = foundry.utils.escapeHTML;
    const gKey = (enhetKey ?? "").toString();
    const items = (actor?.items ?? []).filter((it) => wizardFardighetItemMatchesWizardKey(gKey, it));
    const labeled = items.map((it) => ({
        it,
        label: fardighetItemDisplayName(it)
    }));
    labeled.sort((a, b) => a.label.localeCompare(b.label, game.i18n?.lang ?? "sv"));
    const sel = (selectedItemId ?? "").toString().trim();
    const taken = itemIdsTakenByOtherRows instanceof Set ? itemIdsTakenByOtherRows : new Set();
    const parts = [
        `<select name="ccw_tf_${gKey}_rf_${rowIndex}_item" class="eon-ccw-fardighet-item-select">`,
        `<option value="" data-ccw-grundvarde="0">${esc(game.i18n.localize("eon.wizard.fardighetValjFardighet"))}</option>`
    ];
    const omst = mystikOmstopt === true;
    for (const { it, label } of labeled) {
        const id = (it.id ?? "").toString();
        if (taken.has(id) && id !== sel) continue;
        const selected = id === sel ? " selected" : "";
        const gv = defaultWizardFardighetGrundForCcwDraft(actor, it, gKey, omst);
        parts.push(`<option value="${esc(id)}" data-ccw-grundvarde="${gv}"${selected}>${esc(label)}</option>`);
    }
    parts.push("</select>");
    return parts.join("");
}

/**
 * @param {string} [selectedUuid]
 * @param {number} rowIndex
 * @param {Set<string>} startSprakUuids
 * @param {Set<string>} [itemUuidsTakenByOtherRows]
 */
export async function buildSprakItemOptionsHtml(
    selectedUuid = "",
    rowIndex = 0,
    startSprakUuids = new Set(),
    itemUuidsTakenByOtherRows = null
) {
    const esc = foundry.utils.escapeHTML;
    const emptyLabel = game.i18n.localize("eon.wizard.sprakValjSprak");
    const pack = game.packs.get(SPRAK5_PACK);
    if (!pack) {
        return `<select name="ccw_tf_sprak_rf_${rowIndex}_item" class="eon-ccw-fardighet-item-select" aria-label="${esc(emptyLabel)}"><option value="" data-ccw-grundvarde="0">${esc(emptyLabel)}</option></select>`;
    }
    /** @type {Item[]} */
    let docs = [];
    try {
        docs = await pack.getDocuments({ type: "Språk" });
    } catch {
        docs = [];
    }
    const taken = itemUuidsTakenByOtherRows instanceof Set ? itemUuidsTakenByOtherRows : new Set();
    const startSet = startSprakUuids instanceof Set ? startSprakUuids : new Set();
    const sel = (selectedUuid ?? "").toString().trim();
    const labeled = docs
        .map((d) => ({ d, label: (d.name ?? "").toString().trim() || (d.uuid ?? "").toString() }))
        .filter(({ d }) => {
            const u = (d.uuid ?? "").toString();
            if (!u) return false;
            if (startSet.has(u)) return false;
            if (taken.has(u) && u !== sel) return false;
            return true;
        });
    labeled.sort((a, b) => a.label.localeCompare(b.label, game.i18n?.lang ?? "sv"));
    const parts = [
        `<select name="ccw_tf_sprak_rf_${rowIndex}_item" class="eon-ccw-fardighet-item-select" aria-label="${esc(emptyLabel)}">`,
        `<option value="" data-ccw-grundvarde="0">${esc(emptyLabel)}</option>`
    ];
    for (const { d } of labeled) {
        const u = (d.uuid ?? "").toString();
        const selected = u === sel ? " selected" : "";
        const gv = defaultWizardFardighetGrundFardighetsvarde(d, "sprak", false);
        parts.push(
            `<option value="${esc(u)}" data-ccw-grundvarde="${gv}"${selected}>${esc((d.name ?? "").toString())}</option>`
        );
    }
    parts.push("</select>");
    return parts.join("");
}
