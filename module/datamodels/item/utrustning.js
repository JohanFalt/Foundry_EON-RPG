import foremal from "./base/foremal.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonUtrustning extends foremal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;

        const schema = super.defineSchema();
        
        return schema;
    }
}