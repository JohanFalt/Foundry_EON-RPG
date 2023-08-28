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
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        talighet: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        rorlighet: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        uppfattning: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        vilja: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        psyke: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        visdom: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        }),
        utstralning: new fields.SchemaField({
            tvarde: new fields.NumberField({...valueInteger}),
            bonus: new fields.NumberField({...bonusInteger})
        })
      };
    }
  }