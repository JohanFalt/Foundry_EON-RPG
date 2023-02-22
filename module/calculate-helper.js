export default class CalculateHelper {
    static async hanteraBerakningar(actorData) {

        // Fokushantering
        if (actorData.system.egenskap.fokus.max > 10) {
            actorData.system.egenskap.fokus.max = 10;
        }

        if (actorData.system.egenskap.fokus.max < 0) {
            actorData.system.egenskap.fokus.max = 0;
        }

        if (actorData.system.egenskap.fokus.varde > actorData.system.egenskap.fokus.max) {
            actorData.system.egenskap.fokus.varde = parseInt(actorData.system.egenskap.fokus.max);
        }

    }
}