import DiceHelper from "./dice-helper.js";
import CalculateHelper from "./calculate-helper.js";
import EffectHelper from "./effect-helper.js";
import { CombatAttackFlow } from "./combat-attack-flow.js";
import { dataskapa } from "../data/skapa.js";
import { datafardigheter } from "../data/fardigheter.js";
import { data5fardigheter } from "../data/fardigheter.js";
import { datavaluta } from "../data/valuta.js";

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const PreloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Actor Sheet Partials
		"systems/eon-rpg/templates/actors/parts/rollperson-navigation.html",

		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-top.html",
		"systems/eon-rpg/templates/actors/parts/rollperson5-sheet-top.html",

		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-bio.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-trait.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-weapon.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-weapon-close.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-weapon-martial.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-weapon-ranged.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-weapon-defence.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-health.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-armor.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-equipment.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-magic.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-religion.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-setting.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-skill.html",

		"systems/eon-rpg/templates/actors/parts/varelse-navigation.html",

		"systems/eon-rpg/templates/actors/parts/varelse-sheet-top.html",
		"systems/eon-rpg/templates/actors/parts/varelse-sheet-skill.html",
		"systems/eon-rpg/templates/actors/parts/varelse-sheet-property.html",		
		"systems/eon-rpg/templates/actors/parts/varelse-sheet-weapon.html",
		"systems/eon-rpg/templates/actors/parts/varelse-sheet-bio.html",

		"systems/eon-rpg/templates/items/parts/navigation-ancestry.html",
		"systems/eon-rpg/templates/items/parts/navigation-weapon.html",
		"systems/eon-rpg/templates/items/parts/navigation-faith.html",
		"systems/eon-rpg/templates/items/parts/navigation-spell.html",
		"systems/eon-rpg/templates/items/parts/navigation-effect.html",

		"systems/eon-rpg/templates/items/parts/items-melee-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-missile-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-defence-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-ancestry-data.html",
		"systems/eon-rpg/templates/items/parts/items-ancestry-data5.html",

		"systems/eon-rpg/templates/items/parts/items-weapon-property.html",
		"systems/eon-rpg/templates/items/parts/items-ancestry-property.html",
		"systems/eon-rpg/templates/items/parts/items-ancestry-property5.html",

		"systems/eon-rpg/templates/items/parts/items-faith-data.html",
		"systems/eon-rpg/templates/items/parts/items-faith-skills.html",

		"systems/eon-rpg/templates/items/parts/items-spell-data.html",
		"systems/eon-rpg/templates/items/parts/items-spell-ritual.html",		

		"systems/eon-rpg/templates/items/parts/items-description.html",
		"systems/eon-rpg/templates/items/parts/items-effects.html",
		"systems/eon-rpg/templates/items/parts/items-duration.html",
		"systems/eon-rpg/templates/items/valuta-sheet.html",
		"systems/eon-rpg/templates/combat/eon-combat-tracker.html",
		"systems/eon-rpg/templates/combat/eon-combatant-portrait.html",
		"systems/eon-rpg/templates/wizard/character-creation-wizard.hbs",

		"systems/eon-rpg/templates/actors/parts/motstandare5-sheet-header.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-sheet-stats.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-sheet-health.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-tab-navigation.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-fardigheter.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-strid.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-magi.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-religion.hbs",
		"systems/eon-rpg/templates/actors/parts/motstandare5-anteckningar.hbs",

		"systems/eon-rpg/templates/dialogs/dialog-pick-fardighet.hbs",

		"systems/eon-rpg/templates/dice/tray.html",
		"systems/eon-rpg/templates/dice/roll-template.html",
		"systems/eon-rpg/templates/dice/dialog-settings.html",
    ];

    /* Load the template parts
		That function is part of foundry, not founding it here is normal
	*/
	return foundry.applications.handlebars.loadTemplates(templatePaths);
};

