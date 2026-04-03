/**
 * Gemensamma nycklar och flaggor för karaktärsskapande-wizarden (CCW).
 *
 * Dataflöde (översikt): `actor.flags[eon-rpg].wizardData` persistas via `persistWizardData`;
 * vid render/insamling mergas med `getMergedWizardData` (default + flaggor), formuläret läses med
 * `collectWizardDraftFromRoot`, synkas med bl.a. språk-embed, och vid Slutför skrivs allt till actorn
 * via `applyCharacterCreationFinish` (se `character-creation-helper.js` barrel).
 *
 * @module ccw/ccw-constants-keys
 */

export const EON_CCW_FLAG_SCOPE = "eon-rpg";

/** Rad i wizarden skapad via "Lägg till" på mystik/språk; item ska tas bort från actor om raden tas bort. */
export const CCW_WIZARD_CREATED_FARDIGHET_ROW = "ccwCreatedFardighetItem";

/** Rad på flik 10: ytterligare språk skapade via wizarden; embedded Språk-item tas bort om raden tas bort. */
export const CCW_WIZARD_CREATED_SPRAK_ROW = "ccwCreatedSprakItem";

/** @type {readonly string[]} */
export const HARLEDDA_KEYS = [
    "forflyttning",
    "intryck",
    "kroppsbyggnad",
    "reaktion",
    "sjalvkontroll",
    "vaksamhet",
    "livskraft",
    "visdom"
];

/** @type {readonly string[]} */
export const ENHETER_KEYS = [
    "valfria",
    "strid",
    "rorelse",
    "mystik",
    "social",
    "kunskap",
    "sprak",
    "vildmark",
    "eExpertiser",
    "fFormagor",
    "hHantverk",
    "kKannetecken"
];

/**
 * Färdighetssteg (flik 9): enheter fördelas på färdighets-items i dessa grupper.
 * @type {readonly string[]}
 */
export const ENHETER_FARDIGHET_GRUPP_KEYS = [
    "strid",
    "rorelse",
    "mystik",
    "social",
    "kunskap",
    "vildmark",
    "eExpertiser",
    "fFormagor",
    "hHantverk",
    "kKannetecken"
];

/** Sidomeny / flik 9: övriga färdigheter — samma `grupp` på item, olika typ-flaggor. */
export const WIZARD_OVRIGA_ENHET_KEYS = ["eExpertiser", "fFormagor", "hHantverk", "kKannetecken"];

/** @type {readonly string[]} */
export const HANDELSE_TABELL_KEYS = [
    "farder",
    "intriger",
    "mirakel",
    "strider",
    "studier",
    "trolldom"
];

/** Sidopanel: slag per tabell inkl. valfri händelsetabell. */
export const HANDELSE_SIDEBAR_SLAG_KEYS = ["valfri", ...HANDELSE_TABELL_KEYS];

/** @type {readonly string[]} */
export const UTRUSTNING_PKT_KEYS = [
    "valfritt",
    "djur",
    "fiske",
    "forskning",
    "hantverk",
    "jakt",
    "medicinsk",
    "musik",
    "mystikUtrustning",
    "skriv",
    "skonhet",
    "tjuv",
    "underhallning",
    "vildmark",
    "vapenvar"
];

/** Max antal färdighetsenheter per färdighet i karaktärsskapande-wizarden (steg 9). */
export const CCW_FARDIGHET_ENHETER_MAX = 8;
