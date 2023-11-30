import DiceHelper from "./dice-helper.js";
import { dataskapa } from "../packs/skapa.js";
import { datafardigheter } from "../packs/fardigheter.js";
import { datavapen } from "../packs/vapen.js";
import { datastrid } from "../packs/strid.js";
import { datautrustning } from "../packs/utrustning.js";
import { datadjur } from "../packs/djur.js";

/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const PreloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Actor Sheet Partials
		"systems/eon-rpg/templates/actors/parts/navigation.html",
		"systems/eon-rpg/templates/actors/parts/navigation-mystic.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-top.html",
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
		"systems/eon-rpg/templates/actors/parts/varelse-sheet-top.html",
    ];

    /* Load the template parts
		That function is part of foundry, not founding it here is normal
	*/
	return loadTemplates(templatePaths);
};

export async function Setup() {
    try {        
        /* const {files} = await FilePicker.browse("data", 'systems/eon-rpg/packs');
        let data = await FilePicker.browse("data", "systems/eon-rpg/packs", { bucket: null, extensions: [".json", ".JSON"], wildcard: false }); 
		if (data.files.includes("systems/eon-rpg/packs/karaktarsdrag.json")) {
			const fileData = await fetch(`systems/eon-rpg/packs/karaktarsdrag.json`).then((response) => response.json());
			Object.assign(importData, fileData);
        }*/

		const harStrid = false;

		let importData = {};
		
		let fileData = dataskapa;
		Object.assign(importData, fileData);

		fileData = datafardigheter;
		Object.assign(importData, fileData);

		if (!harStrid) {
			fileData = datavapen;
		}
		else {
			fileData = datastrid;
		}
		Object.assign(importData, fileData);

		fileData = datautrustning;
		Object.assign(importData, fileData);

		fileData = datadjur;
		Object.assign(importData, fileData);

		return importData;		
    } catch(err) {
        return
    }
}