export async function Setup() {
    try {      
		const harStrid = false;

		let importData = {};
		
		let fileData = dataskapa;
		Object.assign(importData, fileData);

		// EON 4
		fileData = datafardigheter;
		Object.assign(importData, fileData);

		// EON 5
		fileData = data5fardigheter;
		Object.assign(importData, fileData);

		// if (!harStrid) {
		// 	fileData = datavapen;
		// 	Object.assign(importData, fileData);

		// 	fileData = data5vapen;
		// 	Object.assign(importData, fileData);
		// }
		// else {
		// 	fileData = datastrid;
		// 	Object.assign(importData, fileData);
		// }		

		// fileData = datautrustning;
		// Object.assign(importData, fileData);

		// fileData = datautrustning5;
		// Object.assign(importData, fileData);

		fileData = datavaluta;
		Object.assign(importData, fileData);

		return importData;		
    } catch(err) {
        return
    }
}

export const RegisterHandlebarsHelpers = function () {
	// Ensure localize is available for all Handlebars templates (e.g. ApplicationV2 combat tracker).
	// Foundry may use a different Handlebars instance; this makes the global one consistent.
	if (!Handlebars.helpers.localize) {
		Handlebars.registerHelper("localize", function (key) {
			return typeof game !== "undefined" && game.i18n ? game.i18n.localize(key) : key;
		});
	}

	function isEmpty(value) {
		if ((value == "") || (value == undefined)) {
			return true;
		}
		else {
			return false;
		}

	}

	// konverterar det interna värdet till ett T6-värde
	Handlebars.registerHelper("getDiceValue", function(value) {
		let dice = "0";

		// rollperson
		if (value?.tvarde != undefined) {
			dice = value?.tvarde;
		}
		// varelse
		else if (value?.grund != undefined) {
			dice = value?.grund.tvarde;
		}

		dice = dice + "T6";

		if ((value?.bonus != undefined) && (value?.bonus != 0)) {
			if (dice == "0T6") {
				dice = "";
			}

			if (value?.bonus > 0) {
				return dice + "+" + value?.bonus;
			}
			if (value?.bonus < 0) {
				return dice + value?.bonus;
			}			
		}
		else if ((value?.grund?.bonus != undefined) && (value?.grund?.bonus != 0)) {
			if (dice == "0T6") {
				dice = "";
			}

			if (value.grund.bonus > 0) {
				return dice + "+" + value.grund.bonus;
			}
			if (value.grund.bonus < 0) {
				return dice + value.grund.bonus;
			}			
		}

		if (dice == "0T6") {
			dice = "0";
		}

		return dice;
	});

	Handlebars.registerHelper("skillDisplayShort", function(fardighet) {	
		let name = "";

		if (fardighet.system.expertis) {
			name = "E";
		}
		if (fardighet.system.kannetecken) {
			name = "K";
		}
		if (fardighet.system.formaga) {
			name = "F";
		}
		if (fardighet.system.hantverk) {
			name = "H";
		}
		
		if (fardighet.system.installningar.blockering) {
			name = "B " + name;
		}	
		if (fardighet.system.installningar.inkompetent) {
			name = "I " + name;
		}
		if (fardighet.system.installningar.talang) {
			name = "T " + name;
		}	

		return name;
	});

	// hämtar en särskild färdighets namn (lokaliserat)
	Handlebars.registerHelper("getSkillname", function(actor, grupp, skill) {
		let namn = "";
		if (actor.type.toLowerCase() === "rollperson") {
			namn = game.EON.fardigheter?.[grupp]?.[skill]?.namn;
		}
		else if (actor.type.toLowerCase() === "rollperson5") {
			namn = game.EON.fardigheter5?.[grupp]?.[skill]?.namn;
		}
		else {
			namn = game.EON.fardigheter?.[grupp]?.[skill]?.namn;
		}
		return namn ? (game.i18n.has(namn) ? game.i18n.localize(namn) : namn) : skill || "";
	});

	// hämtar en särskild färdighets namn
	Handlebars.registerHelper("getSkillnameRitualList", function(actor, list) {
		let oversatt = "";


		if (!list || !Array.isArray(list)) {
			console.warn("Invalid list in getSkillnameRitualList:", list);
			return oversatt;
		}

		try {
			for (const moment of list) {
				let skillName = "";

				if (!moment.grupp || !moment.fardighet) {
					console.warn("Missing grupp or fardighet in moment:", moment);
					continue;
				}

				if (!CalculateHelper.isEon5Actor(actor)) {
					// First try to get from game.EON.fardigheter
					skillName = game.EON.fardigheter?.[moment.grupp]?.[moment.fardighet]?.namn;
					
					// If not found, try CONFIG.EON.fardigheter
					if (!skillName) {
						skillName = CONFIG.EON.fardigheter?.[moment.grupp]?.[moment.fardighet]?.namn;
					}
				}
				else {
					// First try to get from game.EON.fardigheter5
					skillName = game.EON.fardigheter5?.[moment.grupp]?.[moment.fardighet]?.namn;
					
					// If not found, try CONFIG
					if (!skillName) {
						skillName = CONFIG.EON.fardigheter?.[moment.grupp]?.[moment.fardighet]?.namn;
					}
				}

				// If still not found, use the raw fardighet name
				if (skillName == "") {
					skillName = moment.fardighet;
				}

				const displayName = skillName && game.i18n.has(skillName) ? game.i18n.localize(skillName) : skillName;
				if (oversatt !== "") {
					oversatt += ", ";
				}
				oversatt += displayName;
			}
		}
		catch (error) {
			console.error("Error in getSkillnameRitualList:", error, list);
		}       

		return oversatt;
	});

	// hämtar en särskild grupp av färdigheterna
	Handlebars.registerHelper("getActorSkillGroup", function(fardighetgrupp, grupp) {
		return fardighetgrupp[grupp];
	});

	Handlebars.registerHelper("getActorSkillList", function(fardighetlista, grupper) {
		let lista = [];

		for (const grupp in grupper) {
			if ((grupp =="mystik") || (grupp == "sprak") || (grupp == "ovriga")) {
				continue;
			}

			for (const fardighet of fardighetlista[grupp]) {
				lista.push(fardighet);
			}			
		}

		const getSkillDisplayName = (name) => name && game.i18n.has(name) ? game.i18n.localize(name) : (name || "");
		lista.sort((a, b) => getSkillDisplayName(a.name).localeCompare(getSkillDisplayName(b.name)));

		return lista;
	});

	// hämtar en särskild vapenskada
	Handlebars.registerHelper("getWeaponDamageType", function(skada) {
		if (isEmpty(skada)) {
			return "&nbsp;";
		}

		//return vapenskador[skada];

		let icon = "";
		let text = "";
		if (skada == "stick") {
			text = game.i18n.localize("eon.config.vapenskador.stick");
			icon = "skada_stick";
		}
		if (skada == "kross") {
			icon = "skada_kross";
			text = game.i18n.localize("eon.config.vapenskador.kross");
		}
		if (skada == "hugg") {
			text = game.i18n.localize("eon.config.vapenskador.hugg");
			icon = "skada_hugg";
		}

		//return game.EON.CONFIG.ikoner[icon];
		return '<img src="'+game.EON.CONFIG.ikoner[icon]+'" class="item img-text-icon" title="'+text+'" />';
		//game.EON.CONFIG.ikoner[icon]
	});

	/**
	 * Returnerar ALLTID redan översatt display-text (via game.i18n.localize).
	 * Använd i mallar utan {{localize}}: {{getRange rackviddlista rackvidd}}
	 * Saknas rackvidd/namn → "".
	 */
	Handlebars.registerHelper("getRange", function(rackviddlista, rackvidd) {
		if (isEmpty(rackvidd) || !rackviddlista?.[rackvidd]?.namn) {
			return "";
		}

		return game.i18n.localize(rackviddlista[rackvidd].namn);
	});

	// kontrollerar om en viss egenhet finns i listan
	Handlebars.registerHelper("checkProperty", function(egenheter, namn) {
		for (const item of egenheter) {
			if (item.namn == namn) {
				return true;
			}
		}

		return false;
	});

	// hämtar ut nivån för egenheten
	Handlebars.registerHelper("getPropertyLevel", function(egenheter, namn) {
		for (const item of egenheter) {
			if (item.namn == namn) {
				return item.varde;
			}
		}

		return 0;
	});	

	// hämtar en särskild egenskap i en särskild lista
	Handlebars.registerHelper("getListProperty", function(lista, nr, property) {
		if (nr == -1) {
			return "";
		}

		if (lista[nr][property] != undefined) {
			return lista[nr][property];
		}
		else {
			return "";
		}
		
	});

	// lägger ihop två tärningspooler till en.
	Handlebars.registerHelper("addDiceValues", function(fardighet1, fardighet2) {
		return DiceHelper.AdderaVarden(fardighet1, fardighet2);
	});

	// hämtar värdet på en särskild färdighet som RP har.
	Handlebars.registerHelper("getActorSkillGroupValue", function(actor, fardighet, grupp) {
		const fardigheter = actor?.system?.listdata?.fardigheter;
		if (!fardigheter) {
			return { tvarde: 0, bonus: 0 };
		}

		let skillVarde = null;

		if (grupp != "") {
			if (fardigheter[grupp] != undefined) {
				for (const item of fardigheter[grupp]) {
					if (item.system.id == fardighet) {
						skillVarde = item.system.varde;
						break;
					}
				}
			}
		}
		else if (Array.isArray(fardigheter)) {
			for (const item of fardigheter) {
				if (item.system.id == fardighet) {
					skillVarde = item.system.varde;
					break;
				}
			}
		}

		if (CombatAttackFlow.isMotstandareActor(actor)) {
			if (grupp === "strid" && fardighet) {
				return CalculateHelper.resolveMotstandareStridTraffa(actor, skillVarde).varde;
			}
			if (String(fardighet ?? "").toLowerCase() === "undvika") {
				return CalculateHelper.resolveMotstandareUndvika(actor, skillVarde);
			}
		}

		if (skillVarde) {
			return skillVarde;
		}

		return {
			"tvarde": 0,
			"bonus": 0
		}
	});

	Handlebars.registerHelper("getSkillAreaHeight", function(fardigheter) {
		let style = "";
		let numGroup = 0;
		let numSkill = 0;

		for (const grupp in game.EON.CONFIG.fardighetgrupper) {
			numGroup += 1;
			numSkill = numSkill + fardigheter[grupp].length;
		}

		let height = parseInt(numSkill + numGroup) * 27 / 3;
		height = Math.ceil(height);

		style = `max-height: ${height}px`;

		return style;
	});

	// hämtar erfarenhetspoängen på en särskild färdighet.
	Handlebars.registerHelper("getActorSkillGroupExp", function(fardighetgrupp, grupp) {
		return fardighetgrupp[grupp].erf;
	});

	// hämtar ett attribut med egenskaper
	Handlebars.registerHelper("getActorAttribute", function(actor, typ, key) {
		if (!actor?.system?.[typ]?.[key]) {
			return { tvarde: 0, bonus: 0 };
		}
		if (actor.system[typ][key].totalt == undefined) {
			return actor.system[typ][key];
		}

		return actor.system[typ][key].totalt;
	});	

	Handlebars.registerHelper("getAncestryAttributeValue", function(item, typ) {
		return item.system.attribut[typ];
	});		

	// hämtar ett attributs kortnamn
	Handlebars.registerHelper("getAttributeShortName", function(attribut, withdiv = true) {
		if (attribut == "") {
			return "";
		}

		if (withdiv) {
			return '<div class="skill-short">('+game.i18n.localize(CONFIG.EON.grundegenskaper[attribut].kort)+')</div>';
		}
		else {
			return '('+game.i18n.localize(CONFIG.EON.grundegenskaper[attribut].kort)+')';
		}		
	});

	// Hämtar mysteriets färdigheter och listar dessa snyggt
	Handlebars.registerHelper("getMysterySkills", function(actor, skills) {
		let list = "";
		let skillList = "";

		if (!CalculateHelper.isEon5Actor(actor)) {
			skillList = game.EON.fardigheter;
		}
		else {
			skillList = game.EON.fardigheter5;
		}

		for (const skill of skills) {

			if (skillList.mystik[skill.fardighet] == undefined) {
				continue;
			}

			if (list != "") {
				list = list + ", ";
			}
			const namn = skillList.mystik[skill.fardighet].namn;
			list = list + (namn && game.i18n.has(namn) ? game.i18n.localize(namn) : namn);

			if (skill.huvud) {
				list = list + "*";
			}

			list = list + " (" + skill.svarighet + ")";

			if (skill.tid != "") {
				list = list + " " + skill.tid;
			}
		}

		return list;
	});

	Handlebars.registerHelper("getSpellSetting", function(spell, property) {
		if (property == "omfang") {
			if (spell.system.omfang.yta == 0) {
				return `${spell.system.omfang.antal} ${spell.system.omfang.text}`;
			}
			else {
				return game.i18n.localize(CONFIG.EON.magi.omradesomfang[spell.system.omfang.yta]);
			}
		}
		if (property == "rackvidd") {
			if (spell.system.rackvidd.stracka == 0) {
				return `${spell.system.rackvidd.antal} ${spell.system.rackvidd.text}`;
			}
			else {
				return game.i18n.localize(CONFIG.EON.magi.rackvidd[spell.system.rackvidd.stracka]);
			}
		}
		if (property == "varaktighet") {
			if (spell.system.varaktighet.tid == 0) {
				if (spell.system.varaktighet.koncentration) {
					return game.i18n.localize("eon.config.magi.varaktighet.koncentration");
				}
				if (spell.system.varaktighet.momentan) {
					return game.i18n.localize("eon.config.magi.varaktighet.momentan");
				}
				if (spell.system.varaktighet.immanent) {
					return game.i18n.localize("eon.config.magi.varaktighet.immanent");
				}
			}
			else {
				return game.i18n.localize(CONFIG.EON.magi.varaktighet[spell.system.varaktighet.tid]);
			}
		}
	});

	/**
	 * Returnerar ALLTID redan översatt display-text (via game.i18n.localize).
	 * Använd i mallar utan {{localize}}: {{getConfigPropertyName key config}}
	 * Saknas name → "" ; saknas config/nyckel → localize(name) som fallback.
	 */
	Handlebars.registerHelper("getConfigPropertyName", function(name, config) {
		if (name == undefined) {
			return "";
		}

		if (config == undefined) {
			return game.i18n.localize(name);
		}

		if (config[name] == undefined) {
			return game.i18n.localize(name);
		}

		return game.i18n.localize(config[name]);
	});

	Handlebars.registerHelper("getActorSar", function(actor, key) {
		return actor?.system?.skada?.sar?.[key] ?? 0;
	});

	// skickar ut en egenskapslista i läsbart skick
	Handlebars.registerHelper("getPropertyList", function(lista) {
		if (!Array.isArray(lista)) {
			return "";
		}

		let text = "";

		for (const item of lista) {
			let value = item.varde;

			if (text != "") {
				text += ", ";
			}
			
			text += item.label;

			if (value > 0) {
				text += " " + value;
			}		
		}

		return text;
	});

	Handlebars.registerHelper("getBodypart", function(nr, config) {
		const bodynr = parseInt(nr);
		const key = `eon.bodyparts.${bodynr}`;
		const localized = game.i18n.localize(key);
		return localized !== key ? localized : "";
	});

	/**
	 * Returnerar ALLTID redan översatt display-text (via game.i18n.localize).
	 * Använd i mallar utan {{localize}}: {{getArmorType armor actorOrEon5}}
	 * Saknas armor → "" ; saknas material → localize(armor) som fallback.
	 */
	Handlebars.registerHelper("getArmorType", function(armor, actorOrEon5) {
		if (armor == "") {
			return "";
		}
		const isEon5 = actorOrEon5 === "eon5"
			|| actorOrEon5 === true
			|| CalculateHelper.isEon5Actor(actorOrEon5);
		const rustningsmaterial = isEon5 ? CONFIG.EON?.forsvar5?.rustningsmaterial : CONFIG.EON?.forsvar?.rustningsmaterial;
		const entry = rustningsmaterial?.[armor];

		return game.i18n.localize(entry?.namn) ?? game.i18n.localize(armor);
	});

	Handlebars.registerHelper("propertyTrueInList", function(list, property) {
		for(const item of list) {
			if (item[property]) {
				return true;
			}
		}

		return false;
	});

	Handlebars.registerHelper("isChecked", function(value) {
		if (value) {
			return "checked";
		}

		return "";
	});

	Handlebars.registerHelper("isEon5", function(doc) {
		return CalculateHelper.isEon5Actor(doc);
	});

	Handlebars.registerHelper("isEon5Item", function(item) {
		return item?.isEon5 === true || EffectHelper.isEon5Item(item);
	});

	Handlebars.registerHelper("varaktighetText", function(item) {
		const varaktighet = item?.system?.varaktighet ?? "";

		if ((varaktighet === "") || (varaktighet === "tills_borttagen") || (varaktighet === "ingen")) {
			return "";
		}

		// CONFIG.EON.effektVaraktighet är redan lokaliserad vid init (localizeEonConfig)
		if (varaktighet === "runda") {
			const rundorKvar = Number(item?.system?.rundorKvar);

			if (!Number.isFinite(rundorKvar)) {
				return CONFIG.EON.effektVaraktighet.runda ?? "";
			}

			if (rundorKvar === 1) {
				return game.i18n.localize("eon.effects.rundaEn");
			}

			return game.i18n.format("eon.effects.rundorFlera", { antal: rundorKvar });
		}

		return CONFIG.EON.effektVaraktighet[varaktighet] ?? "";
	});

	Handlebars.registerHelper("setVariable", function(varName, varValue, options) {
		options.data.root[varName] = varValue;
	});
		
	Handlebars.registerHelper("numLoop", function (num, options) {
		let ret = "";

		for (let i = 0, j = num; i < j; i++) {
			ret = ret + options.fn(i);
		}

		return ret;
	});

	Handlebars.registerHelper("numFromLoop", function (from, num, options) {
		let ret = "";

		for (let i = from; i <= num; i++) {
			ret = ret + options.fn(i);
		}

		return ret;
	});

	Handlebars.registerHelper("numDownToLoop", function (from, num, options) {
		let ret = "";

		for (let i = from; i >= num; i--) {
			ret = ret + options.fn(i);
		}

		return ret;
	});

	Handlebars.registerHelper('eqAny', function () {
		for(let i = 1; i < arguments.length; i++) {
			if(arguments[0] === arguments[i]) {
				return true;
			}
		}
		return false;
	});

	Handlebars.registerHelper('neAny', function () {
		let found = false;

		for(let i = 1; i < arguments.length; i++) {
		  	if(arguments[0] === arguments[i]) {
				found = true;
		  	}
		}
		
		return !found;
	});

	Handlebars.registerHelper("shorten", function (text, i, exact) {
		if (text === undefined) {
			return "";
		}

		let result = text;



		if (text.length > i) {
			if (exact) {
				if (text.length > i) {
					result = text.substring(0, i);
				}
			}
			else {
				if (text.length > i + 3) {
					result = text.substring(0, i) + "...";
				}
			}
		}

		return result;
	});

	Handlebars.registerHelper("multiplicate", function (number1, number2) {
		return number1 * number2;
	});	

	Handlebars.registerHelper("captilizeFirst", function (text) {
		return text.charAt(0).toUpperCase() + text.slice(1);
	});

	Handlebars.registerHelper("firstLetter", function (text) {
		return text.charAt(0).toUpperCase();
	});

	Handlebars.registerHelper("captilize", function (text) {
		return text.toUpperCase();
	});

	Handlebars.registerHelper("lowercase", function (text) {
		return text.toLowerCase();
	});

	Handlebars.registerHelper("isempty", function (text) {
		if (text.length == 0) {
			return "&nbsp;";
		}
		else {
			return;
		}
	});

	Handlebars.registerHelper("getCurrencyData", function(valuta, property) {
		if (!valuta || !property) {
			return "";
		}

		if (CONFIG.EON.datavaluta?.valuta?.[valuta]?.[property] !== undefined) {
			return CONFIG.EON.datavaluta.valuta[valuta][property];
		}

		return "";
	});

	/**
	 * Returnerar ALLTID redan översatt display-text (via game.i18n.localize).
	 * Använd i mallar utan {{localize}}: {{getEquipmentGroupName groupid}}
	 * Saknas groupid → "".
	 */
	Handlebars.registerHelper("getEquipmentGroupName", function(groupid) {
		if ((groupid == "") || (groupid == undefined)) {
			return "";
		}

		return game.i18n.localize(CONFIG.EON.utrustningsgrupper[groupid]);
	});

	Handlebars.registerHelper("getCurrencyList", function() {
		if (!CONFIG.EON.datavaluta?.valuta) {
			console.warn("No currency data found");
			return [];
		}
		
		const currencyList = Object.entries(CONFIG.EON.datavaluta.valuta).map(([key, currency]) => {
			const item = {
				key: key,
				namn: currency.namn,
				ursprung: currency.ursprung,
				displayNamn: `${currency.namn} (${currency.ursprung})`
			};
			return item;
		});
		
		return currencyList;
	});

	Handlebars.registerHelper("formatDecimal", function(number) {
		if (typeof number !== 'number') {
			number = Number(number);
		}
		return number.toFixed(2);
	});

	Handlebars.registerHelper('sum', function(a, b) {
		
		// Convert inputs to numbers, defaulting to 0 if undefined/null/NaN
		const numA = (a !== undefined && a !== null) ? parseInt(a) || 0 : 0;
		const numB = (b !== undefined && b !== null) ? parseInt(b) || 0 : 0;
		
		const result = numA + numB;
		
		return result;
	});

	Handlebars.registerHelper('round', function(value, decimals) {
		return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
	});

	// Visar listan med Förvaringar på Rollformuläret.
	Handlebars.registerHelper('getEquipmentContainers', function(actor) {
		// Hitta alla förvarings Items på Actor
		const items = (actor?.items || []).filter(item => item.type === "Utrustning" && item.system.installningar.forvaring);
		items.sort((a, b) => a.name.localeCompare(b.name));

		let html = ``;

		// Rubrik: [+] namn 230 | antal 70 | vikt 70 | total
		// Rad: [edit][share][active] namn 180 | antal 70 | vikt 70 | total
		const COL_NAMN = 180;
		const COL_ANTAL = 70;
		const COL_VIKT = 70;
		const COL_TOTAL = 80;

		for (const forvaring of items) {
			const headerhtml = `<div class="item-row container item-listrow" data-itemid="${forvaring._id}" data-actor-id="${actor?._id}">`;
			const footerhtml = `</div>`;

			const editeraUtrustning = game.i18n.localize("eon.sheets.item.editeraUtrustning");
			const beskrivningSaknas = game.i18n.localize("eon.sheets.item.beskrivningSaknas");
			const skickaBeskrivning = game.i18n.localize("eon.sheets.item.skickaBeskrivning");
			const burenTitle = game.i18n.localize("eon.sheets.item.burenUtrustning");

			const descriptionhtml = forvaring.system.beskrivning === ""
				? `<div class="item-listbox weapon-icon"><i class="icon fa-regular fa-share" title="${beskrivningSaknas}"></i></div>`
				: `<div class="item-listbox weapon-icon"><a class="item-send" title="${skickaBeskrivning}" data-source="description" data-itemid="${forvaring._id}"><i class="icon fa-solid fa-share"></i></a></div>`;

			const edithtml = `<div class="item-listbox weapon-icon"><a class="item-edit" title="${editeraUtrustning}" data-source="utrustning" data-itemid="${forvaring._id}"><i class="icon fa-solid fa-pen-to-square"></i></a></div>`;

			const isChecked = forvaring.system.installningar.buren ? "checked" : "";
			const activehtml = `<div class="item-listbox active-icon"><input class="pointer item-active" name="foremal.system.installningar.buren" type="checkbox" data-itemid="${forvaring._id}" data-property="buren" ${isChecked} title="${burenTitle}" /></div>`;

			const namehtml = `<div class="item-listbox draggable" style="width: ${COL_NAMN}px;" data-itemid="${forvaring._id}">${forvaring.name}</div>`;

			const numberhtml = `<div class="item-listbox centerText" style="width: ${COL_ANTAL}px;">
				<i class="fa-solid fa-square-plus green pointer weapon-count" data-action="increase" data-itemid="${forvaring._id}"></i>
				<span class="number-of-text">${forvaring.system.antal}</span>
				<i class="fa-solid fa-square-minus red pointer weapon-count" data-action="decrease" data-itemid="${forvaring._id}"></i>
			</div>`;

			let weight = 0;
			let weighthtml = `<div class="item-listbox centerText" style="width: ${COL_VIKT}px;">-</div>`;
			if (forvaring.system.vikt > 0) {
				weight = forvaring.system.vikt * forvaring.system.antal;
				weighthtml = `<div class="item-listbox centerText" style="width: ${COL_VIKT}px;">${weight.toFixed(2)}</div>`;
			}

			let containerWeight = weight;

			const containedItems = (actor?.items || []).filter(
				item => item.type === "Utrustning" && item.system.installningar.forvaringid === forvaring._id
			);
			containedItems.sort((a, b) => a.name.localeCompare(b.name));

			let containedItemshtml = ``;

			for (const item of containedItems) {
				const itemWeight = Number(item.system.vikt ?? 0) * Number(item.system.antal ?? 0);
				containerWeight += itemWeight;

				const itemShareHtml = item.system.beskrivning === ""
					? `<div class="item-listbox weapon-icon"><i class="icon fa-regular fa-share" title="${beskrivningSaknas}"></i></div>`
					: `<div class="item-listbox weapon-icon"><a class="item-send" title="${skickaBeskrivning}" data-source="description" data-itemid="${item._id}"><i class="icon fa-solid fa-share"></i></a></div>`;

				const itemEditHtml = `<div class="item-listbox weapon-icon"><a class="item-edit" title="${editeraUtrustning}" data-source="utrustning" data-itemid="${item._id}"><i class="icon fa-solid fa-pen-to-square"></i></a></div>`;

				let itemWeightHtml = `<div class="item-listbox centerText" style="width: ${COL_VIKT}px;">-</div>`;
				if (Number(item.system.vikt ?? 0) > 0) {
					itemWeightHtml = `<div class="item-listbox centerText" style="width: ${COL_VIKT}px;">${itemWeight.toFixed(2)}</div>`;
				}

				containedItemshtml += `<div class="item-row container-contents item-listrow">
					${itemEditHtml}
					${itemShareHtml}
					<div class="item-listbox active-icon" aria-hidden="true"></div>
					<div class="item-listbox draggable container-contents-name" style="width: ${COL_NAMN}px;" data-source="utrustning" data-itemid="${item._id}">${item.name}</div>
					<div class="item-listbox centerText" style="width: ${COL_ANTAL}px;">
						<i class="fa-solid fa-square-plus green pointer weapon-count" data-action="increase" data-itemid="${item._id}"></i>
						<span class="number-of-text">${item.system.antal}</span>
						<i class="fa-solid fa-square-minus red pointer weapon-count" data-action="decrease" data-itemid="${item._id}"></i>
					</div>
					${itemWeightHtml}
				</div>`;
			}

			const totalweighthtml = `<div class="item-listbox centerText" style="width: ${COL_TOTAL}px;">${containerWeight.toFixed(2)}</div>`;

			html += headerhtml + edithtml + descriptionhtml + activehtml + namehtml + numberhtml + weighthtml + totalweighthtml + footerhtml + containedItemshtml;
		}

		return html;
	});

	// Visar listan med Förvaringar på Rollformuläret.
	Handlebars.registerHelper('getConnectedItems', function(actor, itemid) {
		const items = (actor?.items || []).filter(item => item.system.installningar.forvaringid == itemid);
		items.sort((a, b) => a.name.localeCompare(b.name));

		return items;
	});

	// sortering
	// Hantera sortering i listor
	// Registera en helper som kollar om ett fält är det som är sorterat just nu
	Handlebars.registerHelper('isSorted', function(listKey, key, options) {
		const sheet = options.data.root.sheet;
		return sheet?.sortState?.[listKey]?.key === key;
	});

	Handlebars.registerHelper('isSortedAsc', function(listName, key, options) {
		const sortState = options.data.root.sheet?.sortState?.[listName];
		return sortState?.key === key && sortState?.asc;
	});

	Handlebars.registerHelper('isSortedDesc', function(listName, key, options) {
		const sortState = options.data.root.sheet?.sortState?.[listName];
		return sortState?.key === key && !sortState?.asc;
	});

	Handlebars.registerHelper('getAncestryProperties', function(actor) {
		const items = (actor?.items || []).filter(item => (item.type === "Egenskap") && (item.system.installningar.folkslag === true));
		items.sort((a, b) => a.name.localeCompare(b.name));

		return items;
	});


}