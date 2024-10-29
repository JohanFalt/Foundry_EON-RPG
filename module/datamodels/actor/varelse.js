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
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = {};
        schema.installningar = new fields.SchemaField({
            ...installningar(),
            varelsemall: new fields.StringField({required: true, nullable: false, initial: ""}),
            varelsegrupp: new fields.StringField({required: true, nullable: false, initial: ""})
        });

        schema.harleddegenskaper = new fields.SchemaField({
            ...harleddegenskaper.defineSchema()
        });

        schema.skada = new fields.SchemaField({
            utmattning: new fields.SchemaField({
                grund: new fields.NumberField({...valueInteger}),
                varde: new fields.NumberField({...valueInteger})
            }),
            sar: new fields.SchemaField({
                huvud: new fields.NumberField({...valueInteger}),
                torso: new fields.NumberField({...valueInteger}),
                vansterarm: new fields.NumberField({...valueInteger}),
                hogerarm: new fields.NumberField({...valueInteger}),
                vansterben: new fields.NumberField({...valueInteger}),
                hogerben: new fields.NumberField({...valueInteger}),
            }),
            smarta: new fields.NumberField({...valueInteger}),
            blodning: new fields.NumberField({...valueInteger}),
            blodningsvarighet: new fields.NumberField({...valueInteger}),
            infektion: new fields.NumberField({...valueInteger}),
            infektionsvarighet: new fields.NumberField({...valueInteger}),
            inreskada: new fields.NumberField({...valueInteger})
        });

        schema.egenskap = new fields.SchemaField({
            fokus: new fields.SchemaField({
                varde: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10}),
                max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10})
            })
        });

        schema.bakgrund = new fields.SchemaField({            
            beskrivning : new fields.HTMLField()
        });

        schema.referens = new fields.StringField({required: true, initial: ""});
        
        return schema;
    }
}