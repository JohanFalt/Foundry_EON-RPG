import harleddegenskaper from "./base/harleddegenskaper.js";
import installningar from "./base/installningar.js";
import grundegenskaper from "./base/grundegenskaper.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class EonRollperson extends foundry.abstract.DataModel {
    static _enableV10Validation = true;
    
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */
    static defineSchema() {
        const fields = foundry.data.fields;
        const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

        const schema = {};

        schema.installningar = new fields.SchemaField({
            ...installningar()
        });

        schema.grundegenskaper = new fields.SchemaField({
            ...grundegenskaper.defineSchema()
        });

        schema.harleddegenskaper = new fields.SchemaField({
            ...harleddegenskaper.defineSchema()
        });

        schema.fardigheter = new fields.SchemaField({
            strid: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            rorelse: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            mystik: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            social: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            kunskap: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            sprak: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            vildmark: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            }),
            ovriga: new fields.SchemaField({
                erf: new fields.NumberField({...valueInteger})
            })
        });

        schema.strid = new fields.SchemaField({
            vapenarm: new fields.StringField({required: true, nullable: false, initial: ""}),
            lakningstakt: new fields.NumberField({...valueInteger})
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

        schema.magi = new fields.SchemaField({
            borttoning: new fields.NumberField({...valueInteger})
        });

        schema.egenskap = new fields.SchemaField({
            karaktärsdrag: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            })),
            fokus: new fields.SchemaField({
                varde: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10}),
                max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10})
            }),
            avtrubbning: new fields.SchemaField({
                utsatthet: new fields.NumberField({...valueInteger}),
                vald: new fields.NumberField({...valueInteger}),
                overnaturligt: new fields.NumberField({...valueInteger})
            })
        });

        schema.bakgrund = new fields.SchemaField({
            kon: new fields.StringField({required: true, nullable: false, initial: ""}),
            alder: new fields.StringField({required: true, nullable: false, initial: ""}),
            langd: new fields.StringField({required: true, nullable: false, initial: ""}),
            vikt: new fields.StringField({required: true, nullable: false, initial: ""}),    
            folkslag: new fields.StringField({required: true, nullable: false, initial: ""}),
            religion: new fields.StringField({required: true, nullable: false, initial: ""}),            
            hemort: new fields.StringField({required: true, nullable: false, initial: ""}),
            varv: new fields.StringField({required: true, nullable: false, initial: ""}),
            sysselsattning: new fields.StringField({required: true, nullable: false, initial: ""}),
            arketyp: new fields.StringField({required: true, nullable: false, initial: ""}),
            miljo: new fields.StringField({required: true, nullable: false, initial: ""}),
            beskrivning : new fields.HTMLField()
        });

        return schema;
    }

    static async initialize() {
    }
}