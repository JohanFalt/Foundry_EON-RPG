export class EonItemSheet extends ItemSheet {
	
	static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["itemsheet"]
		});
	}

	constructor(item, options) {
		super(item, options);

		this.isCharacter = false;	
		this.isGM = game.user.isGM;			

		console.log("WoD | Item Sheet constructor");
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

		return "Editera " + title;
	}

	/** @override */
	async getData() {
		const itemData = duplicate(this.item);		

		if (!itemData.system.installningar.skapad) {
			itemData.system.installningar.version = game.data.system.version;
			itemData.system.installningar.skapad = true;
			itemData.name
			this.item.update(itemData);
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
            //.click(this._ticValue.bind(this));

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
            .find('.weapon-property')
            .click(this._setVapenEgenhet.bind(this));
	}

	async _onItemActive(event) {		
		event.preventDefault();
        event.stopPropagation();

		const element = event.currentTarget;
		const dataset = element.dataset;
		
		let active = this.item.system[dataset.property].aktiv;

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

        if (!item)
            return;

        const performDelete = await new Promise((resolve) => {
            Dialog.confirm({
                title: "Tar bort " + item.name,
                yes: () => resolve(true),
                no: () => resolve(false),
                content: "Är du säker du vill ta bort " + item.name,
            });
        });

        if (!performDelete)
            return;

		await this.actor.deleteEmbeddedDocuments("Item", [itemid]);        
	}

	async _ticValueUp(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const itemData = duplicate(this.item);
		const property = dataset.property;
		const limit = dataset.limit == "true" ? true : false;

		itemData.system[property].bonus += 1;
	
		if ((itemData.system[property].bonus > 3) && ((itemData.system[property].tvarde < 5) || (!limit)))  {
			itemData.system[property].tvarde += 1;
			itemData.system[property].bonus = 0;
		}

		if ((itemData.system[property].tvarde >= 5) && (limit)) {
			itemData.system[property].tvarde = 5;
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

	async _setVapenEgenhet(event) {
		event.preventDefault();
		const element = event.currentTarget;
		const parent = $(element.parentNode);
		const el = parent.closest(".property-area"); 

		const properties = [];

		el.find(".weapon-property").each(function () {
			if ($(this).is(':checked')) {
				//const sibling = $(this).siblings();							
				const sibling = $(this).parent().siblings();
				let newPropery = [];

				if (sibling.length > 0) {
					//if (Number.isInteger(parseInt(sibling[0].value))) {
						//newPropery = [this.value, parseInt(sibling[0].value)];
					if (Number.isInteger(parseInt(sibling[0].children[0].value))) {
						newPropery = [this.value, parseInt(sibling[0].children[0].value)];
						
					}
					else {
						newPropery = [this.value, 0];
						ui.notifications.warn("Egenskapsvärdet måste vara ett heltal.");
					}				
				}
				else {
					newPropery = [this.value];
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
			const typ = this.item.system.attribut;
			const vapenmall = element.value;
			const vapen = game.EON.narstridsvapen[typ][vapenmall];

			const itemData = duplicate(this.item);
			itemData.name = vapen.namn;
			itemData.system.typ = vapenmall;
			itemData.system.attribute = vapen.attribut;
			itemData.system.enhand = vapen.enhand;
			itemData.system.tvahand = vapen.tvahand;
			itemData.system.hugg = vapen.hugg;
			itemData.system.kross = vapen.kross;
			itemData.system.stick = vapen.stick;
			itemData.system.langd = vapen.langd;
			itemData.system.vikt = vapen.vikt;
			itemData.system.egenskaper = vapen.egenskaper;
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "weapon-range") {
			const typ = this.item.system.attribut;
			const vapenmall = element.value;
			const vapen = game.EON.avstandsvapen[typ][vapenmall];

			const itemData = duplicate(this.item);
			itemData.name = vapen.namn;
			itemData.system.typ = vapenmall;
			itemData.system.attribute = vapen.attribut;
			itemData.system.enhand = vapen.enhand;
			itemData.system.tvahand = vapen.tvahand;
			itemData.system.rackvidd = vapen.rackvidd;
			itemData.system.skadetyp = vapen.skadetyp;
			itemData.system.skada = vapen.skada;
			itemData.system.langd = vapen.langd;
			itemData.system.vikt = vapen.vikt;
			itemData.system.egenskaper = vapen.egenskaper;
			await this.item.update(itemData);
			this.render();

			return;
		}

		if (source == "weapon-property") {
			this._setVapenEgenhet(event);

			return;
		}
	}
}
