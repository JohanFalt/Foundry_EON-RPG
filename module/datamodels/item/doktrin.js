import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";
import bonus from "./base/bonus.js";

export default class EonDoktrin extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
        const fields = foundry.data.fields;
        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        // schema.bonus = new fields.ArrayField(
        //     new fields.SchemaField({
        //         ...bonus()
        //     })
        // );

        return schema;
    }
}