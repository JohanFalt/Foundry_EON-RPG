import foremal from "./base/foremal.js";

/**
 * Data schema for Currency (Valuta) items
 * @extends {foremal}
 */
export default class EonValuta extends foremal {
    /** @override */
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            buren: new fields.BooleanField({
                required: true,
                initial: false
            })
        });

        schema.metall = new fields.StringField({
            required: true,
            initial: ""
        });

        schema.silver_varde = new fields.NumberField({
            required: true,
            nullable: false,
            initial: 0,
            min: 0
        });

        schema.ursprung = new fields.StringField({
            required: true,
            initial: ""
        });

        return schema;
    }
}
