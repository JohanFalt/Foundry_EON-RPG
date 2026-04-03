/**
 * Slutför karaktärsskapande: validering och skrivning till actor.
 * @module ccw/ccw-wizard-finish
 */

import CreateHelper from "../../create-helper.js";
import ItemHelper from "../../item-helper.js";
import CalculateHelper from "../../calculate-helper.js";
import {
    buildBakgrundFolkslagString,
    validateValfriaEgenskaperForFinish,
    partitionFolkslagEgenskaper,
    loadFolkslag5Doc,
    SPRAK5_PACK,
    CCW_EGENSKAP_SOURCE_UUID_FLAG
} from "../folkslag-wizard-helper.js";
import { getGrundrustningOchGrundskadaFromKroppsbyggnadVarde } from "../eon5-kroppsbyggnad-derived.js";
import {
    EON_CCW_FLAG_SCOPE,
    HARLEDDA_KEYS,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    WIZARD_OVRIGA_ENHET_KEYS,
    CCW_FARDIGHET_ENHETER_MAX
} from "./ccw-constants-keys.js";
import { defaultWizardData } from "./ccw-wizard-draft-defaults.js";
import {
    attributVardeTillHarleddT6Attribut,
    wizardFardighetItemMatchesWizardKey,
    clampWizardFardighetPoangValue,
    clampWizardFardighetGrundvardeForInkompetentValue,
    clampWizardFardighetPoangValueForRow,
    fardighetsvardeToTvardeBonus,
    defaultWizardFardighetGrundFardighetsvarde
} from "./ccw-fardighet-rules.js";

/**
 * @param {string} valueString
 * @returns {number}
 */
