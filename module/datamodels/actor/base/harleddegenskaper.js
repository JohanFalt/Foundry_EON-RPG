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
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        intryck: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        kroppsbyggnad: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        reaktion: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        sjalvkontroll: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        vaksamhet: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        livskraft: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        grundskada: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        initiativ: new fields.SchemaField({
            tarning: new fields.StringField({required: true, initial: "0d6", blank: false}),
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        grundrustning: new fields.NumberField({required: true, nullable: false, integer: true, initial: 0, min: 0})
      };
    }
  }