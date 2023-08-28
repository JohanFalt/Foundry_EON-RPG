import harleddegenskaper from "./base/harleddegenskaper.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonVarelse extends foundry.abstract.DataModel {
    static _enableV10Validation = true;

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;

        const schema = {};
        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.harleddegenskaper = new fields.SchemaField({
            ...harleddegenskaper.defineSchema()
        });
        
        return schema;
    }
}