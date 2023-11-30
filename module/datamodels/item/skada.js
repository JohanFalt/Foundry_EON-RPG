import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
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
        
        return schema;
    }
}