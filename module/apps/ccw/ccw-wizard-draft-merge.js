/**
 * Merge av actor.flags med standardutkast för karaktärsskapande-wizarden.
 * @module ccw/ccw-wizard-draft-merge
 */

import {
    EON_CCW_FLAG_SCOPE,
    HARLEDDA_KEYS,
    ENHETER_KEYS,
    HANDELSE_SIDEBAR_SLAG_KEYS,
    UTRUSTNING_PKT_KEYS,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    WIZARD_OVRIGA_ENHET_KEYS,
    CCW_WIZARD_CREATED_FARDIGHET_ROW,
    CCW_WIZARD_CREATED_SPRAK_ROW
} from "./ccw-constants-keys.js";
import { defaultWizardData, emptySprakFordelningRow, emptyKaraktarsdragRow } from "./ccw-wizard-draft-defaults.js";
import {
    clampWizardFieldToNonNegativeIntStr,
    clampWizardFardighetGrundTvardeStr,
    clampWizardFardighetPoangStr,
    clampWizardFardighetGrundvardeForInkompetentStr,
    clampWizardFardighetPoangStrForRow,
    defaultWizardFardighetGrundForCcwDraft,
    applyMystikOmstoptFornimmaFardighetRows,
    emptyFardighetFordelningRow
} from "./ccw-fardighet-rules.js";

/**
 * Merge persisted flags with defaults (djup merge).
 * @param {Actor} actor
 */
