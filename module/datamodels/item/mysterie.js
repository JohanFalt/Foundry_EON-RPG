import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonMysterie extends basforemal {
    static _enableV10Validation = true;

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar(),
            aktiv: new fields.BooleanField({initial: false})
        });

        schema.mirakel = new fields.HTMLField();
        schema.cermoni = new fields.HTMLField();
        schema.moment = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        schema.omfang = new fields.StringField({required: true, initial: ""});
        schema.rackvidd = new fields.StringField({required: true, initial: ""});
        schema.magnitud = new fields.NumberField({...valueInteger});
        schema.varaktighet = new fields.StringField({required: true, initial: ""});
        
        return schema;
    }
}

