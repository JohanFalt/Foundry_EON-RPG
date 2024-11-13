import DiceHelper from "./dice-helper.js";
import { dataskapa } from "../packs/skapa.js";
import { datafardigheter } from "../packs/fardigheter.js";
import { datavapen } from "../packs/vapen.js";
import { datastrid } from "../packs/strid.js";
import { datautrustning } from "../packs/utrustning.js";
import { datadjur } from "../packs/djur.js";
import { datavaluta } from "../packs/valuta.js";

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

		"systems/eon-rpg/templates/items/parts/navigation-weapon.html",
		"systems/eon-rpg/templates/items/parts/navigation-faith.html",
		"systems/eon-rpg/templates/items/parts/navigation-spell.html",

		"systems/eon-rpg/templates/items/parts/items-melee-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-missile-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-defence-weapon-data.html",
		"systems/eon-rpg/templates/items/parts/items-weapon-property.html",

		"systems/eon-rpg/templates/items/parts/items-faith-data.html",
		"systems/eon-rpg/templates/items/parts/items-faith-skills.html",

		"systems/eon-rpg/templates/items/parts/items-spell-data.html",
		"systems/eon-rpg/templates/items/parts/items-spell-ritual.html",		

		"systems/eon-rpg/templates/items/parts/items-description.html",
		"systems/eon-rpg/templates/items/valuta-sheet.html",
    ];

    /* Load the template parts
		That function is part of foundry, not founding it here is normal
	*/
	return loadTemplates(templatePaths);
};

export async function Setup() {
    try {      
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

		fileData = datavaluta;
		Object.assign(importData, fileData);

		return importData;		
    } catch(err) {
        return
    }
}

