export default class SelectHelper {
    static SetupActor(actor) {
        let listData = [];

        listData.folkslag = {};

        let folkslag = {
            "": "- Välj -"
        };

        if (actor.system.bakgrund.folkslag == 'custom') {
            let id = actor.system.bakgrund.folkslag;
            let namn = actor.system.altvarde.folkslag;

            folkslag = Object.assign(folkslag, {[id]: namn});
        }

        for (const grupp in game.EON.folkslag) {
            let id = grupp.toLowerCase();
            let namn = game.EON.folkslag[grupp].namn;

            folkslag = Object.assign(folkslag, {[id]: namn});
        }

        listData.folkslag = folkslag;

        listData.vapenArm = {
            "": "- Välj -",
            "hoger": "Höger",
            "vanster": "Vänster",
            "annat": "Annat"
        }

        let djurGrupper = {
            "": "- Välj -"
        };

        listData.djurGrupper = Object.assign(djurGrupper, game.EON.CONFIG.djurgrupper);

        let djurVariant = {
            "": "- Välj -"
        }

        for (const variant in game.EON.djur.variant) {
            let id = variant.toLowerCase();
            let namn = game.EON.djur.variant[variant].namn;

            if (id != 'ingen') {
                djurVariant = Object.assign(djurVariant, {[id]: namn});    
            }            
        }

        listData.djurVariant = djurVariant;      

        return listData;
    }

    static SetupItem(item) {
        let listData = [];      

        return listData;
    }
}