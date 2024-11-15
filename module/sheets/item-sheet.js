import CreateHelper from "../create-helper.js";
import CalculateHelper from "../calculate-helper.js";

export default class EonItemSheet extends ItemSheet {

	static get defaultOptions() {
		return foundry.utils.mergeObject(super.defaultOptions, {
			classes: ["EON itemsheet"],
			tabs: [{
                navSelector: ".item-tabs",
                contentSelector: ".sheet-header",
                initial: "values",
            }]
		});
	}

	/** @override */
	constructor(item, options) {
		super(item, options);

		this.isCharacter = false;	
		this.isGM = game.user.isGM;		
		this.selectedRitual = -1;
	}

	/** @override */
	get template() {
		let sheet = this.item.type;
		sheet = sheet.toLowerCase().replace(" ", "");

		return `systems/eon-rpg/templates/items/${sheet}-sheet.html`;
	}

	/** @override */
	get title() {
		let title = this.item.name;

		return "Editera " + title.toLowerCase();
	}

	/** @override */
	async getData() {
		const itemData = foundry.utils.duplicate(this.item);		

		if (!itemData.system.installningar.skapad) {
			const version = game.data.system.version;

			itemData.system.installningar.version = version;
			itemData.system.installningar.skapad = true;

			if (itemData.type == "Folkslag") {
				if (itemData.name == "") {
					itemData.name = "Nytt folkslag";
				}

				for (const grundegenskap in CONFIG.EON.grundegenskaper) {
					itemData.system.grundegenskaper[grundegenskap].grund.tvarde = 2;
					itemData.system.grundegenskaper[grundegenskap].grund.bonus = 0;
					itemData.system.grundegenskaper[grundegenskap].totalt.tvarde = 2;
					itemData.system.grundegenskaper[grundegenskap].totalt.bonus = 0;
				}
			}
			if (itemData.type == "Färdighet") {
				if (itemData.name == "") {
					itemData.name = "Ny färdighet";
				}
				
				itemData.system.grupp = "ovriga";
				itemData.system.installningar.kantabort = true;
			}
			if (itemData.type == "Språk") {
				if (itemData.name == "") {
					itemData.name = "Nytt språk";
				}

				itemData.system.installningar.kantabort = true;
			}
			if (itemData.type == "Närstridsvapen") {
				if (itemData.name == "") {
					itemData.name = "Nytt närstridsvapen";
				}

				itemData.system.typ = "utrustning";
			}
			if (itemData.type == "Avståndsvapen") {
				if (itemData.name == "") {
					itemData.name = "Nytt avståndsvapen";
				}

				itemData.system.typ = "utrustning";
			}
			if (itemData.type == "Sköld") {
				if (itemData.name == "") {
					itemData.name = "Ny sköld";
				}

				itemData.system.typ = "utrustning";
				itemData.system.grupp = "skold";
			}
			if (itemData.type == "Rustning") {
				if (itemData.name == "") {
					itemData.name = "Ny rustning";
				}

				const kroppsdelar = await CreateHelper.SkapaKroppsdelar(CONFIG.EON, game.data.system.version);
				itemData.system.kroppsdel = kroppsdelar;
				itemData.system.typ = "utrustning";
			}
			if (itemData.type == "Utrustning") {
				if (itemData.name == "") {
					itemData.name = "Nytt föremål";
				}

				itemData.system.typ = "utrustning";
			}
			if (itemData.type == "Skada") {
				if (itemData.name == "") {
					itemData.name = "Ny skada";
				}
			}

			await this.item.update(itemData);
		}

		const data = await super.getData();

		data.isCharacter = this.isCharacter;
		data.isGM = this.isGM;
		data.selectedRitual = parseInt(this.selectedRitual);

		data.EON = game.EON;
		data.EON.CONFIG = CONFIG.EON;

		if (this.item.actor != null) {
			data.hasActor = true;

			if ((this.item.type == "Färdighet") && (this.item.system.grupp == "mystik") && (this.item.system.id == "teoretiskmagi")) {
				data.item.system.installningar.kantabort = true;
			}
		}
		else {
			data.hasActor = false;
		}

		console.log(data.item.type);
		console.log(data.item);
		
		return data;
	}

