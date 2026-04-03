const fields = foundry.data.fields;
const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

/**
 * Data schema, attributes, and methods specific to Actor.
 */
const bonus = () => ({
    namn: new fields.StringField({required: true, initial: ""}),
    typ: new fields.StringField({required: true, initial: ""}),
    varde: new fields.NumberField({...valueInteger})
});

export default bonus