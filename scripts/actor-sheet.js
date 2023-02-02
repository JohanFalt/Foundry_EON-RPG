import DiceHelper from "./dice-helper.js";

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
        /* const actorData = duplicate(this.actor);		

		if (!actorData.system.installningar.skapad) {
            ActionHelper._setMortalAbilities(actorData);
            ActionHelper._setMortalAttributes(actorData);

            this.actor.update(actorData);
		}
		else {
			
		}	
        */
        const data = await super.getData();	

        data.EON = game.EON;
        data.EON.CONFIG = CONFIG.EON;

        console.log(data.actor);
        console.log(data.EON);

        return data;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        html
			.find('.inputdata')
			.change(event => this._onsheetChange(event));
    }

    async _onsheetChange(event) {
		event.preventDefault();

		const element = event.currentTarget;
		const dataset = element.dataset;

		const source = dataset.source;
		const actorData = duplicate(this.actor);

        if (source == "folkslag") {
            if (this.actor.system.installningar.skapad) {
                return;
            }

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
                        content: "Om du byter folkslag kommer alla ändringar du gjort på dina grundegenskaper att nollställas enligt det nya folkslaget"
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

            actorData.system.bakgrund.folkslag = e.value;            

            await this.actor.update(actorData);
		    this.render();
            return;
        }

		/* if (source == "attribute") {
			let attribute = dataset.attribute;
			let value = 0;

			try {
				value = parseInt(element.value);	
			} catch (error) {
				value = 0;
			}		

			actorData.system.attributes[attribute].bonus = value;
		}	
		else if (source == "ability") {
			const itemid = dataset.abilityid;
			const item = this.actor.getEmbeddedDocument("Item", itemid);
			const itemData = duplicate(item);
			itemData.system.speciality = element.value;
			await item.update(itemData);
			return;
		}
		else if (source == "shiftertype") {
			var e = document.getElementById("system.changingbreed");
			var type = e.value;

			ActionHelper.setShifterAttributes(actorData, type);
		}
		else if (source == "frenzy") {
			let value = 0;

			try {
				value = parseInt(element.value);
			} catch (error) {
				value = 0;
			}

			actorData.system.advantages.rage.bonus = value;
		}
		else if (source == "soak") {
			let value = 0;
			const type = dataset.type;

			try {
				value = parseInt(element.value);
			} catch (error) {
				value = 0;
			}

			actorData.system.settings.soak[type].bonus = value;
		}
		else if (source == "initiative") {
			let value = 0;

			try {
				value = parseInt(element.value);
			} catch (error) {
				value = 0;
			}

			actorData.system.initiative.bonus = value;			
		} */

		
	}
}