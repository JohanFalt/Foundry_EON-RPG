import basforemal from "./base/_basforemal.js";
import installningar from "./base/installningar.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonSprak extends basforemal {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = { required: true, nullable: false, integer: true, initial: 0, min: 0 };
        const bonusInteger = { required: true, nullable: false, integer: true, initial: 0 };

        const schema = super.defineSchema();

        schema.installningar = new fields.SchemaField({
            ...installningar()            
        });

        /** Färdighetsvärde → tärningspool (samma tabell som Färdighet); används vid karaktärsskapande m.m. */
        schema.varde = new fields.SchemaField({
            tvarde: new fields.NumberField({ ...valueInteger }),
            bonus: new fields.NumberField({ ...bonusInteger }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false
                })
            )
        });

        schema.talabrytning = new fields.BooleanField({initial: false});
        schema.talaflytande = new fields.BooleanField({initial: false});
        schema.lasaskriva = new fields.BooleanField({initial: false});
        schema.endasttal = new fields.BooleanField({initial: false});
        schema.endastskrift = new fields.BooleanField({initial: false});

        return schema;
    }
}