import { DiceRollContainer } from "../dice-helper.js";
import { RollDice } from "../dice-helper.js";

export class AttributeRoll {
    constructor(actor, type, key) {
        this.grundTarning = parseInt(actor.system[type][key].tvarde);
        this.grundBonus = parseInt(actor.system[type][key].bonus);
        this.namn = actor.name;
        this.close = false;
    }
}

export class DialogAttributeRoll extends FormApplication {
    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.isDialog = true;  
        this.options.title = `${actor.name}`;        
    }

    /**
        * Extend and override the default options used by the 5e Actor Sheet
        * @returns {Object}
    */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["general-dialog"],
            template: "systems/eon-rpg/templates/dialogs/dialog-attribute-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    async getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }

    async _updateObject(event, formData) {
        if (this.object.close) {
            this.close();
            return;
        }

        event.preventDefault();    
    }

    /* clicked to roll */
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        const roll = new DiceRollContainer(this.actor);
        roll.number = parseInt(this.object.grundTarning);
        roll.bonus = parseInt(this.object.grundBonus);
        const result = RollDice(roll);

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}

export class SkillRoll {
    constructor(item) {
        this.grundTarning = item.system.varde["tvarde"];
        this.grundBonus = item.system.varde["bonus"];
        this.namn = item.system["namn"];
        this.close = false;
    }
}

export class DialogSkillRoll extends FormApplication {
    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.isDialog = true;  
        this.options.title = `${actor.name}`;        
    }

    /**
        * Extend and override the default options used by the 5e Actor Sheet
        * @returns {Object}
    */
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["general-dialog"],
            template: "systems/eon-rpg/templates/dialogs/dialog-skill-roll.html",
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    async getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.actionbutton')
            .click(this._generalRoll.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    }

    async _updateObject(event, formData) {
        if (this.object.close) {
            this.close();
            return;
        }

        event.preventDefault();    
    }

    /* clicked to roll */
    _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        const roll = new DiceRollContainer(this.actor);
        roll.number = parseInt(this.object.grundTarning);
        roll.bonus = parseInt(this.object.grundBonus);
        const result = RollDice(roll);

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        this.object.close = true;
    }    

}
