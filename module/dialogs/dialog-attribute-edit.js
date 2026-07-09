import CalculateHelper from "../calculate-helper.js";
import ItemHelper from "../item-helper.js";

export class DialogAttribute {

    static isMotstandareActor(actor) {
        const actorType = (actor?.type ?? "").toLowerCase().replace(/\s/g, "");
        return actorType === "motstandare5" || actor?.system?.installningar?.motstandare === true;
    }

    /**
     * Motståndare: grundskada justeras via modifierare så värdet kvarstår vid kroppsbyggnadsomräkning.
     */
    static usesGrundskadaModifierare(actor, type, key) {
        return type === "harleddegenskaper"
            && key === "grundskada"
            && DialogAttribute.isMotstandareActor(actor);
    }

    static _isFlatOb(field) {
        return field
            && field.tvarde !== undefined
            && field.bonus !== undefined
            && field.totalt === undefined
            && field.grund === undefined
            && field.varde === undefined;
    }

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
            else if (actor.type.toLowerCase().replace(" ", "") == "rollperson5") {
                this.#_isPC = true;
            }
        }        

        this.#_attributeType = type;
        this.#_attributeKey = key;

        const field = actor.system[type]?.[key];
        const isFlatOb = DialogAttribute._isFlatOb(field);

        this.#_hasDescription = field?.beskrivning != undefined;
        this.#_hasBonusList = field?.bonuslista != undefined;
        this.#_isNumeric = field?.varde != undefined;
        this.#_hasLista = field?.lista != undefined;
        this.#_hasName = field?.namn != undefined;

        if (isFlatOb) {
            this.#_canTic = true;
        }

        if (this.#_isPC) {
            if ((this.#_isPC) && (this.#_attributeType == 'grundegenskaper')) {
                this.#_canTic = true;
            }
            if ((this.#_isPC) && (this.#_attributeType == 'harleddegenskaper')) {
                this.#_canTic = false;
            }
            if ((this.#_isPC) && (this.#_attributeType == 'harleddegenskaper') && (actor.system.installningar.eon === "eon5")) {
                this.#_canTic = true;
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
        else if (key === "anfallForsvar") {
            this.#_attributeName = "eon.sheets.motstandare.anfallForsvar";
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
        
        if (DialogAttribute.usesGrundskadaModifierare(actor, this.#_attributeType, this.#_attributeKey)) {
            const modifierare = actor.system.harleddegenskaper.grundskada.modifierare ?? { tvarde: 0, bonus: 0 };
            this.#_attributeBasicValue = {
                tvarde: modifierare.tvarde ?? 0,
                bonus: modifierare.bonus ?? 0
            };
        }
        else if (actor.system[this.#_attributeType][this.#_attributeKey].grund != undefined) {
            this.#_attributeBasicValue = actor.system[this.#_attributeType][this.#_attributeKey].grund;                
        }
        else if (actor.system[this.#_attributeType][this.#_attributeKey].varde != undefined) {
            this.#_attributeBasicValue = actor.system[this.#_attributeType][this.#_attributeKey].varde;
        }
        else if (actor.system[this.#_attributeType][this.#_attributeKey].totalt != undefined) {
            this.#_attributeBasicValue = actor.system[this.#_attributeType][this.#_attributeKey].totalt;                
        }
        else if (DialogAttribute._isFlatOb(actor.system[this.#_attributeType][this.#_attributeKey])) {
            const ob = actor.system[this.#_attributeType][this.#_attributeKey];
            this.#_attributeBasicValue = { tvarde: ob.tvarde, bonus: ob.bonus };
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
        //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " eon-theme-dark " : " eon-theme-light ");
        let mode = " eon-theme-light ";

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog" + mode],
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
            this.options.title = game.i18n.localize("eon.sheets.actor.editera") + " " + game.i18n.localize(attribute.attributeName).toLowerCase();
        }
    }

    /**
     * Varelse Eon 4: max 6 tärningar + overflow till bonus.
     * Gäller grundegenskaper (om de finns) och härledda attribut med T6-grund — inte grundrustning (siffervärde).
     */
    _beraknaTotaltVardeOptions(actorData) {
        const src = actorData ?? this.actor;
        if (!CalculateHelper.isVarelseEon4(src)) return {};
        if (this.object.attributeType === "grundegenskaper") {
            return { varelseEon4Grundegenskap: true };
        }
        if (this.object.attributeType === "harleddegenskaper" && this.object.attributeKey !== "grundrustning") {
            return { varelseEon4Grundegenskap: true };
        }
        return {};
    }

    /**
     * Om tic (+) ska stoppa omvandling +4 bonus → +1 tärning när grund redan har 6 tärningar.
     * Endast Varelse Eon 4 (samma omfattning som _beraknaTotaltVardeOptions). Rollperson: alltid obegränsat via tic.
     */
    _varelseEon4TicSexTarningsTak(actorData) {
        const src = actorData ?? this.actor;
        if (!CalculateHelper.isVarelseEon4(src)) return false;
        if (this.object.attributeType === "grundegenskaper") return true;
        if (this.object.attributeType === "harleddegenskaper" && this.object.attributeKey !== "grundrustning") {
            return true;
        }
        return false;
    }

    /**
     * Varelse Eon 5: normalisera grundvärde till obegränsat format (ingen 6T6-cap)
     * för härledda T6-attribut i dialogen, så visningen blir t.ex. 7T6+1 istället för 6T6+5.
     */
    _grundskadaEditableField(actorData) {
        if (DialogAttribute.usesGrundskadaModifierare(this.actor, this.object.attributeType, this.object.attributeKey)) {
            const grundskada = actorData.system.harleddegenskaper.grundskada;
            if (!grundskada.modifierare) {
                grundskada.modifierare = { tvarde: 0, bonus: 0 };
            }
            return grundskada.modifierare;
        }
        return actorData.system[this.object.attributeType][this.object.attributeKey].grund;
    }

    async _normaliseraVarelseEon5Grund(actorData) {
        const src = actorData ?? this.actor;
        if (CalculateHelper.isVarelseEon4(src)) return false;
        if (DialogAttribute.usesGrundskadaModifierare(src, this.object.attributeType, this.object.attributeKey)) {
            return false;
        }
        if (this.object.attributeType !== "harleddegenskaper" || this.object.attributeKey === "grundrustning") {
            return false;
        }

        const attribut = actorData?.system?.[this.object.attributeType]?.[this.object.attributeKey];
        if (!attribut?.grund) return false;

        const normaliserad = await CalculateHelper.BeraknaTotaltVarde({
            grund: foundry.utils.duplicate(attribut.grund),
            bonuslista: []
        }, {});
        if (!normaliserad || typeof normaliserad !== "object") return false;

        const nuTvarde = parseInt(attribut.grund.tvarde) || 0;
        const nuBonus = parseInt(attribut.grund.bonus) || 0;
        const nyTvarde = parseInt(normaliserad.tvarde) || 0;
        const nyBonus = parseInt(normaliserad.bonus) || 0;
        if (nuTvarde === nyTvarde && nuBonus === nyBonus) return false;

        attribut.grund.tvarde = nyTvarde;
        attribut.grund.bonus = nyBonus;
        attribut.totalt = await CalculateHelper.BeraknaTotaltVarde(
            attribut,
            this._beraknaTotaltVardeOptions(actorData)
        );
        return true;
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

        const actorData = foundry.utils.duplicate(this.actor);
        const normaliserad = await this._normaliseraVarelseEon5Grund(actorData);
        if (normaliserad) {
            await this.actor.update(actorData);
            this.object = this.object.reload(actorData);
        } else {
            this.object = this.object.reload(this.actor);
        }

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
                "": game.i18n.localize("eon.dialogs.vandningQuickpickPlaceholder")
            };

            // hämta alla vändningstabeller som finns i kompendiet.
            // #243
            const vandningar = await ItemHelper.GetCreatureCombatTurn(this.actor.system.installningar.eon);
            for (const i in vandningar) {
                const tid = vandningar[i].id ?? vandningar[i]._id;
                lista = Object.assign(lista, {[tid] : vandningar[i].name});
            }

            data.vandningLista = lista;
            const lid = this.object.attributeListId ?? "";
            data.vandningQuickpickSelected = (lid !== "" && Object.prototype.hasOwnProperty.call(lista, lid)) ? lid : "";
        }

        if (data.hasDescription) {
            data.enrichedBeskrivning = await foundry.applications.ux.TextEditor.implementation.enrichHTML(this.object.attributeDescription);
        }

        if (this.object.attributeType == "grundegenskaper") {
            data.headline = game.i18n.localize("eon.dialogs.attributeEdit.headlineGrundegenskap");
        }
        else if (this.object.attributeType == "strid") {
            data.headline = game.i18n.localize("eon.dialogs.attributeEdit.headlineStrid");
        }
        else if (this.object.attributeType == "skada") {
            const skadaHeadlineKey = {
                forsvar: "eon.dialogs.forsvar",
                skydd: "eon.sheets.actor.skydd",
                utmattning: "eon.sheets.actor.utmattning",
                vandning: "eon.sheets.actor.vandning"
            }[this.object.attributeKey];
            data.headline = skadaHeadlineKey
                ? game.i18n.localize(skadaHeadlineKey).toUpperCase()
                : this.object.attributeKey.toUpperCase();
        }
        else {
            data.headline = game.i18n.localize("eon.dialogs.attributeEdit.headlineHarlettAttribut");
        }
        
        //console.log(this.object.attributeKey);
        //console.log(data);

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

        html.find("#vandning-compendium-pick").on("change", (ev) => {
            const valdListaId = ev.currentTarget.value;
            const input = html.find('input[name="attribut.listaid"]');
            if (input.length) input.val(valdListaId);
        });
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
                        let faltVarde = value;
                        if (index === "listaid" && typeof faltVarde === "string") faltVarde = faltVarde.trim();
                        actorData.system[this.object.attributeType][this.object.attributeKey][index] = faltVarde;
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

        const objectKeys = Object.keys(formData).filter(k => k.startsWith("object."));
        if (objectKeys.length > 0) {
            for (let key of objectKeys) {
                const index = key.split(".")[1];
                const value = formData[key];

                if (index == "namn") {
                    actorData.system[this.object.attributeType][this.object.attributeKey].namn = value;
                }
            }
        }

        const attrPath = actorData.system[this.object.attributeType]?.[this.object.attributeKey];

        if (attrPath?.grund != null && this.object.attributeType !== "skada") {
            attrPath.totalt = await CalculateHelper.BeraknaTotaltVarde(
                attrPath,
                this._beraknaTotaltVardeOptions(actorData));
            await CalculateHelper.efterHarleddAttributAndring(actorData);
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

            const namnInput = document.getElementById(component);
            const newValue = namnInput.value;

            actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].namn = newValue;
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

        if (this.object.attributeType === "strid" && this.object.attributeKey === "anfallForsvar") {
            const path = actorData.system.strid.anfallForsvar;
            path.bonus = (path.bonus || 0) + 1;
            if (path.bonus > 3) {
                path.tvarde = (path.tvarde || 0) + 1;
                path.bonus = 0;
            }
            await this.actor.update(actorData);
            this.object.reload(this.actor);
            this.render();
            return;
        }

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
            else {
                actorData.system[this.object.attributeType][this.object.attributeKey].varde += 1;
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
            actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus += 1;

            if (actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus > 3) {
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.tvarde += 1;
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
			if (dataset.property != undefined) {
                const grundField = this._grundskadaEditableField(actorData);
				grundField.bonus += 1;

				if (grundField.bonus > 3) {
                    if (this.object.attributeKey == "grundskada") {
                        grundField.tvarde += 1;
					    grundField.bonus = 0;
                    }
                    else if (
                        !this._varelseEon4TicSexTarningsTak(actorData)
                        || grundField.tvarde < 6) {
					    grundField.tvarde += 1;
					    grundField.bonus = 0;
                    }
				}

				actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(
                    actorData.system[this.object.attributeType][this.object.attributeKey],
                    this._beraknaTotaltVardeOptions(actorData));
				await CalculateHelper.efterHarleddAttributAndring(actorData);
				await this.actor.update(actorData);
			}
			else if (dataset.key != undefined) {
				const key = dataset.key;
				let tvarde = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde;
				let bonus = actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus;

				bonus += 1;
				if (
                    (bonus > 3)
                    && (!this._varelseEon4TicSexTarningsTak(actorData)
                        || actorData.system[this.object.attributeType][this.object.attributeKey].grund.tvarde < 6)) {
					tvarde += 1;
					bonus = 0;
				}

				actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].tvarde = tvarde;
				actorData.system[this.object.attributeType][this.object.attributeKey].bonuslista[key].bonus = bonus;
				actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(
                    actorData.system[this.object.attributeType][this.object.attributeKey],
                    this._beraknaTotaltVardeOptions(actorData));
				await CalculateHelper.efterHarleddAttributAndring(actorData);
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

        if (this.object.attributeType === "strid" && this.object.attributeKey === "anfallForsvar") {
            const path = actorData.system.strid.anfallForsvar;
            if (path.bonus > 0) {
                path.bonus -= 1;
            } else if (path.tvarde > 0) {
                path.tvarde -= 1;
                path.bonus = 3;
            }
            await this.actor.update(actorData);
            this.object.reload(this.actor);
            this.render();
            return;
        }

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
            }
            else {
                if (actorData.system[this.object.attributeType][this.object.attributeKey].varde > 0) {
                    actorData.system[this.object.attributeType][this.object.attributeKey].varde -= 1;
                }               
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
            this.render();
            return;
        }
        else if (this.object.attributeType === "skada") {
            actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus -= 1;

            if (actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus < -1) {
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.tvarde -= 1;
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus = 3;
            }

            if (actorData.system[this.object.attributeType][this.object.attributeKey].totalt.tvarde < 0) {
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.tvarde = 0;
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt.bonus = 0;
            }

            await this.actor.update(actorData);
        }
        else {
            if (dataset.property != undefined) {
                const grundField = this._grundskadaEditableField(actorData);
                grundField.bonus -= 1;        

                if (grundField.bonus < -1) {
                    grundField.tvarde -= 1;
                    grundField.bonus = 3;
                }

                if (grundField.tvarde < 0) {
                    grundField.tvarde = 0;
                    grundField.bonus = 0;
                }

                actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(
                    actorData.system[this.object.attributeType][this.object.attributeKey],
                    this._beraknaTotaltVardeOptions(actorData));
                await CalculateHelper.efterHarleddAttributAndring(actorData);
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
                actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(
                    actorData.system[this.object.attributeType][this.object.attributeKey],
                    this._beraknaTotaltVardeOptions(actorData));
                await CalculateHelper.efterHarleddAttributAndring(actorData);

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
            actorData.system[this.object.attributeType][this.object.attributeKey].totalt = await CalculateHelper.BeraknaTotaltVarde(
                actorData.system[this.object.attributeType][this.object.attributeKey],
                this._beraknaTotaltVardeOptions(actorData));
            await CalculateHelper.efterHarleddAttributAndring(actorData);
        }

        await this.actor.update(actorData);

        this.render();
    }

    async _saveFormForm(event) {
        event.preventDefault();

        if (this.object.attributeType == "bakgrund") {
            const actorData = foundry.utils.duplicate(this.actor);
            const altValueInput = document.getElementById("altvalue");

            const newValue = altValueInput.value;

            if (newValue != "") {
                actorData.system[this.object.attributeType][this.object.attributeKey] = "custom";
                actorData.system.altvarde[this.object.attributeKey] = newValue;
                this.object.varde = newValue;
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
