import {
    DiceRollContainer,
    RollDice,
    buildBelastningModifierHtml,
    buildSmartaModifierHtml,
    buildWoundInLimbHtml,
    buildWoundsBodyHtml,
    buildWoundIgnoredHtml
} from "../dice-helper.js";
import { CombatAttackFlow } from "../combat-attack-flow.js";
import CalculateHelper from "../calculate-helper.js";
import EffectHelper from "../effect-helper.js";

/**
 * Chock- och dödsslag identifieras via stabil slagnyckel. Titeljämförelsen finns
 * kvar för anrop som saknar nyckel (t.ex. äldre makron) och kan tas bort när
 * alla anropsvägar skickar rollKey.
 * @param {string} rollKey
 * @param {string} title
 * @returns {boolean}
 */
function isChockOrDodRoll(rollKey, title) {
    if (rollKey === "chock" || rollKey === "dod") return true;
    if (rollKey) return false;
    return title === game.i18n.localize("eon.sheets.actor.chockslag")
        || title === game.i18n.localize("eon.sheets.actor.dodsslag");
}

function getActorSmarta(actor) {
    return Number(
        actor?.system?.berakning?.svarighet?.smarta
        ?? actor?.system?.skada?.smarta
        ?? 0
    );
}

function getBelastningAvdrag(actor) {
    const totaltAvdrag = actor?.system?.berakning?.belastning?.totaltavdrag;
    return {
        tvarde: Number(totaltAvdrag?.tvarde ?? 0),
        bonus: Number(totaltAvdrag?.bonus ?? 0)
    };
}

