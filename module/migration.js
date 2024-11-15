import CreateHelper from "./create-helper.js";
 
 /**
 * Compares two version numbers to see if the new one is newer than the old one
 * @param oldVersion   The existing version no: e.g. 1.5.9
 * @param newVersion   The new version no: e.g. 1.5.10
 */
export async function CompareVersion(oldVersion, newVersion) {
    if (newVersion == "") {
        return false;
    }

    if (newVersion == undefined) {
        return false;
    }

    if (oldVersion == "") {
        return true;
    }

    if ((oldVersion.toLowerCase().includes("alpha")) && (!newVersion.toLowerCase().includes("alpha"))) {
      return true;
    }

    if ((oldVersion.toLowerCase().includes("alpha")) && (!newVersion.toLowerCase().includes("beta"))) {
      return true;
    }

    if ((oldVersion.toLowerCase().includes("beta")) && (!newVersion.toLowerCase().includes("beta"))) {
      return true;
    }

    if (oldVersion.toLowerCase().includes("alpha")) {
        oldVersion = oldVersion.toLowerCase().replace("alpha", "");
        oldVersion = oldVersion.toLowerCase().replace("-", "");
        oldVersion = oldVersion.toLowerCase().replace(" ", "");
    }

    if (newVersion.toLowerCase().includes("alpha")) {
        newVersion = newVersion.toLowerCase().replace("alpha", "");
        newVersion = newVersion.toLowerCase().replace("-", "");
        newVersion = newVersion.toLowerCase().replace(" ", "");
    }

    if (oldVersion.toLowerCase().includes("beta")) {
      oldVersion = oldVersion.toLowerCase().replace("beta", "");
      oldVersion = oldVersion.toLowerCase().replace("-", "");
      oldVersion = oldVersion.toLowerCase().replace(" ", "");
    }

    if (newVersion.toLowerCase().includes("beta")) {
        newVersion = newVersion.toLowerCase().replace("beta", "");
        newVersion = newVersion.toLowerCase().replace("-", "");
        newVersion = newVersion.toLowerCase().replace(" ", "");
    }

    if (oldVersion == "1") {
        return true;
    } 

    if (oldVersion == newVersion) {
        return false;
    }

    try {
        const newfields = newVersion.split(".");
        const oldfields = oldVersion.split(".");

        for (let i = 0; i <= 2; i++) {
            let varde1 = 0;
            let varde2 = 0;
            
            if (newfields[i] != undefined) {
                varde1 = newfields[i];
            }
            if (oldfields[i] != undefined) {
                varde2 = oldfields[i];
            }
            if (parseInt(varde1) > parseInt(varde2)) {
                return true;
            }
            else if (parseInt(varde1) < parseInt(varde2)) {
                return false;
            }
        }
    }
    catch {
    }

    return false
}

/**
 * patch an actor to the latest version
 * @param {Actor} actor   The actor to Update
 * @param config   game.EON 
 */
export const updateActor = async function(actor, config, systemVersion) {
    try {
        const updateData = foundry.utils.duplicate(actor);
        let update = false;

        if (updateData.system.installningar.version == "") {
            updateData.system.installningar.version = "1.0.0";
        } 

        if (CompareVersion(actor.system.installningar.version, "2.1.0")) {
            updateData.system.installningar.version = "2.1.0";

            let addSkill = true;

            for (const item of actor.items) {
                if ((item.type == "Färdighet") && (item.system.grupp == "mystik") && (item.system.id == "harmonisera")) {
                    addSkill = false;
                    break;
                }
            }

            if (addSkill) {
				const grupp = "mystik";
                let fardighet = "harmonisera";

                let itemData = await CreateHelper.SkapaFardighetItem(grupp, config.fardigheter[grupp][fardighet], fardighet, updateData.system.installningar.version);
                await actor.createEmbeddedDocuments("Item", [itemData]);
			}            

            if ((actor.system.bakgrund.arketyp != "custom") && (config.arketyper[actor.system.bakgrund.arketyp] != undefined)) {
                updateData.system.bakgrund.arketyp = config.arketyper[actor.system.bakgrund.arketyp].namn;
            }
            
            if ((actor.system.bakgrund.miljo != "custom") && (config.miljoer[actor.system.bakgrund.miljo] != undefined)) {
                updateData.system.bakgrund.miljo = config.miljoer[actor.system.bakgrund.miljo].namn;
            }

            update = true;
        }

        if (update) {
            await actor.update(updateData);
            update = false;
        }

        for (const item of actor.items) {
            await updateItem(item, config, actor);
        }
    } 
    catch (e) {
        e.message = `Failed migration for Actor ${actor.name}: ${e.message}`;
        console.error(e.message);
    }
}

