import CreateHelper from "../create-helper.js";

export default class EonItemSheet extends ItemSheet {
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["EON itemsheet"]
		});
	}

	constructor(item, options) {
		super(item, options);

		this.isCharacter = false;	
		this.isGM = game.user.isGM;			
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
		
		if (this.item.system.namn != undefined) {
			if (this.item.system.namn != "") {
				title = this.item.system.namn;
			}
		}

		return "Editera " + title.toLowerCase();
	}

	/** @override */
	async getData() {
		const itemData = duplicate(this.item);		

		if (!itemData.system.installningar.skapad) {
			const version = game.data.system.version;

			itemData.system.installningar.version = version;
			itemData.system.installningar.skapad = true;

			if (itemData.type == "Rustning") {
				const kroppsdelar = await CreateHelper.SkapaKroppsdelar(CONFIG.EON, game.data.system.version);
				itemData.system.kroppsdel = kroppsdelar;
			}

			await this.item.update(itemData);
		}

		const data = await super.getData();

		data.isCharacter = this.isCharacter;
		data.EON = game.EON;
		data.EON.CONFIG = CONFIG.EON;

		if (this.item.actor != null) {
			data.hasActor = true;
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
			.find(".item-active")
			.click(this._onItemActive.bind(this));

		html
            .find('.tic')
			.click(this._ticValueUp.bind(this));

		html
			.find('.tic')
			.on('contextmenu', this._ticValueDown.bind(this));

		html
			.find(".item-delete")
			.click(this._onItemDelete.bind(this));

		html
            .find('.svarighet')
            .click(this._setSvarighet.bind(this));	

		html
			.find('.item-property')
			.click(this._setValue.bind(this));	

		html
            .find('.weapon-property')
            .click(this._setVapenEgenhet.bind(this));
	}

	async _onItemActive(event) {		
		event.preventDefault();
        event.stopPropagation();

		const element = event.currentTarget;
		const dataset = element.dataset;
		
		let active = this.item.system[dataset.property];

		const itemData = duplicate(this.item);

		itemData.system[dataset.property].aktiv = !active;
		await this.item.update(itemData);

		this.render();
	}

	async _onItemDelete(event) {
		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;
        const itemid = dataset.itemid;
		const item = this.actor.getEmbeddedDocument("Item", itemid);
		const namn = (item.name == "ny" ? item.system.namn : item.name);

        if (!item) {
            return;
		}

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

		const itemData = duplicate(this.item);
		const property = dataset.property;

		itemData.system[property].bonus += 1;
	
		if (itemData.system[property].bonus > 3)  {
			itemData.system[property].tvarde += 1;
			itemData.system[property].bonus = 0;
		}

		await this.item.update(itemData);

		this.render();
	}

	async _ticValueDown(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemData = duplicate(this.item);
		const property = dataset.property;

		itemData.system[property].bonus -= 1;

		if (itemData.system[property].bonus < -1) {
			itemData.system[property].tvarde -= 1;
			itemData.system[property].bonus = 3;
		}

		if (itemData.system[property].tvarde < 0) {
			itemData.system[property].tvarde = 0;
			itemData.system[property].bonus = 0;
		}

		await this.item.update(itemData);

		this.render();
	}

	async _setSvarighet(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = duplicate(this.item);

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

	async _setValue(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const itemData = duplicate(this.item);

		if (dataset.dtype.toLowerCase() == "boolean") {
			itemData.system[dataset.field] = !itemData.system[dataset.field];
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
					if (Number.isInteger(parseInt(sibling[0].children[0].value))) {
						newPropery = {
							namn: this.value,
							varde: parseInt(sibling[0].children[0].value)
						}
					}
					else {
						newPropery = {
							namn: this.value,
							varde: 0
						}
						ui.notifications.warn("Egenskapsvärdet måste vara ett heltal.");
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

		const itemData = duplicate(this.item);
		itemData.system.egenskaper = properties;
		await this.item.update(itemData);

		this.render();
	}

	async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;
		const source = dataset.source;

		if (source == "weapon-close") {
			const typ = this.item.system.grupp;
			const vapenmall = element.value;
			const vapen = game.EON.narstridsvapen[typ][vapenmall];

			const itemData = duplicate(this.item);
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
			const vapen = game.EON.avstandsvapen[typ][vapenmall];

			const itemData = duplicate(this.item);
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
			const vapen = game.EON.forsvar[typ][vapenmall];

			const itemData = duplicate(this.item);
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
			const itemData = duplicate(this.item);
			itemData.system.belastning = 0;
			itemData.system.tacker = [];

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
					itemData.system.tacker.push(del.namn);
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

			const itemData = duplicate(this.item);
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
			this._setVapenEgenhet(event);

			return;
		}

		ui.notifications.error("Saknar _onsheetChange source typ");
	}
}
