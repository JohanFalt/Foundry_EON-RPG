import CreateHelper from "./create-helper.js";
 
 /**
 * Compares two version numbers to see if the new one is newer than the old one
 * @param oldVersion   The existing version no: e.g. 1.5.9
 * @param newVersion   The new version no: e.g. 1.5.10
 */
export function CompareVersion(oldVersion, newVersion, isDemo = false) {
    if (isDemo) {
        return true;
    }

    if ((newVersion == undefined) || (oldVersion == undefined)) {
        return false;
    }

    if (newVersion == "") {
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
        let version210 = await CompareVersion(actor.system.installningar.version, "2.1.0");
        let version311 = await CompareVersion(actor.system.installningar.version, "3.1.1");
        let version400 = await CompareVersion(actor.system.installningar.version, "4.0.0");

        if (updateData.system.installningar.version == "") {
            updateData.system.installningar.version = "1.0.0";
        } 

        if (version210) {
            updateData.system.installningar.version = "2.1.0";

            let addSkill = true;

            for (const item of actor.items) {
                if ((item.type.toLowerCase() == "färdighet") && (item.system.grupp == "mystik") && (item.system.id == "harmonisera")) {
                    addSkill = false;
                    break;
                }
            }

            if (addSkill) {
				const grupp = "mystik";
                let fardighet = "harmonisera";

                let itemData = await CreateHelper.SkapaFardighetItem(actor, grupp, config.fardigheter[grupp][fardighet], fardighet, updateData.system.installningar.version);
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

        if (version311) {
            updateData.system.installningar.version = "3.1.1";
            update = true;

            if ((actor.prototypeToken.bar1.attribute == "") || (actor.prototypeToken.bar1.attribute == undefined)) {
                updateData.prototypeToken.bar1.attribute = "skada.utmattning.varde";
            }
        }

        if (version400) {
            updateData.system.installningar.version = "4.0.0";
            update = true;

            if (actor.system.installningar.eon === "") {
                updateData.system.installningar.eon = "eon4";
            }
            if (actor.type === "rollperson5") {
                if (!Number.isInteger(actor.system.harleddegenskaper?.visdom)) {
                    updateData.system.harleddegenskaper.visdom = 0;
                    console.log('visdom ' + actor.name);
                }                
            }
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
 * @param {foundry.documents.collections.Items} item   The item to Update
 * @param config   game.EON 
 */
export const updateItem = async function(item, config, actor) {
    try {
        let update = false;
        let version210 = await CompareVersion(item.system.installningar.version, "2.1.0");
        let version310 = await CompareVersion(item.system.installningar.version, "3.1.0");     
        let version400 = await CompareVersion(item.system.installningar.version, "4.0.0");   

        const updateData = foundry.utils.duplicate(item);        

        if (item.system.installningar.version === "") {
            updateData.system.installningar.version = "1.0.0";
            update = true;
        }        

        if (version210) {
            updateData.system.installningar.version = "2.1.0";

            if (item.type.toLowerCase() === "färdighet") {
                if ((!item.system.installningar.lattlard) && (!item.system.installningar.svarlard)) {
                    updateData.system.installningar.normal = true;
                    update = true;
                }
            }
            if ((item.type.toLowerCase() === "skada") && (item.system.typ === "")) {
                updateData.system.typ = "skada";
                update = true;
            }
        }

        if (version310) {
            updateData.system.installningar.version = "3.1.0";

            if (((item.type.toLowerCase() === "närstridsvapen") || (item.type.toLowerCase() === "avståndsvapen") || (item.type.toLowerCase() === "sköld")) && (item.system.egenskaper.length > 0)) {
                update = true;

                const pack = game.packs.get("eon-rpg.vapenegenskaper");
                const egenskaper = await pack.getDocuments({type: "Egenskap"});
                let nylista = [];
                
                for (const vapenegenskap of item.system.egenskaper) {
                    const i = egenskaper.find(e => e.system.id === vapenegenskap.namn);

                    let egenskap = {
                    	uuid: i.uuid,
                    	_id: i._id,
                    	label: i.name, 
                    	namn: i.system.id, 
                    	varde: vapenegenskap.varde, 
                    	beskrivning: i.system.beskrivning,
                    	harniva: i.system.installningar.harniva
                    };

                    nylista.push(egenskap);
                }

                updateData.system.egenskaper = nylista;
            }
        }

        if (version400) {
            updateData.system.installningar.version = "4.0.0";
            update = true;

            if (item.system.installningar.eon === "") {
                updateData.system.installningar.eon = "eon4";
            }
        }

        if (update) {
            //console.log("Uppdaterar " + item.name + " " + item.system.installningar.version);
            await item.update(updateData);
            update = false;
        }
    } 
    catch (e) {
        if (actor == undefined) {
            e.message = `Failed migration for Item ${item.name}: ${e.message}`;
        }
        else {
            e.message = `Failed migration for Item ${item.name} on Actor ${actor.name}: ${e.message}`;
        }
        
        console.error(e.message);
    }
}

 /**
 * patch an compendium to the latest version
 * @param {Pack} pack   The pack to Update
 * @param systemVersion   The version that is being pushed at the world
 * 
 */
 export const updateCompendium = async function(pack, config, systemVersion) {
    const entity = pack.documentName;
    if ( ["Scene"].includes(entity) ) return;
    if ( !["Actor", "Item", "Scene"].includes(entity) ) return;

    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    // Begin by requesting server-side data model migration and get the migrated content
    await pack.migrate();
    const content = await pack.getDocuments();

    // Iterate over compendium entries - applying fine-tuned migration functions
    for ( let ent of content ) {
        try {
            switch (entity) {
                case "Actor":
                    await updateActor(ent, config, systemVersion);
                    break;
                case "Item":
                    await updateItem(ent, config, undefined);
                    break;
                case "Scene":
                    break;
            }
        }

        // Handle migration failures
        catch(err) {
            err.message = `Failed migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }

    // Apply the original locked status for the pack
    await pack.configure({locked: wasLocked});
    console.log(`Migrated all ${entity} entities from Compendium ${pack.collection}`);
 };

 /**
 * Sends version text to chat
 * @param systemVersion The new system version
 * @param installedVersion The installed system version
 * @param config   game.EON
 */
export async function patchWorld(systemVersion, installedVersion, config) {
    if (CompareVersion(installedVersion, systemVersion)) {
        ui.notifications.warn(`Uppdaterar världen från version ${installedVersion} till ${systemVersion} stäng inte världen eller din Foundry. Var god vänta då det kan ta tid...`, {permanent: true});

        for (const id of game.actors.invalidDocumentIds) {
            try {
                const actor = game.actors.getInvalid(id);
                console.error(`Actor ${actor.name} is of a not valid type and have been removed from the system`);
                await actor.delete()
            }
            catch(err) {
                console.error(`invalidDocumentIds ${actor.name}: ${err.message}`);
                console.error(err);
            }
        }

        for (const actor of game.actors) {
            await updateActor(actor, config, systemVersion);
        }

        for (const item of game.items) {
            await updateItem(item, config, undefined);
        }

        for ( let pack of game.packs ) {
            try {
                //if ( pack.metadata.packageType !== "world" ) continue;
                //if ( pack.metadata.packageType !== "system" ) continue;
                //if ( !["Actor", "Item", "Scene"].includes(pack.documentName) ) continue;
                await updateCompendium(pack, config, systemVersion);
            } catch(err) {
                console.error(err);
                isError = true;
            }
        }

        ui.notifications.info("Klar!", {permanent: true});
    }
}

 /**
 * Sends version text to chat
 * @param systemVersion The new system version
 */
export async function DoNotice(systemVersion, installedVersion, isDemo = false) {
    if (!game.user.isGM) {
      return;
    }

    let partMessage = "";
    let futureMessage = "";    

    if (await CompareVersion(installedVersion, '4.0.0', isDemo)) {
        partMessage += `
        <p><ul style="margin-top: 0">
            <li>Stöd för Foundry v13</li>
            <li>Eon 5 rollformulär</li>
            <li>Tillägg till Eon IV kompendium:<br />
                Utrustning<br />
                Folkslag<br />
                Folkslags egenskaper<br />
                Språk
            </li>
            <li>Dra föremål mellan rollformulär</li>
            <li>Väskor och behållare</li>
            <li>Manuell sortering av Utrustningslistan på namn och typ.</li>
            <li>Folkslag lagrar nu de egenskaper som folkslaget har samt de språk de talar. Dessa läggs till automatiskt till formuläret när Folkslaget läggs till.</li>
            <li>I lite mer detalj: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/8?closed=1">v4.0</a></li>
        </ul></p>     
        <h4>Eon 5 rollformulär</h4>  
        <p>Lagt till en beta-version av ett nytt Eon 5 rollformulär, finns också en världsinställning vilken version av Eon man spelar som fasställer vilken typ av Rollformulär (bl a) som är förvalt när man skapar en ny Actor.</p>

        <h4>Dra föremål mellan rollformulär</h4>
        <p>Man kan nu dra utrustning, vapen, rustningar och förvaringsutrustning mellan rollformulärer. Dessa läggs då till på det nya formuläret och tas bort från det ursprungliga. Fungerar mellan Eon 4 och Eon 5 rollformuläret.</p>

        <h4>Väskor och behållare</h4>
        <p>Man kan sätta en utrustning så den blir Förvaring, alltså en behållare att lägga annan utrustning i. Detta gör man med drag and drop. Du sätter egenskapen Förvaring på föremålet du vill ha som förvaring därefter drar den utrustning du vill förvara i den till den.</p>
        `;
    }

    if (await CompareVersion(installedVersion, '4.0.1')) {
        partMessage += `
        <p>
            <h4>Eon 5 rollformulär</h4>            
            <p>[<a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/329">#329</a>] - Belastningstabellen gav fel värde i Eon 5.</p>
            <p>[<a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/333">#333</a>] - Kan inte spara karaktärsdrag samt om man hade mer än ett rollformulär öppet så togs värdet på det andra rollformulärets karaktärsdraget.</p>
        </p>           
        `;
    }

    // if (await CompareVersion(installedVersion, '3.1.0')) {
    //     partMessage += `
    //         <li><h3>Eon IV kompendium</h3>
    //             <b>Föremål</b> - Från grundboken alla vapen, sköldar och vapenegenskaper.<br />
    //             <b>Tabeller</b> - skada, träfftabell och varelse vändningar<br />
    //             <b>Varelser</b> - alla djur och början till varelserna (fick hoppas vissa då systemet har inte riktigt support för alla varianter upptäcktes det på slutet, de som saknas kommer i v3.2).</li>
    //         <li>Rollformulär till varelser med stöd för vändningar.</li>
    //         <li>Funktionen för vapenegenskaper har gjorts om så nu drar man de egenskaper man vill att ett vapen skall ha till vapnet.</li>
    //         <li>Fler val vid vapenanfall - försvarstekniker, attacktypsalternativ.</li>
    //         <li>Vapenutrustning har nu också "antal".</li>
    //         <li>Man kan editera en rustnings skydd och belastning.</li>
    //         <li>Olika valutor</li>
    //         <li>Förbättringsslag direkt i editeringsfönstret för färdigheten.</li>
    //         <li>I lite mer detalj: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/5?closed=1">v3.1</a></li>
    //     `;

    //     futureMessage += `
    //         <li>Utrustningslistan, väskor och behållare</li>
    //         <li>Initiativ</li>            
    //         <li>Mer varelser</li>
    //         <li>Strid</li>
    //     `;
    // }

    // if (await CompareVersion(installedVersion, '3.1.1')) {
    //     partMessage += `
    //         <li>[<a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/286">#286</a>, <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/287">#287</a>] - Utmattning är nu kopplade till Tokens. Se <a href="https://github.com/JohanFalt/Foundry_EON-RPG/wiki/Token">Wiki</a></li>.
    //         <li>[BUGG][<a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/288">#288</a>] - Föremålens formulär öppnades inte som de skulle efter att man skapade dem till en Rollperson.</li>
    //         <li>[BUGG][<a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/285">#285</a>] - Man kunde inte skapa myntsorten Koppar och Silverdaler.</li>
    //     `;
    // }

    // if (await CompareVersion(installedVersion, '3.1.2')) {
    //     partMessage += `
    //         <li>Förberedande för Foundry v13.</li>
    //     `;
    // }

    // if (await CompareVersion(installedVersion, '2.2.0')) {
    //     partMessage += `
    //         <li>[INSTÄLLNING] Vilka fonter man vill använda till brödtext och rubriker.</li>
    //         <li>[DESIGN] Fixat och trixat i designen av alla formulärer i systemet.</li>            
    //         <li>[SYSTEM] Lagt till automatisk beräkning för avdrag på färdighetsslag enligt grundboken när det gäller sår, smärta och belastning.</li>
    //         <li>[SYSTEM] Man kan nu skicka beskrivningar till chatten.</li>
    //         <li>[SYSTEM] Flyttat att höja/sänka grundegenskaperna/färdigheterna inne i EDITERA.</li>
    //         <li>[SYSTEM] Alla beskrivningsrutor stödjer nu Foundrys inre länkning samt HTML.</li>
    //         <li>[MAGI] Lagt till så man kan registrera ritualversioner till besvärjelser.</li>
    //         <li>I lite mer detalj: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/1?closed=1">v2.2</a></li>
    //     `;

    //     futureMessage += `
    //         <li>Boken Strid</li>
    //         <li>Varelser</li>            
    //         <li>Utrustningslistan</li>
    //         <li>Folkslag</li>
    //         <li>Vad som ligger planerat: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/5">v2.3</a></li>
    //     `;
    // }

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

    if (partMessage == "") {
        return;
    }

    let introduction = `
        <div class="tray-title-area"><h4>Version ${systemVersion} installerat</h4></div>
        <div class="tray-action-area">
            Systemet är nu uppdaterat till en ny version.
            <p>Delar av detta system innehåller material som tillhör <a href="https://helmgast.se/">Helmgast AB</a> som äger copyright och trademark. Allt material används med tillåtelse.</p>
            Detta system är inte en officiell Eon produkt.
        </div>`;

    let message = `
        <div class="tray-title-area">Nytt för versionen</div>
        <div class="tray-action-area">
            ${partMessage}
        </div>`;

    if (futureMessage != '') {
        message += `
        <div class="tray-title-area">Planerat för nästa version</div>
        <div class="tray-action-area">
        </div>
        <div class="tray-action-area">
            <ul style="margin-top: 0">
            ${futureMessage}
            </ul>
        </div>`;
    }    

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
    
    const enrichedMessage = await foundry.applications.ux.TextEditor.implementation.enrichHTML(`${message}`, { async: true });
    await ChatMessage.create({
      user: game.user.id,
      content: enrichedMessage
    });
}