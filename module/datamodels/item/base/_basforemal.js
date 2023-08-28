/**
 * Data schema, attributes, and methods specific to Actor.
 */
export default class basforemal extends foundry.abstract.TypeDataModel {
    /* -------------------------------------------- */
    /*  Data Schema                                 */
    /* -------------------------------------------- */  
    /** @inheritDoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        const schema = {};

        schema.typ = new fields.StringField({required: true, initial: ""});
        schema.grupp = new fields.StringField({required: true, initial: ""});
        schema.mall = new fields.StringField({required: true, initial: ""});
        schema.attribut = new fields.StringField({required: true, initial: ""});
        schema.referens = new fields.StringField({required: true, initial: ""});
        schema.beskrivning = new fields.HTMLField();

        return schema;
    }
}