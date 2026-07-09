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
    const queryField = (name) => root.querySelector(`[name="${name}"]`);
    /** @param {string} name */
    const fieldValue = (name) => {
        const node = queryField(name);
        if (!node) return "";
        if (node instanceof HTMLInputElement && node.type === "checkbox") return node.checked;
        return (node.value ?? "").toString();
    };
    /** @param {string} name */
    const numericFieldStr = (name) => fieldValue(name).toString().trim();

    const draft = actor
        ? foundry.utils.mergeObject(defaultWizardData(), getMergedWizardData(actor), { inplace: false, recursive: true })
        : defaultWizardData();

    /** Huvudflikarnas fält monteras bara när fliken är aktiv; utan detta skrivs sparade värden över med "" vid sparning från annan flik. */
    const activeTab = (root.querySelector(".eon-ccw-tab.active")?.getAttribute?.("data-tab") ?? "").toString().trim();

    if (activeTab === "val") {
        draft.koncept = fieldValue("ccw_koncept").toString().trim();
        draft.hemland = fieldValue("ccw_hemland").toString().trim();
        draft.bakgrund = fieldValue("ccw_bakgrund").toString().trim();
        draft.folkslag = fieldValue("ccw_folkslag").toString().trim();
        const harKulturfolkslagRaw = fieldValue("ccw_har_kulturfolkslag");
        draft.harKulturfolkslag = harKulturfolkslagRaw === true || harKulturfolkslagRaw === "1" || harKulturfolkslagRaw === 1;
        draft.kulturfolkslag = fieldValue("ccw_kulturfolkslag").toString().trim();

        const poolCsv = fieldValue("ccw_folk_valfri_pool").toString().trim();
        draft.folkValfriaPoolUuids = poolCsv ? poolCsv.split(",").map((s) => s.trim()).filter(Boolean) : [];
        draft.religion = fieldValue("ccw_religion").toString().trim();
        {
            const doktrinRows = [];
            let doktrinIndex = 0;
            while (root.querySelector(`[name="ccw_doktrin_${doktrinIndex}_beskrivning"]`)) {
                doktrinRows.push({ beskrivning: fieldValue(`ccw_doktrin_${doktrinIndex}_beskrivning`).toString() });
                doktrinIndex += 1;
            }
            draft.doktrinRader = doktrinRows;
        }
        draft.arketyp = fieldValue("ccw_arketyp").toString().trim();
        draft.varv = fieldValue("ccw_varv").toString().trim();
        draft.miljo = fieldValue("ccw_miljo").toString().trim();
        draft.levnadsstandard = fieldValue("ccw_levnadsstandard").toString().trim();
        draft.startkapital = fieldValue("ccw_startkapital").toString().trim();
    }

    if (activeTab === "namnDetaljer") {
        draft.rollpersonNamn = fieldValue("ccw_rollperson_namn").toString().trim();
        draft.detaljer = fieldValue("ccw_detaljer").toString().trim();
        draft.titel = fieldValue("ccw_titel").toString().trim();
        draft.alder = fieldValue("ccw_alder").toString().trim();
        draft.kon = fieldValue("ccw_kon").toString().trim();
        draft.hemort = fieldValue("ccw_hemort").toString().trim();
        draft.utseende = fieldValue("ccw_utseende").toString().trim();
        draft.relationer = fieldValue("ccw_relationer").toString().trim();
        draft.vapenarm = fieldValue("ccw_vapenarm").toString().trim();
    }

    draft.extraAttributPoang = normalizeWizardNumStr(numericFieldStr("ccw_extra_attr_poang"));

    if (activeTab === "grundegenskaper") {
        draft.avtrubbning = {
            valfriKategori: normalizeWizardNumStr(numericFieldStr("ccw_avt_valfri")),
            utsatthet: normalizeWizardNumStr(numericFieldStr("ccw_avt_utsatthet")),
            vald: normalizeWizardNumStr(numericFieldStr("ccw_avt_vald")),
            overnaturligt: normalizeWizardNumStr(numericFieldStr("ccw_avt_over"))
        };
    }

    for (const key of HARLEDDA_KEYS) {
        const overviewGrundStr = numericFieldStr(`ccw_ov_attr_${key}_g`);
        const overviewBonusStr = numericFieldStr(`ccw_ov_attr_${key}_b`);
        const tabGrundStr = numericFieldStr(`ccw_t8_attr_${key}_g`);
        const tabBonusStr = numericFieldStr(`ccw_t8_attr_${key}_b`);
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
        const overviewEnhetStr = numericFieldStr(`ccw_ov_e_${key}`);
        const tabEnhetStr = numericFieldStr(`ccw_tf_e_${key}`);
        draft.enheter[key] = clampWizardFieldToNonNegativeIntStr(overviewEnhetStr || tabEnhetStr);
    }

    for (const key of HANDELSE_SIDEBAR_SLAG_KEYS) {
        draft.handelseSlag[key] = clampWizardFieldToNonNegativeIntStr(numericFieldStr(`ccw_ht_${key}`));
    }
    for (const key of UTRUSTNING_PKT_KEYS) {
        draft.utrustningPaket[key] = clampWizardFieldToNonNegativeIntStr(numericFieldStr(`ccw_pkt_${key}`));
    }

    if (activeTab === "handelser") {
        const handelseRows = [];
        let hrIndex = 0;
        while (root.querySelector(`[name="ccw_hr_${hrIndex}_tabell"]`)) {
            handelseRows.push({
                tabell: fieldValue(`ccw_hr_${hrIndex}_tabell`).toString().trim(),
                nummer: fieldValue(`ccw_hr_${hrIndex}_num`).toString().trim(),
                anteckning: fieldValue(`ccw_hr_${hrIndex}_anteckning`).toString().trim()
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
            const fardighetRows = [];
            let rowIndex = 0;
            while (root.querySelector(`[name="ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_item"]`)) {
                let itemId = fieldValue(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_item`).toString().trim();
                if (WIZARD_OVRIGA_ENHET_KEYS.includes(fardighetsGruppKey)) {
                    const rowObj = {
                        itemId,
                        grundvarde: "0",
                        poang: clampWizardFardighetPoangStr(
                            numericFieldStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_poang`),
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
                    fardighetRows.push(rowObj);
                    rowIndex += 1;
                    continue;
                }
                const inkompetent = Boolean(fieldValue(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_inkompetent`));
                const blockering = Boolean(fieldValue(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_blockering`));
                const grundvardeRaw = numericFieldStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_grundvarde`);
                const grundStr = clampWizardFardighetGrundvardeForInkompetentStr(grundvardeRaw, inkompetent);
                const rowObj = {
                    itemId,
                    grundvarde: grundStr,
                    poang: clampWizardFardighetPoangStrForRow(
                        numericFieldStr(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_poang`),
                        inkompetent,
                        blockering,
                        grundStr
                    )
                };
                rowObj.talang = Boolean(fieldValue(`ccw_tf_${fardighetsGruppKey}_rf_${rowIndex}_talang`));
                rowObj.inkompetent = inkompetent;
                rowObj.blockering = blockering;
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
                fardighetRows.push(rowObj);
                rowIndex += 1;
            }
            {
                const seenFardighetIds = new Set();
                for (const row of fardighetRows) {
                    const itemId = (row.itemId ?? "").toString().trim();
                    if (!itemId) continue;
                    if (seenFardighetIds.has(itemId)) row.itemId = "";
                    else seenFardighetIds.add(itemId);
                }
            }
            draft.fardighetFordelning[fardighetsGruppKey] = fardighetRows;
        }
    }

    if (activeTab === "sprak") {
        const sprakRows = [];
        let sprakRowIndex = 0;
        while (root.querySelector(`[name="ccw_tf_sprak_rf_${sprakRowIndex}_item"]`)) {
            sprakRows.push({
                itemId: fieldValue(`ccw_tf_sprak_rf_${sprakRowIndex}_item`).toString().trim(),
                grundvarde: "0",
                poang: "0",
                talang: false,
                inkompetent: false,
                blockering: false
            });
            sprakRowIndex += 1;
        }
        draft.sprakFordelning = sprakRows;

        const kretsarRader = [];
        let kretsRowIndex = 0;
        while (root.querySelector(`[name="ccw_kr_${kretsRowIndex}_namn"]`)) {
            kretsarRader.push({
                namn: fieldValue(`ccw_kr_${kretsRowIndex}_namn`).toString().trim(),
                anteckning: fieldValue(`ccw_kr_${kretsRowIndex}_anteckning`).toString().trim()
            });
            kretsRowIndex += 1;
        }
        draft.kretsarRader = kretsarRader;

        const foljeslagareRader = [];
        let foljeRowIndex = 0;
        while (root.querySelector(`[name="ccw_fj_${foljeRowIndex}_namn"]`)) {
            foljeslagareRader.push({
                namn: fieldValue(`ccw_fj_${foljeRowIndex}_namn`).toString().trim(),
                anteckning: fieldValue(`ccw_fj_${foljeRowIndex}_anteckning`).toString().trim()
            });
            foljeRowIndex += 1;
        }
        draft.foljeslagareRader = foljeslagareRader;
    }

    if (activeTab === "val") {
        draft.egenskaper = draft.egenskaper.map((_, index) => ({
            typ: fieldValue(`ccw_eg_${index}_typ`).toString().trim(),
            namn: fieldValue(`ccw_eg_${index}_namn`).toString().trim(),
            kalla: fieldValue(`ccw_eg_${index}_kalla`).toString().trim(),
            beskrivning: fieldValue(`ccw_eg_${index}_beskrivning`).toString().trim()
        }));
    }

    if (activeTab === "karaktarsdrag") {
        const karaktarsdragRader = [];
        let karaktarsdragIndex = 0;
        while (root.querySelector(`[name="ccw_kd_${karaktarsdragIndex}_namn"]`)) {
            karaktarsdragRader.push({
                namn: fieldValue(`ccw_kd_${karaktarsdragIndex}_namn`).toString().trim(),
                niva1: fieldValue(`ccw_kd_${karaktarsdragIndex}_n1`).toString().trim(),
                niva2: fieldValue(`ccw_kd_${karaktarsdragIndex}_n2`).toString().trim(),
                niva3: fieldValue(`ccw_kd_${karaktarsdragIndex}_n3`).toString().trim()
            });
            karaktarsdragIndex += 1;
        }
        draft.karaktarsdrag = karaktarsdragRader;
    }

    if (activeTab === "mystik") {
        draft.mystikOmstopt = Boolean(fieldValue("ccw_mystik_omstopt"));
        draft.mystikAntal = normalizeWizardNumStr(numericFieldStr("ccw_mystik_antal"));
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