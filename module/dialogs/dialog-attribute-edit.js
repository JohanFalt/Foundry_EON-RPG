import CalculateHelper from "../calculate-helper.js";

export class DialogAttribute {
    constructor(type, key) {
        this.typ = type;
        this.nyckel = key;
        this.varde = "";

        this.dialogClass = "dialog-" + this.typ.toLowerCase();
    }
}

export class DialogAttributeEdit extends FormApplication {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog"],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: false
        });
    }

    constructor(actor, attribute) {
        super(attribute, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;  

        this.config = game.EON.CONFIG;      
        this.isDialog = true;  

        if (attribute.typ == "bakgrund") {
            this.options.title = `${actor.name} - ${attribute.nyckel}`;
            
        }
        else {
            this.options.title = `${actor.name} - ${game.EON.CONFIG[attribute.typ][attribute.nyckel].namn}`;        
        }
        
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-edit.html";
	}  

    getData() {
        const data = super.getData();

        data.CONFIG = this.config;

        if (this.object.typ == "bakgrund") {
            this.object.varde = this.actor.system.altvarde[this.object.nyckel];
        }
        else {
            data.attribut = this.actor.system[this.object.typ][this.object.nyckel];
            data.attribut.namn = this.config[this.object.typ][this.object.nyckel].namn;
        }
        

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
			.find('.inputdata')
			.change(event => this._onsheetChange(event));

        html
            .find('.tic')
			.click(this._ticValueUp.bind(this));

		html
			.find('.tic')
			.on('contextmenu', this._ticValueDown.bind(this));

        html
            .find('.item-create')
            .click(this._addBonus.bind(this));
        
        html
            .find('.item-delete')
            .click(this._deleteBonus.bind(this));

        html
            .find('.savebutton')
            .click(this._saveFormForm.bind(this));

        html
            .find('.closebutton')
            .click(this._closeForm.bind(this));
    } 

    async _updateObject(event, formData) {
    
    } 

    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.key != undefined) {
            const key = dataset.key;
            const actorData = duplicate(this.actor);
            const component = "object.name_" + key;

            var e = document.getElementById(component);
            var newvalue = e.value;

            actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].namn = newvalue;
            await this.actor.update(actorData);
            this.render();

            return;
        }
	}

    async _ticValueUp(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.key != undefined) {
            const key = dataset.key;
            const actorData = duplicate(this.actor);

            let tvarde = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde;
            let bonus = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus;

            bonus += 1;

            if (bonus > 3)  {
                tvarde += 1;
                bonus = 0;
            }

            actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde = tvarde;
            actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus = bonus;
            actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);

            await this.actor.update(actorData);
            this.render();

            return;
        }
	}

    async _ticValueDown(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.key != undefined) {
            const key = dataset.key;
            const actorData = duplicate(this.actor);

            let tvarde = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde;
            let bonus = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus;

            bonus -= 1;

            if (bonus < -3)  {
                tvarde -= 1;
                bonus = 0;
            }

            actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde = tvarde;
            actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus = bonus;
            actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);

            await this.actor.update(actorData);
            this.render();

            return;
        }
	}

    async _addBonus(event) {
        const bonus = {
            namn: "Ny bonus",
            tvarde: 0,
            bonus: 0
        }

        const actorData = duplicate(this.actor);
        actorData.system[this.object.typ][this.object.nyckel].bonuslista.push(bonus);

        await this.actor.update(actorData);

        this.render();
    }

    async _deleteBonus(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        const key = parseInt(dataset.key);

        const actorData = duplicate(this.actor);
        actorData.system[this.object.typ][this.object.nyckel].bonuslista.splice(key, 1);
        actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
        await CalculateHelper.BeraknaHarleddEgenskaper(actorData);

        await this.actor.update(actorData);

        this.render();
    }

    async _saveFormForm(event) {
        event.preventDefault();

        if (this.object.typ == "bakgrund") {
            const actorData = duplicate(this.actor);
            //var e = document.getElementById(this.object.nyckel);
            var alt = document.getElementById("altvalue");

            var newvalue = alt.value;

            if (newvalue != "") {
                actorData.system[this.object.typ][this.object.nyckel] = "custom";
                actorData.system.altvarde[this.object.nyckel] = newvalue;
                this.object.varde = newvalue;
            }
            else {
                actorData.system[this.object.typ][this.object.nyckel] = "";
                actorData.system.altvarde[this.object.nyckel] = "";
                this.object.varde = "";
            }

            await this.actor.update(actorData);
        }

        this.render();
    }

    /* clicked to close form */
    _closeForm(event) {
        event.preventDefault();

        this.close();
    }    
}