export class AttributeRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;
    #_tarningar;

    #_harBelastning = false;
    #_harSmarta = false;
    #_harSar = false;

    /**
        * Konstruktor
        * @param actor - the actual actor in question
        * @param type - what type of attribute
        * @param key - what attribute
        * @param title - title of the roll
        * @param rollKey - stabil slagnyckel, t.ex. "chock" eller "dod"
    */
    constructor(actor, type, key, title, rollKey = "") {
        if (CombatAttackFlow.isFolkslagActor(actor)) {
            actor.system.berakning = CalculateHelper.byggRollBerakning(actor);
        }

        this.actor = actor;
        this.namn = actor.name;
        this.title = title;
        this.type = type;
        this.key = key;
        this.rollKey = rollKey;
        this.close = false;

        if ((type == "harleddegenskaper") && ((key == "forflyttning") || (key == "reaktion"))) {
            const avdrag = getBelastningAvdrag(actor);
            if (avdrag.tvarde > 0 || avdrag.bonus > 0) {
                this.#_harBelastning = true;
            }
        }

        if ((type == "harleddegenskaper") && ((key == "forflyttning") || (key == "kroppsbyggnad") || (key == "reaktion") || (key == "vaksamhet"))) {
            if (getActorSmarta(actor) > 0) {
                this.#_harSmarta = true;
            }
        }

        if (((type == "harleddegenskaper") && (key == "forflyttning")) || isChockOrDodRoll(rollKey, title)) {
            if (this.hamtaAntalSar > 0) {
                this.#_harSar = true;
            }
        }

        this.#_tarningar = (type === "strid" && key === "anfallForsvar")
            ? actor.system.strid.anfallForsvar
            : actor.system[type][key].totalt;
        this.#_grundTarning = this.#_tarningar.tvarde;
        this.#_grundBonus = this.#_tarningar.bonus;
        this.#_totalTarning = this.#_tarningar.tvarde;
        this.#_totalBonus = this.#_tarningar.bonus;
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (this.#_harBelastning) {
            tarning.tvarde = tarning.tvarde - this.actor.system.berakning.belastning.totaltavdrag.tvarde;
            tarning.bonus = tarning.bonus - this.actor.system.berakning.belastning.totaltavdrag.bonus;

            if (tarning.bonus < -1) {
                tarning.tvarde -= 1;
                tarning.bonus = tarning.bonus + 3;               
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
        }

        if (this.#_harSmarta) {
            tarning.tvarde = tarning.tvarde - getActorSmarta(this.actor);

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
        }

        if (this.#_harSar) {
            const sar = this.actor.system?.skada?.sar ?? {};
            if (isChockOrDodRoll(this.rollKey, this.title)) {
                tarning.tvarde = tarning.tvarde - this.hamtaAntalSar;
            }
            else {
                tarning.tvarde = tarning.tvarde - Number(sar.hogerben ?? 0);
                tarning.tvarde = tarning.tvarde - Number(sar.vansterben ?? 0);
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
        }

        if (this.actor.isEon5) {
            const context = EffectHelper.buildAttributeContext(this.actor, this.key, this.rollKey);
            const effects = EffectHelper.getMatchingEffects(this.actor, context, { types: ["tvarde"] });
            this._matchedEffects = effects;
            tarning = EffectHelper.applyToPool(tarning, effects);
        }

        return tarning;
    }

    get grundTarning() {
        return this.#_grundTarning;
    }

    get grundBonus() {
        return this.#_grundBonus;
    }

    get tarningar() {
        return this.#_tarningar;
    }

    get totalTarning() {
        return this.#_totalTarning;
    }

    get totalBonus() {
        return this.#_totalBonus;
    }

    get harBelastning() {
        return this.#_harBelastning;
    }

    get harSmarta() {
        return this.#_harSmarta;
    }

    get harSar() {
        return this.#_harSar;
    }

    get hamtaAntalSar() {
        if (!CombatAttackFlow.isFolkslagActor(this.actor)) {
            return 0;
        }

        const sar = this.actor.system?.skada?.sar ?? {};

        if (isChockOrDodRoll(this.rollKey, this.title)) {
            return Number(this.actor.system?.berakning?.svarighet?.antalsar ?? 0)
                || Object.values(sar).reduce((sum, val) => sum + Number(val ?? 0), 0);
        }

        return Number(sar.hogerben ?? 0) + Number(sar.vansterben ?? 0);
    }

    addTicToTarning() {
        if (this.#_totalBonus == 3) {
            this.#_totalTarning += 1;
            this.#_totalBonus = 0;
        }
        else {
            this.#_totalBonus += 1;
        }
    }

    addDiceToTarning() {
        this.#_totalTarning += 1;
    }

    removeTicToTarning() {
        if ((this.#_totalBonus == -1) && (this.#_totalTarning > 0)) {
            this.#_totalTarning -= 1;
            this.#_totalBonus = 3;
        }
        else if ((this.#_totalTarning == 0) && (this.#_totalBonus == 0)) {
            // gör inget alls
        }
        else {
            this.#_totalBonus -= 1;
        }
    }

    removeDiceToTarning() {
        if (this.#_totalTarning > 0) {
            this.#_totalTarning -= 1;
        }
    }
}

export class DialogAttributeRoll extends FormApplication {

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

    constructor(actor, roll, options = {}) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = CONFIG.EON ?? game.EON?.CONFIG ?? {};   
        this.isDialog = true;  
        this.onRollComplete = typeof options.onRollComplete === "function" ? options.onRollComplete : null;
        this.onRollCancelled = typeof options.onRollCancelled === "function" ? options.onRollCancelled : null;
        
        let headline = "";
        
        if (roll.type != "skada") {
            headline = this.config?.[roll.type]?.[roll.key]?.namn ?? roll.key;
        }
        else {
            headline = actor.system[roll.type][roll.key].namn;
        }

        this.options.title = game.i18n.format("eon.roll.rollTitle", { name: headline });
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-attribute-roll.html";
	}     

    getData() {
        const data = super.getData();

        if (data.object.title == "") {
            if (data.object.type != "skada") {
                data.object.namn = game.EON.CONFIG[data.object.type][data.object.key].namn.toLowerCase();
            }
            else {
                data.object.namn = this.actor.system[data.object.type][data.object.key].namn.toLowerCase();
            }
        }
        else {
            data.object.namn = this.object.title;
        }

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.eventbutton')
            .click(this._eventclick.bind(this));

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

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.source == "bonus") {
            let value = dataset.value;

            if (dataset?.action == "add") {
                if (value == "1T6") {
                    this.object.addDiceToTarning();
                }
                else {
                    this.object.addTicToTarning();  
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    this.object.removeDiceToTarning();
                }
                else {
                    this.object.removeTicToTarning();      
                }
            }
        }
        if (dataset?.source == "difficulty") {
            const difficultyInput = document.getElementById("difficulty");
            let value = "";

            if (dataset.value != "clear") {
                value = difficultyInput.value + dataset.value;
            }            

            this.object.svarighet = value;
        }

        this.render();
    }

    /* clicked to roll */
    async _generalRoll(event) {
        event?.preventDefault();

        if (this.object.close) {
            this.close();
            return;
        }

        let info = [];
        let grundvarde = "";
        const visadeTarningar = this.object.visaTarning;
        let description = "";

        if (this.object.harBelastning) {
            description += buildBelastningModifierHtml(this.actor);
        }

        if (this.object.harSmarta) {
            description += buildSmartaModifierHtml(this.actor);
        }

        if (this.object.harSar) {
            if (isChockOrDodRoll(this.object.rollKey, this.object.title)) {
                description += buildWoundsBodyHtml(this.actor);
            }
            else {
                description += buildWoundInLimbHtml(this.actor.system.skada.sar.hogerben, "RightLeg");
                description += buildWoundInLimbHtml(this.actor.system.skada.sar.vansterben, "LeftLeg");
            }
        }

        if (this.actor.isEon5) {
            const context = EffectHelper.buildAttributeContext(this.actor, this.object.key, this.object.rollKey);
            const effects = EffectHelper.getMatchingEffects(this.actor, context);
            description += EffectHelper.describeEffects(effects);
        }

        if ((visadeTarningar.tvarde != this.object.grundTarning) || (visadeTarningar.bonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                grundvarde = `${this.object.grundTarning}T6`;
            }
            else if (this.object.grundBonus > 0) {
                grundvarde = `${this.object.grundTarning}T6+${this.object.grundBonus}`;
            }
            else {
                grundvarde = `${this.object.grundTarning}T6${this.object.grundBonus}`;
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.grundegenskap;
        roll.action = this.object.namn;
        roll.number = visadeTarningar.tvarde;
        roll.bonus = visadeTarningar.bonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;
        roll.description = description;
        roll.grundvarde = grundvarde;

        const result = await RollDice(roll);
        if (this.onRollComplete) {
            await this.onRollComplete({
                result: Number(result),
                dice: visadeTarningar,
                roll
            });
        }
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        event?.preventDefault();
        this.object.close = true;
        if (this.onRollCancelled) {
            this.onRollCancelled();
        }
        this.close();
    }    
}

export class SkillRoll {

    #_totalTarning = 0;
    #_totalBonus = 0;
    #_grundTarning = 0;
    #_grundBonus = 0;

    #_harBelastning = false;
    #_harSmarta = false;
    #_harSar = false;
    #_visaSar = false;

    /**
        * Konstruktor
        * @param item - skill to roll
        * @param actor - the actual actor in question        
    */
    constructor(item, actor) {
        if (CombatAttackFlow.isFolkslagActor(actor)) {
            actor.system.berakning = CalculateHelper.byggRollBerakning(actor);
        }

        const belastningAvdrag = getBelastningAvdrag(actor);
        const sar = actor?.system?.skada?.sar;

        if (item.type == "Färdighet") {

            if ((item.system.grupp == "rorelse") && (CONFIG.EON.settings.hinderenceSkillGroupMovement)) { 
                if ((belastningAvdrag.tvarde > 0) || (belastningAvdrag.bonus > 0)) {
                    this.#_harBelastning = true;
                }                
            }
            if ((item.system.attribut == "rorlighet") && (CONFIG.EON.settings.hinderenceAttributeMovement)) { 
                if ((belastningAvdrag.tvarde > 0) || (belastningAvdrag.bonus > 0)) {
                    this.#_harBelastning = true;
                }  
            }
        }

        if (item.type == "Färdighet") {
            if ((item.system.grupp == "rorelse") || (item.system.grupp == "mystik") || (item.system.grupp == "strid")) {
                if (getActorSmarta(actor) > 0) {
                    this.#_harSmarta = true;
                }
            }
        }

        if (item.type == "Färdighet") {
            if (!sar) {
                this.#_harSar = false;
                this.#_visaSar = false;
            }
            else if (((sar.hogerben > 0) || (sar.vansterben > 0)) && (item.system.grupp == "rorelse")) {
                this.#_harSar = true;
                this.#_visaSar = true;
            }
            else if (((sar.hogerarm > 0) || (sar.vansterarm > 0)) && (item.system.grupp == "strid")) {
                this.#_visaSar = true;
            }
        } 

        this.#_grundTarning = item.system.varde["tvarde"];
        this.#_grundBonus = item.system.varde["bonus"];
        this.#_totalTarning = item.system.varde["tvarde"];
        this.#_totalBonus = item.system.varde["bonus"];

        if (CombatAttackFlow.isMotstandareActor(actor)
            && item.type === "Färdighet"
            && String(item.system?.id ?? "").toLowerCase() === "undvika") {
            const resolved = CalculateHelper.resolveMotstandareUndvika(actor, item.system.varde);
            this.#_grundTarning = resolved.tvarde;
            this.#_grundBonus = resolved.bonus;
            this.#_totalTarning = resolved.tvarde;
            this.#_totalBonus = resolved.bonus;
        }

        this.close = false;
        this.actor = actor;
        this.item = item;
        this.typ = "skill";
        this.grupp = item.system.grupp;
        this.effectRollKind = "";
        this._externalEffects = [];

        this.namn = game.i18n.has(item.name) ? game.i18n.localize(item.name) : item.name;
        this.svarighet = "";
        this.hantverk = item.system["hantverk"];
        this.kannetecken = item.system["kannetecken"];
        this.expertis = item.system["expertis"];   
    }

    /**
     * Matcha egna aktörseffekter och externa effekter mot varsin målkontext.
     * Externa effekter kommer exempelvis från anfallarens vapenegenskaper.
     * @param {string[]} [types]
     * @returns {object[]}
     */
    getMatchedEffects(types) {
        const ownContext = EffectHelper.buildSkillContext(this.actor, this.item, {
            rollKind: this.effectRollKind,
            mal: "aktor"
        });
        const ownEffects = EffectHelper.getMatchingEffects(this.actor, ownContext, { types });

        const externalContext = EffectHelper.buildSkillContext(this.actor, this.item, {
            rollKind: this.effectRollKind,
            mal: "forsvarare"
        });
        const externalEffects = EffectHelper.getMatchingEffects(this.actor, externalContext, {
            types,
            extraEffects: this._externalEffects,
            includeActorEffects: false
        });

        return [...ownEffects, ...externalEffects];
    }

    get visaTarning() {
        let tarning = {
            tvarde: this.#_totalTarning,
            bonus: this.#_totalBonus
        };

        if (this.#_harBelastning) {
            const avdrag = getBelastningAvdrag(this.actor);
            tarning.tvarde = tarning.tvarde - avdrag.tvarde;
            tarning.bonus = tarning.bonus - avdrag.bonus;

            if (tarning.bonus < -1) {
                tarning.tvarde -= 1;
                tarning.bonus = tarning.bonus + 3;               
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }
 
        }

        if (this.#_harSmarta) {
            tarning.tvarde = tarning.tvarde - getActorSmarta(this.actor);

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }       
        }

        if (this.#_harSar) {
            const sar = this.actor?.system?.skada?.sar ?? {};
            if (this.grupp == "rorelse") {
                tarning.tvarde = tarning.tvarde - Number(sar.hogerben ?? 0);
                tarning.tvarde = tarning.tvarde - Number(sar.vansterben ?? 0);
            }         
            if (this.grupp == "strid") {
                tarning.tvarde = tarning.tvarde - Number(sar.hogerarm ?? 0);
                tarning.tvarde = tarning.tvarde - Number(sar.vansterarm ?? 0);
            }

            if (tarning.tvarde < 0) {
                tarning.tvarde = 0;
                tarning.bonus = 0;
            }   
        }

        if (this.actor.isEon5) {
            const effects = this.getMatchedEffects(["tvarde"]);
            tarning = EffectHelper.applyToPool(tarning, effects);
        }

        return tarning;
    }

    get grundTarning() {
        return this.#_grundTarning;
    }

    get grundBonus() {
        return this.#_grundBonus;
    }

    get totalTarning() {
        return this.#_totalTarning;
    }

    get totalBonus() {
        return this.#_totalBonus;
    }

    get harBelastning() {
        return this.#_harBelastning;
    }

    get harSmarta() {
        return this.#_harSmarta;
    }

    get harSar() {
        return this.#_harSar;
    }

    set harSar(aktiv) {
        this.#_harSar = aktiv;
    }

    get visaSar() {
        return this.#_visaSar;
    }

    get hamtaAntalSar() {
        return this.actor.system.skada.sar.hogerarm + this.actor.system.skada.sar.vansterarm;
    }

    addTicToTarning() {
        if (this.#_totalBonus == 3) {
            this.#_totalTarning += 1;
            this.#_totalBonus = 0;
        }
        else {
            this.#_totalBonus += 1;
        }
    }

    addDiceToTarning() {
        this.#_totalTarning += 1;
    }

    removeTicToTarning() {
        if ((this.#_totalBonus == -1) && (this.#_totalTarning > 0)) {
            this.#_totalTarning -= 1;
            this.#_totalBonus = 3;
        }
        else if ((this.#_totalTarning == 0) && (this.#_totalBonus == 0)) {
            // gör inget alls
        }
        else {
            this.#_totalBonus -= 1;
        }
    }

    removeDiceToTarning() {
        if (this.#_totalTarning > 0) {
            this.#_totalTarning -= 1;
        }
    }
}

export class DialogSkillRoll extends FormApplication {

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

    constructor(actor, roll, options = {}) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;      
        this.isDialog = true;
        this.onRollComplete = typeof options.onRollComplete === "function" ? options.onRollComplete : null;
        this.onRollCancelled = typeof options.onRollCancelled === "function" ? options.onRollCancelled : null;
        this.combatContext = options.combatContext ?? null;
        this.options.title = game.i18n.format("eon.roll.rollTitle", { name: roll.namn.toLowerCase() });
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-skill-roll.html";
	}  

    getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        html
            .find('.eventbutton')
            .click(this._eventclick.bind(this));

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

    /* something happened on the sheet */
    _eventclick(event) {
        event.preventDefault();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset?.source == "set") {
            this.object[dataset.value] = !this.object[dataset.value];
        }
        if (dataset?.source == "bonus") {
            let value = dataset.value;

            if (dataset?.action == "add") {
                if (value == "1T6") {
                    this.object.addDiceToTarning();
                }
                else {
                    this.object.addTicToTarning();
                }
            }
            if (dataset?.action == "remove") {
                if (value == "1T6") {
                    this.object.removeDiceToTarning();
                }
                else {
                    this.object.removeTicToTarning();
                }
            }
        }
        if (dataset?.source == "difficulty") {
            const difficultyInput = document.getElementById("difficulty");
            let value = "";

            if (dataset.value != "clear") {
                value = difficultyInput.value + dataset.value;
            }            

            this.object.svarighet = value;
        }

        this.render();
    }

    /* clicked to roll */
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }

        let info = [];
        let description = "";

        if (this.object.hantverk) {
            info.push(game.i18n.localize("eon.sheets.actor.hantverk"));
        }
        if (this.object.kannetecken) {
            info.push(game.i18n.localize("eon.sheets.actor.kannetecken"));
        }
        if (this.object.expertis) {
            info.push(game.i18n.localize("eon.sheets.actor.expertis"));
        }

        if (this.object.harBelastning) {
            description += buildBelastningModifierHtml(this.actor);
        }

        if (this.object.harSmarta) {
            description += buildSmartaModifierHtml(this.actor);
        }

        if (this.object.harSar) {
            const sar = this.actor?.system?.skada?.sar ?? {};
            if ((sar.hogerben > 0) && (this.object.grupp == "rorelse")) {
                description += buildWoundInLimbHtml(sar.hogerben, "RightLeg");
            }
            if ((sar.vansterben > 0) && (this.object.grupp == "rorelse")) {
                description += buildWoundInLimbHtml(sar.vansterben, "LeftLeg");
            }
            if ((sar.hogerarm > 0) && (this.object.grupp == "strid")) {
                description += buildWoundInLimbHtml(sar.hogerarm, "RightArm");
            }
            if ((sar.vansterarm > 0) && (this.object.grupp == "strid")) {
                description += buildWoundInLimbHtml(sar.vansterarm, "LeftArm");
            }
        }
        if ((this.object.visaSar) && (!this.object.harSar)) {
            const sar = this.actor?.system?.skada?.sar ?? {};
            if ((sar.hogerben > 0) && (this.object.grupp == "rorelse")) {
                description += buildWoundIgnoredHtml(sar.hogerben, "RightLeg");
            }
            if ((sar.vansterben > 0) && (this.object.grupp == "rorelse")) {
                description += buildWoundIgnoredHtml(sar.vansterben, "LeftLeg");
            }
            if ((sar.hogerarm > 0) && (this.object.grupp == "strid")) {
                description += buildWoundIgnoredHtml(sar.hogerarm, "RightArm");
            }
            if ((sar.vansterarm > 0) && (this.object.grupp == "strid")) {
                description += buildWoundIgnoredHtml(sar.vansterarm, "LeftArm");
            }
        }

        if (this.actor.isEon5) {
            const effects = this.object.getMatchedEffects();
            description += EffectHelper.describeEffects(effects);
        }

        let grundvarde = "";

        if ((this.object.visaTarning.tvarde != this.object.grundTarning) || (this.object.visaTarning.bonus != this.object.grundBonus)) {
            if (this.object.grundBonus == 0) {
                grundvarde = `${this.object.grundTarning}T6`;
            }
            else if (this.object.grundBonus > 0) {
                grundvarde = `${this.object.grundTarning}T6+${this.object.grundBonus}`;
            }
            else {
                grundvarde = `${this.object.grundTarning}T6-${this.object.grundBonus}`;
            }            
        }

        const roll = new DiceRollContainer(this.actor, this.config);
        roll.typeroll = CONFIG.EON.slag.fardighet;

        if (this.combatContext) {
            roll.action = game.i18n.format("eon.combatAttack.defenseUndvikaAgainst", {
                skill: this.object.namn.toLowerCase(),
                attacker: this.combatContext.attackerName
            });
            const attackLine = game.i18n.format("eon.combatAttack.defenseAgainstAttackResult", {
                result: this.combatContext.attackResult
            });
            description += `${attackLine}<br />`;
        } else {
            roll.action = this.object.namn;
        }

        roll.number = this.object.visaTarning.tvarde;
        roll.bonus = this.object.visaTarning.bonus;

        if ((this.object.svarighet != "") && (this.object.svarighet != undefined)) {
            roll.svarighet = parseInt(this.object.svarighet);
        }

        roll.info = info;      
        roll.description = description;
        roll.grundvarde = grundvarde;  

        const result = await RollDice(roll);
        if (this.onRollComplete) {
            await this.onRollComplete({
                result: Number(result),
                dice: this.object.visaTarning,
                roll
            });
        }
        this.close();
    }

    /* clicked to close form */
    _closeForm(event) {
        event?.preventDefault();
        this.object.close = true;
        if (this.onRollCancelled) {
            this.onRollCancelled();
        }
        this.close();
    }    

}

