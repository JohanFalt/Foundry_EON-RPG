export default class SelectHelper {
    static SetupActor(actor) {
        let listData = [];

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