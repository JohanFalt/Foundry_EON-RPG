import DiceHelper from "./dice-helper.js";
import DialogHelper from "./dialog-helper.js";
import CreateHelper from "./create-helper.js";
import CalculateHelper from "./calculate-helper.js";

export class EonActorSheet extends ActorSheet {

    /** @override */
    static get defaultOptions() {
		return mergeObject(super.defaultOptions, {
			classes: ["rollperson"],
            tabs: [{
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "skill",
			    },
                {
                    navSelector: ".sheet-combat-tabs",
                    contentSelector: ".sheet-combat-body",
                    initial: "weapon",
                },
                {
                    navSelector: ".sheet-mystic-tabs",
                    contentSelector: ".sheet-mystic-body",
                    initial: "magic",
                }
            ]
		});
	}
  
    /** @override */
	constructor(actor, options) {
        super(actor, options);

        this.locked = false;
		this.isCharacter = true;	
		this.isGM = game.user.isGM;	
    }

    /** @override */
	get template() {
        let sheet = "rollperson";

        if ((this.actor.system?.type != undefined)&&(this.actor.system?.type == "")){
            sheet = this.actor.system.type;
        }

		sheet = sheet.toLowerCase().replace(" ", "");
		return `systems/eon-rpg/templates/actors/${sheet}-sheet.html`;
	}

    /** @override */
    async getData() {
        const actorData = duplicate(this.actor);		

		if (!actorData.system.installningar.skapad) {
            const version = game.data.system.version;

            await CreateHelper.SkapaFardigheter(this.actor, CONFIG.EON, version);
            await CreateHelper.SkapaNarstridsvapen(this.actor, game.EON, "slagsmal", "obevapnad", version);
            await CreateHelper.SkapaForsvarsvapen(this.actor, game.EON, "manover", "undvika", version);

            actorData.system.installningar.skapad = true;
            actorData.system.installningar.version = version;
            await this.actor.update(actorData);
		}	
        else {
            await CalculateHelper.hanteraBerakningar(actorData);
            await this.actor.update(actorData);
        }

        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        data.actor.system.listdata = [];
        data.actor.system.listdata.fardigheter = [];
        data.actor.system.listdata.fardigheter.strid = [];
        data.actor.system.listdata.fardigheter.rorelse = [];
        data.actor.system.listdata.fardigheter.mystik = [];
        data.actor.system.listdata.fardigheter.social = [];
        data.actor.system.listdata.fardigheter.kunskap = [];
        data.actor.system.listdata.fardigheter.sprak = [];
        data.actor.system.listdata.fardigheter.vildmark = [];
        data.actor.system.listdata.fardigheter.ovriga = [];
        data.actor.system.listdata.vapen = [];
        data.actor.system.listdata.vapen.narstrid = [];
        data.actor.system.listdata.vapen.avstand = [];
        data.actor.system.listdata.vapen.forsvar = [];


        for (const item of this.actor.items) {
            if (item.type == "F??rdighet") {
                data.actor.system.listdata.fardigheter[item.system.grupp].push(item);
            }        
            if (item.type == "N??rstridsvapen") {    
                data.actor.system.listdata.vapen.narstrid.push(item);
            }
            if (item.type == "Avst??ndsvapen") {    
                data.actor.system.listdata.vapen.avstand.push(item);
            }
            if (item.type == "F??rsvar") {    
                data.actor.system.listdata.vapen.forsvar.push(item);
            }
        }

        for (const grupp in CONFIG.EON.fardighetgrupper) {
            data.actor.system.listdata.fardigheter[grupp] = data.actor.system.listdata.fardigheter[grupp].sort((a, b) => a.name.localeCompare(b.name));
        }

        data.actor.system.listdata.vapen.narstrid = data.actor.system.listdata.vapen.narstrid.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.vapen.avstand = data.actor.system.listdata.vapen.avstand.sort((a, b) => a.name.localeCompare(b.name));
        data.actor.system.listdata.vapen.forsvar = data.actor.system.listdata.vapen.forsvar.sort((a, b) => a.name.localeCompare(b.name));

        console.log(data.actor);
        console.log(data.EON);

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        this._setupDotCounters(html);

        html
			.find('.inputdata')
			.change(event => this._onsheetChange(event));

        // Resource dots
		html
            .find(".resource-circle > .resource-value")
            .click(this._clickedCircle.bind(this));

        html
            .find(".resource-box > .resource-value")
            .click(this._clickedCircle.bind(this));

        // Rollable stuff
		html
            .find(".vrollable")
            .click(this._onRollDialog.bind(this));

        // item handling
        html
			.find(".item-create")
			.click(this._onItemCreate.bind(this));

        html
			.find(".item-edit")
			.click(this._onItemEdit.bind(this));
    }

    _onRollDialog(event) {		
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

        if (dataset.source == "attribute") {
            DialogHelper.AttributeDialog(this.actor, dataset.type, dataset.key);

            return;
        }

        if (dataset.source == "skill") {
            DialogHelper.SkillDialog(event, this.actor);

			return;
        }      
        
		ui.notifications.error("Slag saknar funktion");
	}

