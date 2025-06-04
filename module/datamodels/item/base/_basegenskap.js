/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class basegenskap extends foundry.abstract.TypeDataModel {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {};

        schema.bonuslista = new fields.ArrayField(
            new fields.ObjectField({
                initial: {},
                nullable: false,
        }));

        schema.id = new fields.StringField({required: true, initial: ""});
        schema.typ = new fields.StringField({required: true, initial: ""});        
        schema.grupp = new fields.StringField({required: true, initial: ""});
        schema.mall = new fields.StringField({required: true, initial: ""});
        schema.referens = new fields.StringField({required: true, initial: ""});
        schema.beskrivning = new fields.HTMLField();
        schema.eon

        return schema;
    }
}