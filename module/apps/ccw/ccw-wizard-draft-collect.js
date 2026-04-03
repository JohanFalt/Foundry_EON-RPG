/**
 * Insamling av wizard-utkast från DOM (karaktärsskapande-wizard).
 * @module ccw/ccw-wizard-draft-collect
 */

import {
    HARLEDDA_KEYS,
    ENHETER_KEYS,
    HANDELSE_SIDEBAR_SLAG_KEYS,
    UTRUSTNING_PKT_KEYS,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    WIZARD_OVRIGA_ENHET_KEYS,
    CCW_WIZARD_CREATED_FARDIGHET_ROW
} from "./ccw-constants-keys.js";
import { defaultWizardData } from "./ccw-wizard-draft-defaults.js";
import { getMergedWizardData } from "./ccw-wizard-draft-merge.js";
import {
    normalizeWizardNumStr,
    clampWizardFieldToNonNegativeIntStr,
    clampWizardFardighetPoangStr,
    clampWizardFardighetGrundvardeForInkompetentStr,
    clampWizardFardighetPoangStrForRow,
    wizardHarleddTotaltDisplayText,
    applyMystikOmstoptFornimmaFardighetRows
} from "./ccw-fardighet-rules.js";

/**
 * Läs alla ccw_*-fält från DOM till wizardData-objekt.
 * @param {HTMLElement} root
 * @param {Actor} [actor] Om satt: börja från befintligt wizardData så cache-fält bevaras.
 */
