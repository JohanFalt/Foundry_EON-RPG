import harleddegenskaper5 from "./base/harleddegenskaper5.js";
import installningar from "./base/installningar.js";
//import grundegenskaper from "./base/grundegenskaper.js";

import {CompareVersion} from "../../migration.js";
import CalculateHelper from "../../calculate-helper.js";

/**
 * Data schema, attributes, and methods specific to Rollperson type Actors.
 */
export default class Eon5Rollperson extends foundry.abstract.DataModel {
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
            eon: new fields.StringField({required: true, initial: "eon5"})
        });

        // schema.grundegenskaper = new fields.SchemaField({
        //     ...grundegenskaper.defineSchema()
        // });

        schema.harleddegenskaper = new fields.SchemaField({
            ...harleddegenskaper5.defineSchema()
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
            lakningstakt: new fields.SchemaField({
                varde: new fields.NumberField({...valueInteger}),
                totalt: new fields.NumberField({...valueInteger}),
                bonuslista: new fields.ArrayField(
                    new fields.ObjectField({
                        initial: {},
                        nullable: false,
                    })
                )
            })
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
            koncept: new fields.StringField({required: true, nullable: false, initial: ""}),
            kon: new fields.StringField({required: true, nullable: false, initial: ""}),
            alder: new fields.StringField({required: true, nullable: false, initial: ""}),
            langd: new fields.StringField({required: true, nullable: false, initial: ""}),
            vikt: new fields.StringField({required: true, nullable: false, initial: ""}),    
            folkslag: new fields.StringField({required: true, nullable: false, initial: ""}),
            kulturfolkslag: new fields.StringField({required: true, nullable: false, initial: ""}),
            religion: new fields.StringField({required: true, nullable: false, initial: ""}),
            doktriner: new fields.StringField({required: true, nullable: false, initial: ""}),
            hemland: new fields.StringField({required: true, nullable: false, initial: ""}),
            hemort: new fields.StringField({required: true, nullable: false, initial: ""}),
            varv: new fields.StringField({required: true, nullable: false, initial: ""}),
            sysselsattning: new fields.StringField({required: true, nullable: false, initial: ""}),
            levnadsstandard: new fields.StringField({required: true, nullable: false, initial: ""}),
            arketyp: new fields.StringField({required: true, nullable: false, initial: ""}),
            miljo: new fields.StringField({required: true, nullable: false, initial: ""}),
            titel: new fields.StringField({ required: true, nullable: false, initial: "" }),
            utseende: new fields.HTMLField(),
            relationer: new fields.HTMLField(),
            /** Fria anteckningar (motsvarar rubriken Anteckningar på bio-fliken). */
            beskrivning: new fields.HTMLField(),
        });

        const kontaktRadSchema = () =>
            new fields.SchemaField({
                namn: new fields.StringField({ required: true, nullable: false, initial: "" }),
                anteckning: new fields.StringField({ required: true, nullable: false, initial: "" })
            });

        schema.kretsar = new fields.ArrayField(kontaktRadSchema());
        schema.foljeslagare = new fields.ArrayField(kontaktRadSchema());

        return schema;
    }

    static async initialize() {
    }

    static migrateData(source) {
        const bg = source.bakgrund ?? (source.bakgrund = {});
        const kretsTom = !Array.isArray(source.kretsar) || source.kretsar.length === 0;
        if (kretsTom && Array.isArray(bg.kretsar) && bg.kretsar.length) {
            source.kretsar = foundry.utils.duplicate(bg.kretsar);
        }
        if ("kretsar" in bg) delete bg.kretsar;
        const foljeTom = !Array.isArray(source.foljeslagare) || source.foljeslagare.length === 0;
        if (foljeTom && Array.isArray(bg.foljeslagare) && bg.foljeslagare.length) {
            source.foljeslagare = foundry.utils.duplicate(bg.foljeslagare);
        }
        if ("foljeslagare" in bg) delete bg.foljeslagare;

        if (Array.isArray(bg.doktrinRader) && bg.doktrinRader.length) {
            const fromArr = bg.doktrinRader
                .map((r) => (r?.beskrivning ?? "").toString().trim())
                .filter(Boolean)
                .join("\n");
            if (fromArr) {
                const cur = (bg.doktriner ?? "").toString().trim();
                bg.doktriner = cur ? `${cur}\n${fromArr}` : fromArr;
            }
            delete bg.doktrinRader;
        }
        const d1 = (bg.doktrin1 ?? "").toString().trim();
        const d2 = (bg.doktrin2 ?? "").toString().trim();
        if (d1 || d2) {
            const legacy = [d1, d2].filter(Boolean).join("\n");
            const cur = (bg.doktriner ?? "").toString().trim();
            bg.doktriner = cur ? `${cur}\n${legacy}` : legacy;
        }
        delete bg.doktrin1;
        delete bg.doktrin2;

        let version310 = CompareVersion(source.installningar?.version, "3.1.0");

        if (version310) {
            source.installningar.version = "3.1.0";

            // strid.lakningstakt
            if (CalculateHelper.isNumeric(source.strid.lakningstakt)) {
                const varde = source.strid.lakningstakt;

                source.strid.lakningstakt = {
                    varde: varde,
                    totalt: varde
                };
            }
            if (CalculateHelper.isNumeric(source.harleddegenskaper.grundrustning)) {
                const varde = source.harleddegenskaper.grundrustning;

                source.harleddegenskaper.grundrustning = {
                    varde: varde,
                    totalt: varde
                };
            }
        }

        return super.migrateData(source);
    }
}