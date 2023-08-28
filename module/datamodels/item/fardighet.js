import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonFardighet extends basforemal {
    static _enableV10Validation = true;

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar(),            
            lattlard: new fields.BooleanField({initial: false}),
            svarlard: new fields.BooleanField({initial: false}),
            normal: new fields.BooleanField({initial: false}),
            
        });

        schema.namn = new fields.StringField({required: true, initial: ""});
        schema.expertis = new fields.BooleanField({initial: false}),
        schema.kannetecken = new fields.BooleanField({initial: false}),
        schema.hantverk = new fields.BooleanField({initial: false})

        schema.varde = new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        });
        
        return schema;
    }
}