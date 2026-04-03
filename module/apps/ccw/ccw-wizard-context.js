/**
 * Bygger Handlebars-kontext för {@link CharacterCreationWizard} (flikar, rader, HTML-alternativ).
 * @module ccw/ccw-wizard-context
 */

import ItemHelper from "../../item-helper.js";
import {
    EON_CCW_FLAG_SCOPE,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    WIZARD_OVRIGA_ENHET_KEYS,
    CCW_WIZARD_CREATED_FARDIGHET_ROW
} from "./ccw-constants-keys.js";
import { formatWizardFardighetRowSlutligT6 } from "./ccw-fardighet-rules.js";
import { getMergedWizardData } from "./ccw-wizard-draft-merge.js";
import { ensureRollperson5StartingItems } from "./ccw-wizard-finish.js";
import {
    loadFolkslag5Doc,
    partitionFolkslagEgenskaper,
    normalizeEgenskapRefKey,
    enrichEgenskapRefsForDisplay,
    resolveStartsprakRowsWithPack,
    CCW_EGENSKAP_SOURCE_UUID_FLAG,
    CCW_FOLKSLAG_MANAGED_FLAG
} from "../folkslag-wizard-helper.js";
import {
    buildFolkslag5OptionsHtml,
    buildKulturFolkslag5OptionsHtml,
    buildHandelseTabellOptionsHtml,
    buildFardighetItemOptionsHtml,
    buildSprakItemOptionsHtml,
    fardighetItemDisplayName
} from "./ccw-template-html.js";

/** @type {Record<string, string>} */
const ENHET_LABEL_KEYS = {
    valfria: "eon.wizard.fardighetsenheterValfriaUtomFormagor",
    strid: "eon.config.fardighetgrupper.strid",
    rorelse: "eon.config.fardighetgrupper.rorelse",
    mystik: "eon.config.fardighetgrupper.mystik",
    social: "eon.config.fardighetgrupper.social",
    kunskap: "eon.config.fardighetgrupper.kunskap",
    sprak: "eon.config.fardighetgrupper.sprak",
    vildmark: "eon.config.fardighetgrupper.vildmark",
    eExpertiser: "eon.sheets.actor.gruppExpertisKort",
    fFormagor: "eon.sheets.actor.gruppFormagorKort",
    hHantverk: "eon.sheets.actor.gruppHantverkKort",
    kKannetecken: "eon.sheets.actor.gruppKanneteckenKort"
};

/**
 * Fyller i wizard-specifik template-kontext efter `super._prepareContext`.
 * @param {*} wizard CharacterCreationWizard-instans (`this`)
 * @param {object} context
 * @param {object} _options
 * @returns {Promise<object>}
 */