/**
 * patch an actor to the latest version
 * @param {Items} item   The item to Update
 * @param config   game.EON 
 */
export const updateItem = async function(item, config, actor) {
    try {
        const updateData = foundry.utils.duplicate(item);
        let update = false;

        if (item.system.installningar.version == "") {
            updateData.system.installningar.version = "1.0.0";
            update = true;
        }

        if (CompareVersion(item.system.installningar.version, "2.1.0")) {
            updateData.system.installningar.version = "2.1.0";

            if (item.type == "Färdighet") {
                if ((!item.system.installningar.lattlard) && (!item.system.installningar.svarlard)) {
                    updateData.system.installningar.normal = true;
                    update = true;
                }
            }
            if ((item.type == "Skada") && (item.system.typ == "")) {
                updateData.system.typ = "skada";
                update = true;
            }
        }

        if (update) {
            await item.update(updateData);
            update = false;
        }
    } 
    catch (e) {
        if (actor == undefined) {
            e.message = `Failed migration for Item ${item.name}: ${err.message}`;
        }
        else {
            e.message = `Failed migration for Item ${item.name} on Actor ${actor.name}: ${err.message}`;
        }
        
        console.error(e.message);
    }
}

 /**
 * Sends version text to chat
 * @param systemVersion The new system version
 * @param installedVersion The installed system version
 * @param config   game.EON
 */
export async function patchWorld(systemVersion, installedVersion, config) {
    if (CompareVersion(installedVersion, systemVersion)) {
        ui.notifications.warn(`Uppdaterar världen från version ${installedVersion} till ${systemVersion} stäng inte världen eller din Foundry. Var god vänta då det kan ta tid...`, {permanent: true});

        for (const actor of game.actors) {
            await updateActor(actor, config, systemVersion);
        }

        for (const item of game.items) {
            await updateItem(item, config, undefined);
        }

        ui.notifications.info("Klar!", {permanent: true});
    }
}

 /**
 * Sends version text to chat
 * @param systemVersion The new system version
 */
