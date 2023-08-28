import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonSprak extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar(),
            
        });

        schema.namn = new fields.StringField({required: true, initial: ""});        
        schema.talabrytning = new fields.BooleanField({initial: false});
        schema.talaflytande = new fields.BooleanField({initial: false});
        schema.lasaskriva = new fields.BooleanField({initial: false});

        return schema;
    }
}