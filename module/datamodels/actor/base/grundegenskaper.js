/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class grundegenskaper extends foundry.abstract.DataModel {

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
      const fields = foundry.data.fields;
      const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
      const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};      

      return {
        styrka: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        talighet: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        rorlighet: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        uppfattning: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        vilja: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        psyke: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        visdom: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        utstralning: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        })
      };
    }
  }