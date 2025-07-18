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
        const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};

        const schema = {};
        schema.installningar = new fields.SchemaField({
            ...installningar(),
            eon: new fields.StringField({required: true, initial: ""}),
            varelsemall: new fields.StringField({required: true, nullable: false, initial: ""}),
            varelsegrupp: new fields.StringField({required: true, nullable: false, initial: ""})
        });

        schema.harleddegenskaper = new fields.SchemaField({
            ...harleddegenskaper.defineSchema()
        });

        schema.skada = new fields.SchemaField({
            forsvar: new fields.SchemaField({
                namn: new fields.StringField({
                    initial: 'Undvika',
                    nullable: false,
                }),
                beskrivning: new fields.StringField({
                    initial: '',
                    nullable: false,
                }),
                totalt: new fields.SchemaField({
                    tvarde: new fields.NumberField({...valueInteger}),
                    bonus: new fields.NumberField({...bonusInteger})
                })
            }),
            skydd: new fields.SchemaField({
                hugg: new fields.NumberField({...valueInteger}),
                kross: new fields.NumberField({...valueInteger}),
                stick: new fields.NumberField({...valueInteger})
            }),
            utmattning: new fields.SchemaField({
                grund: new fields.NumberField({...valueInteger}),
                varde: new fields.NumberField({...valueInteger})
            }),
            vandning: new fields.SchemaField({
                lista: new fields.ArrayField(                
                    new fields.ObjectField({
                        initial: {},
                        nullable: false,
                })),
                listaid: new fields.StringField({required: true, initial: ""})
            }),
            
        });

        schema.strid = new fields.SchemaField({
            lakningstakt: new fields.SchemaField({
                varde: new fields.NumberField({...valueInteger}),
                totalt: new fields.NumberField({...valueInteger}),
                bonuslista: new fields.ArrayField(
                    new fields.ObjectField({
                        initial: {},
                        nullable: false,
                    })
                )
            }),
            aterhamtning: new fields.NumberField({...valueInteger})
        }),

        schema.egenskap = new fields.SchemaField({
            fokus: new fields.SchemaField({
                varde: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10}),
                max: new fields.NumberField({required: true, nullable: false, integer: true, initial: 10, min: 0, max: 10})
            })
        });

        schema.bakgrund = new fields.SchemaField({         
            kon: new fields.StringField({required: true, nullable: false, initial: ""}),
            alder: new fields.StringField({required: true, nullable: false, initial: ""}),
            langd: new fields.StringField({required: true, nullable: false, initial: ""}),
            vikt: new fields.StringField({required: true, nullable: false, initial: ""}),   
            beskrivning : new fields.HTMLField()
        });

        schema.referens = new fields.StringField({required: true, initial: ""});
        
        return schema;
    }

    static async initialize() {
    }

    static migrateData(source) {
        return super.migrateData(source);
    }
}