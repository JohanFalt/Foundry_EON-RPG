import basegenskap from "./base/_basegenskap.js";
import installningar from "./base/installningar.js";
import egenskaper from "./base/egenskaper.js";
import grundegenskaper from "../actor/base/grundegenskaper.js";

/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class folkslag extends basegenskap {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.egenskaper = new fields.ArrayField(
            ...egenskaper()
        );

        schema.sprak = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        schema.grundegenskaper = new fields.SchemaField({
            ...grundegenskaper.defineSchema()
        });       

        schema.strid = new fields.SchemaField({
            lakningstakt: new fields.NumberField({...valueInteger})
        });

        return schema;
    }
}