function parseIntSafe(valueString) {
    const parsed = parseInt(String(valueString).trim(), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Kopiera `Folkslag5.system.attribut` till utkastets harledd.grund (G-fälten i översikt och grundegenskapsflik).
 * @param {Item} primaryDoc
 * @param {object} mergedDraft
 */
export function applyPrimaryFolkslagAttributToMergedDraft(primaryDoc, mergedDraft) {
    const folkslagAttribut = primaryDoc?.system?.attribut ?? {};
    for (const key of HARLEDDA_KEYS) {
        const rawVarde = folkslagAttribut[key];
        if (rawVarde !== undefined && rawVarde !== null && mergedDraft.harledd?.[key]) {
            mergedDraft.harledd[key].grund = String(rawVarde);
        }
    }
}

/**
 * Validering av valfria egenskaper inför Slutför.
 * @param {object} mergedDraft
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function validateFolkslagWizardForFinish(mergedDraft) {
    if (!(mergedDraft.folkslag ?? "").toString().trim()) return { ok: true };
    const primarDoc = await loadFolkslag5Doc(mergedDraft.folkslag);
    if (!primarDoc) return { ok: true };
    const kulturDoc = mergedDraft.harKulturfolkslag ? await loadFolkslag5Doc(mergedDraft.kulturfolkslag) : null;
    const { valfriaPoolRefs } = partitionFolkslagEgenskaper(
        primarDoc,
        kulturDoc,
        !!(mergedDraft.harKulturfolkslag && kulturDoc)
    );
    return validateValfriaEgenskaperForFinish(mergedDraft, valfriaPoolRefs);
}

/**
 * Idempotent: skapar alla Eon 5-färdigheter och obeväpnat närstridsvapen om de saknas.
 * Används under pågående karaktärsskapande så att rollformuläret har items innan wizarden är klar,
 * och vid slutför utan att skapa dubbletter.
 * @param {Actor} actor
 */
export async function ensureRollperson5StartingItems(actor) {
    if (!actor || actor.type !== "Rollperson5") return;
    const version = game.data.system.version;

    const hasFardighet = actor.items?.some((item) => item.type === "Färdighet");
    if (!hasFardighet) {
        await CreateHelper.SkapaFardigheter(actor, CONFIG.EON, version);
    }

    const hasObevapnad = actor.items?.some(
        (item) =>
            item.type === "Närstridsvapen" &&
            item.system?.grupp == "slagsmal" &&
            item.system?.mall == "obevapnad"
    );
    if (!hasObevapnad) {
        const doc = await ItemHelper.findNarstridsvapen5InCompendium({
            grupp: "slagsmal",
            mall: "obevapnad"
        });
        if (doc) {
            const itemData = doc.toObject();
            delete itemData._id;
            await actor.createEmbeddedDocuments("Item", [itemData]);
        } else {
            console.warn(
                "[eon-rpg] ensureRollperson5StartingItems: inget närstridsvapen (slagsmal/obevapnad) i eon-rpg.narstridsvapen5"
            );
        }
    }
}

/**
 * Bygg `system.egenskap.karaktärsdrag` (Eon 5) från wizardrader; tomma rader utelämnas.
 * @param {Array<{ namn?: string, niva1?: string, niva2?: string, niva3?: string }>} rows
 * @returns {object[]}
 */
function buildEon5KaraktarsdragFromWizardRows(rows) {
    const out = [];
    const emptyDrag = () => ({
        namn: "",
        niva1: { vald: 0, text: "" },
        niva2: { vald: 0, text: "" },
        niva3: { vald: 0, text: "" },
        last: 0,
        svarighet: 0,
        tvivel: 0,
        storning: 0
    });
    for (const row of rows) {
        if (!row || typeof row !== "object") continue;
        const namn = (row.namn ?? "").toString().trim();
        const n1 = (row.niva1 ?? "").toString().trim();
        const n2 = (row.niva2 ?? "").toString().trim();
        const n3 = (row.niva3 ?? "").toString().trim();
        if (!namn && !n1 && !n2 && !n3) continue;
        const d = emptyDrag();
        d.namn = namn;
        d.niva1.text = n1;
        d.niva2.text = n2;
        d.niva3.text = n3;
        out.push(d);
    }
    return out;
}

/**
 * Fas 1: kräv rollpersonsnamn.
 * @param {Actor} actor
 */
/**
 * @param {Actor} actor
 * @param {object | null} [wizardDraft] Om satt: använd `rollpersonNamn` som primär källa för namnkrav.
 */
export function validateFas1Finish(actor, wizardDraft = null) {
    const fromDraft =
        wizardDraft && typeof wizardDraft === "object"
            ? (wizardDraft.rollpersonNamn ?? "").toString().trim()
            : "";
    const fromActor = (actor?.name ?? "").toString().trim();
    const name = fromDraft || fromActor;
    if (!name) {
        return { ok: false, message: game.i18n.localize("eon.wizard.errorNamnKravs") };
    }
    return { ok: true };
}

/**
 * Slutför skapande: grundsetup + bakgrund/härledda enligt wizardutkast.
 * @param {Actor} actor
 * @param {object} wizardData
 */
export async function applyCharacterCreationFinish(actor, wizardData) {
    const version = game.data.system.version;
    const mergedDraft = foundry.utils.mergeObject(defaultWizardData(), wizardData, { inplace: false, recursive: true });

    const actorData = foundry.utils.duplicate(actor);

    if (actorData.system.installningar.eon !== "eon5") {
        actorData.system.installningar.eon = "eon5";
    }

    const bg = actorData.system.bakgrund;
    bg.koncept = mergedDraft.koncept ?? "";
    bg.hemland = mergedDraft.hemland ?? "";
    bg.hemort = mergedDraft.hemort ?? "";
    bg.folkslag = await buildBakgrundFolkslagString(mergedDraft);
    const kultDocFin = mergedDraft.harKulturfolkslag ? await loadFolkslag5Doc(mergedDraft.kulturfolkslag) : null;
    bg.kulturfolkslag = mergedDraft.harKulturfolkslag && kultDocFin ? (kultDocFin.name ?? "").trim() : "";
    bg.religion = mergedDraft.religion ?? "";
    const wizardDoktrin = Array.isArray(mergedDraft.doktrinRader) ? mergedDraft.doktrinRader : [];
    bg.doktriner = wizardDoktrin
        .map((rad) => (rad?.beskrivning ?? "").toString().trim())
        .filter((rad) => rad.length > 0)
        .join("\n");
    bg.arketyp = mergedDraft.arketyp ?? "";
    bg.varv = mergedDraft.varv ?? "";
    bg.miljo = mergedDraft.miljo ?? "";
    bg.levnadsstandard = mergedDraft.levnadsstandard ?? "";
    bg.alder = mergedDraft.alder ?? "";
    bg.kon = (mergedDraft.kon ?? "").toString().trim();
    bg.titel = (mergedDraft.titel ?? "").toString().trim();
    bg.utseende = (mergedDraft.utseende ?? "").toString();
    bg.relationer = (mergedDraft.relationer ?? "").toString();

    const rollNamn = (mergedDraft.rollpersonNamn ?? "").toString().trim();
    if (rollNamn) actorData.name = rollNamn;

    if (!actorData.system.strid) actorData.system.strid = {};
    const va = (mergedDraft.vapenarm ?? "").toString().trim();
    if (va === "hoger" || va === "vanster" || va === "annat") {
        actorData.system.strid.vapenarm = va;
    }
    actorData.system.kretsar = (Array.isArray(mergedDraft.kretsarRader) ? mergedDraft.kretsarRader : [])
        .map((r) => ({
            namn: (r?.namn ?? "").toString().trim(),
            anteckning: (r?.anteckning ?? "").toString().trim()
        }))
        .filter((r) => r.namn.length > 0 || r.anteckning.length > 0);
    actorData.system.foljeslagare = (Array.isArray(mergedDraft.foljeslagareRader) ? mergedDraft.foljeslagareRader : [])
        .map((r) => ({
            namn: (r?.namn ?? "").toString().trim(),
            anteckning: (r?.anteckning ?? "").toString().trim()
        }))
        .filter((r) => r.namn.length > 0 || r.anteckning.length > 0);

    const beskrivBits = [];
    if ((mergedDraft.bakgrund ?? "").trim()) beskrivBits.push(mergedDraft.bakgrund.trim());
    if ((mergedDraft.startkapital ?? "").trim()) {
        beskrivBits.push(`${game.i18n.localize("eon.sheets.actor.startkapital")}: ${mergedDraft.startkapital.trim()}`);
    }
    const utseendeTxt = (mergedDraft.utseende ?? "").toString().trim();
    if (utseendeTxt) {
        beskrivBits.push(
            `${game.i18n.localize("eon.sheets.actor.utseende")}\n${utseendeTxt}`
        );
    }
    if ((mergedDraft.detaljer ?? "").trim()) beskrivBits.push(mergedDraft.detaljer.trim());

    if (beskrivBits.length) {
        const block = beskrivBits.join("\n\n");
        const existing = (bg.beskrivning ?? "").toString();
        bg.beskrivning = existing ? `${existing}\n\n${block}` : block;
    }

    const avt = actorData.system.egenskap.avtrubbning;
    // Schema: utsatthet, vald, övernaturligt — mockup: Valfri kategori, Utsatthet, Våld, Övernaturligt
    avt.utsatthet = parseIntSafe(mergedDraft.avtrubbning?.utsatthet);
    avt.vald = parseIntSafe(mergedDraft.avtrubbning?.vald);
    avt.overnaturligt = parseIntSafe(mergedDraft.avtrubbning?.overnaturligt);
    const valfriKat = parseIntSafe(mergedDraft.avtrubbning?.valfriKategori);
    if (valfriKat) {
        const note = `${game.i18n.localize("eon.sheets.actor.avtrubbningValfriKategoriNote")}: ${valfriKat}`;
        bg.beskrivning = (bg.beskrivning ?? "").toString() ? `${bg.beskrivning}\n\n${note}` : note;
    }

    const handelseLabel = (tabKey) => {
        const tabellKey = (tabKey ?? "").toString().trim();
        /** @type {Record<string, string>} */
        const labels = {
            valfri: "eon.wizard.htValfri",
            farder: "eon.wizard.htFarder",
            intriger: "eon.wizard.htIntriger",
            mirakel: "eon.wizard.htMirakel",
            strider: "eon.wizard.htStrider",
            studier: "eon.wizard.htStudier",
            trolldom: "eon.wizard.htTrolldom"
        };
        const path = labels[tabellKey];
        return path ? game.i18n.localize(path) : tabellKey;
    };
    const handelseRader = Array.isArray(mergedDraft.handelseResultat) ? mergedDraft.handelseResultat : [];
    const handelseLines = handelseRader
        .map((rad) => {
            const tab = (rad.tabell ?? "").toString().trim();
            const nr = (rad.nummer ?? "").toString().trim();
            const ant = (rad.anteckning ?? "").toString().trim();
            if (!tab && !nr && !ant) return "";
            const tabellNamn = tab ? handelseLabel(tab) : "";
            const nrDel = nr ? `#${nr}` : "";
            const delar = [tabellNamn, nrDel, ant].filter(Boolean);
            return delar.join(" — ");
        })
        .filter(Boolean);
    if (handelseLines.length) {
        const rubrik = game.i18n.localize("eon.wizard.handelseResultatRubrik");
        const note = `${rubrik}\n${handelseLines.join("\n")}`;
        bg.beskrivning = (bg.beskrivning ?? "").toString() ? `${bg.beskrivning}\n\n${note}` : note;
    }

    const hd = actorData.system.harleddegenskaper;
    for (const key of HARLEDDA_KEYS) {
        const row = mergedDraft.harledd?.[key] ?? {};
        const grundVarde = parseIntSafe(row.grund);
        const bonusVarde = parseIntSafe(row.bonus);
        if (key === "visdom") {
            hd.visdom = grundVarde + bonusVarde;
            continue;
        }
        const pool = attributVardeTillHarleddT6Attribut(grundVarde + bonusVarde);
        const attr = hd[key];
        if (attr?.grund) {
            attr.grund.tvarde = pool.tvarde;
            attr.grund.bonus = pool.bonus;
            attr.bonuslista = Array.isArray(attr.bonuslista) ? attr.bonuslista : [];
            const tot = await CalculateHelper.BeraknaTotaltVarde(attr);
            if (tot && typeof tot === "object") attr.totalt = tot;
        }
    }
    const extraAttr = parseIntSafe(mergedDraft.extraAttributPoang);
    if (extraAttr && actorData.system.harleddegenskaper) {
        // Ingen dedikerad slot i schema — anteckna i beskrivning
        if (extraAttr) {
            const note = `${game.i18n.localize("eon.wizard.valfriaAttributPoangLabel")}: ${extraAttr}`;
            bg.beskrivning = (bg.beskrivning ?? "").toString() ? `${bg.beskrivning}\n\n${note}` : note;
        }
    }

    // Grundrustning och grundskada från kroppsbyggnad (tabell); modifierare/bonuslista på grundskada och bonuslista på rustning appliceras efter.
    const kbRow = mergedDraft.harledd?.kroppsbyggnad ?? {};
    let kbVarde = parseIntSafe(kbRow.grund) + parseIntSafe(kbRow.bonus);
    if (kbVarde < 4) kbVarde = 4;
    const { rustning, grundskada: grundskadaTabell } = getGrundrustningOchGrundskadaFromKroppsbyggnadVarde(kbVarde);
    const hdPost = actorData.system.harleddegenskaper;
    if (hdPost?.grundrustning) {
        if (!hdPost.grundrustning.bonuslista?.length) {
            hdPost.grundrustning.varde = rustning;
            hdPost.grundrustning.totalt = rustning;
        } else {
            hdPost.grundrustning.varde = rustning;
            hdPost.grundrustning.totalt = await CalculateHelper.BeraknaTotaltVarde(hdPost.grundrustning);
        }
    }
    if (hdPost?.grundskada?.grund) {
        hdPost.grundskada.bonuslista = hdPost.grundskada.bonuslista ?? [];
        hdPost.grundskada.grund.tvarde = grundskadaTabell.tvarde;
        hdPost.grundskada.grund.bonus = grundskadaTabell.bonus;
        if (hdPost.grundskada.modifierare) {
            hdPost.grundskada.grund.tvarde += parseInt(hdPost.grundskada.modifierare.tvarde ?? 0, 10) || 0;
            hdPost.grundskada.grund.bonus += parseInt(hdPost.grundskada.modifierare.bonus ?? 0, 10) || 0;
        }
        const grundskadaTotalt = await CalculateHelper.BeraknaTotaltVarde(hdPost.grundskada);
        if (grundskadaTotalt && typeof grundskadaTotalt === "object") {
            hdPost.grundskada.totalt = grundskadaTotalt;
        }
    }

    await ensureRollperson5StartingItems(actor);

    {
        const fd = mergedDraft.fardighetFordelning ?? {};
        /** @type {{ _id: string, system: Record<string, unknown> }[]} */
        const updates = [];
        for (const gKey of ENHETER_FARDIGHET_GRUPP_KEYS) {
            const rows = Array.isArray(fd[gKey]) ? fd[gKey] : [];
            for (const row of rows) {
                const id = (row.itemId ?? "").toString().trim();
                if (!id) continue;
                const itemDoc = actor.items.get(id);
                if (!itemDoc || !wizardFardighetItemMatchesWizardKey(gKey, itemDoc)) continue;
                if (WIZARD_OVRIGA_ENHET_KEYS.includes(gKey)) {
                    const p = clampWizardFardighetPoangValue(row.poang, false);
                    const combinedFv = Math.min(CCW_FARDIGHET_ENHETER_MAX, p);
                    const pool = fardighetsvardeToTvardeBonus(combinedFv);
                    const instPrev = foundry.utils.duplicate(itemDoc.system?.installningar ?? {});
                    const installningar = foundry.utils.mergeObject(
                        instPrev,
                        { talang: false, inkompetent: false, blockering: false },
                        { inplace: false, recursive: true }
                    );
                    updates.push({
                        _id: id,
                        system: {
                            varde: {
                                tvarde: pool.tvarde,
                                bonus: pool.bonus
                            },
                            installningar
                        }
                    });
                    continue;
                }
                const inkR = !!row.inkompetent;
                const blockR = !!row.blockering;
                const g0 = clampWizardFardighetGrundvardeForInkompetentValue(row.grundvarde, inkR);
                const p = clampWizardFardighetPoangValueForRow(row.poang, inkR, blockR, g0);
                const capFv = inkR ? 1 : CCW_FARDIGHET_ENHETER_MAX;
                const combinedFv = Math.min(capFv, g0 + p);
                const pool = fardighetsvardeToTvardeBonus(combinedFv);
                /** @type {Record<string, unknown>} */
                const sys = {
                    varde: {
                        tvarde: pool.tvarde,
                        bonus: pool.bonus
                    },
                    installningar: {
                        talang: !!row.talang,
                        inkompetent: !!row.inkompetent,
                        blockering: !!row.blockering
                    }
                };
                updates.push({
                    _id: id,
                    system: sys
                });
            }
        }
        if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    }

    {
        const sf = Array.isArray(mergedDraft.sprakFordelning) ? mergedDraft.sprakFordelning : [];
        const pack = game.packs.get(SPRAK5_PACK);
        /** @type {Item[]} */
        let sprakDocs = [];
        if (pack) {
            try {
                sprakDocs = await pack.getDocuments({ type: "Språk" });
            } catch {
                sprakDocs = [];
            }
        }
        /** @type {{ _id: string, system: Record<string, unknown> }[]} */
        const sprakUpdates = [];
        const scope = EON_CCW_FLAG_SCOPE;
        for (const row of sf) {
            const id = (row.itemId ?? "").toString().trim();
            if (!id) continue;
            const itemDoc = actor.items.get(id);
            if (!itemDoc || itemDoc.type !== "Språk") continue;
            const uuid = (itemDoc.getFlag(scope, CCW_EGENSKAP_SOURCE_UUID_FLAG) ?? "").toString().trim();
            const src = uuid ? sprakDocs.find((d) => d.uuid === uuid) : null;
            const fv = src
                ? defaultWizardFardighetGrundFardighetsvarde(src, "sprak", false)
                : defaultWizardFardighetGrundFardighetsvarde(itemDoc, "sprak", false);
            const pool = fardighetsvardeToTvardeBonus(fv);
            sprakUpdates.push({
                _id: id,
                system: {
                    varde: {
                        tvarde: pool.tvarde,
                        bonus: pool.bonus,
                        bonuslista: []
                    }
                }
            });
        }
        if (sprakUpdates.length) await actor.updateEmbeddedDocuments("Item", sprakUpdates);
    }

    actorData.system.egenskap.karaktärsdrag = buildEon5KaraktarsdragFromWizardRows(
        Array.isArray(mergedDraft.karaktarsdrag) ? mergedDraft.karaktarsdrag : []
    );

    actorData.system.installningar.skapad = true;
    actorData.system.installningar.version = version;

    await actor.update({
        name: actorData.name,
        system: {
            installningar: actorData.system.installningar,
            bakgrund: actorData.system.bakgrund,
            strid: actorData.system.strid,
            egenskap: actorData.system.egenskap,
            harleddegenskaper: actorData.system.harleddegenskaper,
            kretsar: actorData.system.kretsar,
            foljeslagare: actorData.system.foljeslagare
        }
    });

    await actor.unsetFlag(EON_CCW_FLAG_SCOPE, "wizardData");
    await actor.unsetFlag(EON_CCW_FLAG_SCOPE, "wizardActiveTab");
}