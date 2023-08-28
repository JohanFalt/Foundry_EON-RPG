const fields = foundry.data.fields;

/**
 * Data schema, attributes, and methods specific to Actor.
 */
const installningar = () => ({
    skapad: new fields.BooleanField({initial: false}),
    borttagen: new fields.BooleanField({initial: false}),
    version: new fields.StringField({required: true, initial: ""})
});

export default installningar