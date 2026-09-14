/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class harleddegenskaper5 extends foundry.abstract.DataModel {

    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
      const fields = foundry.data.fields;
      const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};
      const bonusInteger = {required: true, nullable: false, integer: true, initial: 0};   
      const attributInteger = {required: true, nullable: false, integer: true, initial: 2, min: 0};
      const hojningarField = () => new fields.NumberField({
          required: true, nullable: false, integer: true, initial: 0, min: 0
      });
      const t6Attribut = () => new fields.SchemaField({
          grund: new fields.SchemaField({
              tvarde: new fields.NumberField({...attributInteger}),
              bonus: new fields.NumberField({...bonusInteger})
          }),
          totalt: new fields.SchemaField({
              tvarde: new fields.NumberField({...attributInteger}),
              bonus: new fields.NumberField({...bonusInteger})
          }),
          bonuslista: new fields.ArrayField(
              new fields.ObjectField({
                  initial: {},
                  nullable: false,
          })),
          hojningar: hojningarField()
      });

      return {
        forflyttning: t6Attribut(),
        intryck: t6Attribut(),
        kroppsbyggnad: t6Attribut(),
        reaktion: t6Attribut(),
        sjalvkontroll: t6Attribut(),
        vaksamhet: t6Attribut(),
        livskraft: t6Attribut(),
        visdom: new fields.SchemaField({
            varde: new fields.NumberField({...valueInteger}),
            hojningar: hojningarField()
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