export async function buildCharacterCreationWizardContext(wizard, context, _options) {
    if (wizard.actor?.type === "Rollperson5") {
        await ensureRollperson5StartingItems(wizard.actor);
    }
    let wizardDraft = getMergedWizardData(wizard.actor);
    if (!(wizardDraft.rollpersonNamn ?? "").toString().trim() && (wizard.actor?.name ?? "").toString().trim()) {
        wizardDraft = foundry.utils.mergeObject(
            wizardDraft,
            { rollpersonNamn: wizard.actor.name },
            { inplace: false, recursive: true }
        );
    }
    let activeTab = wizard.actor.flags?.[EON_CCW_FLAG_SCOPE]?.wizardActiveTab ?? "val";
    if (activeTab === "detaljer") activeTab = "namnDetaljer";

    context.actorId = wizard.actor.id;
    context.actorName = wizard.actor.name ?? "";
    context.wizardDraft = wizardDraft;
    context.activeTab = activeTab;
    context.tabVal = activeTab === "val";
    context.tabHandelser = activeTab === "handelser";
    context.tabGrundegenskaper = activeTab === "grundegenskaper";
    context.tabFardigheter = activeTab === "fardigheter";
    context.tabSprak = activeTab === "sprak";
    context.tabKaraktarsdrag = activeTab === "karaktarsdrag";
    context.tabNamnDetaljer = activeTab === "namnDetaljer";
    context.tabUtrustning = activeTab === "utrustning";
    context.tabMystik = activeTab === "mystik";
    context.windowTitle = game.i18n.localize("eon.sheets.actor.karaktarSkapande");

    Object.assign(context, wizard._buildRowContext(wizardDraft));

    context.folkslagOptionsHtml = await buildFolkslag5OptionsHtml(wizardDraft.folkslag);
    context.kulturfolkslagOptionsHtml = await buildKulturFolkslag5OptionsHtml(
        wizardDraft.folkslag,
        wizardDraft.kulturfolkslag
    );
    context.kulturfolkslagSelectEnabled = wizardDraft.kulturfolkslagSelectEnabled === true;

    const handelseRader = Array.isArray(wizardDraft.handelseResultat) ? wizardDraft.handelseResultat : [];
    context.handelseResultatRows = handelseRader.map((row, index) => ({
        tabell: row?.tabell ?? "",
        nummer: row?.nummer ?? "",
        anteckning: row?.anteckning ?? "",
        index,
        tabellOptionsHtml: buildHandelseTabellOptionsHtml(row?.tabell ?? "", index)
    }));

    const fardighetFd = wizardDraft.fardighetFordelning ?? {};
    context.fardighetFordelningSections = ENHETER_FARDIGHET_GRUPP_KEYS.map((fardighetsGruppKey) => {
        const rows = Array.isArray(fardighetFd[fardighetsGruppKey]) ? [...fardighetFd[fardighetsGruppKey]] : [];
        const isOvrigWizardTyp = WIZARD_OVRIGA_ENHET_KEYS.includes(fardighetsGruppKey);
        const isMystikFardighetGrupp = fardighetsGruppKey === "mystik";
        return {
            gruppKey: fardighetsGruppKey,
            label: game.i18n.localize(ENHET_LABEL_KEYS[fardighetsGruppKey] ?? fardighetsGruppKey),
            pool: wizardDraft.enheter[fardighetsGruppKey] ?? "0",
            isOvrigWizardTyp,
            isMystikFardighetGrupp,
            rows: rows.map((row, index) => {
                const itemIdStr = (row?.itemId ?? "").toString().trim();
                const inkR = !!(row?.inkompetent === true || row?.inkompetent === "true");
                const blockR = !!(row?.blockering === true || row?.blockering === "true");
                const itemIdsTakenByOtherRows = new Set();
                for (let peerIndex = 0; peerIndex < rows.length; peerIndex += 1) {
                    if (peerIndex === index) continue;
                    const oid = (rows[peerIndex]?.itemId ?? "").toString().trim();
                    if (oid) itemIdsTakenByOtherRows.add(oid);
                }
                const itemDoc = itemIdStr ? wizard.actor.items.get(itemIdStr) : null;
                const itemLabelHtml = itemDoc ? fardighetItemDisplayName(itemDoc) : "—";
                const rawName = (itemDoc?.name ?? "").toString();
                const itemNamePlain = rawName.startsWith("eon.") ? game.i18n.localize(rawName) : rawName;
                const isWizardCreatedFardighet = !!(row?.[CCW_WIZARD_CREATED_FARDIGHET_ROW]);
                const showWizardMystikNamnInput = isMystikFardighetGrupp && isWizardCreatedFardighet;
                return {
                    itemId: itemIdStr,
                    poang: row?.poang ?? "0",
                    grundvarde: row?.grundvarde ?? "0",
                    talang: !!(row?.talang === true || row?.talang === "true"),
                    inkompetent: inkR,
                    blockering: blockR,
                    index,
                    itemLabelHtml,
                    itemNamePlain,
                    isWizardCreatedFardighet,
                    showWizardMystikNamnInput,
                    slutligT6Display: formatWizardFardighetRowSlutligT6(
                        isOvrigWizardTyp ? "0" : row?.grundvarde ?? "0",
                        row?.poang ?? "0",
                        {
                            ovrigWizardTyp: isOvrigWizardTyp,
                            sprak: false,
                            inkompetent: isOvrigWizardTyp ? false : inkR,
                            blockering: isOvrigWizardTyp ? false : blockR
                        }
                    ),
                    itemOptionsHtml:
                        isOvrigWizardTyp || showWizardMystikNamnInput
                            ? ""
                            : buildFardighetItemOptionsHtml(
                                  wizard.actor,
                                  fardighetsGruppKey,
                                  itemIdStr,
                                  index,
                                  wizardDraft.mystikOmstopt === true,
                                  itemIdsTakenByOtherRows
                              )
                };
            })
        };
    });

    const primarFolkslagDoc = await loadFolkslag5Doc(wizardDraft.folkslag);
    const kulturFolkslagDoc =
        wizardDraft.harKulturfolkslag && wizardDraft.kulturfolkslag
            ? await loadFolkslag5Doc(wizardDraft.kulturfolkslag)
            : null;
    const harKulturfolkslagEffektivt = !!(wizardDraft.harKulturfolkslag && kulturFolkslagDoc);
    const { listedRefs, valfriaPoolRefs } = partitionFolkslagEgenskaper(
        primarFolkslagDoc,
        kulturFolkslagDoc,
        harKulturfolkslagEffektivt
    );

    if ((wizardDraft.folkslag ?? "").toString().trim()) {
        const harCcwFolkslagManaged = wizard.actor.items.some(
            (folkslagsItem) => folkslagsItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) === true
        );
        const syncRedanPagar = ItemHelper.isCcwFolkslagSyncInProgressForActor(wizard.actor.id);
        if (!harCcwFolkslagManaged && !syncRedanPagar) {
            await ItemHelper.syncCcwFolkslagItemsFromDraft(wizard.actor, wizardDraft);
        }
    }

    const managedEgenskaperItems = wizard.actor.items.filter(
        (folkslagsItem) =>
            folkslagsItem.type === "Egenskap" &&
            folkslagsItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_FOLKSLAG_MANAGED_FLAG) === true
    );

    const listedItemsOrdered = [];
    for (const ref of listedRefs ?? []) {
        const refUuid = normalizeEgenskapRefKey(ref);
        if (!refUuid) continue;
        const matchItem = managedEgenskaperItems.find(
            (folkslagsItem) =>
                folkslagsItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_EGENSKAP_SOURCE_UUID_FLAG) === refUuid
        );
        if (matchItem) listedItemsOrdered.push(matchItem);
    }

    context.folkEgenskapRows = await Promise.all(
        listedItemsOrdered.map(async (itemDoc, index) => {
            const rawBeskrivning = (itemDoc.system?.beskrivning ?? "").toString();
            return {
                label: (itemDoc.name ?? "").toString().trim(),
                uuid: itemDoc.id,
                editFieldSuffix: `obl_${index}`,
                editFieldName: `ccw_folk_edit_${itemDoc.id}`,
                beskrivning: rawBeskrivning,
                beskrivningDisplay: await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawBeskrivning, {
                    async: true
                })
            };
        })
    );

    const valfriaEnriched = await enrichEgenskapRefsForDisplay(valfriaPoolRefs);
    const valdaSet = new Set((wizardDraft.folkValfriaValda ?? []).map((valtUuid) => String(valtUuid)));
    context.folkValfriaRows = await Promise.all(
        valfriaEnriched.map(async (row, index) => {
            const refUuid = normalizeEgenskapRefKey(row);
            const itemDoc = managedEgenskaperItems.find(
                (folkslagsItem) =>
                    folkslagsItem.getFlag(EON_CCW_FLAG_SCOPE, CCW_EGENSKAP_SOURCE_UUID_FLAG) === refUuid
            );
            const rawBeskrivning = itemDoc
                ? (itemDoc.system?.beskrivning ?? "").toString()
                : (row.beskrivning ?? "").toString();
            const valfriChecked = valdaSet.has(row.uuid);
            return {
                uuid: row.uuid,
                label: row.label,
                valfriChecked,
                showProseMirror: !!itemDoc,
                editFieldSuffix: `val_${index}`,
                editFieldName: itemDoc ? `ccw_folk_edit_${itemDoc.id}` : "",
                beskrivning: rawBeskrivning,
                beskrivningDisplay: await foundry.applications.ux.TextEditor.implementation.enrichHTML(rawBeskrivning, {
                    async: true
                })
            };
        })
    );
    context.folkValfriaPoolCsv = valfriaPoolRefs
        .map((poolRef) => (poolRef.uuid ?? "").toString())
        .filter(Boolean)
        .join(",");
    context.startsprakLista = await resolveStartsprakRowsWithPack(
        wizardDraft.folkslag,
        wizardDraft.kulturfolkslag,
        harKulturfolkslagEffektivt
    );

    const startSprakUuidSet = new Set(
        (context.startsprakLista ?? []).map((rad) => (rad?.uuid ?? "").toString().trim()).filter(Boolean)
    );
    const sprakRowsRaw = Array.isArray(wizardDraft.sprakFordelning) ? [...wizardDraft.sprakFordelning] : [];
    context.sprakFordelningRows = await Promise.all(
        sprakRowsRaw.map(async (row, index) => {
            const itemIdStr = (row?.itemId ?? "").toString().trim();
            const itemDoc = itemIdStr && wizard.actor?.items?.get ? wizard.actor.items.get(itemIdStr) : null;
            let selectedCompendiumUuid = "";
            if (itemDoc?.type === "Språk") {
                selectedCompendiumUuid = (itemDoc.getFlag(EON_CCW_FLAG_SCOPE, CCW_EGENSKAP_SOURCE_UUID_FLAG) ?? "")
                    .toString()
                    .trim();
            } else if (itemIdStr.includes("Compendium.")) {
                selectedCompendiumUuid = itemIdStr;
            }
            const itemUuidsTakenByOtherRows = new Set();
            for (let peerIndex = 0; peerIndex < sprakRowsRaw.length; peerIndex += 1) {
                if (peerIndex === index) continue;
                const otherId = (sprakRowsRaw[peerIndex]?.itemId ?? "").toString().trim();
                const otherDoc = otherId ? wizard.actor?.items?.get?.(otherId) : null;
                let otherUuid = "";
                if (otherDoc?.type === "Språk") {
                    otherUuid = (otherDoc.getFlag(EON_CCW_FLAG_SCOPE, CCW_EGENSKAP_SOURCE_UUID_FLAG) ?? "")
                        .toString()
                        .trim();
                } else if (otherId.includes("Compendium.")) {
                    otherUuid = otherId;
                }
                if (otherUuid) itemUuidsTakenByOtherRows.add(otherUuid);
            }
            const itemOptionsHtml = await buildSprakItemOptionsHtml(
                selectedCompendiumUuid,
                index,
                startSprakUuidSet,
                itemUuidsTakenByOtherRows
            );
            return {
                itemId: itemIdStr,
                index,
                itemOptionsHtml
            };
        })
    );

    const startSprakTabellRader = (context.startsprakLista ?? []).map((rad) => ({
        isStartSprak: true,
        startLabel: (rad?.label ?? "").toString().trim() || "—"
    }));
    context.sprakListaAllRows = [
        ...startSprakTabellRader,
        ...context.sprakFordelningRows.map((r) => ({ isStartSprak: false, ...r }))
    ];
    context.sprakListaHarInget = context.sprakListaAllRows.length === 0;

    const kretsarRader = Array.isArray(wizardDraft.kretsarRader) ? wizardDraft.kretsarRader : [];
    context.kretsarRaderRows = kretsarRader.map((rad, index) => ({
        index,
        namn: rad?.namn ?? "",
        anteckning: rad?.anteckning ?? ""
    }));
    const foljeslagareRader = Array.isArray(wizardDraft.foljeslagareRader) ? wizardDraft.foljeslagareRader : [];
    context.foljeslagareRaderRows = foljeslagareRader.map((rad, index) => ({
        index,
        namn: rad?.namn ?? "",
        anteckning: rad?.anteckning ?? ""
    }));

    const doktrinRader = Array.isArray(wizardDraft.doktrinRader) ? wizardDraft.doktrinRader : [];
    context.doktrinRaderRows = doktrinRader.map((rad, index) => ({
        index,
        beskrivning: (rad?.beskrivning ?? "").toString()
    }));

    const toAntalText = (itemDoc) => {
        const raw = itemDoc?.system?.antal;
        const asNum = parseInt(String(raw ?? "").trim(), 10);
        if (Number.isFinite(asNum)) return String(asNum);
        return "1";
    };
    const itemName = (itemDoc) => {
        const rawName = (itemDoc?.name ?? "").toString();
        if (rawName.startsWith("eon.")) return game.i18n.localize(rawName);
        return rawName || "—";
    };
    const weaponTypeSet = new Set(["Närstridsvapen", "Avståndsvapen", "Sköld"]);
    const armorTypeSet = new Set(["Rustning"]);
    const equipmentTypeSet = new Set(["Utrustning"]);
    context.weaponRows = wizard.actor.items
        .filter((itemDoc) => weaponTypeSet.has(itemDoc.type))
        .map((itemDoc) => ({
            itemId: itemDoc.id,
            name: itemName(itemDoc),
            antal: toAntalText(itemDoc)
        }));
    context.armorRows = wizard.actor.items
        .filter((itemDoc) => armorTypeSet.has(itemDoc.type))
        .map((itemDoc) => ({
            itemId: itemDoc.id,
            name: itemName(itemDoc),
            antal: toAntalText(itemDoc)
        }));
    context.equipmentRows = wizard.actor.items
        .filter((itemDoc) => equipmentTypeSet.has(itemDoc.type))
        .map((itemDoc) => ({
            itemId: itemDoc.id,
            name: itemName(itemDoc),
            antal: toAntalText(itemDoc)
        }));
    context.mysterieRows = wizard.actor.items
        .filter((itemDoc) => itemDoc.type === "Mysterie")
        .map((itemDoc) => ({
            itemId: itemDoc.id,
            name: itemName(itemDoc)
        }));
    context.besvarjelseRows = wizard.actor.items
        .filter((itemDoc) => itemDoc.type === "Besvärjelse")
        .map((itemDoc) => ({
            itemId: itemDoc.id,
            name: itemName(itemDoc)
        }));
    context.hasWeaponRows = context.weaponRows.length > 0;
    context.hasArmorRows = context.armorRows.length > 0;
    context.hasEquipmentRows = context.equipmentRows.length > 0;
    context.hasMysterieRows = context.mysterieRows.length > 0;
    context.hasBesvarjelseRows = context.besvarjelseRows.length > 0;

    return context;
}