export async function DoNotice(systemVersion, installedVersion) {
    if (!game.user.isGM) {
      return;
    }

    let partMessage = "";
    let futureMessage = "";

    if (await CompareVersion(installedVersion, '2.2.0')) {
        partMessage += `
            <li>[INSTÄLLNING] Vilka fonter man vill använda till brödtext och rubriker.</li>
            <li>[DESIGN] Fixat och trixat i designen av alla formulärer i systemet.</li>            
            <li>[SYSTEM] Lagt till automatisk beräkning för avdrag på färdighetsslag enligt grundboken när det gäller sår, smärta och belastning.</li>
            <li>[SYSTEM] Man kan nu skicka beskrivningar till chatten.</li>
            <li>[SYSTEM] Flyttat att höja/sänka grundegenskaperna/färdigheterna inne i EDITERA.</li>
            <li>[SYSTEM] Alla beskrivningsrutor stödjer nu Foundrys inre länkning samt HTML.</li>
            <li>[MAGI] Lagt till så man kan registrera ritualversioner till besvärjelser.</li>
            <li>I lite mer detalj: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/1?closed=1">v2.2</a></li>
        `;

        futureMessage += `
            <li>Boken Strid</li>
            <li>Varelser</li>            
            <li>Utrustningslistan</li>
            <li>Folkslag</li>
            <li>Vad som ligger planerat: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/5">v2.3</a></li>
        `;
    }

    /* if (await CompareVersion(installedVersion, '2.1.0')) {
        partMessage += `
            <li>[INSTÄLLNING] Regelbok - Magi är en inställning som aktiveras automatiskt i din världs inställningar. Detta gör att man kan se magifliken på rollformuläret.</li>  
            <li>[BAKGRUND] Folkslag kan nu skapas som ett föremål i systemet om man vill ha ett folkslag som inte finns med i grundlistan.</li>
            <li>[MAGI] Fliken Magi</li>                  
            <li>[MAGI] Besvärjelser är nu ett nytt föremål i systemet. Man lägger till dem i sin värld eller direkt på rollformuläret.</li>
            <li>[MAGI] Kongelat är nu ett nytt föremål i systemet. Man lägger till dem i sin värld eller direkt på rollformuläret.</li>
            <li>[MAGI] Fältstörning är nu ett nytt föremål i systemet. Man lägger till dem i sin värld eller direkt på rollformuläret.</li>            
            <li>[MAGI] Aspekter är nu en ny typ av färdigheter i systemet. Man skapar aspekten under mystikfärdigheterna och markerar den som en aspektfärdighet. Sedan kopplas denna automatiskt rätt när man använder magi.</li>
            <li>[MAGI] Använda improviserad magi.</li>
            <li>[RUSTNING] Grundrustning och rustning räknas ihop.</li>
            <li>I lite mer detalj: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/2?closed=1">v2.1</a></li>
            `; 
    } */

    /* if (await CompareVersion(installedVersion, '2.0.0')) {
        partMessage += `
            <li>Skarp version (v2.0)</li>
            <li>Fliken Bakgrund</li>
            <li>Bonus på tärningsslag med vapen</li>
            <li>Grafik</li>`;
    }    

    if (await CompareVersion(installedVersion, '2.0.4')) {
        partMessage += `<li>[GRAFIK] Textboxarnas grafik fortplantades in i hur journaltexter såg ut.`;
    }

    if (await CompareVersion(installedVersion, '2.0.3')) {
        partMessage += `<li>[BAKGRUND] Texten under karaktärsdragen sparas inte. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/102">#102</a></li>`;
    }

    if (await CompareVersion(installedVersion, '2.0.2')) {
        partMessage += `
            <li>[VAPEN] Problem med att vapen bytte från närstridsvapen till avståndsvapen utan anledning. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/107">#107</a></li>
            <li>[VAPEN] Vapenskadan räknar inte alltid ihop grundskada och vapenskada. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/106">#106</a></li>`;
    }    */     

    if (message == "") {
        return;
    }

    let introduction = `
        <div class="tray-title-area">Version ${systemVersion} installerat</div>
        <div class="tray-action-area">
            Systemet är nu uppdaterat till en ny version. Ny funktion kan läsas nedan.
            <p>Delar av detta system innehåller material som tillhör <a href="https://helmgast.se/">Helmgast AB</a> som äger copyright och trademark. Allt material används med tillåtelse.</p>
            Detta system är inte en officiell Eon produkt.
        </div>`;

    let message = `
        <div class="tray-title-area">Nytt för versionen</div>
        <div class="tray-action-area">
            <ul style="margin-top: 0">
            ${partMessage}
            </ul>
        </div>`;

    message += `
        <div class="tray-title-area">Planerat för framtiden</div>
        <div class="tray-action-area">
            För nästa version är det lite svårare att egentligen säga vad som kommer. Jag har vissa punkter som behöver göras och kommer koncentrera på dessa men om alla verkligen görs till nästa version eller om vissa flyttas fram får vi se.
        </div>
        <div class="tray-action-area">
            <ul style="margin-top: 0">
            ${futureMessage}
            </ul>
        </div>`;

    let support =  `
        <div class="tray-title-area">Länkar</div>
        <div class="tray-action-area">
            <ul style="margin-top: 0">
                <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG">Projektets källkod</a></li>
                <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues">Rapportera önskemål eller fel</a></li>
            </ul>
        </div>
        <div class="tray-title-area">Stöd mitt arbete</div>
        <div class="tray-action-area">
            <a href="https://ko-fi.com/johanfk"><img src="https://ko-fi.com/img/githubbutton_sm.svg" /></a>
        </div>`;

    message = introduction + message + support;
    
    const enrichedMessage = await TextEditor.enrichHTML(`${message}`, { async: true });
    await ChatMessage.create({
      user: game.user.id,
      content: enrichedMessage,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
}