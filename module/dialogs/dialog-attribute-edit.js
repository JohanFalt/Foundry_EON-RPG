import CalculateHelper from "../calculate-helper.js";

export class DialogAttribute {
    constructor(type, key) {
        this.typ = type;
        this.nyckel = key;
        this.varde = "";

        this.dialogClass = "dialog-" + this.typ.toLowerCase();
    }
}

/* 

- De olika typerna av attribut -

bakgrund 
ändra custom-egenskaper från fliken rollperson bakgrund.

strid
rollpersons läkningstakt

skada
varelse försvar och vändning

attribute
ändra rollperson och varelses grundegenskaper och härledda grundegenskaper

*/

export class DialogAttributeEdit extends FormApplication {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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
        else if (game.EON.CONFIG[attribute.typ]?.[attribute.nyckel] != undefined) {
            let headline = game.EON.CONFIG[attribute.typ][attribute.nyckel].namn.toLowerCase();

            this.options.title = `Editera ${headline}`;        
        }
        else {
            let headline = "";

            if (attribute.nyckel == 'forsvar') headline = 'försvar';
            if (attribute.nyckel == 'vandning') headline = 'vändning';

            this.options.title = `Editera ${headline}`;
        }
        
        this.isNumericBonus = attribute.source === "strid" || 
            (attribute.source === "harleddegenskaper" && attribute.key === "grundrustning");
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-edit.html";
	}  

    getData() {
        const data = super.getData();
        data.hasName = false;
        data.hasDescription = false;
        data.isNumericBonus = true;

        data.EON = game.EON;
		data.EON.CONFIG = CONFIG.EON;

        if (this.object.typ == "bakgrund") {
            this.object.varde = this.actor.system.altvarde[this.object.nyckel];
            data.namn = this.object.nyckel;
            data.varde = this.object.varde;
            return data;
        }
        else if (this.object.typ === "strid") {
            const attribute = this.actor.system[this.object.typ]?.[this.object.nyckel];
            let name = "";

            if (this.config[this.object.typ]?.[this.object.nyckel]?.namn != undefined) {
                name = this.config.strid[this.object.nyckel].namn;
                data.isNumericBonus = true;
            }

            data.attribut = {
                namn: name,
                varde: attribute.varde || 0,
                totalt: attribute.totalt || attribute.varde || 0,
                bonuslista: attribute.bonuslista || []
            };
        }
        else if (this.object.typ === "skada")  {
            if (this.object.nyckel == "vandning") {
                data.attribut = this.actor.system[this.object.typ][this.object.nyckel]
            }
            else if (this.actor.system[this.object.typ][this.object.nyckel].namn != undefined) {
                data.attribut = this.actor.system[this.object.typ][this.object.nyckel];
                data.hasName = true;    
            }            

            data.hasDescription = data.attribut.beskrivning != undefined
            data.isNumericBonus = false;
        }
        else {
            data.attribut = this.actor.system[this.object.typ][this.object.nyckel];

            if (this.config[this.object.typ]?.[this.object.nyckel]?.namn != undefined) {
                data.attribut.namn = this.config[this.object.typ][this.object.nyckel].namn;
            }
        }     
        
        console.log(this.object.nyckel);
        console.log(data);

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
        const actorData = foundry.utils.duplicate(this.actor);
        
        if (formData.newbonus !== undefined && formData.newbonus !== "") {
            const bonus = {
                namn: "Ny bonus",
                tvarde: parseInt(formData.newbonus)
            };
            
            const path = this.isNumericBonus ? 
                (this.attribute.source === "strid" ? 
                    actorData.system.strid[this.attribute.key] :
                    actorData.system.harleddegenskaper[this.attribute.key]) :
                actorData.system[this.attribute.source][this.attribute.key];
            
            if (!path.bonuslista) {
                path.bonuslista = [];
            }
            path.bonuslista.push(bonus);
        }

        const attributeKeys = Object.keys(formData).filter(k => k.startsWith("attribut."));

        if (attributeKeys.length > 0) {
            for (let key of attributeKeys) {
                const index = key.split(".")[1];
                const value = formData[key];

                if (value !== undefined) {
                    actorData.system[this.object.typ][this.object.nyckel][index] = value;
                }
            }
        }

        const bonusKeys = Object.keys(formData).filter(k => k.startsWith("bonus."));
        if (bonusKeys.length > 0) {
            for (let key of bonusKeys) {
                const index = parseInt(key.split(".")[1]);
                const value = formData[key];
                
                if (value !== undefined) {
                    const path = this.isNumericBonus ? 
                        (this.attribute.source === "strid" ? 
                            actorData.system.strid[this.attribute.key] :
                            actorData.system.harleddegenskaper[this.attribute.key]) :
                        actorData.system[this.attribute.source][this.attribute.key];
                    
                    path.bonuslista[index].tvarde = parseInt(value);
                }
            }
        }

        await this.actor.update(actorData);
        this.render();
    }

    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.key != undefined) {
            const key = dataset.key;
            const actorData = foundry.utils.duplicate(this.actor);
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
		const actorData = foundry.utils.duplicate(this.actor);

        if (this.object.typ === "strid" || 
            (this.object.typ === "harleddegenskaper" && this.object.nyckel === "grundrustning")) {
            if (dataset.key !== undefined) {
                const key = parseInt(dataset.key);
                const path = this.object.typ === "strid" ? 
                    actorData.system.strid[this.object.nyckel] :
                    actorData.system.harleddegenskaper[this.object.nyckel];

                if (!path.bonuslista[key]) {
                    path.bonuslista[key] = { tvarde: 0 };
                }
                path.bonuslista[key].tvarde = (path.bonuslista[key].tvarde || 0) + 1;
            }

            const path = this.object.typ === "strid" ? 
                actorData.system.strid[this.object.nyckel] :
                actorData.system.harleddegenskaper[this.object.nyckel];

            let total = parseInt(path.varde) || 0;
            path.bonuslista.forEach(bonus => {
                total += parseInt(bonus.tvarde) || 0;
            });
            path.totalt = total;

            await this.actor.update(actorData);
            this.render();
            return;
        }
        else if (this.object.typ === "skada") {
            actorData.system[this.object.typ][this.object.nyckel].grund.bonus += 1;

            if (actorData.system[this.object.typ][this.object.nyckel].grund.bonus > 3) {
                actorData.system[this.object.typ][this.object.nyckel].grund.tvarde += 1;
                actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
			if (dataset.property != undefined) {
				actorData.system[this.object.typ][this.object.nyckel].grund.bonus += 1;

				if (actorData.system[this.object.typ][this.object.nyckel].grund.bonus > 3) {
					actorData.system[this.object.typ][this.object.nyckel].grund.tvarde += 1;
					actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 0;
				}

				actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
				await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
				await this.actor.update(actorData);
			}
			else if (dataset.key != undefined) {
				const key = dataset.key;
				let tvarde = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde;
				let bonus = actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus;

				bonus += 1;
				if (bonus > 3) {
					tvarde += 1;
					bonus = 0;
				}

				actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].tvarde = tvarde;
				actorData.system[this.object.typ][this.object.nyckel].bonuslista[key].bonus = bonus;
				actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
				await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
				await this.actor.update(actorData);
			}
		}

		this.render();
	}

    async _ticValueDown(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const actorData = foundry.utils.duplicate(this.actor);

        if (this.object.typ === "strid" || 
            (this.object.typ === "harleddegenskaper" && this.object.nyckel === "grundrustning")) {
            if (dataset.key !== undefined) {
                const key = parseInt(dataset.key);
                const path = this.object.typ === "strid" ? 
                    actorData.system.strid[this.object.nyckel] :
                    actorData.system.harleddegenskaper[this.object.nyckel];

                if (path.bonuslista[key]) {
                    path.bonuslista[key].tvarde = Math.max((path.bonuslista[key].tvarde || 0) - 1, 0);
                }

                let total = parseInt(path.varde) || 0;
                path.bonuslista.forEach(bonus => {
                    total += parseInt(bonus.tvarde) || 0;
                });
                path.totalt = total;

                await this.actor.update(actorData);
                this.render();
                return;
            }
        }
        else if (this.object.typ === "skada") {
            actorData.system[this.object.typ][this.object.nyckel].grund.bonus -= 1;

            if (actorData.system[this.object.typ][this.object.nyckel].grund.bonus < -1) {
                actorData.system[this.object.typ][this.object.nyckel].grund.tvarde -= 1;
                actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 3;
            }

            if (actorData.system[this.object.typ][this.object.nyckel].grund.tvarde < 0) {
                actorData.system[this.object.typ][this.object.nyckel].grund.tvarde = 0;
                actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
            if (dataset.property != undefined) {
                actorData.system[this.object.typ][this.object.nyckel].grund.bonus -= 1;        

                if (actorData.system[this.object.typ][this.object.nyckel].grund.bonus < -1) {
                    actorData.system[this.object.typ][this.object.nyckel].grund.tvarde -= 1;
                    actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 3;
                }

                if (actorData.system[this.object.typ][this.object.nyckel].grund.tvarde < 0) {
                    actorData.system[this.object.typ][this.object.nyckel].grund.tvarde = 0;
                    actorData.system[this.object.typ][this.object.nyckel].grund.bonus = 0;
                }

                actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
                await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
                await this.actor.update(actorData);
            }
            else if (dataset.key != undefined) {
                const key = dataset.key;

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
            }
        }

		this.render();
	}

    async _addBonus(event) {
        const bonus = {
            namn: "Ny bonus",
            tvarde: 0
        }

        const actorData = foundry.utils.duplicate(this.actor);

        if (this.object.typ === "strid") {
            if (!actorData.system.strid[this.object.nyckel].bonuslista) {
                actorData.system.strid[this.object.nyckel].bonuslista = [];
            }
            actorData.system.strid[this.object.nyckel].bonuslista.push(bonus);
        } else {
            const diceBonus = {
                namn: "Ny bonus",
                tvarde: 0,
                bonus: 0
            }
            actorData.system[this.object.typ][this.object.nyckel].bonuslista.push(diceBonus);
        }

        await this.actor.update(actorData);
        this.render();
    }

    async _deleteBonus(event) {
        event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        const key = parseInt(dataset.key);

        const actorData = foundry.utils.duplicate(this.actor);

        if (this.object.typ === "strid") {
            actorData.system.strid[this.object.nyckel].bonuslista.splice(key, 1);
            
            let total = parseInt(actorData.system.strid[this.object.nyckel].varde) || 0;
            actorData.system.strid[this.object.nyckel].bonuslista.forEach(bonus => {
                total += parseInt(bonus.tvarde) || 0;
            });
            actorData.system.strid[this.object.nyckel].totalt = total;
        } else {
            actorData.system[this.object.typ][this.object.nyckel].bonuslista.splice(key, 1);
            actorData.system[this.object.typ][this.object.nyckel].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.typ][this.object.nyckel]);
            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
        }

        await this.actor.update(actorData);

        this.render();
    }

    async _saveFormForm(event) {
        event.preventDefault();

        if (this.object.typ == "bakgrund") {
            const actorData = foundry.utils.duplicate(this.actor);
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