export function collectWizardDraftFromRoot(root, actor = null) {
    /** @param {string} name */
    const el = (name) => root.querySelector(`[name="${name}"]`);
    /** @param {string} name */
    const val = (name) => {
        const node = el(name);
        if (!node) return "";
        if (node instanceof HTMLInputElement && node.type === "checkbox") return node.checked;
        return (node.value ?? "").toString();
    };
    /** @param {string} name */
    const numStr = (name) => val(name).toString().trim();

    const draft = actor
        ? foundry.utils.mergeObject(defaultWizardData(), getMergedWizardData(actor), { inplace: false, recursive: true })
        : defaultWizardData();

    /** Huvudflikarnas fält monteras bara när fliken är aktiv; utan detta skrivs sparade värden över med "" vid sparning från annan flik. */
    const activeTab = (root.querySelector(".eon-ccw-tab.active")?.getAttribute?.("data-tab") ?? "").toString().trim();

    if (activeTab === "val") {
        draft.koncept = val("ccw_koncept").toString().trim();
        draft.hemland = val("ccw_hemland").toString().trim();
        draft.bakgrund = val("ccw_bakgrund").toString().trim();
        draft.folkslag = val("ccw_folkslag").toString().trim();
        const hkRaw = val("ccw_har_kulturfolkslag");
        draft.harKulturfolkslag = hkRaw === true || hkRaw === "1" || hkRaw === 1;
        draft.kulturfolkslag = val("ccw_kulturfolkslag").toString().trim();

        const poolCsv = val("ccw_folk_valfri_pool").toString().trim();
        draft.folkValfriaPoolUuids = poolCsv ? poolCsv.split(",").map((s) => s.trim()).filter(Boolean) : [];
        draft.religion = val("ccw_religion").toString().trim();
        {
            const doktrinRows = [];
            let doktrinIndex = 0;
            while (root.querySelector(`[name="ccw_doktrin_${doktrinIndex}_beskrivning"]`)) {
                doktrinRows.push({ beskrivning: val(`ccw_doktrin_${doktrinIndex}_beskrivning`).toString() });
                doktrinIndex += 1;
            }
            draft.doktrinRader = doktrinRows;
        }
        draft.arketyp = val("ccw_arketyp").toString().trim();
        draft.varv = val("ccw_varv").toString().trim();
        draft.miljo = val("ccw_miljo").toString().trim();
        draft.levnadsstandard = val("ccw_levnadsstandard").toString().trim();
        draft.startkapital = val("ccw_startkapital").toString().trim();
    }

    if (activeTab === "namnDetaljer") {
        draft.rollpersonNamn = val("ccw_rollperson_namn").toString().trim();
        draft.detaljer = val("ccw_detaljer").toString().trim();
        draft.titel = val("ccw_titel").toString().trim();
        draft.alder = val("ccw_alder").toString().trim();
        draft.kon = val("ccw_kon").toString().trim();
        draft.hemort = val("ccw_hemort").toString().trim();
        draft.utseende = val("ccw_utseende").toString().trim();
        draft.relationer = val("ccw_relationer").toString().trim();
        draft.vapenarm = val("ccw_vapenarm").toString().trim();
    }

    draft.extraAttributPoang = normalizeWizardNumStr(numStr("ccw_extra_attr_poang"));

    if (activeTab === "grundegenskaper") {
        draft.avtrubbning = {
            valfriKategori: normalizeWizardNumStr(numStr("ccw_avt_valfri")),
            utsatthet: normalizeWizardNumStr(numStr("ccw_avt_utsatthet")),
            vald: normalizeWizardNumStr(numStr("ccw_avt_vald")),
            overnaturligt: normalizeWizardNumStr(numStr("ccw_avt_over"))
        };
    }

    for (const key of HARLEDDA_KEYS) {
        const overviewGrundStr = numStr(`ccw_ov_attr_${key}_g`);
        const overviewBonusStr = numStr(`ccw_ov_attr_${key}_b`);
        const tabGrundStr = numStr(`ccw_t8_attr_${key}_g`);
        const tabBonusStr = numStr(`ccw_t8_attr_${key}_b`);
        let grundStr = overviewGrundStr || tabGrundStr;
        if (grundStr === "" || grundStr === null || grundStr === undefined) grundStr = "0";
        let bonusStr = overviewBonusStr || tabBonusStr;
        if (bonusStr === "" || bonusStr === null || bonusStr === undefined) bonusStr = "0";
        draft.harledd[key] = {
            grund: grundStr,
            bonus: bonusStr,
            totalt: wizardHarleddTotaltDisplayText(key, grundStr, bonusStr)
        };
    }

    for (const key of ENHETER_KEYS) {
        const overviewEnhetStr = numStr(`ccw_ov_e_${key}`);
        const tabEnhetStr = numStr(`ccw_tf_e_${key}`);
        draft.enheter[key] = clampWizardFieldToNonNegativeIntStr(overviewEnhetStr || tabEnhetStr);
    }

    for (const key of HANDELSE_SIDEBAR_SLAG_KEYS) {
        draft.handelseSlag[key] = clampWizardFieldToNonNegativeIntStr(numStr(`ccw_ht_${key}`));
    }
    for (const key of UTRUSTNING_PKT_KEYS) {
        draft.utrustningPaket[key] = clampWizardFieldToNonNegativeIntStr(numStr(`ccw_pkt_${key}`));
    }

    if (activeTab === "handelser") {
        const handelseRows = [];
        let hrIndex = 0;
        while (root.querySelector(`[name="ccw_hr_${hrIndex}_tabell"]`)) {
            handelseRows.push({
                tabell: val(`ccw_hr_${hrIndex}_tabell`).toString().trim(),
                nummer: val(`ccw_hr_${hrIndex}_num`).toString().trim(),
                anteckning: val(`ccw_hr_${hrIndex}_anteckning`).toString().trim()
            });
            hrIndex += 1;
        }
        draft.handelseResultat = handelseRows;
    }

    if (!draft.fardighetFordelning || typeof draft.fardighetFordelning !== "object") {
        draft.fardighetFordelning = {};
    }
    if (activeTab === "fardigheter") {
        for (const fardighetsGruppKey of ENHETER_FARDIGHET_GRUPP_KEYS) {
            const gRows = [];
            let rowIndex = 0;
            while (root.querySelector(`[name="ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_item"]`)) {
                let itemId = val(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_item`).toString().trim();
                if (WIZARD_OVRIGA_ENHET_KEYS.includes(fardighetsGruppKey)) {
                    const rowObj = {
                        itemId,
                        grundvarde: "0",
                        poang: clampWizardFardighetPoangStr(
                            numStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_poang`),
                            false
                        ),
                        talang: false,
                        inkompetent: false,
                        blockering: false
                    };
                    const prevArr = Array.isArray(draft.fardighetFordelning[fardighetsGruppKey])
                        ? draft.fardighetFordelning[fardighetsGruppKey]
                        : [];
                    const prevRow = prevArr[rowIndex];
                    const prevId = (prevRow?.itemId ?? "").toString().trim();
                    if (prevId && prevId === itemId && prevRow?.[CCW_WIZARD_CREATED_FARDIGHET_ROW] === true) {
                        rowObj[CCW_WIZARD_CREATED_FARDIGHET_ROW] = true;
                    }
                    gRows.push(rowObj);
                    rowIndex += 1;
                    continue;
                }
                const ink = Boolean(val(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_inkompetent`));
                const block = Boolean(val(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_blockering`));
                const gvRaw = numStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_grundvarde`);
                const grundStr = clampWizardFardighetGrundvardeForInkompetentStr(gvRaw, ink);
                const rowObj = {
                    itemId,
                    grundvarde: grundStr,
                    poang: clampWizardFardighetPoangStrForRow(
                        numStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_poang`),
                        ink,
                        block,
                        grundStr
                    )
                };
                rowObj.talang = Boolean(val(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_talang`));
                rowObj.inkompetent = ink;
                rowObj.blockering = block;
                if (fardighetsGruppKey === "mystik") {
                    const prevArr = Array.isArray(draft.fardighetFordelning[fardighetsGruppKey])
                        ? draft.fardighetFordelning[fardighetsGruppKey]
                        : [];
                    const prevRow = prevArr[rowIndex];
                    const prevId = (prevRow?.itemId ?? "").toString().trim();
                    if (prevId && prevId === itemId && prevRow?.[CCW_WIZARD_CREATED_FARDIGHET_ROW] === true) {
                        rowObj[CCW_WIZARD_CREATED_FARDIGHET_ROW] = true;
                    }
                }
                gRows.push(rowObj);
                rowIndex += 1;
            }
            {
                const seenFardighetIds = new Set();
                for (const row of gRows) {
                    const id = (row.itemId ?? "").toString().trim();
                    if (!id) continue;
                    if (seenFardighetIds.has(id)) row.itemId = "";
                    else seenFardighetIds.add(id);
                }
            }
            draft.fardighetFordelning[fardighetsGruppKey] = gRows;
        }
    }

    if (activeTab === "sprak") {
        const sprakRows = [];
        let sprakRowIndex = 0;
        while (root.querySelector(`[name="ccw_tf_sprak_rf_${sprakRowIndex}_item"]`)) {
            sprakRows.push({
                itemId: val(`ccw_tf_sprak_rf_${sprakRowIndex}_item`).toString().trim(),
                grundvarde: "0",
                poang: "0",
                talang: false,
                inkompetent: false,
                blockering: false
            });
            sprakRowIndex += 1;
        }
        draft.sprakFordelning = sprakRows;

        const kr = [];
        let kretsRowIndex = 0;
        while (root.querySelector(`[name="ccw_kr_${kretsRowIndex}_namn"]`)) {
            kr.push({
                namn: val(`ccw_kr_${kretsRowIndex}_namn`).toString().trim(),
                anteckning: val(`ccw_kr_${kretsRowIndex}_anteckning`).toString().trim()
            });
            kretsRowIndex += 1;
        }
        draft.kretsarRader = kr;

        const fj = [];
        let foljeRowIndex = 0;
        while (root.querySelector(`[name="ccw_fj_${foljeRowIndex}_namn"]`)) {
            fj.push({
                namn: val(`ccw_fj_${foljeRowIndex}_namn`).toString().trim(),
                anteckning: val(`ccw_fj_${foljeRowIndex}_anteckning`).toString().trim()
            });
            foljeRowIndex += 1;
        }
        draft.foljeslagareRader = fj;
    }

    if (activeTab === "val") {
        draft.egenskaper = draft.egenskaper.map((_, index) => ({
            typ: val(`ccw_eg_${index}_typ`).toString().trim(),
            namn: val(`ccw_eg_${index}_namn`).toString().trim(),
            kalla: val(`ccw_eg_${index}_kalla`).toString().trim(),
            beskrivning: val(`ccw_eg_${index}_beskrivning`).toString().trim()
        }));
    }

    if (activeTab === "karaktarsdrag") {
        const kd = [];
        let kdIndex = 0;
        while (root.querySelector(`[name="ccw_kd_${kdIndex}_namn"]`)) {
            kd.push({
                namn: val(`ccw_kd_${kdIndex}_namn`).toString().trim(),
                niva1: val(`ccw_kd_${kdIndex}_n1`).toString().trim(),
                niva2: val(`ccw_kd_${kdIndex}_n2`).toString().trim(),
                niva3: val(`ccw_kd_${kdIndex}_n3`).toString().trim()
            });
            kdIndex += 1;
        }
        draft.karaktarsdrag = kd;
    }

    if (activeTab === "mystik") {
        draft.mystikOmstopt = Boolean(val("ccw_mystik_omstopt"));
        draft.mystikAntal = normalizeWizardNumStr(numStr("ccw_mystik_antal"));
    }

    if (actor) applyMystikOmstoptFornimmaFardighetRows(actor, draft);

    if (activeTab === "val") {
        const valfriChecked = [...root.querySelectorAll('input[name="ccw_valfri"]:checked')].map((inputNode) =>
            (inputNode instanceof HTMLInputElement ? inputNode.value : "").toString()
        );
        draft.folkValfriaValda = valfriChecked.filter(Boolean);
    }

    return draft;
}