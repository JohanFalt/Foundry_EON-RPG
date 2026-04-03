/** @typedef {{ uuid?: string, _id?: string, label?: string, namn?: string, beskrivning?: string }} FolkslagEgenskapRef */

/**
 * En stabil nyckel för samma egenskap i folkslagslistor (undviker dubbletter när samma rad finns i både egenskaper och kulturegenskaper).
 * @param {FolkslagEgenskapRef|null|undefined} ref
 * @returns {string}
 */
export function normalizeEgenskapRefKey(ref) {
    if (!ref) return "";
    const u = (ref.uuid ?? "").toString().trim();
    if (u) return u;
    return (ref._id ?? "").toString().trim();
}

/**
 * @param {FolkslagEgenskapRef[]} refs
 * @returns {FolkslagEgenskapRef[]}
 */
function dedupeFolkslagEgenskaperRefs(refs) {
    const seen = new Set();
    /** @type {FolkslagEgenskapRef[]} */
    const out = [];
    for (const ref of refs ?? []) {
        const key = normalizeEgenskapRefKey(ref);
        if (!key || seen.has(key)) continue;
        seen.add(key);
        out.push(ref);
    }
    return out;
}

export const FOLKSLAG5_PACK = "eon-rpg.folkslag5";
export const FOLKSLAGSEGENSKAPER5_PACK = "eon-rpg.folkslagegenskaper5";
export const SPRAK5_PACK = "eon-rpg.sprak5";

/** Flagga på embedded Item: skapad av karaktärsskapande-guidens folkslagssteg (ska rensas vid folkslagsbyte). */
export const CCW_FOLKSLAG_MANAGED_FLAG = "ccwFolkslagManaged";
/** Flagga: ursprunglig egenskap-uuid i folkslagegenskaper5 ( för CCW-listor, inte för spelaren). */
export const CCW_EGENSKAP_SOURCE_UUID_FLAG = "ccwSourceUuid";

/**
 * @param {string} id
 * @returns {Promise<Item|null>}
 */
export async function loadFolkslag5Doc(id) {
    const trimmedId = (id ?? "").toString().trim();
    if (!trimmedId) return null;
    const pack = game.packs.get(FOLKSLAG5_PACK);
    if (!pack) return null;
    try {
        return await pack.getDocument(trimmedId);
    } catch {
        return null;
    }
}

/**
 * Delar upp egenskapsrefs enligt plan: med/utan kulturfolkslag.
 * @param {Item|null} primaryDoc
 * @param {Item|null} kulturDoc
 * @param {boolean} harKultur
 * @returns {{ listedRefs: FolkslagEgenskapRef[], valfriaPoolRefs: FolkslagEgenskapRef[] }}
 */
export function partitionFolkslagEgenskaper(primaryDoc, kulturDoc, harKultur) {
    const primarySystem = primaryDoc?.system ?? {};
    /** @type {FolkslagEgenskapRef[]} */
    let listedRefs = [];
    /** @type {FolkslagEgenskapRef[]} */
    let valfriaPoolRefs = [];

    if (harKultur && kulturDoc) {
        listedRefs = [...(primarySystem.egenskaper ?? []), ...(kulturDoc.system?.kulturegenskaper ?? [])];
        valfriaPoolRefs = [...(kulturDoc.system?.valfriaegenskaper ?? [])];
    } else {
        listedRefs = [...(primarySystem.egenskaper ?? []), ...(primarySystem.kulturegenskaper ?? [])];
        valfriaPoolRefs = [...(primarySystem.valfriaegenskaper ?? [])];
    }

    return {
        listedRefs: dedupeFolkslagEgenskaperRefs(listedRefs),
        valfriaPoolRefs: dedupeFolkslagEgenskaperRefs(valfriaPoolRefs)
    };
}

/**
 * Obligatoriska + valfria som användaren markerat (kryssrutor). Valda valfria läggs bara till om uuid finns i folkValfriaValda.
 * @param {FolkslagEgenskapRef[]} listedRefs
 * @param {FolkslagEgenskapRef[]} valfriaPoolRefs
 * @param {string[]} folkValfriaValda uuid
 * @returns {FolkslagEgenskapRef[]}
 */
export function collectAllEgenskapRefsForFinish(listedRefs, valfriaPoolRefs, folkValfriaValda) {
    /** @type {FolkslagEgenskapRef[]} */
    const out = [];
    const seenUuids = new Set();
    for (const ref of listedRefs ?? []) {
        const key = normalizeEgenskapRefKey(ref);
        if (key && !seenUuids.has(key)) {
            seenUuids.add(key);
            out.push(ref);
        }
    }
    const valda = new Set((folkValfriaValda ?? []).map((uuid) => String(uuid).trim()).filter(Boolean));
    for (const ref of valfriaPoolRefs ?? []) {
        const key = normalizeEgenskapRefKey(ref);
        if (key && valda.has(key) && !seenUuids.has(key)) {
            seenUuids.add(key);
            out.push(ref);
        }
    }
    return out;
}