export async function RegisterRollableTables() {
	let stridfolderData = false;
	let skadefolderData = false;
	let vandningfolderData = false;

	// skapa mapp-strukturen först strid
	for (const folder of game.folders) {
		if ((folder.type == "RollTable") && (folder.flags?.eon?.folderId == "Strid")) {
			stridfolderData = folder;
			break;
		}
	}

	if (!stridfolderData) {
		// Create a new Folder
		stridfolderData = await Folder.create({
			name: "[EON] Strid",
			type: "RollTable",
			parent: null,
			sorting: 'm',
			"flags.eon.folderId": "Strid"
		});
	}

	// skapa mapp-strukturen först skada
	for (const folder of game.folders) {
		if ((folder.type == "RollTable") && (folder.flags?.eon?.folderId == "Skadetabell")) {
			skadefolderData = folder;
			break;
		}
	}

	if (!skadefolderData) {
		// Create a new Folder
		skadefolderData = await Folder.create({
			name: "[EON] Skadetabell",
			type: "RollTable",
			parent: null,
			sorting: 'm',
			"flags.eon.folderId": "Skadetabell"
		});
	}

	// skapa mapp-strukturen först vändning
	for (const folder of game.folders) {
		if ((folder.type == "RollTable") && (folder.flags?.eon?.folderId == "Vandningstabell")) {
			vandningfolderData = folder;
			break;
		}
	}

	if (!vandningfolderData) {
		// Create a new Folder
		vandningfolderData = await Folder.create({
			name: "[EON] Vändningstabell",
			type: "RollTable",
			parent: null,
			sorting: 'm',
			"flags.eon.folderId": "Vandningstabell"
		});
	}

	// läs in alla tabellerna
	let data = await FilePicker.browse("data", "systems/eon-rpg/packs/tabeller", { bucket: null, extensions: [".json", ".JSON"], wildcard: false }); 

	for (const file of data.files) {
		const fileData = await fetch(`${file}`).then((response) => response.json());

		let id = "";

		try {
			id = game.settings.get('eon-rpg', fileData.id);
		}
		catch(err) {
			// om tabellen inte har en inställning hoppa över denna (settings.js)
			console.log(`${fileData.id} finns inte registrerad i systemet`);
			continue;
		}

		let folderData = false;

		// kontrollera om mappen redan finns
		if (fileData.mapp != "") {
			if (fileData.mapp == "Skadetabell") {
				folderData = skadefolderData;
			}
			if (fileData.mapp == "Strid") {
				folderData = stridfolderData;
			}
			if (fileData.mapp == "Vandningstabell") {
				folderData = vandningfolderData;
			}
		}	

		let range = 1;

		try {
			range = parseInt(fileData.tabell.results[fileData.tabell.results.length-1].range[1]);
		}
		catch(err) {
			console.error(`Kunde inte läsa in antalet sidor tabellen ${fileData.id} skulle ha`);
			continue;
		}		

		if (id == "") {
			let formula = `1d${range}`;

			if (fileData.tabell?.formula != undefined) {
				formula = fileData.tabell?.formula;
			}

			let tabell = await RollTable.implementation.create({
				name: fileData.tabell.name,
				results: fileData.tabell.results,
				img: fileData.tabell.img,
				description: fileData.tabell.description,
				folder: folderData._id,
				replacement: true,
				displayRoll: true,
				formula: formula
			});

			console.log(`Tabell ${fileData.id} skapad ${tabell._id}`);
			await game.settings.set('eon-rpg', fileData.id, tabell._id);
		}
		// kontrollera version på tabellen
		// om tabellen är borttagen OM borttagen skall den läggas till igen?
		else {
			const table = game.tables.find(i => i._id === id);

			if ((!table) || (table == undefined)) {
				let tabell = await RollTable.implementation.create({
					name: fileData.tabell.name,
					results: fileData.tabell.results,
					img: fileData.tabell.img,
					description: fileData.tabell.description,
					folder: folderData._id,
					replacement: true,
					displayRoll: true,
					formula: `1d${range}`
				});

				console.log(`Tabell ${fileData.id} skapad ${tabell._id}`);		
				await game.settings.set('eon-rpg', fileData.id, tabell._id);
			}			
		}		
	}

	//await Macro.implementation.create({});
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

			if (value?.bonus > 0) {
				return dice + "+" + value?.grund.bonus;
			}
			if (value?.bonus < 0) {
				return dice + value?.grund?.bonus;
			}			
		}

		if (dice == "0T6") {
			dice = "0";
		}

		return dice;
	});

	// hämtar en särskild färdighets namn
	Handlebars.registerHelper("getSkillname", function(grupp, skill) {
		return game.EON.fardigheter[grupp][skill].namn;
	});

	// hämtar en särskild färdighets namn
	Handlebars.registerHelper("getSkillnameRitualList", function(list) {
		let oversatt = "";

		if (!list || !Array.isArray(list)) {
			console.warn("Invalid list in getSkillnameRitualList:", list);
			return oversatt;
		}

		try {
			for (const moment of list) {
				if (!moment.grupp || !moment.fardighet) {
					console.warn("Missing grupp or fardighet in moment:", moment);
					continue;
				}

				// First try to get from game.EON.fardigheter
				let skillName = game.EON.fardigheter?.[moment.grupp]?.[moment.fardighet]?.namn;
				
				// If not found, try CONFIG.EON.fardigheter
				if (!skillName) {
					skillName = CONFIG.EON.fardigheter?.[moment.grupp]?.[moment.fardighet]?.namn;
				}

				// If still not found, use the raw fardighet name
				if (!skillName) {
					skillName = moment.fardighet;
				}

				if (oversatt !== "") {
					oversatt += ", ";
				}
				oversatt += skillName;
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

		lista.sort((a, b) => a.name.localeCompare(b.name));

		return lista;
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

		return vapenskador[skada];
	});

	// hämtar en särskild räckvidd
	Handlebars.registerHelper("getRange", function(rackviddlista, rackvidd) {
		if (isEmpty(rackvidd)) {
			return "&nbsp;";
		}

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

	// hämtar en särskild egenskap i en särskild lista
	Handlebars.registerHelper("getListProperty", function(lista, nr, property) {
		if (nr == -1) {
			return "";
		}

		return lista[nr][property];
	});

	// lägger ihop två tärningspooler till en.
	Handlebars.registerHelper("addDiceValues", function(fardighet1, fardighet2) {
		return DiceHelper.AdderaVarden(fardighet1, fardighet2);
	});

	// hämtar värdet på en särskild färdighet som RP har.
	Handlebars.registerHelper("getActorSkillGroupValue", function(actor, fardighet, grupp) {
		if (actor.system.listdata.fardigheter[grupp] != undefined) {
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
		return actor.system[typ][key].totalt;
	});	

	// hämtar ett attributs kortnamn
	Handlebars.registerHelper("getAttributeShortName", function(attribut) {
		if (attribut == "") {
			return "";
		}

		return "("+CONFIG.EON.grundegenskaper[attribut].kort+")";
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

	Handlebars.registerHelper("getCurrencyList", function() {
		if (!CONFIG.EON.datavaluta?.valuta) {
			console.log("No currency data found");
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
}