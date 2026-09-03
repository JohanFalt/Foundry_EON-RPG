const fields = foundry.data.fields;

/**
 * Delad effektschema för Egenskap och Skada (Eon 5).
 * @returns {foundry.data.fields.ArrayField}
 */
const effekter = () => new fields.ArrayField(
    new fields.SchemaField({
        typ: new fields.StringField({ required: true, initial: "tvarde" }),
        targets: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
        mode: new fields.StringField({ required: true, initial: "add" }),
        tvarde: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
        bonus: new fields.NumberField({ required: true, nullable: false, integer: true, initial: 0 }),
        skadetyp: new fields.StringField({ required: true, initial: "" }),
        referens: new fields.StringField({ required: true, initial: "" }),
        predicates: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
        exclusions: new fields.ArrayField(new fields.StringField({ blank: false }), { initial: [] }),
        aktiv: new fields.BooleanField({ initial: true })
    }),
    { required: true, initial: [] }
);

/**
 * Varaktighetsfält för Skada (allvarlig skada och tillstånd).
 * @returns {object}
 */
export const varaktighetFields = () => ({
    varaktighet: new fields.StringField({ required: true, initial: "tills_borttagen" }),
    rundorKvar: new fields.NumberField({ required: true, nullable: true, integer: true, initial: null }),
    varaktighetFormel: new fields.StringField({ required: true, initial: "" }),
    kalla: new fields.StringField({ required: true, initial: "" })
});

export default effekter;
