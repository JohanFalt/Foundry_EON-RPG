/**
 * Synk av inbäddade språk-items mot wizardens flik 10.
 * @module ccw/ccw-sprak-embed
 */

import { EON_CCW_FLAG_SCOPE, CCW_WIZARD_CREATED_SPRAK_ROW } from "./ccw-constants-keys.js";
import {
    CCW_EGENSKAP_SOURCE_UUID_FLAG,
    CCW_FOLKSLAG_MANAGED_FLAG,
    SPRAK5_PACK
} from "../folkslag-wizard-helper.js";
import { getMergedWizardData } from "./ccw-wizard-draft-merge.js";
import { emptySprakFordelningRow } from "./ccw-wizard-draft-defaults.js";
import {
    defaultWizardFardighetGrundFardighetsvarde,
    fardighetsvardeToTvardeBonus
} from "./ccw-fardighet-rules.js";

/**
 * Skapar/uppdaterar/raderar embedded Språk-items utifrån flik 10 (kompendium-uuid i formuläret).
 * Efter körning pekar `draft.sprakFordelning[].itemId` på actor-Item-id.
 * @param {HTMLElement} root
 * @param {Actor} actor
 * @param {object} draft Resultat av {@link collectWizardDraftFromRoot}
 * @returns {Promise<void>}
 */
export async function syncWizardSprakItemsFromForm(root, actor, draft) {
    if (!root || !actor?.createEmbeddedDocuments || !draft) return;
    const prevMerged = getMergedWizardData(actor);
    const prevRows = Array.isArray(prevMerged.sprakFordelning) ? prevMerged.sprakFordelning : [];
    /** @type {object[]} */
    const newSprakRows = [];
    /** @type {string[]} */
    const toDelete = [];

    const folkslagManaged = (item) =>
        item?.getFlag?.(EON_CCW_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) === true;

    let sprakRowIndex = 0;
    while (root.querySelector(`[name="ccw_tf_sprak_rf_${sprakRowIndex}_item"]`)) {
        const selEl = root.querySelector(`[name="ccw_tf_sprak_rf_${sprakRowIndex}_item"]`);
        const uuid = selEl instanceof HTMLSelectElement ? (selEl.value ?? "").toString().trim() : "";

        const prevRow = prevRows[sprakRowIndex];
        const prevId = (prevRow?.itemId ?? "").toString().trim();
        const prevItem = prevId ? actor.items.get(prevId) : null;
        const prevWasWizard = prevRow?.[CCW_WIZARD_CREATED_SPRAK_ROW] === true;

        if (!uuid) {
            if (prevItem?.type === "Språk" && !folkslagManaged(prevItem)) toDelete.push(prevId);
            newSprakRows.push({ ...emptySprakFordelningRow(), [CCW_WIZARD_CREATED_SPRAK_ROW]: false });
            sprakRowIndex += 1;
            continue;
        }

        if (prevItem?.type === "Språk") {
            const prevSrc = (prevItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_EGENSKAP_SOURCE_UUID_FLAG) ?? "")
                .toString()
                .trim();
            if (prevSrc === uuid) {
                newSprakRows.push({
                    ...emptySprakFordelningRow(),
                    itemId: prevId,
                    [CCW_WIZARD_CREATED_SPRAK_ROW]: prevWasWizard
                });
                sprakRowIndex += 1;
                continue;
            }
            if (!folkslagManaged(prevItem)) toDelete.push(prevId);
        }

        const newId = await createEmbeddedSprakFromCompendiumUuid(actor, uuid);
        if (!newId) {
            newSprakRows.push({ ...emptySprakFordelningRow(), [CCW_WIZARD_CREATED_SPRAK_ROW]: false });
        } else {
            newSprakRows.push({
                ...emptySprakFordelningRow(),
                itemId: newId,
                [CCW_WIZARD_CREATED_SPRAK_ROW]: true
            });
        }
        sprakRowIndex += 1;
    }

    if (toDelete.length) {
        const uniq = [...new Set(toDelete)].filter((id) => id && actor.items.get(id));
        if (uniq.length) await actor.deleteEmbeddedDocuments("Item", uniq);
    }
    draft.sprakFordelning = newSprakRows;
}

/**
 * Skapar ett embedded Språk från språk5-kompendiet (flik 10).
 * @param {Actor} actor
 * @param {string} compendiumUuid
 * @returns {Promise<string|null>} item id
 */
export async function createEmbeddedSprakFromCompendiumUuid(actor, compendiumUuid) {
    const uuid = (compendiumUuid ?? "").toString().trim();
    if (!uuid || !actor?.createEmbeddedDocuments) return null;
    const pack = game.packs.get(SPRAK5_PACK);
    if (!pack) return null;
    /** @type {Item[]} */
    let sprakDocs = [];
    try {
        sprakDocs = await pack.getDocuments({ type: "Språk" });
    } catch {
        return null;
    }
    const src = sprakDocs.find((d) => d.uuid === uuid);
    if (!src) return null;
    const fv = defaultWizardFardighetGrundFardighetsvarde(src, "sprak", false);
    const pool = fardighetsvardeToTvardeBonus(fv);
    const itemData = foundry.utils.duplicate(src.toObject());
    delete itemData._id;
    itemData.system = itemData.system ?? {};
    itemData.system.varde = {
        tvarde: pool.tvarde,
        bonus: pool.bonus,
        bonuslista: []
    };
    itemData.flags = foundry.utils.mergeObject(itemData.flags ?? {}, {
        [EON_CCW_FLAG_SCOPE]: {
            [CCW_EGENSKAP_SOURCE_UUID_FLAG]: uuid
        }
    });
    const docs = await actor.createEmbeddedDocuments("Item", [itemData]);
    return (docs[0]?.id ?? docs[0]?._id ?? null)?.toString?.() ?? null;
}