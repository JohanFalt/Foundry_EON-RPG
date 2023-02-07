export default class CreateHelper {
    static async SkapaFardigheter(actor, config, version) {

        for (const grupp in config.fardighetgrupper) {
            for (const fardighet in game.EON.fardigheter[grupp]) {
                let itemData = await this._SkapaFardighetItem(grupp, game.EON.fardigheter[grupp][fardighet], version);
                await actor.createEmbeddedDocuments("Item", [itemData]);
            }
        }       
    }

    static async _SkapaFardighetItem(grupp, fardighet, worldVersion) {

        let itemData = {
            name: fardighet.namn,
            type: "Färdighet",
            
            data: {
                installningar: {
                    skapad: true,
                    version: worldVersion
                },
                attribut: fardighet.attribut,
                grupp: grupp,
                varde: {
                    tvarde: parseInt(fardighet.grund.tvarde),
                    bonus: parseInt(fardighet.grund.bonus)
                }
            }
        };

        return itemData;
    }
}