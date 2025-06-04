/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class harleddegenskaper extends foundry.abstract.DataModel {

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
      const fields = foundry.data.fields;
      const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
      const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};      

      return {
        forflyttning: new fields.SchemaField({    
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
        intryck: new fields.SchemaField({       
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
        kroppsbyggnad: new fields.SchemaField({   
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
        reaktion: new fields.SchemaField({     
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
        sjalvkontroll: new fields.SchemaField({   
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
        vaksamhet: new fields.SchemaField({      
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
        livskraft: new fields.SchemaField({   
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
        grundskada: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            modifierare: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        initiativ: new fields.SchemaField({
            grund: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            totalt: new fields.SchemaField({
                tvarde: new fields.NumberField({...valueInteger}),
                bonus: new fields.NumberField({...bonusInteger})
            }),
            tarning: new fields.StringField({required: true, initial: "0d6", blank: false}),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        }),
        grundrustning: new fields.SchemaField({
            varde: new fields.NumberField({...valueInteger}),
            totalt: new fields.NumberField({...valueInteger}),
            bonuslista: new fields.ArrayField(
                new fields.ObjectField({
                    initial: {},
                    nullable: false,
            }))
        })
      };
    }
  }