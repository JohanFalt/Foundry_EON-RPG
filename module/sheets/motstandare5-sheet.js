import Eon5ActorSheetBase from "./eon5-actor-sheet-base.js";

/**
 * ApplicationV2 sheet för Eon 5-motståndare (GM-NPC).
 */
export default class Eon5MotstandareSheet extends Eon5ActorSheetBase {
    static DEFAULT_OPTIONS = {
        classes: ["EON", "EON5", "motstandare", "sheet-character", "eon-text", "normal-headline", "eon-theme-light"],
        window: {
            icon: "fa-solid fa-user-secret",
            resizable: true
        },
        position: {
            width: 1024,
            height: 1024
        }
    };

    static PARTS = {
        header: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-sheet-header.hbs"
        },
        tabs: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-tab-navigation.hbs"
        },
        fardigheter: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-fardigheter.hbs"
        },
        strid: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-strid.hbs"
        },
        magi: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-magi.hbs"
        },
        religion: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-religion.hbs"
        },
        anteckningar: {
            template: "systems/eon-rpg/templates/actors/parts/motstandare5-anteckningar.hbs"
        }
    };

    tabs = {
        fardigheter: {
            id: "fardigheter",
            group: "primary",
            title: "eon.sheets.motstandare.tabFardigheter",
            icon: "<i class=\"fa-solid fa-book-open\"></i>"
        },
        strid: {
            id: "strid",
            group: "primary",
            title: "eon.sheets.motstandare.tabStrid",
            icon: "<i class=\"fa-solid fa-swords\"></i>"
        },
        magi: {
            id: "magi",
            group: "primary",
            title: "eon.sheets.motstandare.tabMagi",
            icon: "<i class=\"fa-solid fa-hat-wizard\"></i>"
        },
        religion: {
            id: "religion",
            group: "primary",
            title: "eon.sheets.motstandare.tabReligion",
            icon: "<i class=\"fa-solid fa-hands-praying\"></i>"
        },
        anteckningar: {
            id: "anteckningar",
            group: "primary",
            title: "eon.sheets.motstandare.tabAnteckningar",
            icon: "<i class=\"fa-solid fa-note-sticky\"></i>"
        }
    };

    tabGroups = {
        primary: "fardigheter"
    };

    constructor(options = {}) {
        super(options);
        this.isPC = false;
    }
}