	/** @override */
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
			.find(".item-create")
			.click(this._onItemCreate.bind(this));

		html
			.find(".item-edit")
			.click(this._onItemEdit.bind(this));

		html
			.find(".item-save")
			.click(this._onItemSave.bind(this));
		
		html
			.find(".item-active")
			.click(this._onItemActive.bind(this));

		html
			.find(".item-delete")
			.click(this._onItemDelete.bind(this));

		html
            .find('.svarighet')
            .click(this._setSvarighet.bind(this));
			
		html
            .find('.varaktighet')
            .click(this._setVaraktighet.bind(this));			

		html
			.find('.item-property')
			.click(this._setValue.bind(this));	

		html
			.find('.item-property')
			.change(event => this._setValue(event));

		html
            .find('.weapon-property')
            .click(this._setVapenEgenhet.bind(this));
	}

	/** @override */
	async close(...args) {
		await super.close(...args);

		if (this.item.type == "Besvärjelse") {
			const itemData = foundry.utils.duplicate(this.item);	

			for(const ritual of itemData.system.ritual) {
				ritual.editera = false;
			}

			this.item.update(itemData);
			this.selectedRitual = -1;
		}
	}

	async _onItemCreate(event) {
		event.preventDefault();

		const header = event.currentTarget;
		const type = header.dataset.type;
		const source = header.dataset.source;
        const version = game.data.system.version;
		const itemData = foundry.utils.duplicate(this.item);

		if ((type == "moment") && (source == "ritual")) {
			if (this.selectedRitual == -1) {
				return;
			}

			const itemData = foundry.utils.duplicate(this.item);
			itemData.system.ritual[this.selectedRitual].moment.push({grupp: "mystik", fardighet: "cermoni"});			
			await this.item.update(itemData);

			this.render();
			return;
		}
		if (type == "moment") {
			let moment = {
                fardighet: "",
				huvud: false,
				svarighet: 0,
				tid: ""
            };

        	itemData.system.moment.push(moment);
        	await this.item.update(itemData);

        	this.render();

			return;
		}
		if (type == "ritual") {
			let ritual = {
				namn: "Ny ritual",
				typ: "",
				tid: "",
				moment: [{grupp: "mystik", fardighet: "cermoni"}],
				overtag: 0,
				kostnad: 0,
				bonus: 0,
				editera: false,
				beskrivning: ""
			};

        	itemData.system.ritual.push(ritual);
        	await this.item.update(itemData);

        	this.render();
			return;
		}
	}

	async _onItemEdit(event) {
		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.source == "ritual") {
			const key = parseInt(dataset.itemid);
			const itemData = foundry.utils.duplicate(this.item);

			for(const ritual of itemData.system.ritual) {
				ritual.editera = false;
			}

			itemData.system.ritual[key].editera = !itemData.system.ritual[key].editera;
			await this.item.update(itemData);

			this.selectedRitual = key;
        	this.render();
            return;
        }
	}

	async _onItemSave(event) {
		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.source == "ritual") {
			const itemData = foundry.utils.duplicate(this.item);

			for(const ritual of itemData.system.ritual) {
				ritual.editera = false;
			}

			await this.item.update(itemData);
			this.selectedRitual = -1;
			this.render();
			return;
        }
	}	

	async _onItemActive(event) {		
		event.preventDefault();
        event.stopPropagation();

		const element = event.currentTarget;
		const dataset = element.dataset;		

		if (dataset.source == "moment") {
			await this._setMysterieMoment(event);
			return;
		}

		const itemData = foundry.utils.duplicate(this.item);

		if (this.item.system.installningar[dataset.property] != undefined) {
			let active = this.item.system.installningar[dataset.property];
			itemData.system.installningar[dataset.property] = !active;
		}
		else {
			let active = this.item.system[dataset.property].aktiv;
			itemData.system[dataset.property].aktiv = !active;
		}
		await this.item.update(itemData);

		this.render();
	}

	async _onItemDelete(event) {
		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;        

		// är det en del av ett item
		if (dataset.type != undefined) {
			const type = dataset.type;
			const key = parseInt(dataset.key);
			let source = undefined;

			if (dataset.source != undefined) {
				source = dataset.source;
			}

			if ((type == "moment") && (source == "ritual")) {
				if (this.selectedRitual == -1) {
					return;
				}

				const itemData = foundry.utils.duplicate(this.item);

				if (itemData.system.ritual[this.selectedRitual].moment.length > 1) {
					itemData.system.ritual[this.selectedRitual].moment.splice(key, 1);
				}
				else {
					itemData.system.ritual[this.selectedRitual].moment = [{grupp: "mystik", fardighet: "cermoni"}];
				}
				
				await this.item.update(itemData);
	
				this.render();
				return;
			}
			if (type == "moment") {
				const itemData = foundry.utils.duplicate(this.item);
				itemData.system[type].splice(key, 1);
				await this.item.update(itemData);
	
				this.render();
				return;
			}
			if (type == "ritual") {
				const itemData = foundry.utils.duplicate(this.item);
				itemData.system[type].splice(key, 1);

				await this.item.update(itemData);
	
				this.render();
				return;
			}
			
			return;
		}    
		
		const itemid = dataset.itemid;
		const item = this.actor.getEmbeddedDocument("Item", itemid);
		const namn = item.name;

        if (!item) {
            return;
		}

		// gäller item i sig
        const performDelete = await new Promise((resolve) => {
            Dialog.confirm({
                title: "Tar bort " + namn,
                yes: () => resolve(true),
                no: () => resolve(false),
                content: "Är du säker du vill ta bort " + namn,
            });
        });

        if (!performDelete) {
            return;
		}

		await this.actor.deleteEmbeddedDocuments("Item", [itemid]);        
	}

	async _ticValueUp(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemData = foundry.utils.duplicate(this.item);
		const property = dataset.property;

		const fields = property.split(".");

		// bonus
		if (fields.length == 1) {
			itemData.system[property].bonus += 1;
	
			if (itemData.system[property].bonus > 3)  {
				itemData.system[property].tvarde += 1;
				itemData.system[property].bonus = 0;
			}
		}
		// grundegenskaper
		else if (fields.length == 3) {
			itemData.system[fields[0]][fields[1]][fields[2]].bonus += 1;
	
			if (itemData.system[fields[0]][fields[1]][fields[2]].bonus > 3)  {
				itemData.system[fields[0]][fields[1]][fields[2]].tvarde += 1;
				itemData.system[fields[0]][fields[1]][fields[2]].bonus = 0;
			}

			itemData.system[fields[0]][fields[1]].totalt = await CalculateHelper.BeraknaTotaltVarde(itemData.system[fields[0]][fields[1]]);
		}		

		await this.item.update(itemData);

		this.render();
	}

	async _ticValueDown(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemData = foundry.utils.duplicate(this.item);
		const property = dataset.property;

		const fields = property.split(".");

		// bonus
		if (fields.length == 1) {
			itemData.system[property].bonus -= 1;

			if (itemData.system[property].bonus < -1) {
				itemData.system[property].tvarde -= 1;
				itemData.system[property].bonus = 3;
			}

			if (itemData.system[property].tvarde < 0) {
				itemData.system[property].tvarde = 0;
				itemData.system[property].bonus = 0;
			}
		}
		// grundegenskaper
		else if (fields.length == 3) {
			itemData.system[fields[0]][fields[1]][fields[2]].bonus -= 1;
	
			if (itemData.system[fields[0]][fields[1]][fields[2]].bonus < -1) {
				itemData.system[fields[0]][fields[1]][fields[2]].tvarde -= 1;
				itemData.system[fields[0]][fields[1]][fields[2]].bonus = 3;
			}

			if (itemData.system[fields[0]][fields[1]][fields[2]].tvarde < 0) {
				itemData.system[fields[0]][fields[1]][fields[2]].tvarde = 0;
				itemData.system[fields[0]][fields[1]][fields[2]].bonus = 0;
			}

			if ((fields[0] == "grundegenskaper") && (fields[2] == "grund")) {
				itemData.system[fields[0]][fields[1]].totalt = await CalculateHelper.BeraknaTotaltVarde(itemData.system[fields[0]][fields[1]]);
			}			
		}

		await this.item.update(itemData);

		this.render();
	}

	async _setSvarighet(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = foundry.utils.duplicate(this.item);

		itemData.system.installningar.lattlard = false;
		itemData.system.installningar.svarlard = false;
		itemData.system.installningar.normal = true;

		if ((dataset.value == "S") && (!this.item.system.installningar.svarlard)) {
			itemData.system.installningar.svarlard = true;
			itemData.system.installningar.normal = false;
		}
		if ((dataset.value == "L") && (!this.item.system.installningar.lattlard)) {
			itemData.system.installningar.lattlard = true;
			itemData.system.installningar.normal = false;
		}
		
		await this.item.update(itemData);

		this.render();
	}

	async _setVaraktighet(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = foundry.utils.duplicate(this.item);

		if (dataset.field == "varaktighet.koncentration") {
			itemData.system.varaktighet.immanent = false;
			itemData.system.varaktighet.momentan = false;
			itemData.system.varaktighet.koncentration = !this.item.system.varaktighet.koncentration;
		}
		if (dataset.field == "varaktighet.momentan") {
			itemData.system.varaktighet.immanent = false;
			itemData.system.varaktighet.momentan = !this.item.system.varaktighet.momentan;
			itemData.system.varaktighet.koncentration = false;
		}
		if (dataset.field == "varaktighet.immanent") {
			itemData.system.varaktighet.immanent = !this.item.system.varaktighet.immanent;
			itemData.system.varaktighet.momentan = false;
			itemData.system.varaktighet.koncentration = false;
		}		
		
		await this.item.update(itemData);

		this.render();
	}

	async _setValue(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = foundry.utils.duplicate(this.item);		

		if (dataset.dtype.toLowerCase() == "boolean") {
			const fields = dataset.field.split(".");

			if (fields.length == 1) {
				itemData.system[fields[0]] = !itemData.system[fields[0]];
			}			
			else if (fields.length == 2) {
				itemData.system[fields[0]][fields[1]] = !itemData.system[fields[0]][fields[1]];
			}
		}
		else if (dataset.dtype.toLowerCase() == "number") {
			if (dataset.field == "egenskaper") {
				const egenskaper = [];

				for (const egenskap of itemData.system.egenskaper) {
					if (egenskap.namn == dataset.name) {
						const component = "egenskap_" + dataset.name;
        				var e = document.getElementById(component);
						egenskap.varde = parseInt(e.value);
					}

					egenskaper.push(egenskap);
				}

				itemData.system.egenskaper = egenskaper;
			}
		}

		// om man klickar bort att det är en aspekt så behöver typen rensas.
		if ((dataset.field == "aspekt") && (!itemData.system[dataset.field])) {
			itemData.system.id = "";
		}

		await this.item.update(itemData);
		this.render();
	}

	async _setVapenEgenhet(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const parent = $(element.parentNode);
		const el = parent.closest(".property-area"); 

		const properties = [];

		el.find(".weapon-property").each(function () {
			if ($(this).is(':checked')) {
				const sibling = $(this).parent().siblings();
				let newPropery;

				// Om ruta för nivå av egenskap finns
				if (sibling.length > 0) {
					let value = 0;

					if (sibling[0].children.length > 0) {
						if (Number.isInteger(parseInt(sibling[0].children[0].value))) {
							value = parseInt(sibling[0].children[0].value);
						}
						else {
							ui.notifications.warn("Egenskapsvärdet måste vara ett heltal.");
						}
					}

					newPropery = {
						namn: this.value,
						varde: value
					}				
				}
				else {
					newPropery = {
						namn: this.value,
						varde: 0
					}
				}

				properties.push(newPropery);
			}
		});

		const itemData = foundry.utils.duplicate(this.item);
		itemData.system.egenskaper = properties;
		await this.item.update(itemData);

		this.render();
	}

	async _setMysterieMoment(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;

		const key = dataset.key;
		const property = dataset.egenskap;

		const component = "object." + property + "_" + key;
        var e = document.getElementById(component);

        var newvalue = "";
		
		if (property == "svarighet") {
			newvalue = parseInt(e.value);
		}
		else if (property == "huvud") {
			newvalue = !(e.value == "true");
		}
		else {
			newvalue = e.value;
		}

		const itemData = foundry.utils.duplicate(this.item);
		itemData.system.moment[key][property] = newvalue;
		await this.item.update(itemData);

		this.render();
	}

	async _setRitualData(event, key) {
		const itemData = foundry.utils.duplicate(this.item);

		// for(const ritual of itemData.system.ritual) {
		// 	ritual.editera = false;
		// }

		itemData.system.ritual[key].namn = document.getElementById("ritual.namn").value;

		try {
			itemData.system.ritual[key].bonus = parseInt(document.getElementById("ritual.bonus").value);
		}
		catch{
			itemData.system.ritual[key].bonus = 0;
			ui.notifications.warn("Fel läsa av ritual - bonus", {permanent: false});
		}

		try {
			itemData.system.ritual[key].overtag = parseInt(document.getElementById("ritual.overtag").value);
		}
		catch{
			itemData.system.ritual[key].overtag = 0;
			ui.notifications.warn("Fel läsa av ritual - övertag", {permanent: false});
		}

		try {
			itemData.system.ritual[key].kostnad = parseInt(document.getElementById("ritual.kostnad").value);
		}
		catch{
			itemData.system.ritual[key].kostnad = 0;
			ui.notifications.warn("Fel läsa av ritual - kostnad", {permanent: false});
		}

		try {
			itemData.system.ritual[key].tid = document.getElementById("ritual.tid").value;
		}
		catch{
			itemData.system.ritual[key].tid = "";
			ui.notifications.warn("Fel läsa av ritual - tidsåtgång", {permanent: false});
		}

		try {
			for (let value = 0; value < itemData.system.ritual[key].moment.length; value++) {
				let grupp = document.getElementById("ritual.momentgrupp_" + value).value;

				if (grupp == itemData.system.ritual[key].moment[value].grupp) {
					itemData.system.ritual[key].moment[value].fardighet = document.getElementById("ritual.moment_" + value).value;
				}
				else {
					itemData.system.ritual[key].moment[value].grupp = grupp;
					itemData.system.ritual[key].moment[value].fardighet = "";
				}			
			}
		}
		catch {
			itemData.system.ritual[key].moment = [{grupp: "mystik", fardighet: "cermoni"}];
			ui.notifications.warn("Fel läsa av ritual - moment", {permanent: false});
		}

		await this.item.update(itemData);
	}

	/* when selecting what group an item belongs too */
	async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const source = dataset.source;

		if (source == "weapon-close") {
			const typ = this.item.system.grupp;
			const vapenmall = element.value;

			if (vapenmall == this.item._id) {
				return;
			}

			const vapen = game.EON.narstridsvapen[typ][vapenmall];

			const itemData = foundry.utils.duplicate(this.item);
			itemData.name = vapen.namn;
			itemData.system.mall = vapenmall;
			itemData.system.grupp = vapen.grupp;
			itemData.system.enhand = vapen.enhand;
			itemData.system.tvahand = vapen.tvahand;
			itemData.system.hugg = vapen.hugg;
			itemData.system.kross = vapen.kross;
			itemData.system.stick = vapen.stick;
			itemData.system.langd = vapen.langd;
			itemData.system.vikt = vapen.vikt;
			itemData.system.pris = vapen.pris;
			itemData.system.egenskaper = vapen.egenskaper;
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "weapon-range") {
			const typ = this.item.system.grupp;
			const vapenmall = element.value;

			if (vapenmall == this.item._id) {
				return;
			}

			const vapen = game.EON.avstandsvapen[typ][vapenmall];

			const itemData = foundry.utils.duplicate(this.item);
			itemData.name = vapen.namn;
			itemData.system.mall = vapenmall;
			itemData.system.grupp = vapen.grupp;
			itemData.system.enhand = vapen.enhand;
			itemData.system.tvahand = vapen.tvahand;
			itemData.system.rackvidd = vapen.rackvidd;
			itemData.system.skadetyp = vapen.skadetyp;
			itemData.system.skada = vapen.skada;
			itemData.system.langd = vapen.langd;
			itemData.system.vikt = vapen.vikt;
			itemData.system.pris = vapen.pris;
			itemData.system.egenskaper = vapen.egenskaper;
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "shield") {
			const typ = this.item.system.grupp;
			const vapenmall = element.value;

			if (vapenmall == this.item._id) {
				return;
			}

			const vapen = game.EON.forsvar[typ][vapenmall];

			const itemData = foundry.utils.duplicate(this.item);
			itemData.name = vapen.namn;
			itemData.system.mall = vapenmall;
			itemData.system.grupp = vapen.grupp;
			itemData.system.enhand = vapen.enhand;
			itemData.system.tvahand = vapen.tvahand;
			itemData.system.narstrid = vapen.narstrid;
			itemData.system.avstand = vapen.avstand;
			itemData.system.skydd = vapen.skydd;
			itemData.system.skadetyp = vapen.skadetyp;
			itemData.system.skada = vapen.skada;
			itemData.system.langd = vapen.langd;
			itemData.system.vikt = vapen.vikt;
			itemData.system.pris = vapen.pris;
			itemData.system.egenskaper = vapen.egenskaper;
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "armor") {
			const rustningsmall = element.value;
			let hugg = 0;
			let kross = 0;
			let stick = 0;
			let belastning = 0;
			let namn = "";

			const kroppsdel = dataset.kroppsdel;
			const itemData = foundry.utils.duplicate(this.item);
			itemData.system.belastning = 0;
			itemData.system.tacker = "";

			if (rustningsmall != "") {
				const rustning = game.EON.forsvar.rustningsmaterial[rustningsmall];

				hugg = rustning.hugg;
				kross = rustning.kross;
				stick = rustning.stick;
				belastning = rustning.belastning * game.EON.CONFIG.kroppsdelsfaktor[kroppsdel];
				namn = rustning.namn;
			}

			for (const del of itemData.system.kroppsdel) {
				if (del.kroppsdel == kroppsdel) {
					del.material = rustningsmall;
					del.hugg = hugg;
					del.kross = kross;
					del.stick = stick;
					del.belastning = belastning;
				}

				itemData.system.belastning += del.belastning;
				if (del.material != "") {
					if (itemData.system.tacker == "") {
						itemData.system.tacker = del.namn;
					}
					else {
						itemData.system.tacker += ", " + del.namn.toLowerCase();
					}					
				}
			}

			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "equipment") {
			const typ = this.item.system.grupp;
			const utrustningmall = element.value;
			const utrustning = game.EON.utrustning[typ][utrustningmall];

			const itemData = foundry.utils.duplicate(this.item);
			itemData.name = utrustning.namn;			
			itemData.system.mall = utrustningmall;
			itemData.system.grupp = typ;
			itemData.system.vikt = utrustning.vikt;
			itemData.system.pris = utrustning.pris;

			if (utrustning.installningar.behallare) {
				itemData.system.installningar.behallare = utrustning.installningar.behallare;
				itemData.system.volym.enhet = utrustning.volym.enhet;
				itemData.system.volym.antal = utrustning.volym.antal;
				itemData.system.volym.max = utrustning.volym.max;
			}
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "weapon-property") {
			await this._setVapenEgenhet(event);

			return;
		}

		if (source == "moment") {
			await this._setMysterieMoment(event);

			return;
		}

		if (source == "aspekt") {
			let value = element.value;

			const itemData = foundry.utils.duplicate(this.item);
			itemData.name = game.EON.CONFIG.aspekter[value];
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "ritual") {
			const key = parseInt(this.selectedRitual);

			await this._setRitualData(event, key);

			return;
		}

		ui.notifications.error("Saknar _onsheetChange source typ");
	}
}
