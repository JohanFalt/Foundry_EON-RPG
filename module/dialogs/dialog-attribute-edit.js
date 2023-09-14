import CalculateHelper from "../calculate-helper.js";

export class DialogAttribute {
    constructor(type, key) {
        this.typ = type;
        this.key = key;
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
        this.options.title = `${actor.name} - ${game.EON.CONFIG[attribute.typ][attribute.key].namn}`;        
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-edit.html";
	}  

    getData() {
        const data = super.getData();

        data.attribut = this.actor.system[this.object.typ][this.object.key];
        data.attribut.namn = this.config[this.object.typ][this.object.key].namn;

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

            actorData.system[this.object.typ][this.object.key].bonuslista[key].namn = newvalue;
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

            let tvarde = actorData.system[this.object.typ][this.object.key].bonuslista[key].tvarde;
            let bonus = actorData.system[this.object.typ][this.object.key].bonuslista[key].bonus;

            bonus += 1;

            if (bonus > 3)  {
                tvarde += 1;
                bonus = 0;
            }

            actorData.system[this.object.typ][this.object.key].bonuslista[key].tvarde = tvarde;
            actorData.system[this.object.typ][this.object.key].bonuslista[key].bonus = bonus;
            actorData.system[this.object.typ][this.object.key].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.key]);
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

            let tvarde = actorData.system[this.object.typ][this.object.key].bonuslista[key].tvarde;
            let bonus = actorData.system[this.object.typ][this.object.key].bonuslista[key].bonus;

            bonus -= 1;

            if (bonus < -3)  {
                tvarde -= 1;
                bonus = 0;
            }

            actorData.system[this.object.typ][this.object.key].bonuslista[key].tvarde = tvarde;
            actorData.system[this.object.typ][this.object.key].bonuslista[key].bonus = bonus;
            actorData.system[this.object.typ][this.object.key].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.key]);
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
        actorData.system[this.object.typ][this.object.key].bonuslista.push(bonus);

        await this.actor.update(actorData);

        this.render();
    }

    async _deleteBonus(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        const key = parseInt(dataset.key);

        const actorData = duplicate(this.actor);
        actorData.system[this.object.typ][this.object.key].bonuslista.splice(key, 1);
        actorData.system[this.object.typ][this.object.key].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.key]);
        await CalculateHelper.BeraknaHarleddEgenskaper(actorData);

        await this.actor.update(actorData);

        this.render();
    }

    _saveFormForm(event) {
        this.render();
    }

    /* clicked to close form */
    _closeForm(event) {
        event.preventDefault();

        this.close();
    }    
}
