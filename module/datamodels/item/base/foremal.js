import installningar from "./installningar.js";
import basforemal from "./_basforemal.js";
import egenskaper from "./egenskaper.js";

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
            forvaring: new fields.BooleanField({initial: false}),
            behallare: new fields.BooleanField({initial: false}),
            buren: new fields.BooleanField({initial: false}),
            aktiv: new fields.BooleanField({initial: false}),
            exceptionell: new fields.BooleanField({initial: false, required: true}),
            forvaringid: new fields.StringField({required: true, initial: ""})
        });

        schema.volym = new fields.SchemaField({
            enhet: new fields.StringField({required: true, initial: ""}),
            antal: new fields.NumberField({...valueInteger}),
            max: new fields.NumberField({...valueInteger})
        });

        schema.egenskaper = new fields.ArrayField(
            // new fields.SchemaField({
            //     uuid: new fields.StringField({
            //         initial: '',
            //         nullable: false,
            //     }),
            //     _id: new fields.StringField({
            //         initial: '',
            //         nullable: false,
            //     }),
            //     label: new fields.StringField({
            //         initial: '',
            //         nullable: false,
            //     }),
            //     namn: new fields.StringField({
            //         initial: '',
            //         nullable: false,
            //     }),
            //     varde: new fields.NumberField({
            //         initial: 0,
            //         nullable: false,
            //         required: false,
            //         min: 0
            //     }),
            //     beskrivning: new fields.HTMLField(),
            //     harniva: new fields.NumberField({...valueInteger}) 
            // }),
            // {
            //     initial: [],
            //     nullable: false,
            // }
            ...egenskaper()
        );

        schema.antal = new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0});
        schema.vikt = new fields.NumberField({...valueReal});
        schema.pris = new fields.NumberField({...valueReal});

        return schema;
    }
}