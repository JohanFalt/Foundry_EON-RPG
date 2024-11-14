import foremal from "./foremal.js";

/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class vapen extends foremal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};

        const schema = super.defineSchema();

        schema.langd = new fields.NumberField({...valueInteger});

        schema.enhand = new fields.SchemaField({
            aktiv: new fields.BooleanField({initial: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})            
        });

        schema.tvahand = new fields.SchemaField({
            aktiv: new fields.BooleanField({initial: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        });        

        return schema;
    }
}