export class MysteryRoll {

    #_harSmarta = false;

    constructor(item, actor) {
        this.typ = "mystery";
        this.namn = game.i18n.has(item.name) ? game.i18n.localize(item.name) : item.name;
        this.moment = item.system.moment;
        this.magnitud = item.system.magnitud;
        this.close = false;
        this.actor = actor;

        if (actor.system.berakning.svarighet.smarta > 0) {
            this.#_harSmarta = true;
        }      
    }

    get harSmarta() {
        return this.#_harSmarta;
    }
}

export class DialogMysteryRoll extends FormApplication {

    static get defaultOptions() {
        //let mode = (game.settings.get('core', 'uiConfig').colorScheme.applications == "dark" ? " eon-theme-dark " : " eon-theme-light ");
        let mode = " eon-theme-light ";

        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["EON general-dialog" + mode],
            closeOnSubmit: false,
            submitOnChange: true,
            resizable: true
        });
    }

    constructor(actor, roll) {
        super(roll, {submitOnChange: true, closeOnSubmit: false});
        this.actor = actor;     
        this.config = game.EON.CONFIG;     
        this.EON = game.EON; 
        this.isDialog = true;  
        this.options.title = `${actor.name} - ${roll.namn}`;        
    }

    /** @override */
	get template() {
        return "systems/eon-rpg/templates/dialogs/dialog-skill-roll.html";
	}  

    getData() {
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
    async _generalRoll(event) {
        if (this.object.close) {
            this.close();
            return;
        }        

        let success = true;
        let grundvarde = "";

        for (const diceroll of this.object.moment) {
            grundvarde = "";

            const roll = new DiceRollContainer(this.actor, this.config);
            roll.typeroll = CONFIG.EON.slag.fardighet;

            if (!this.actor.isEon5) {
                roll.action = game.EON.fardigheter.mystik[diceroll.fardighet].namn;
            }
            else {
                roll.action = game.EON.fardigheter5.mystik[diceroll.fardighet].namn;
            }

            let grundTarning = 0;
            let grundBonus = 0;

            for (const item of this.actor.system.listdata.fardigheter.mystik) {
                if (item.system.id == diceroll.fardighet) {
                    grundTarning = item.system.varde.tvarde - this.actor.system.berakning.svarighet.smarta;
                    grundBonus = item.system.varde.bonus;

                    if (grundTarning < 0) {
                        grundTarning = 0;
                        grundBonus = 0;
                    }

                    if ((grundTarning != item.system.varde.tvarde) || (grundBonus != item.system.varde.bonus)) {
                        if (item.system.varde.bonus == 0) {
                            grundvarde = `${item.system.varde.tvarde}T6`;
                        }
                        else if (item.system.varde.bonus > 0) {
                            grundvarde = `${item.system.varde.tvarde}T6+${item.system.varde.bonus}`;
                        }
                        else {
                            grundvarde = `${item.system.varde.tvarde}T6-${item.system.varde.bonus}`;
                        }            
                    }

                    break;
                }
            }

            let info = [];

            if (this.actor.system.berakning.svarighet.smarta > 0) {
                roll.description = buildSmartaModifierHtml(this.actor);
            }

            roll.grundvarde = grundvarde; 

            roll.number = grundTarning;
            roll.bonus = grundBonus;
            roll.svarighet = parseInt(diceroll.svarighet);
            roll.info = info;    
            
            const result = await RollDice(roll);
    
            if (result < parseInt(diceroll.svarighet)) {
                console.log("failed: " + result);
            }
            else {
                console.log("success: " + result);
            }
        }        

        this.object.close = true;
    }

    /* clicked to close form */
    _closeForm(event) {
        event?.preventDefault();
        this.object.close = true;
        this.close();
    }
}