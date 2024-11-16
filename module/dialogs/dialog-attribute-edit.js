import CalculateHelper from "../calculate-helper.js";

export class DialogAttribute {

    #_isPC = false;
    #_isNumeric = false;                // Är attributet en siffra/tärningar
    #_hasName = false;                  // Har attributet ett namn som går att ändra
    #_hasBonusList = false;             // Har attributet en bonuslista
    #_hasLista = false;                 // Har attributet en lista 
    #_hasDescription = false;           // Har attributet en beskrivning
    #_canTic = false;

    #_attributeType = "";
    #_attributeKey = "";
    #_attributeName = "";
    #_attributeBasicValue = 0;          
    #_attributeBonusList = [];
    #_attributeList = [];
    #_attributeListId = "";
    #_attributeDescription = "";

    constructor(actor, type, key) {
        if (actor != undefined) {
            if (actor.type.toLowerCase().replace(" ", "") == "rollperson") {
                this.#_isPC = true;
            }
        }        

        this.#_attributeType = type;
        this.#_attributeKey = key;

        this.#_hasDescription = actor.system[type][key]?.beskrivning != undefined;
        this.#_hasBonusList = actor.system[type][key]?.bonuslista != undefined;
        this.#_isNumeric = actor.system[type][key]?.varde != undefined;
        this.#_hasLista = actor.system[type][key]?.lista != undefined;
        this.#_hasName = actor.system[type][key]?.namn != undefined;

        if (this.#_isPC) {
            if ((this.#_isPC) && (this.#_attributeType == 'grundegenskaper')) {
                this.#_canTic = true;
            }
            if ((this.#_isPC) && (this.#_attributeType == 'harleddegenskaper')) {
                this.#_canTic = false;
            }
        }
        else {
            if (this.#_attributeType == 'harleddegenskaper') {
                this.#_canTic = true;
            }
            // undvika
            if ((this.#_attributeType == 'skada') && (this.#_attributeKey == 'forsvar')) {
                this.#_canTic = true;
            }
        }

        // fastställa namnet
        if (type == "bakgrund") {
            this.#_attributeName = key;
        }
        else if (game.EON.CONFIG?.[type]?.[key] != undefined) {
            this.#_attributeName = game.EON.CONFIG[type]?.[key].namn;   
        }
        else {
            let headline = "";

            if (key == 'forsvar') headline = 'Försvar';
            if (key == 'vandning') {
                headline = 'Vändning';
            }

            this.#_attributeName = headline;
        }

        // läs in datan från actor
        this.reload(actor);

        this.dialogClass = "dialog-" + this.#_attributeType.toLowerCase();
    }

    reload(actor) {
        if (this.#_hasName) {
            this.#_attributeName = actor.system[this.#_attributeType][this.#_attributeKey]?.namn;
        }

        if (this.#_hasLista) {
            this.#_attributeList = actor.system[this.#_attributeType][this.#_attributeKey]?.lista;
            this.#_attributeListId = actor.system[this.#_attributeType][this.#_attributeKey]?.listaid;
        }

        if (actor.system[this.#_attributeType][this.#_attributeKey].grund != undefined) {
            this.#_attributeBasicValue = actor.system[this.#_attributeType][this.#_attributeKey].grund;                
        }
        else if (actor.system[this.#_attributeType][this.#_attributeKey].varde != undefined) {
            this.#_attributeBasicValue = actor.system[this.#_attributeType][this.#_attributeKey].varde;
        }
        else {
            if (this.#_attributeKey != 'vandning')
                console.error('DialogAttribute saknade värde');
        }

        if (actor.system[this.#_attributeType][this.#_attributeKey]?.bonuslista) {
            this.#_attributeBonusList = actor.system[this.#_attributeType][this.#_attributeKey].bonuslista;               
        }

        if (this.#_hasLista) {
            this.#_attributeList = actor.system[this.#_attributeType][this.#_attributeKey]?.lista;
            this.#_attributeListId = actor.system[this.#_attributeType][this.#_attributeKey]?.listaid;
        }
        
        if (this.#_hasDescription) {
            this.#_attributeDescription = actor.system[this.#_attributeType][this.#_attributeKey]?.beskrivning;
        }

        return this;
    }

    get isPC() {
        return this.#_isPC;
    }

    get hasBonusList() {
        return this.#_hasBonusList;
    }

    get hasDescription() {
        return this.#_hasDescription;
    }

    get isNumeric() {
        return this.#_isNumeric;
    }

    get hasName() {
        return this.#_hasName;
    }

    get hasLista() {
        return this.#_hasLista;
    }

    get canTic() {
        return this.#_canTic;
    }

    get attributeName() {
        return this.#_attributeName;
    }

    get attributeType() {
        return this.#_attributeType;
    }

    get attributeKey() {
        return this.#_attributeKey;
    }

    get attributeBasicValue() {
        return this.#_attributeBasicValue;
    }

    get attributeBonusList() {
        return this.#_attributeBonusList;
    }

    get attributeList() {
        return this.#_attributeList;
    }

    get attributeListId() {
        return this.#_attributeListId;
    }

    get attributeDescription() {
        return this.#_attributeDescription;
    }
}

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

        if (attribute.attributeType == "bakgrund") {
            this.options.title = `${actor.name} - ${attribute.attributeKey}`;            
        }
        else {
            this.options.title = `Editera ${attribute.attributeName.toLowerCase()}`;
        }
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-edit.html";
	}  

    async getData() {
        const data = super.getData();

        data.headline = "";        

        data.EON = game.EON;
		data.EON.CONFIG = CONFIG.EON;

        this.object = this.object.reload(this.actor);      

        if (this.object.attributeType == "bakgrund") {
            this.object.varde = this.actor.system.altvarde[this.object.attributeKey];
            data.namn = this.object.attributeKey;
            data.varde = this.object.varde;
            return data;
        }
        if (this.object.attributeKey == "vandning") {
            data.vandningLista = {};
            data.valtid = "";
            let lista = {
                "": "- Välj -"
            };

            // hämta alla vändningstabeller som finns registrerade i systemet.
            game.settings.settings.forEach(setting => {
                if ((setting.namespace == 'eon-rpg') && (setting.key.indexOf('vd_') > -1)) {
                    lista = Object.assign(lista, {[setting.key] : setting.name});
                }                    
            }); 
                
            data.vandningLista = lista;
        }    

        if (data.hasDescription) {
            data.enrichedBeskrivning = await TextEditor.enrichHTML(this.object.attributeDescription);
        }

        if (this.object.attributeType == "grundegenskaper") {
            data.headline = "GRUNDEGENSKAP";
        }
        else if (this.object.attributeType == "strid") {
            data.headline = "STRID";
        }
        else if (this.object.attributeType == "skada") {
            data.headline = this.object.attributeKey.toUpperCase();

            if (this.object.attributeKey == "forsvar") {
                data.headline = "FÖRSVAR";
            } 
            if (this.object.attributeKey == "vandning") {
                data.headline = "VÄNDNING";
            }
        }
        else {
            data.headline = 'HÄRLETT ATTRIBUT';
        }
        
        console.log(this.object.attributeKey);
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
			.find(".item-active")
			.click(this._onItemActive.bind(this));
        
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
                    actorData.system.strid[this.object.attributeKey] :
                    actorData.system.harleddegenskaper[this.object.attributeKey]) :
                actorData.system[this.attribute.source][this.object.attributeKey];
            
            if (!path.bonuslista) {
                path.bonuslista = [];
            }
            path.bonuslista.push(bonus);
        }

        const attributeKeys = Object.keys(formData).filter(k => k.startsWith("attribut."));

        if (attributeKeys.length > 0) {
            for (let key of attributeKeys) {
                const i = (key.match(/\./g) || []).length;
                const value = formData[key];                

                if (i == 1) {
                    if (value !== undefined) {
                        const index = key.split(".")[1];
                        actorData.system[this.object.attributeType][this.object.attributeKey][index] = value;
                    }
                }    
                if (i == 3) {      
                    const egenskap = key.split(".")[1];
                    const index = key.split(".")[2];
                    const attribut = key.split(".")[3];
                    
                    if (value !== undefined) {
                        actorData.system[this.object.attributeType][this.object.attributeKey][egenskap][index][attribut] = value;
                    } 
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
                            actorData.system.strid[this.object.attributeKey] :
                            actorData.system.harleddegenskaper[this.object.attributeKey]) :
                        actorData.system[this.attribute.source][this.object.attributeKey];
                    
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

            actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].namn = newvalue;
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

        if (this.object.attributeType === "strid" || 
            (this.object.attributeType === "harleddegenskaper" && this.object.attributeKey === "grundrustning")) {
            if (dataset.key !== undefined) {
                const key = parseInt(dataset.key);
                const path = this.object.attributeType === "strid" ? 
                    actorData.system.strid[this.object.attributeKey] :
                    actorData.system.harleddegenskaper[this.object.attributeKey];

                if (!path.bonuslista[key]) {
                    path.bonuslista[key] = { tvarde: 0 };
                }
                path.bonuslista[key].tvarde = (path.bonuslista[key].tvarde || 0) + 1;
            }

            const path = this.object.attributeType === "strid" ? 
                actorData.system.strid[this.object.attributeKey] :
                actorData.system.harleddegenskaper[this.object.attributeKey];

            let total = parseInt(path.varde) || 0;
            path.bonuslista.forEach(bonus => {
                total += parseInt(bonus.tvarde) || 0;
            });
            path.totalt = total;

            await this.actor.update(actorData);
        }
        else if (this.object.attributeType === "skada") {
            actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus += 1;

            if (actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus > 3) {
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde += 1;
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
			if (dataset.property != undefined) {
				actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus += 1;

				if ((actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus > 3) && (actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde < 6)) {
					actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde += 1;
					actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 0;
				}

				actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.attributeType][this.object.attributeKey]);
				await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
				await this.actor.update(actorData);
			}
			else if (dataset.key != undefined) {
				const key = dataset.key;
				let tvarde = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde;
				let bonus = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus;

				bonus += 1;
				if ((bonus > 3) && (actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde < 6)) {
					tvarde += 1;
					bonus = 0;
				}

				actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde = tvarde;
				actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus = bonus;
				actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.attributeType][this.object.attributeKey]);
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

        if (this.object.attributeType === "strid" || 
            (this.object.attributeType === "harleddegenskaper" && this.object.attributeKey === "grundrustning")) {
            if (dataset.key !== undefined) {
                const key = parseInt(dataset.key);
                const path = this.object.attributeType === "strid" ? 
                    actorData.system.strid[this.object.attributeKey] :
                    actorData.system.harleddegenskaper[this.object.attributeKey];

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
        else if (this.object.attributeType === "skada") {
            actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus -= 1;

            if (actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus < -1) {
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde -= 1;
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 3;
            }

            if (actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde < 0) {
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde = 0;
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
            if (dataset.property != undefined) {
                actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus -= 1;        

                if (actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus < -1) {
                    actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde -= 1;
                    actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 3;
                }

                if (actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde < 0) {
                    actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde = 0;
                    actorData.system[this.object.attributeType][this.object.attributeKey].grund.bonus = 0;
                }

                actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.attributeType][this.object.attributeKey]);
                await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
                await this.actor.update(actorData);
            }
            else if (dataset.key != undefined) {
                const key = dataset.key;

                let tvarde = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde;
                let bonus = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus;

                bonus -= 1;

                if (bonus < -3)  {
                    tvarde -= 1;
                    bonus = 0;
                }

                actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde = tvarde;
                actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus = bonus;
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.attributeType][this.object.attributeKey]);
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

        if (this.object.attributeType === "strid") {
            if (!actorData.system.strid[this.object.attributeKey].bonuslista) {
                actorData.system.strid[this.object.attributeKey].bonuslista = [];
            }
            actorData.system.strid[this.object.attributeKey].bonuslista.push(bonus);
        } else {
            const diceBonus = {
                namn: "Ny bonus",
                tvarde: 0,
                bonus: 0
            }
            actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista.push(diceBonus);
        }

        await this.actor.update(actorData);
        this.render();
    }

    /**
        * Körs när något item blir aktiverat. 
        * @param _event
    */
    async _onItemActive(event) {	
        console.log("_onItemActive");
        
		event.preventDefault();
        event.stopPropagation();

		const element = event.currentTarget;
		const dataset = element.dataset;
        const actorData = foundry.utils.duplicate(this.actor);

        if ((this.object.attributeType == "skada") && (this.object.attributeKey == "vandning")) {
            const key = dataset.key.split(".")[0];
            const index = parseInt(dataset.key.split(".")[1]);

            actorData.system[this.object.attributeType][this.object.attributeKey][key][index].vandning = !actorData.system[this.object.attributeType][this.object.attributeKey][key][index].vandning;
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

        if (this.object.attributeType === "strid") {
            actorData.system.strid[this.object.attributeKey].bonuslista.splice(key, 1);
            
            let total = parseInt(actorData.system.strid[this.object.attributeKey].varde) || 0;
            actorData.system.strid[this.object.attributeKey].bonuslista.forEach(bonus => {
                total += parseInt(bonus.tvarde) || 0;
            });
            actorData.system.strid[this.object.attributeKey].totalt = total;
        } else {
            actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista.splice(key, 1);
            actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(actorData.system[this.object.attributeType][this.object.attributeKey]);
            await CalculateHelper.BeraknaHarleddEgenskaper(actorData);
        }

        await this.actor.update(actorData);

        this.render();
    }

    async _saveFormForm(event) {
        event.preventDefault();

        if (this.object.attributeType == "bakgrund") {
            const actorData = foundry.utils.duplicate(this.actor);
            var alt = document.getElementById("altvalue");

            var newvalue = alt.value;

            if (newvalue != "") {
                actorData.system[this.object.attributeType][this.object.attributeKey] = "custom";
                actorData.system.altvarde[this.object.attributeKey] = newvalue;
                this.object.varde = newvalue;
            }
            else {
                actorData.system[this.object.attributeType][this.object.attributeKey] = "";
                actorData.system.altvarde[this.object.attributeKey] = "";
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
