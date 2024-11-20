import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
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
            harniva: new fields.BooleanField({initial: false})
        });

        schema.niva = new fields.NumberField({...valueInteger});

        return schema;
    }
}