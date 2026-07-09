/**
 * Eon 5: avdrag vid bruk av vapen utan att uppnå Kroppsbyggnadskravet.
 */

/** @param {{ tvarde?: number, bonus?: number }} pool */
export function t6Rank(pool = {}) {
    const tvarde = Number(pool.tvarde) || 0;
    const bonus = Number(pool.bonus) || 0;
    return tvarde * 4 + bonus;
}

/** @param {{ tvarde?: number, bonus?: number }} pool */
export function formatT6Pool(pool = {}) {
    const tvarde = Number(pool.tvarde) || 0;
    const bonus = Number(pool.bonus) || 0;
    if (bonus > 0) return `${tvarde}T6+${bonus}`;
    if (bonus < 0) return `${tvarde}T6-${Math.abs(bonus)}`;
    return `${tvarde}T6`;
}

/**
 * @param {object} actor
 * @returns {boolean}
 */
export function isKroppsbyggnadVapenAvdragAktiv(actor) {
    let regelPa = true;
    if (game?.settings) {
        regelPa = game.settings.get("eon-rpg", "stridEon5KroppsbyggnadAvdrag");
    } else if (CONFIG.EON?.settings?.stridEon5KroppsbyggnadAvdrag !== undefined) {
        regelPa = CONFIG.EON.settings.stridEon5KroppsbyggnadAvdrag;
    }
    const eon5 = actor?.system?.installningar?.eon === "eon5";
    return Boolean(regelPa && eon5);
}

/**
 * @param {object} vapenSystem item.system
 * @param {"enhand"|"tvahand"|null} fattning
 * @returns {{ tvarde: number, bonus: number } | null}
 */
export function resolveVapenKroppsbyggnadKrav(vapenSystem, fattning) {
    if (!vapenSystem || !fattning) return null;
    const krav = vapenSystem[fattning];
    if (!krav?.aktiv) return null;
    return {
        tvarde: Number(krav.tvarde) || 0,
        bonus: Number(krav.bonus) || 0
    };
}

/**
 * @param {{ tvarde?: number, bonus?: number }} aktörKb
 * @param {{ tvarde?: number, bonus?: number }} vapenKrav
 * @returns {number}
 */
export function antalT6UnderKrav(aktörKb, vapenKrav) {
    if (!vapenKrav) return 0;
    const diff = t6Rank(vapenKrav) - t6Rank(aktörKb);
    if (diff <= 0) return 0;
    return Math.ceil(diff / 4);
}

/**
 * @param {{ tvarde?: number, bonus?: number }} aktörKb
 * @param {{ tvarde?: number, bonus?: number } | null} vapenKrav
 * @returns {number}
 */
export function kroppsbyggnadBrukarVapenAvdragT6(aktörKb, vapenKrav) {
    const under = antalT6UnderKrav(aktörKb, vapenKrav);
    return under > 0 ? Math.max(1, under) : 0;
}

/**
 * @param {{ tvarde?: number, bonus?: number }} pool
 * @param {number} avdragT6
 * @returns {{ tvarde: number, bonus: number }}
 */
export function appliceraT6AvdragMedGolv1(pool, avdragT6) {
    let tvarde = (Number(pool.tvarde) || 0) - (Number(avdragT6) || 0);
    let bonus = Number(pool.bonus) || 0;

    while (bonus < -1) {
        tvarde -= 1;
        bonus += 4;
    }

    if (tvarde < 1) {
        tvarde = 1;
        bonus = 0;
    }

    return { tvarde, bonus };
}

/**
 * Bestäm fattning från vapenets 1H/2H-flaggor.
 * @param {object} vapenSystem
 * @returns {{ fattning: "enhand"|"tvahand"|null, valbarFattning: boolean }}
 */
export function resolveDefaultFattning(vapenSystem) {
    const en = Boolean(vapenSystem?.enhand?.aktiv);
    const tv = Boolean(vapenSystem?.tvahand?.aktiv);
    if (en && tv) {
        return { fattning: "enhand", valbarFattning: true };
    }
    if (en) {
        return { fattning: "enhand", valbarFattning: false };
    }
    if (tv) {
        return { fattning: "tvahand", valbarFattning: false };
    }
    return { fattning: null, valbarFattning: false };
}

/**
 * @param {object} actor
 * @param {object} vapen ItemDocument eller { system }
 * @param {"enhand"|"tvahand"|null} fattning
 */
export function getKroppsbyggnadVapenAvdragContext(actor, vapen, fattning) {
    const inactive = {
        aktiv: false,
        avdragT6: 0,
        underskottT6: 0,
        krav: null,
        aktorKb: null
    };

    if (!isKroppsbyggnadVapenAvdragAktiv(actor)) {
        return inactive;
    }

    const vapenSystem = vapen?.system ?? vapen;
    const krav = resolveVapenKroppsbyggnadKrav(vapenSystem, fattning);
    if (!krav) {
        return inactive;
    }

    const aktorKb = actor.system?.harleddegenskaper?.kroppsbyggnad?.totalt ?? { tvarde: 0, bonus: 0 };
    const underskottT6 = antalT6UnderKrav(aktorKb, krav);
    const avdragT6 = kroppsbyggnadBrukarVapenAvdragT6(aktorKb, krav);

    return {
        aktiv: avdragT6 > 0,
        avdragT6,
        underskottT6,
        krav,
        aktorKb
    };
}

/**
 * @param {{ tvarde?: number, bonus?: number }} pool
 * @param {object} actor
 * @param {object} vapen
 * @param {"enhand"|"tvahand"|null} fattning
 */
export function appliceraKroppsbyggnadVapenAvdrag(pool, actor, vapen, fattning) {
    const ctx = getKroppsbyggnadVapenAvdragContext(actor, vapen, fattning);
    if (!ctx.aktiv || ctx.avdragT6 <= 0) {
        return { pool: { ...pool }, ctx };
    }
    return {
        pool: appliceraT6AvdragMedGolv1(pool, ctx.avdragT6),
        ctx
    };
}
