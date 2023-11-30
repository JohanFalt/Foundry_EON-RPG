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
        schema.tacker = new fields.StringField({initial: '', nullable: false}) 
        
        return schema;
    }
}