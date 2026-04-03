/**
 * Standardutkast och tomma rader för karaktärsskapande-wizarden.
 * @module ccw/ccw-wizard-draft-defaults
 */

import {
    HARLEDDA_KEYS,
    ENHETER_KEYS,
    HANDELSE_SIDEBAR_SLAG_KEYS,
    UTRUSTNING_PKT_KEYS,
    ENHETER_FARDIGHET_GRUPP_KEYS,
    CCW_WIZARD_CREATED_SPRAK_ROW
} from "./ccw-constants-keys.js";

function emptyEgenskapRow() {
    return { typ: "", namn: "", kalla: "", beskrivning: "" };
}

/** Tom rad för händelseresultat (flik 7). */
export function emptyHandelseResultRow() {
    return { tabell: "", nummer: "", anteckning: "" };
}

/** Rad på flik 10: ytterligare språk; `itemId` = embedded Item-id på actorn (synkas från kompendiumval). */
export function emptySprakFordelningRow() {
    return {
        itemId: "",
        grundvarde: "0",
        poang: "0",
        talang: false,
        inkompetent: false,
        blockering: false,
        [CCW_WIZARD_CREATED_SPRAK_ROW]: false
    };
}

function emptyKontaktRad() {
    return { namn: "", anteckning: "" };
}

/** Tom rad för flik 11 (namn + nivåtexter); rad 0 = primärt (övers), övriga sekundära. */
export function emptyKaraktarsdragRow() {
    return { namn: "", niva1: "", niva2: "", niva3: "" };
}

function emptyMysteriumRow() {
    return { namn: "", anteckning: "" };
}

/** @returns {object} Default wizard draft (mockup v2-struktur) */
export function defaultWizardData() {
    const harledd = {};
    for (const key of HARLEDDA_KEYS) {
        harledd[key] = { grund: "0", bonus: "0", totalt: "" };
    }
    const enheter = {};
    for (const key of ENHETER_KEYS) {
        enheter[key] = "0";
    }
    const handelseSlag = {};
    for (const key of HANDELSE_SIDEBAR_SLAG_KEYS) {
        handelseSlag[key] = "0";
    }
    const utrustningPaket = {};
    for (const key of UTRUSTNING_PKT_KEYS) {
        utrustningPaket[key] = "0";
    }
    const fardighetFordelning = {};
    for (const key of ENHETER_FARDIGHET_GRUPP_KEYS) {
        fardighetFordelning[key] = [];
    }

    return {
        koncept: "",
        hemland: "",
        hemort: "",
        bakgrund: "",
        folkslag: "",
        harKulturfolkslag: false,
        kulturfolkslag: "",
        religion: "",
        doktrinRader: [],
        arketyp: "",
        varv: "",
        miljo: "",
        levnadsstandard: "",
        startkapital: "",
        detaljer: "",
        /** Flik 12: kopplas till actor.name vid Slutför */
        rollpersonNamn: "",
        /** Flik 12: kön, utseende, relationer (sparas i bakgrund / beskrivning) */
        kon: "",
        utseende: "",
        relationer: "",
        /** Flik 12: samma värden som rollformuläret: hoger | vanster | annat | "" */
        vapenarm: "",
        titel: "",
        alder: "",
        extraAttributPoang: "0",
        avtrubbning: {
            valfriKategori: "0",
            utsatthet: "0",
            vald: "0",
            overnaturligt: "0"
        },
        harledd,
        enheter,
        handelseSlag,
        utrustningPaket,
        handelseResultat: [emptyHandelseResultRow()],
        fardighetFordelning,
        egenskaper: Array.from({ length: 6 }, () => ({ ...emptyEgenskapRow() })),
        /** Flik 10: ytterligare språk (embedded itemId, synkas vid sparning) */
        sprakFordelning: [],
        kretsarRader: [],
        foljeslagareRader: [],
        karaktarsdrag: [emptyKaraktarsdragRow(), emptyKaraktarsdragRow()],
        mystikOmstopt: false,
        mystikAntal: "0",
        mysterier: Array.from({ length: 5 }, () => ({ ...emptyMysteriumRow() })),
        /** Folkslag-wizard: valda valfria egenskaps-uuid (max 2 när pool > 2) */
        folkValfriaValda: [],
        /** Cache: uuid i valfri pool (sätts vid folkslagsbyte) */
        folkValfriaPoolUuids: [],
        /** När true: `ccw_kulturfolkslag` kan användas (efter dialog Ja) */
        kulturfolkslagSelectEnabled: false,
        /** Om användaren svarat på kulturfolkslagsdialog (för att undvika om-dialog) */
        folkslagKulturDialogBesvarad: false
    };
}