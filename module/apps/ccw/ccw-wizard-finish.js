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
    const version = game.system.version;

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
        const niva1Text = (row.niva1 ?? "").toString().trim();
        const niva2Text = (row.niva2 ?? "").toString().trim();
        const niva3Text = (row.niva3 ?? "").toString().trim();
        if (!namn && !niva1Text && !niva2Text && !niva3Text) continue;
        const karaktarsdrag = emptyDrag();
        karaktarsdrag.namn = namn;
        karaktarsdrag.niva1.text = niva1Text;
        karaktarsdrag.niva2.text = niva2Text;
        karaktarsdrag.niva3.text = niva3Text;
        out.push(karaktarsdrag);
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
    const version = game.system.version;
    const mergedDraft = foundry.utils.mergeObject(defaultWizardData(), wizardData, { inplace: false, recursive: true });

    const actorData = foundry.utils.duplicate(actor);

    if (actorData.system.installningar.eon !== "eon5") {
        actorData.system.installningar.eon = "eon5";
    }

    const bakgrund = actorData.system.bakgrund;
    bakgrund.koncept = mergedDraft.koncept ?? "";
    bakgrund.hemland = mergedDraft.hemland ?? "";
    bakgrund.hemort = mergedDraft.hemort ?? "";
    bakgrund.folkslag = await buildBakgrundFolkslagString(mergedDraft);
    const kultDocFin = mergedDraft.harKulturfolkslag ? await loadFolkslag5Doc(mergedDraft.kulturfolkslag) : null;
    bakgrund.kulturfolkslag = mergedDraft.harKulturfolkslag && kultDocFin ? (kultDocFin.name ?? "").trim() : "";
    bakgrund.religion = mergedDraft.religion ?? "";
    const wizardDoktrin = Array.isArray(mergedDraft.doktrinRader) ? mergedDraft.doktrinRader : [];
    bakgrund.doktriner = wizardDoktrin
        .map((rad) => (rad?.beskrivning ?? "").toString().trim())
        .filter((rad) => rad.length > 0)
        .join("\n");
    bakgrund.arketyp = mergedDraft.arketyp ?? "";
    bakgrund.varv = mergedDraft.varv ?? "";
    bakgrund.miljo = mergedDraft.miljo ?? "";
    bakgrund.levnadsstandard = mergedDraft.levnadsstandard ?? "";
    bakgrund.alder = mergedDraft.alder ?? "";
    bakgrund.kon = (mergedDraft.kon ?? "").toString().trim();
    bakgrund.titel = (mergedDraft.titel ?? "").toString().trim();
    bakgrund.utseende = (mergedDraft.utseende ?? "").toString();
    bakgrund.relationer = (mergedDraft.relationer ?? "").toString();

    const rollNamn = (mergedDraft.rollpersonNamn ?? "").toString().trim();
    if (rollNamn) actorData.name = rollNamn;

    if (!actorData.system.strid) actorData.system.strid = {};
    const vapenarm = (mergedDraft.vapenarm ?? "").toString().trim();
    if (vapenarm === "hoger" || vapenarm === "vanster" || vapenarm === "annat") {
        actorData.system.strid.vapenarm = vapenarm;
    }
    actorData.system.kretsar = (Array.isArray(mergedDraft.kretsarRader) ? mergedDraft.kretsarRader : [])
        .map((rad) => ({
            namn: (rad?.namn ?? "").toString().trim(),
            anteckning: (rad?.anteckning ?? "").toString().trim()
        }))
        .filter((rad) => rad.namn.length > 0 || rad.anteckning.length > 0);
    actorData.system.foljeslagare = (Array.isArray(mergedDraft.foljeslagareRader) ? mergedDraft.foljeslagareRader : [])
        .map((rad) => ({
            namn: (rad?.namn ?? "").toString().trim(),
            anteckning: (rad?.anteckning ?? "").toString().trim()
        }))
        .filter((rad) => rad.namn.length > 0 || rad.anteckning.length > 0);

    const beskrivBits = [];
    if ((mergedDraft.bakgrund ?? "").trim()) beskrivBits.push(mergedDraft.bakgrund.trim());
    if ((mergedDraft.startkapital ?? "").trim()) {
        beskrivBits.push(`${game.i18n.localize("eon.sheets.actor.startkapital")}: ${mergedDraft.startkapital.trim()}`);
    }
    if ((mergedDraft.detaljer ?? "").trim()) beskrivBits.push(mergedDraft.detaljer.trim());

    if (beskrivBits.length) {
        const beskrivningsBlock = beskrivBits.join("\n\n");
        const existing = (bakgrund.beskrivning ?? "").toString();
        bakgrund.beskrivning = existing ? `${existing}\n\n${beskrivningsBlock}` : beskrivningsBlock;
    }

    const avtrubbning = actorData.system.egenskap.avtrubbning;
    // Schema: utsatthet, vald, övernaturligt — mockup: Valfri kategori, Utsatthet, Våld, Övernaturligt
    avtrubbning.utsatthet = parseIntSafe(mergedDraft.avtrubbning?.utsatthet);
    avtrubbning.vald = parseIntSafe(mergedDraft.avtrubbning?.vald);
    avtrubbning.overnaturligt = parseIntSafe(mergedDraft.avtrubbning?.overnaturligt);
    const valfriKat = parseIntSafe(mergedDraft.avtrubbning?.valfriKategori);
    if (valfriKat) {
        const note = `${game.i18n.localize("eon.sheets.actor.avtrubbningValfriKategoriNote")}: ${valfriKat}`;
        bakgrund.beskrivning = (bakgrund.beskrivning ?? "").toString() ? `${bakgrund.beskrivning}\n\n${note}` : note;
    }

    actorData.system.handelseresultat = (Array.isArray(mergedDraft.handelseResultat) ? mergedDraft.handelseResultat : [])
        .map((rad) => ({
            tabell: (rad?.tabell ?? "").toString().trim(),
            nummer: (rad?.nummer ?? "").toString().trim(),
            anteckning: (rad?.anteckning ?? "").toString().trim()
        }))
        .filter((rad) => rad.tabell.length > 0 || rad.nummer.length > 0 || rad.anteckning.length > 0);

    const handelseSlagDraft = mergedDraft.handelseSlag ?? {};
    actorData.system.handelseSlag = {
        valfri: parseIntSafe(handelseSlagDraft.valfri),
        farder: parseIntSafe(handelseSlagDraft.farder),
        intriger: parseIntSafe(handelseSlagDraft.intriger),
        mirakel: parseIntSafe(handelseSlagDraft.mirakel),
        strider: parseIntSafe(handelseSlagDraft.strider),
        studier: parseIntSafe(handelseSlagDraft.studier),
        trolldom: parseIntSafe(handelseSlagDraft.trolldom)
    };

    const harleddegenskaper = actorData.system.harleddegenskaper;
    for (const key of HARLEDDA_KEYS) {
        const harleddRad = mergedDraft.harledd?.[key] ?? {};
        const grundVarde = parseIntSafe(harleddRad.grund);
        const bonusVarde = parseIntSafe(harleddRad.bonus);
        if (key === "visdom") {
            harleddegenskaper.visdom = {
                varde: grundVarde + bonusVarde,
                hojningar: harleddegenskaper.visdom?.hojningar ?? 0
            };
            continue;
        }
        const t6Pool = attributVardeTillHarleddT6Attribut(grundVarde + bonusVarde);
        const attribut = harleddegenskaper[key];
        if (attribut?.grund) {
            attribut.grund.tvarde = t6Pool.tvarde;
            attribut.grund.bonus = t6Pool.bonus;
            attribut.bonuslista = Array.isArray(attribut.bonuslista) ? attribut.bonuslista : [];
            const totalt = await CalculateHelper.BeraknaTotaltVarde(attribut);
            if (totalt && typeof totalt === "object") attribut.totalt = totalt;
        }
    }
    const extraAttr = parseIntSafe(mergedDraft.extraAttributPoang);
    if (extraAttr && actorData.system.harleddegenskaper) {
        // Ingen dedikerad slot i schema — anteckna i beskrivning
        if (extraAttr) {
            const note = `${game.i18n.localize("eon.wizard.valfriaAttributPoangLabel")}: ${extraAttr}`;
            bakgrund.beskrivning = (bakgrund.beskrivning ?? "").toString() ? `${bakgrund.beskrivning}\n\n${note}` : note;
        }
    }

    await CalculateHelper.beraknaGrundrustningOchGrundskadaEon5(actorData);

    await ensureRollperson5StartingItems(actor);

    {
        const fardighetFordelning = mergedDraft.fardighetFordelning ?? {};
        /** @type {{ _id: string, system: Record<string, unknown> }[]} */
        const updates = [];
        for (const fardighetsGruppKey of ENHETER_FARDIGHET_GRUPP_KEYS) {
            const rows = Array.isArray(fardighetFordelning[fardighetsGruppKey]) ? fardighetFordelning[fardighetsGruppKey] : [];
            for (const row of rows) {
                const itemId = (row.itemId ?? "").toString().trim();
                if (!itemId) continue;
                const itemDoc = actor.items.get(itemId);
                if (!itemDoc || !wizardFardighetItemMatchesWizardKey(fardighetsGruppKey, itemDoc)) continue;
                if (WIZARD_OVRIGA_ENHET_KEYS.includes(fardighetsGruppKey)) {
                    const poang = clampWizardFardighetPoangValue(row.poang, false);
                    const combinedFv = Math.min(CCW_FARDIGHET_ENHETER_MAX, poang);
                    const t6Pool = fardighetsvardeToTvardeBonus(combinedFv);
                    const instPrev = foundry.utils.duplicate(itemDoc.system?.installningar ?? {});
                    const installningar = foundry.utils.mergeObject(
                        instPrev,
                        { talang: false, inkompetent: false, blockering: false },
                        { inplace: false, recursive: true }
                    );
                    updates.push({
                        _id: itemId,
                        system: {
                            varde: {
                                tvarde: t6Pool.tvarde,
                                bonus: t6Pool.bonus
                            },
                            installningar
                        }
                    });
                    continue;
                }
                const inkompetent = !!row.inkompetent;
                const blockering = !!row.blockering;
                const grundvarde = clampWizardFardighetGrundvardeForInkompetentValue(row.grundvarde, inkompetent);
                const poang = clampWizardFardighetPoangValueForRow(row.poang, inkompetent, blockering, grundvarde);
                const maxFardighetsvarde = inkompetent ? 1 : CCW_FARDIGHET_ENHETER_MAX;
                const combinedFv = Math.min(maxFardighetsvarde, grundvarde + poang);
                const t6Pool = fardighetsvardeToTvardeBonus(combinedFv);
                /** @type {Record<string, unknown>} */
                const systemUpdate = {
                    varde: {
                        tvarde: t6Pool.tvarde,
                        bonus: t6Pool.bonus
                    },
                    installningar: {
                        talang: !!row.talang,
                        inkompetent,
                        blockering
                    }
                };
                updates.push({
                    _id: itemId,
                    system: systemUpdate
                });
            }
        }
        if (updates.length) await actor.updateEmbeddedDocuments("Item", updates);
    }

    {
        const sprakFordelning = Array.isArray(mergedDraft.sprakFordelning) ? mergedDraft.sprakFordelning : [];
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
        for (const row of sprakFordelning) {
            const itemId = (row.itemId ?? "").toString().trim();
            if (!itemId) continue;
            const itemDoc = actor.items.get(itemId);
            if (!itemDoc || itemDoc.type !== "Språk") continue;
            const uuid = (itemDoc.getFlag(scope, CCW_EGENSKAP_SOURCE_UUID_FLAG) ?? "").toString().trim();
            const kallaSprakDoc = uuid ? sprakDocs.find((doc) => doc.uuid === uuid) : null;
            const fardighetsvarde = kallaSprakDoc
                ? defaultWizardFardighetGrundFardighetsvarde(kallaSprakDoc, "sprak", false)
                : defaultWizardFardighetGrundFardighetsvarde(itemDoc, "sprak", false);
            const t6Pool = fardighetsvardeToTvardeBonus(fardighetsvarde);
            sprakUpdates.push({
                _id: itemId,
                system: {
                    varde: {
                        tvarde: t6Pool.tvarde,
                        bonus: t6Pool.bonus,
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
            foljeslagare: actorData.system.foljeslagare,
            handelseresultat: actorData.system.handelseresultat,
            handelseSlag: actorData.system.handelseSlag
        }
    });

    await actor.unsetFlag(EON_CCW_FLAG_SCOPE, "wizardData");
    await actor.unsetFlag(EON_CCW_FLAG_SCOPE, "wizardActiveTab");
}