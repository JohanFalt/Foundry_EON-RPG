/**
 * Lookup och formatering av Eon 5-skadetabeller (allvarlig skada).
 * @module skadetabell-helper
 */

import { skadetabellerEon5 } from "../data/skadetabeller/eon5/index.js";

export function getLocationGroup(bodyPartKey) {
    const key = String(bodyPartKey ?? "torso").toLowerCase();

    if (key === "huvud") return "huvud";
    if (key === "torso") return "torso";

    return "armBen";
}

export function getActorEonVersion(actor) {
    return actor?.system?.installningar?.eon === "eon5" ? "eon5" : "eon4";
}

export function resolveDamageTable(eon, damageType) {
    if (eon !== "eon5") return null;

    const dtype = String(damageType ?? "hugg").toLowerCase();

    return skadetabellerEon5[dtype] ?? null;
}

export function lookupRow(rows, rollTotal) {
    const roll = Math.floor(Number(rollTotal) || 0);

    if (!Array.isArray(rows) || roll < 1) return null;

    let best = null;

    for (const row of rows) {
        const min = Number(row.min) || 0;
        const max = row.max == null ? null : Number(row.max);
        if (roll < min) continue;
        if (max != null && roll > max) continue;
        if (!best || min > best.min) best = row;
    }

    return best;
}

export function getIntervalBonus(finalDamage) {
    const slutskada = Math.floor(Number(finalDamage) || 0);

    if (slutskada < 10) return 0;

    return 2 * Math.floor((slutskada - 10) / 5);
}

export function computeTableRoll(allvarligBaseRoll, finalDamage) {
    return Math.floor(Number(allvarligBaseRoll) || 0) + getIntervalBonus(finalDamage);
}

export function resolveAllvarligSkada(defender, damageType, bodyPartKey, allvarligBaseRoll, finalDamage) {
    const eon = getActorEonVersion(defender);

    if (eon !== "eon5") return { ok: false, error: "eon4" };

    const table = resolveDamageTable(eon, damageType);

    if (!table) return { ok: false, error: "noTable" };

    const locationGroup = getLocationGroup(bodyPartKey);
    const rows = table.locations?.[locationGroup]?.rows;

    if (!rows?.length) return { ok: false, error: "noLocation" };

    const tableRoll = computeTableRoll(allvarligBaseRoll, finalDamage);
    const row = lookupRow(rows, tableRoll);

    if (!row) return { ok: false, error: "noRow", tableRoll };

    return { ok: true, tableRoll, row, table, locationGroup, damageType: table.damageType };
}

export function formatAllvarligSections(row, context = {}) {
    const sections = [];

    if (context.tableRoll != null) {
        sections.push(game.i18n.format("eon.combatAttack.allvarligResultRoll", { roll: context.tableRoll }));
    }
    if (row.text) sections.push(row.text);
    if (row.dodslag != null && row.dodslag !== "") {
        sections.push(game.i18n.format("eon.combatAttack.allvarligResultDodslag", { value: row.dodslag }));
    }
    if (Array.isArray(row.effects) && row.effects.length) {
        sections.push(game.i18n.format("eon.combatAttack.allvarligResultEffects", { effects: row.effects.join(", ") }));
    }
    
    return sections;
}

export class SkadetabellHelper {
    static getLocationGroup = getLocationGroup;
    static getActorEonVersion = getActorEonVersion;
    static resolveDamageTable = resolveDamageTable;
    static lookupRow = lookupRow;
    static getIntervalBonus = getIntervalBonus;
    static computeTableRoll = computeTableRoll;
    static resolveAllvarligSkada = resolveAllvarligSkada;
    static formatAllvarligSections = formatAllvarligSections;
}