/**
 * @param {string} primaryId
 * @param {string} kulturId
 * @param {boolean} harKultur
 * @returns {Promise<{ uuid: string, label: string }[]>}
 */
export async function resolveStartsprakRows(primaryId, kulturId, harKultur) {
    const doc =
        harKultur && (kulturId ?? "").toString().trim()
            ? await loadFolkslag5Doc(kulturId)
            : await loadFolkslag5Doc(primaryId);
    if (!doc?.system?.sprak?.length) return [];
    const out = [];
    for (const sprakRad of doc.system.sprak) {
        const uuid = sprakRad.uuid ?? "";
        const label = (sprakRad.name ?? sprakRad.label ?? "").toString().trim() || uuid;
        if (uuid || label) out.push({ uuid, label });
    }
    return out;
}

/**
 * @param {object} mergedDraft
 * @returns {Promise<string>}
 */
export async function buildBakgrundFolkslagString(mergedDraft) {
    const primarId = (mergedDraft.folkslag ?? "").toString().trim();
    const kulturId = mergedDraft.harKulturfolkslag ? (mergedDraft.kulturfolkslag ?? "").toString().trim() : "";
    const primarDoc = await loadFolkslag5Doc(primarId);
    const primarNamn = (primarDoc?.name ?? "").trim();
    if (!kulturId) return primarNamn;
    const kulturDoc = await loadFolkslag5Doc(kulturId);
    const kulturNamn = (kulturDoc?.name ?? "").trim();
    if (primarNamn && kulturNamn) return `${primarNamn}, ${kulturNamn}`;
    return primarNamn || kulturNamn;
}

/**
 * Partial wizardData som nollställer folkslagsderived data vid byte av primärt folkslag.
 * @returns {object}
 */
export function getFolkslagPrimaryChangeResetPatch() {
    return {
        harKulturfolkslag: false,
        kulturfolkslag: "",
        kulturfolkslagSelectEnabled: false,
        folkValfriaValda: [],
        folkValfriaPoolUuids: [],
        folkslagKulturDialogBesvarad: false
    };
}

/**
 * @param {object} draft
 * @param {FolkslagEgenskapRef[]} valfriaPool
 * @returns {{ ok: boolean, message?: string }}
 */
export function validateValfriaEgenskaperForFinish(draft, valfriaPool) {
    const poolSize = valfriaPool?.length ?? 0;
    const valda = Array.isArray(draft.folkValfriaValda) ? draft.folkValfriaValda.map((uuid) => String(uuid)) : [];
    if (poolSize > 2) {
        const uniq = [...new Set(valda.filter(Boolean))];
        if (uniq.length !== 2) {
            return {
                ok: false,
                message: game.i18n.localize("eon.wizard.errorValfriaTva")
            };
        }
    }
    return { ok: true };
}

/**
 * Slå upp visningsnamn + beskrivning för folkslags-egenskapsrefs.
 * @param {FolkslagEgenskapRef[]} refs
 * @returns {Promise<{ uuid: string, label: string, beskrivning: string }[]>}
 */
export async function enrichEgenskapRefsForDisplay(refs) {
    const pack = game.packs.get(FOLKSLAGSEGENSKAPER5_PACK);
    /** @type {Item[]} */
    let docs = [];
    if (pack) {
        try {
            docs = await pack.getDocuments({ type: "Egenskap" });
        } catch {
            docs = [];
        }
    }
    return (refs ?? []).map((ref) => {
        const refUuid = normalizeEgenskapRefKey(ref);
        const egenskapDoc = refUuid ? docs.find((d) => d.uuid === refUuid) : null;
        const fallbackLabel = (ref.label ?? ref.namn ?? refUuid).toString();
        return {
            uuid: refUuid,
            label: egenskapDoc ? (egenskapDoc.name ?? "").trim() || fallbackLabel : fallbackLabel,
            beskrivning: (egenskapDoc?.system?.beskrivning ?? ref.beskrivning ?? "").toString()
        };
    });
}

/**
 * Startspråk med namn från kompendium sprak5 (om uuid matchar).
 * @param {string} primaryId
 * @param {string} kulturId
 * @param {boolean} harKultur
 * @returns {Promise<{ uuid: string, label: string }[]>}
 */
export async function resolveStartsprakRowsWithPack(primaryId, kulturId, harKultur) {
    const base = await resolveStartsprakRows(primaryId, kulturId, harKultur);
    const pack = game.packs.get(SPRAK5_PACK);
    if (!pack) return base;
    /** @type {Item[]} */
    let docs = [];
    try {
        docs = await pack.getDocuments({ type: "Språk" });
    } catch {
        return base;
    }
    return base.map((sprakRad) => {
        const sprakUuid = (sprakRad.uuid ?? "").toString();
        const sprakDoc = sprakUuid ? docs.find((d) => d.uuid === sprakUuid) : null;
        return {
            uuid: sprakUuid,
            label: sprakDoc ? (sprakDoc.name ?? "").trim() || sprakRad.label : sprakRad.label
        };
    });
}