export function getMergedWizardData(actor) {
    const fromFlags = actor.flags?.[EON_CCW_FLAG_SCOPE]?.wizardData ?? {};
    const merged = foundry.utils.mergeObject(defaultWizardData(), fromFlags, { inplace: false, recursive: true });
    for (const key of HARLEDDA_KEYS) {
        const row = merged.harledd?.[key];
        if (row) {
            if (row.grund === "" || row.grund === null || row.grund === undefined) {
                row.grund = "0";
            }
            if (row.bonus === "" || row.bonus === null || row.bonus === undefined) {
                row.bonus = "0";
            }
        }
    }
    const avt = merged.avtrubbning ?? {};
    for (const avtKey of ["valfriKategori", "utsatthet", "vald", "overnaturligt"]) {
        const v = avt[avtKey];
        if (v === "" || v === null || v === undefined) avt[avtKey] = "0";
    }
    merged.avtrubbning = avt;
    const exPo = merged.extraAttributPoang;
    if (exPo === "" || exPo === null || exPo === undefined) merged.extraAttributPoang = "0";
    if (!Array.isArray(merged.doktrinRader)) merged.doktrinRader = [];

    if (!Array.isArray(merged.sprakFordelning)) merged.sprakFordelning = [];
    if (!Array.isArray(merged.kretsarRader)) merged.kretsarRader = [];
    if (!Array.isArray(merged.foljeslagareRader)) merged.foljeslagareRader = [];
    if (!Array.isArray(merged.karaktarsdrag)) merged.karaktarsdrag = [];
    merged.karaktarsdrag = merged.karaktarsdrag.map((row) => {
        if (!row || typeof row !== "object") return { ...emptyKaraktarsdragRow() };
        return {
            namn: (row.namn ?? "").toString().trim(),
            niva1: (row.niva1 ?? "").toString().trim(),
            niva2: (row.niva2 ?? "").toString().trim(),
            niva3: (row.niva3 ?? "").toString().trim()
        };
    });
    while (merged.karaktarsdrag.length < 2) {
        merged.karaktarsdrag.push({ ...emptyKaraktarsdragRow() });
    }
    const legacySprakKontakter = merged.sprakKontakter;
    if (Array.isArray(legacySprakKontakter) && legacySprakKontakter.length) {
        const hasNewKontakter =
            (merged.kretsarRader?.length ?? 0) > 0 || (merged.foljeslagareRader?.length ?? 0) > 0;
        if (!hasNewKontakter) {
            for (const r of legacySprakKontakter) {
                if (!r || typeof r !== "object") continue;
                const typ = (r.typ ?? "").toString().toLowerCase();
                const row = {
                    namn: (r.namn ?? "").toString(),
                    anteckning: (r.anteckning ?? "").toString()
                };
                if (typ.includes("krets")) merged.kretsarRader.push(row);
                else merged.foljeslagareRader.push(row);
            }
        }
        delete merged.sprakKontakter;
    }
    {
        const seenUuid = new Set();
        merged.sprakFordelning = merged.sprakFordelning.map((row) => {
            if (!row || typeof row !== "object") return { ...emptySprakFordelningRow() };
            let itemId = (row.itemId ?? "").toString().trim();
            if (itemId && seenUuid.has(itemId)) itemId = "";
            if (itemId) seenUuid.add(itemId);
            return {
                itemId,
                grundvarde: clampWizardFardighetGrundTvardeStr(row.grundvarde),
                poang: clampWizardFardighetPoangStr(row.poang, false),
                talang: false,
                inkompetent: false,
                blockering: false,
                [CCW_WIZARD_CREATED_SPRAK_ROW]: row[CCW_WIZARD_CREATED_SPRAK_ROW] === true
            };
        });
    }

    if (!merged.enheter) merged.enheter = {};
    for (const key of ENHETER_KEYS) {
        merged.enheter[key] = clampWizardFieldToNonNegativeIntStr(merged.enheter[key]);
    }
    if (!merged.handelseSlag) merged.handelseSlag = {};
    for (const key of HANDELSE_SIDEBAR_SLAG_KEYS) {
        merged.handelseSlag[key] = clampWizardFieldToNonNegativeIntStr(merged.handelseSlag[key]);
    }
    if (!merged.utrustningPaket) merged.utrustningPaket = {};
    for (const key of UTRUSTNING_PKT_KEYS) {
        const v = merged.utrustningPaket[key];
        if (v === "" || v === null || v === undefined) merged.utrustningPaket[key] = "0";
    }
    const mystAnt = merged.mystikAntal;
    if (mystAnt === "" || mystAnt === null || mystAnt === undefined) merged.mystikAntal = "0";

    if (!merged.fardighetFordelning || typeof merged.fardighetFordelning !== "object") {
        merged.fardighetFordelning = {};
    }
    if (actor) applyMystikOmstoptFornimmaFardighetRows(actor, merged);
    for (const key of ENHETER_FARDIGHET_GRUPP_KEYS) {
        const arr = merged.fardighetFordelning[key];
        if (!Array.isArray(arr)) {
            merged.fardighetFordelning[key] = [];
            continue;
        }
        const seenMergeIds = new Set();
        const arrDedup = arr.map((row) => {
            if (!row || typeof row !== "object") return row;
            const rawId = (row.itemId ?? "").toString().trim();
            if (!rawId) return row;
            if (seenMergeIds.has(rawId)) return { ...row, itemId: "" };
            seenMergeIds.add(rawId);
            return row;
        });
        merged.fardighetFordelning[key] = arrDedup.map((row) => {
            if (!row || typeof row !== "object") return { ...emptyFardighetFordelningRow() };
            const itemId = (row.itemId ?? "").toString().trim();
            const ccwCreated = !!row[CCW_WIZARD_CREATED_FARDIGHET_ROW];
            if (WIZARD_OVRIGA_ENHET_KEYS.includes(key)) {
                return {
                    itemId,
                    grundvarde: "0",
                    poang: clampWizardFardighetPoangStr(row.poang, false),
                    talang: false,
                    inkompetent: false,
                    blockering: false,
                    [CCW_WIZARD_CREATED_FARDIGHET_ROW]: ccwCreated
                };
            }
            const itemDoc = itemId && actor?.items?.get ? actor.items.get(itemId) : null;
            const defG = defaultWizardFardighetGrundForCcwDraft(actor, itemDoc, key, merged.mystikOmstopt === true);
            const hasStoredGrund =
                row.grundvarde !== undefined &&
                row.grundvarde !== null &&
                String(row.grundvarde).trim() !== "";
            const ink = !!row.inkompetent;
            const block = !!row.blockering;
            const grundRaw = hasStoredGrund ? row.grundvarde : defG;
            const grundStr = clampWizardFardighetGrundvardeForInkompetentStr(grundRaw, ink);
            return {
                itemId,
                grundvarde: grundStr,
                poang: clampWizardFardighetPoangStrForRow(row.poang, ink, block, grundStr),
                talang: !!row.talang,
                inkompetent: ink,
                blockering: block,
                [CCW_WIZARD_CREATED_FARDIGHET_ROW]: ccwCreated
            };
        });
    }
    if (merged.fardighetFordelning) {
        delete merged.fardighetFordelning.sprak;
        delete merged.fardighetFordelning.valfria;
    }

    const allowedVapenarm = new Set(["", "hoger", "vanster", "annat"]);
    let va = (merged.vapenarm ?? "").toString().trim();
    if (!va && actor?.system?.strid?.vapenarm) {
        const fromActor = (actor.system.strid.vapenarm ?? "").toString().trim();
        if (allowedVapenarm.has(fromActor) && fromActor !== "") va = fromActor;
    }
    merged.vapenarm = allowedVapenarm.has(va) ? va : "";

    if (actor?.system?.bakgrund) {
        const k0 = (merged.kon ?? "").toString().trim();
        const k1 = (actor.system.bakgrund.kon ?? "").toString().trim();
        if (!k0 && k1) merged.kon = k1;
    }

    return merged;
}

/**
 * @param {Actor} actor
 * @param {object} partial Deep partial wizardData
 */
export async function persistWizardData(actor, partial) {
    const current = getMergedWizardData(actor);
    const next = foundry.utils.mergeObject(current, partial, { inplace: false, recursive: true });
    delete next.helperForm;
    const deepEq = foundry.utils.isDeepEqual;
    if (typeof deepEq === "function" && deepEq(current, next)) {
        return;
    }
    await actor.setFlag(EON_CCW_FLAG_SCOPE, "wizardData", next);
}