import foremal from "./base/foremal.js";
import vapen from "./base/vapen.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonNarstridsvapen extends vapen {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};

        const schema = super.defineSchema();

        schema.hugg = new fields.SchemaField({
            aktiv: new fields.BooleanField({initial: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        });

        schema.kross = new fields.SchemaField({
            aktiv: new fields.BooleanField({initial: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        });

        schema.stick = new fields.SchemaField({
            aktiv: new fields.BooleanField({initial: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        });
        
        return schema;
    }
}