export const RegisterHandlebarsHelpers = function () {

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

		if (value?.tvarde != undefined) {
			dice = value?.tvarde;
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

		if (dice == "0T6") {
			dice = "0";
		}

		//return "Ob" + dice;
		return dice;
	});

	// hämtar en särskild räckvidd
	Handlebars.registerHelper("getSkillname", function(grupp, skill) {
		return game.EON.fardigheter[grupp][skill].namn;
	});

	// hämtar en särskild grupp av färdigheterna
	Handlebars.registerHelper("getActorSkillGroup", function(fardighetgrupp, grupp) {
		return fardighetgrupp[grupp];
	});

	// hämtar en särskild grupp av vapnen
	Handlebars.registerHelper("getWeaponGroup", function(vapengrupp, grupp) {
		return vapengrupp[grupp];
	});

	// hämtar en särskild vapenskada
	Handlebars.registerHelper("getWeaponDamageType", function(vapenskador, skada) {
		if (isEmpty(skada)) {
			return "&nbsp;";
		}
		/* if ((skada == "") || (skada == undefined)) {
			return "&nbsp;";
		} */

		return vapenskador[skada];
	});

	// hämtar en särskild räckvidd
	Handlebars.registerHelper("getRange", function(rackviddlista, rackvidd) {
		if (isEmpty(rackvidd)) {
			return "&nbsp;";
		}
		/* if ((rackvidd == "") || (rackvidd == undefined)) {
			return "&nbsp;";
		} */

		return rackviddlista[rackvidd].namn;
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

	// hämtar en särskild grupp av utrustning
	Handlebars.registerHelper("getEquipmentGroup", function(utrustningsgrupp, grupp) {
		return utrustningsgrupp[grupp];
	});

	// lägger ihop två tärningspooler till en.
	Handlebars.registerHelper("addDiceValues", function(fardighet1, fardighet2) {
		return DiceHelper.AdderaVarden(fardighet1, fardighet2);
	});

	// hämtar värdet på en särskild färdighet som RP har.
	Handlebars.registerHelper("getActorSkillGroupValue", function(actor, fardighet, grupp) {
		for (const item of actor.system.listdata.fardigheter[grupp]) {
			if (item.system.id == fardighet) {
				return item.system.varde;
			}
		}

		return {
			"tvarde": 0,
			"bonus": 0
		}
	});

	Handlebars.registerHelper("getActorSkillValue", function(actor, fardighet, config) {
		for (const grupp in config.fardighetgrupper) {
			for (const item of actor.system.listdata.fardigheter[grupp]) {
				if (item.system.id == fardighet) {
					return item.system.varde;
				}
			}
		}

		return {
			"tvarde": 0,
			"bonus": 0
		}
	});	

	// hämtar erfarenhetspoängen på en särskild färdighet.
	Handlebars.registerHelper("getActorSkillGroupExp", function(fardighetgrupp, grupp) {
		return fardighetgrupp[grupp].erf;
	});

	// hämtar ett attribut med egenskaper
	Handlebars.registerHelper("getActorAttribute", function(actor, typ, key) {
		return actor.system[typ][key].totalt;
	});	

	// hämtar ett attributs kortnamn
	Handlebars.registerHelper("getAttributeShortName", function(attribut) {
		if (attribut == "") {
			return "";
		}

		return CONFIG.EON.grundegenskaper[attribut].kort;
	});

	// Hämtar mysteriets färdigheter och listar dessa snyggt
	Handlebars.registerHelper("getMysterySkills", function(skills) {
		let list = "";

		for (const skill of skills) {
			//list = list + CONFIG.EON.fardigheter.mystik[skill.fardighet];
			if (game.EON.fardigheter.mystik[skill.fardighet] == undefined) {
				continue;
			}

			if (list != "") {
				list = list + ", ";
			}

			list = list + game.EON.fardigheter.mystik[skill.fardighet].namn;

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
				return CONFIG.EON.magi.omradesomfang[spell.system.omfang.yta];
			}
		}
		if (property == "rackvidd") {
			if (spell.system.rackvidd.stracka == 0) {
				return `${spell.system.rackvidd.antal} ${spell.system.rackvidd.text}`;
			}
			else {
				return CONFIG.EON.magi.rackvidd[spell.system.rackvidd.stracka];
			}
		}
		if (property == "varaktighet") {
			if (spell.system.varaktighet.tid == 0) {
				if (spell.system.varaktighet.koncentration) {
					return "Koncentration";
				}
				if (spell.system.varaktighet.momentan) {
					return "Momentan";
				}
				if (spell.system.varaktighet.immanent) {
					return "Immanent";
				}
			}
			else {
				return CONFIG.EON.magi.varaktighet[spell.system.varaktighet.tid];
			}
		}
	});

	Handlebars.registerHelper("getConfigPropertyName", function(name, config) {
		if (name == undefined) {
			return name;
		}

		if (config == undefined) {
			return name;
		}

		if (config[name] == undefined) {
			return name;
		}

		return config[name];
	});

	Handlebars.registerHelper("getActorSar", function(actor, key) {
		return actor.system.skada.sar[key];
	});

	// skickar ut en egenskapslista i läsbart skick
	Handlebars.registerHelper("getPropertyList", function(lista) {
		let text = "";

		for (const item of lista) {
			let name = item.namn;
			let value = item.varde;

			/* if (item.length > 1) {				
				value = item[1];
			} */

			if (text != "") {
				text += ", ";
			}

			for (const egenskap in game.EON.egenskaper) {
				if (egenskap == name) {
					text += game.EON.egenskaper[egenskap].namn;

					if (value > 0) {
						text += " " + value;
					}

					break;
				}
			}			
		}

		return text;
	});

	Handlebars.registerHelper("getBodypart", function(nr, config) {
		let text = "";
		let bodynr = parseInt(nr);

		switch (bodynr) {
			case 1:
				text = "Ansikte";
				break;
			case 2:
				text = "Skalle";
				break;
			case 3:
				text = "Hals";
				break;
			case 4:
				text = "Bröstkorg";
				break;
			case 5:
				text = "Mage";
				break;
			case 6:
				text = "Underliv";
				break;
			case 7:
				text = "Skuldra (V)";
				break;
			case 8:
				text = "Skuldra (H)";
				break;
			case 9:
				text = "Överarm (V)";
				break;
			case 10:
				text = "Överarm (H)";
				break;
			case 11:
				text = "Armbåge (V)";
				break;
			case 12:
				text = "Armbåde (H)";
				break;
			case 13:
				text = "Underarm (V)";
				break;
			case 14:
				text = "Underarm (H)";
				break;
			case 15:
				text = "Hand (V)";
				break;
			case 16:
				text = "Hand (H)";
				break;
			case 17:
				text = "Höft (V)";
				break;
			case 18:
				text = "Höft (H)";
				break;
			case 19:
				text = "Lår (V)";
				break;
			case 20:
				text = "Lår (H)";
				break;
			case 21:
				text = "Knä (V)";
				break;
			case 22:
				text = "Knä (H)";
				break;
			case 23:
				text = "Vad (V)";
				break;
			case 24:
				text = "Vad (H)";
				break;
			case 25:
				text = "Fot (V)";
				break;
			case 26:
				text = "Fot (H)";
				break;
			default:
		}

		return text;
	});

	Handlebars.registerHelper("getArmorType", function(armor) {
		if (armor == "") {
			return "";
		}

		return game.EON.forsvar.rustningsmaterial[armor].namn;
	});

	Handlebars.registerHelper("isChecked", function(value) {
		if (value) {
			return "checked";
		}

		return "";
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

	Handlebars.registerHelper("shorten", function (text, i) {
		let result = text;

		if (text.length > i) {
			if (text.length > i + 3) {
				result = text.substring(0, i) + "...";
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
}