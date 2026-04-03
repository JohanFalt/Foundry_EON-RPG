/**
 * Parade formulärfält (översikt ↔ flik) i karaktärsskapande-wizarden.
 * @module ccw/ccw-wizard-fields-pairing
 */

import { HARLEDDA_KEYS, ENHETER_KEYS } from "./ccw-constants-keys.js";

/**
 * Synka par av fält (översikt ↔ flik) så båda visar samma värde.
 * @param {HTMLElement} root
 * @param {string} sourceName name-attribut som ändrats
 * @param {string} value
 */
export function syncPairedWizardField(root, sourceName, value) {
    const pairs = buildWizardFieldPairs();
    const partner = pairs[sourceName];
    if (!partner) return;
    const other = root.querySelector(`[name="${partner}"]`);
    if (other instanceof HTMLInputElement || other instanceof HTMLTextAreaElement || other instanceof HTMLSelectElement) {
        if (other.value !== value) other.value = value;
    }
}

/**
 * Speglar `ccw_ov_e_*` / `ccw_tf_e_*` till pool-texten på flik 9 (färdighetsfördelning).
 * @param {HTMLElement} root
 * @param {string} fieldName
 * @param {unknown} value
 */
export function mirrorWizardFardighetPoolDisplay(root, fieldName, value) {
    if (!root || !fieldName) return;
    const m = fieldName.match(/^ccw_(?:ov|tf)_e_(.+)$/);
    const key = m?.[1];
    if (!key) return;
    const esc =
        typeof CSS !== "undefined" && typeof CSS.escape === "function"
            ? CSS.escape(key)
            : key.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    const hosts = root.querySelectorAll(`[data-ccw-fardighet-pool="${esc}"]`);
    const text = (value ?? "").toString();
    for (const host of hosts) {
        const out = host.querySelector("[data-ccw-fardighet-pool-value]");
        if (out) out.textContent = text;
    }
}

/** @returns {Record<string, string>} */
export function buildWizardFieldPairs() {
    /** @type {Record<string, string>} */
    const map = {};
    for (const key of HARLEDDA_KEYS) {
        const overviewGrundField = `ccw_ov_attr_${key}_g`;
        const tabGrundField = `ccw_t8_attr_${key}_g`;
        map[overviewGrundField] = tabGrundField;
        map[tabGrundField] = overviewGrundField;
        const overviewBonusField = `ccw_ov_attr_${key}_b`;
        const tabBonusField = `ccw_t8_attr_${key}_b`;
        map[overviewBonusField] = tabBonusField;
        map[tabBonusField] = overviewBonusField;
    }
    for (const key of ENHETER_KEYS) {
        const overviewEnhetField = `ccw_ov_e_${key}`;
        const tabEnhetField = `ccw_tf_e_${key}`;
        map[overviewEnhetField] = tabEnhetField;
        map[tabEnhetField] = overviewEnhetField;
    }
    return map;
}