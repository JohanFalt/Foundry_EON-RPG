/**
 * Synk av namn på wizard-skapade övriga färdigheter.
 * @module ccw/ccw-wizard-sync-names
 */

import { WIZARD_OVRIGA_ENHET_KEYS, CCW_WIZARD_CREATED_FARDIGHET_ROW } from "./ccw-constants-keys.js";

/**
 * Skriver wizard-skapade övriga färdigheters namn från flik 9 till embedded items (före persist av flags).
 * @param {HTMLElement} root
 * @param {Actor} actor
 * @param {object} draft Resultat av {@link collectWizardDraftFromRoot}
 * @returns {Promise<void>}
 */
export async function syncWizardOvrigFardighetItemNamesFromForm(root, actor, draft) {
    if (!root || !actor?.updateEmbeddedDocuments || !draft?.fardighetFordelning) return;
    const fallback = game.i18n.localize("eon.items.nyFardighet");
    /** @type {Array<{ _id: string, name: string }>} */
    const updates = [];
    const keysForWizardNamnSync = [...WIZARD_OVRIGA_ENHET_KEYS, "mystik"];
    for (const fardighetsGruppKey of keysForWizardNamnSync) {
        let rowIndex = 0;
        while (root.querySelector(`[name="ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_item"]`)) {
            const row = (draft.fardighetFordelning[fardighetsGruppKey] ?? [])[rowIndex];
            const namnEl = root.querySelector(`[name="ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_namn"]`);
            if (row?.[CCW_WIZARD_CREATED_FARDIGHET_ROW] === true && namnEl instanceof HTMLInputElement) {
                const itemId = (row.itemId ?? "").toString().trim();
                const item = itemId ? actor.items.get(itemId) : null;
                if (item) {
                    let name = (namnEl.value ?? "").toString().trim();
                    if (!name) name = fallback;
                    if ((item.name ?? "").toString() !== name) {
                        updates.push({ _id: itemId, name });
                    }
                }
            }
            rowIndex += 1;
        }
    }
    if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
}