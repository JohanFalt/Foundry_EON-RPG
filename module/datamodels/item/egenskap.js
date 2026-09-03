import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";
import effekter from "./base/effekter.js";

/**
 * Data schema for Egenskap items (vapen / folkslag / allmänt).
 */
export default class EonEgenskap extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar(),
            vapen: new fields.BooleanField({initial: false}),
            folkslag: new fields.BooleanField({initial: false}),
            harniva: new fields.BooleanField({initial: false})
        });

        schema.niva = new fields.NumberField({...valueInteger});
        schema.effekter = effekter();

        return schema;
    }
}
