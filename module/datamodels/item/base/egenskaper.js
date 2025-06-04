const fields = foundry.data.fields;
const valueInteger = {required: true, nullable: false, integer: true, initial: 0, min: 0};

const egenskaper = () => [
    new fields.SchemaField({
        uuid: new fields.StringField({ initial: '', nullable: false }),
        _id: new fields.StringField({ initial: '', nullable: false }),
        label: new fields.StringField({ initial: '', nullable: false }),
        namn: new fields.StringField({ initial: '', nullable: false }),
        varde: new fields.NumberField({
            initial: 0,
            nullable: false,
            required: false,
            min: 0
        }),
        beskrivning: new fields.HTMLField(),
        harniva: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0, min: 0 })
    })
];


export default egenskaper