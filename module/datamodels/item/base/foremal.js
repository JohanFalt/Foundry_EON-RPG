import installningar from "./installningar.js";
import basforemal from "./_basforemal.js";

/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class foremal extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const valueReal = {required: true, nullable: false, integer: false, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar(),
            behallare: new fields.BooleanField({initial: false}),
            buren: new fields.BooleanField({initial: false}),
            aktiv: new fields.BooleanField({initial: false})
        });

        schema.volym = new fields.SchemaField({
            enhet: new fields.StringField({required: true, initial: ""}),
            antal: new fields.NumberField({...valueInteger}),
            max: new fields.NumberField({...valueInteger})
        });

        schema.egenskaper = new fields.ArrayField(
            new fields.SchemaField({
                namn: new fields.StringField({
                    initial: '',
                    nullable: false,
                }),
                varde: new fields.NumberField({
                    initial: 0,
                    nullable: false,
                    required: false,
                    min: 0
                }),
            }),
            {
                initial: [],
                nullable: false,
            }
        );

        schema.antal = new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0});
        schema.vikt = new fields.NumberField({...valueReal});
        schema.pris = new fields.NumberField({...valueReal});

        return schema;
    }
}