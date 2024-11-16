import foremal from "./base/foremal.js";
/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonRustning extends foremal {
    static _enableV10Validation = true;

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.kroppsdel = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        schema.belastning = new fields.NumberField({...valueInteger}); 
        schema.tacker = new fields.StringField({initial: '', nullable: false});
        
        schema.installningar = new fields.SchemaField({
            skapad: new fields.BooleanField({initial: false, required: true}),
            version: new fields.StringField({initial: "", required: true}),
            kantabort: new fields.BooleanField({initial: false, required: true}),
            exceptionell: new fields.BooleanField({initial: false, required: true}),
            buren: new fields.BooleanField({initial: false, required: true})
        });
        
        schema.belastning_reduction = new fields.NumberField({...valueInteger});
        
        return schema;
    }
}