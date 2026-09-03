import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";
import effekter, { varaktighetFields } from "./base/effekter.js";

/**
 * Allvarlig skada, tillfälligt tillstånd (system.typ) och fältstörning.
 */
export default class EonSkada extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;

        const schema = super.defineSchema();
        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.niva = new fields.StringField({required: true, initial: ""});
        schema.effekter = effekter();
        Object.assign(schema, varaktighetFields());

        return schema;
    }
}
