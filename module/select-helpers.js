export default class SelectHelper {
    static SetupActor(actor) {
        let listData = [];

        listData.vapenArm = {
            "": "eon.wizard.vapenarmValj",
            hoger: "eon.wizard.vapenarmVal_hoger",
            vanster: "eon.wizard.vapenarmVal_vanster",
            annat: "eon.wizard.vapenarmVal_annat",
        };

        return listData;
    }

    /**
     * Bygger record key → i18n-nyckel (namn) för vapengrupper med given grupp-typ.
     * @param {Record<string, { namn?: string, grupp?: string }>|undefined} vapengrupper
     * @param {string} gruppTyp t.ex. "narstridsvapen" | "avstandsvapen"
     */
    static _filterVapengrupperByGrupp(vapengrupper, gruppTyp) {
        const out = {};
        if (!vapengrupper) return out;
        for (const [key, v] of Object.entries(vapengrupper)) {
            if (v?.grupp === gruppTyp && v.namn != null) {
                out[key] = v.namn;
            }
        }
        return out;
    }

    static SetupItem(_item) {
        const listData = {
            vapenegenskaper: [],
        };
        const vg = CONFIG.EON?.vapengrupper;
        listData.vapengrupperNarstridsvapen = SelectHelper._filterVapengrupperByGrupp(vg, "narstridsvapen");
        listData.vapengrupperAvstandsvapen = SelectHelper._filterVapengrupperByGrupp(vg, "avstandsvapen");
        return listData;
    }
}