    async _onItemCreate(event) {
		event.preventDefault();

		const header = event.currentTarget;
		const type = header.dataset.type;
        const version = game.data.system.version;
        let found = false;

		let itemData;        

		if (type == "n??rstridsvapen") {
            found = true;

			itemData = {
                name: "Nytt n??rstridsvapen",
                type: "N??rstridsvapen",
                
                data: {
                    installningar: {
                        skapad: true,
                        version: version
                    }                    
                }
            };
		}

        if (type == "avst??ndsvapen") {
            found = true;

			itemData = {
                name: "Nytt avst??ndsvapen",
                type: "Avst??ndsvapen",
                
                data: {
                    installningar: {
                        skapad: true,
                        version: version
                    }                    
                }
            };
		}        

        if (found) {
            await this.actor.createEmbeddedDocuments("Item", [itemData]);

            return;
        }

        ui.notifications.error("Typen som skall skapas saknar funktion");
    }

    async _onItemEdit(event) {
		var _a;

		event.preventDefault();
        event.stopPropagation();

        const element = event.currentTarget;
		const dataset = element.dataset;
        const itemid = dataset.itemid;
		const item = this.actor.getEmbeddedDocument("Item", itemid);		

		if (item instanceof Item) {
            _a = item.sheet;

            if ((_a === null) || (_a === void 0)) {
                void 0;
            }                
            else {
                _a.render(true);  
            }
		}
	}

    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const source = dataset.source;
		const actorData = duplicate(this.actor);

        if (source == "folkslag") {
            var e = document.getElementById("folkslag");
            let data = game.EON.folkslag[e.value];

            if (data?.namn == undefined) {
                return;
            }

            if (this.actor.system.bakgrund.folkslag != "") {
                const performDelete = await new Promise((resolve) => {
                    Dialog.confirm({
                        title: "Varning!",
                        yes: () => resolve(true),
                        no: () => resolve(false),
                        content: "Om du byter folkslag kommer alla ??ndringar du gjort p?? dina grundegenskaper att nollst??llas enligt det nya folkslaget"
                    });
                });

                if (!performDelete)
                    return;
            }

            for (const egenskap in data.grundegenskaper) {
                actorData.system.grundegenskaper[egenskap].tvarde = data.grundegenskaper[egenskap].tvarde;
                actorData.system.grundegenskaper[egenskap].bonus = data.grundegenskaper[egenskap].bonus;
            }

            actorData.system.harleddegenskaper.forflyttning = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.rorlighet, actorData.system.grundegenskaper.talighet);
            actorData.system.harleddegenskaper.intryck = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.utstralning, actorData.system.grundegenskaper.visdom);
            actorData.system.harleddegenskaper.kroppsbyggnad = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);
            actorData.system.harleddegenskaper.reaktion = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.rorlighet, actorData.system.grundegenskaper.uppfattning);
            actorData.system.harleddegenskaper.sjalvkontroll = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.psyke, actorData.system.grundegenskaper.vilja);
            actorData.system.harleddegenskaper.vaksamhet = await DiceHelper.BeraknaMedelvarde(actorData.system.grundegenskaper.psyke, actorData.system.grundegenskaper.uppfattning);
            actorData.system.harleddegenskaper.livskraft = await DiceHelper.BeraknaLivskraft(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);
            actorData.system.harleddegenskaper.grundskada = await DiceHelper.BeraknaGrundskada(actorData.system.grundegenskaper.styrka);
            actorData.system.harleddegenskaper.grundrustning = await DiceHelper.BeraknaGrundrustning(actorData.system.grundegenskaper.styrka, actorData.system.grundegenskaper.talighet);

            actorData.system.strid.lakningstakt = parseInt(data.lakningstakt);

            actorData.system.bakgrund.folkslag = e.value;            

            await this.actor.update(actorData);
		    this.render();
            return;
        }		
        if (source == "valmaende") {
            let ruta = document.getElementById("fokus_varde");

            const oldIndex = Number(dataset.value);
            const newIndex = Number(ruta.value);

            if (newIndex < oldIndex) {

                actorData.system.egenskap.fokus.varde = newIndex;
                actorData.system.egenskap.fokus.max = newIndex;
                
                await this.actor.update(actorData);
                this.render();
                return;                
            }            
        }
	}

    _setupDotCounters(html) {
		html.find(".resource-circle").each(function () {
			const value = Number(this.dataset.value);
			$(this)
				.find(".resource-value")
				.each(function (i) {
					if (i <= value - 1) {
						$(this).addClass("active");
					}
				});
		});

        html.find(".resource-box").each(function () {
			const value = Number(this.dataset.value);
			$(this)
				.find(".resource-value")
				.each(function (i) {
					if (i <= value - 1) {
						$(this).addClass("active");
					}
				});
		});
	}

    async _clickedCircle(event) {
        event.preventDefault();
		const element = event.currentTarget;
		const dataset = element.dataset;
		const type = dataset.type;
        const value = dataset.value

        const index = Number(dataset.index);
		const parent = $(element.parentNode);
		const steps = parent.find(".resource-value");

        const fieldStrings = parent[0].dataset.name;

        if (index < 0 || index > steps.length) {
            return;
        }

        const actorData = duplicate(this.actor);
        steps.removeClass("active");

        if (type != undefined) {
            if ((parseInt(actorData.system[fieldStrings][type][value]) == 1) && (parseInt(index) == 1)) {
                actorData.system[fieldStrings][type][value] = 0;
            }
            else {
                actorData.system[fieldStrings][type][value] = parseInt(index);
            }
        }
        else if ((actorData.system[fieldStrings][value] == 1) && (parseInt(index) == 1)) {
            actorData.system[fieldStrings][value] = 0;
        }
        else {
            actorData.system[fieldStrings][value] = parseInt(index);
        }

        steps.each(function (i) {
            if (i <= index - 1) {
                $(this).addClass("active");
            }
        });
        
        this.actor.update(actorData);
    }
}