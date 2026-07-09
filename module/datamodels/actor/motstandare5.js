import Eon5Rollperson from "./rollperson5.js";

/**
 * Eon 5 motståndare — delad datamodell med Rollperson5 plus motståndarspecifika fält i samma schema.
 */
export default class Eon5Motstandare extends Eon5Rollperson {
    static migrateData(source) {
        source = super.migrateData(source);
        if (source.installningar) {
            source.installningar.motstandare = true;
            if (!source.installningar.eon) source.installningar.eon = "eon5";
        }
        return source;
    }
}
