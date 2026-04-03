import basegenskap from "./base/_basegenskap.js";
import installningar from "./base/installningar.js";
import egenskaper from "./base/egenskaper.js";

/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class Eon5Folkslag extends basegenskap {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.folkslag = new fields.StringField({required: true, initial: ""});

        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.attribut = new fields.SchemaField({
            forflyttning: new fields.NumberField({...valueInteger}),
            intryck: new fields.NumberField({...valueInteger}),
            kroppsbyggnad: new fields.NumberField({...valueInteger}),
            reaktion: new fields.NumberField({...valueInteger}),
            sjalvkontroll: new fields.NumberField({...valueInteger}),
            vaksamhet: new fields.NumberField({...valueInteger}),
            livskraft: new fields.NumberField({...valueInteger}),
            visdom: new fields.NumberField({...valueInteger}),
            valfria: new fields.NumberField({...valueInteger})
        });

        schema.egenskaper = new fields.ArrayField(
            ...egenskaper()
        );

        schema.kulturegenskaper = new fields.ArrayField(
            ...egenskaper()
        );

        schema.valfriaegenskaper = new fields.ArrayField(
            ...egenskaper()
        );        

        schema.sprak = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        return schema;
    }
}