import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonBesvarjelse extends basforemal {
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

        schema.aspekt = new fields.StringField({required: true, initial: ""});
        schema.svarighet = new fields.NumberField({...valueInteger});
        schema.forsvar = new fields.StringField({required: true, initial: ""});
        schema.anfall = new fields.StringField({required: true, initial: ""});

        schema.omfang = new fields.SchemaField({
            antal: new fields.NumberField({...valueInteger}),
            yta: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0}),
            text: new fields.StringField({required: true, initial: ""})
        });

        schema.rackvidd = new fields.SchemaField({
            stracka: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0}),
            antal: new fields.NumberField({...valueInteger}),
            text: new fields.StringField({required: true, initial: ""})
        });

        schema.varaktighet = new fields.SchemaField({
            tid: new fields.NumberField({required: true, nullable: false, integer: true, initial: 1, min: 0}),
            text: new fields.StringField({required: true, initial: ""}),
            koncentration: new fields.BooleanField({initial: false}),
            momentan: new fields.BooleanField({initial: false}),
            immanent: new fields.BooleanField({initial: false})
        });

        schema.ritual = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        schema.magnitud = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));
        
        return schema;
    }
}