import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

export default class EonAvvisning extends basforemal {
    static _enableV10Validation = true;

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.magnitud = new fields.NumberField({...valueInteger});
        
        return schema;
    }
}