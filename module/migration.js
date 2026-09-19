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
            if (actor.type === "rollperson5" || actor.type === "Motstandare5") {
                const visdom = actor.system.harleddegenskaper?.visdom;
                
                if (typeof visdom === "number") {
                    updateData.system.harleddegenskaper.visdom = { varde: visdom, hojningar: 0 };
                    console.log('visdom ' + actor.name);
                } else if (!Number.isInteger(visdom?.varde)) {
                    updateData.system.harleddegenskaper.visdom = { varde: 0, hojningar: 0 };
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

        if (item.type === "Tillstånd") {
            const itemData = item.toObject();
            delete itemData._id;
            itemData.type = "Skada";
            itemData.system = itemData.system ?? {};
            itemData.system.typ = itemData.system.typ || "tillstand";
            itemData.system.effekter = itemData.system.effekter ?? [];
            if (actor) {
                await actor.createEmbeddedDocuments("Item", [itemData]);
            } else {
                await Item.create(itemData);
            }
            await item.delete();
            return;
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

    let headMessage = "";
    let partMessage = "";
    let futureMessage = "";   

    if (await CompareVersion(installedVersion, '5.3.0', isDemo)) {
        headMessage += `
        <p><ul style="margin-top: 0">            
            <li>Tagit bort kravet på modulen Eon dice helper, den är nu en del av systemets grundfunktioner</li>
            <li>Fixat hanteringen av varelse-formuläret för stödtill Eon 5</li>
            <li>Lägga till en egenskapad vändning till en varelse genom att klistra in tabellens id</li>
            <li>Tillägg till Eon V kompendium:<br />
                Djur - bastyper av djur<br />
                Vändningar - vändningar som kan användas av varelser<br />
            </li>
            
        </ul></p>     
        `;
        // partMessage += `
        // <h4>Foundry v14 stöd</h4>  
        // <p>Modulen har nu stöd för både Foundry v13 och v14.</p>
        // `;
    }  

    if (await CompareVersion(installedVersion, '5.4.0', isDemo)) {
        headMessage += `
        <p><ul style="margin-top: 0">
            <li>Foundry v14 krav</li>
            <li>Stridmodulen: attack vs försvar, initiativ, skadeformulär, besegrad/ta bort från strid, öppna formulär från trackern</li>
            <li>Ny actortyp för Eon 5: Motståndare (med varelser i kompendiet)</li>
            <li>Vapen: förbättrad dialog, inställning för kroppsbyggnadskrav, Ob visas i generella slaget</li>
            <li>Utrustning: förbättrad layout, +/- antal i behållare (t.ex. väska)</li>
            <li>Övrigt: eget folkslag, inställning för Eon 4/5-visning, flera slag i samma chattmeddelande</li>
            <li>Detaljer: <a href="https://github.com/JohanFalt/Foundry_EON-RPG/milestone/10?closed=1">v5.4</a></li>
        </ul></p>    
        `;
        partMessage += `
            <h4>Stridmodulen (Eon 5)</h4>  
            <p>Stridmodulen har växt och nu hanterar den även stridsresultat.</p>
            <p>Varje deltagare av striden har en besegrad-knapp som markerar deltagaren som besegrad, vilket kan vara tillfälligt eller permanent. Systemet hoppar då över dem.</p>
            <p>Genom att klicka på deltagarens porträtt öppnas detas formulär.</p>
            <h4>Motståndare</h4>
            <p>En ny typ av actor har lagts till för Eon 5 - Motståndare.</p>
            <p>De motståndare som finns listade i Regelboken finns i Eon 5 kompendiumet under Varelser.</p>
        `;
    } 

    if (await CompareVersion(installedVersion, '5.5.0', isDemo)) {
        headMessage += `
        <p><ul style="margin-top: 0">
        <li>Förbättrat hanteringen av stridsresultatet i stridmodulen.</li>
        <li>Förbättrat hanteringen av vapenegenskaper och gett de som har direkta effekter på utgången i stridmodulen så dessa läggs till automatiskt.</li>
        <li>Lagt till en ny typ av skador till rollformuläret - Tillstånd.</li>
        </ul></p>
        `;

        partMessage += `
            <h4>Stridmodulen (Eon 5)</h4>
            <p>Förbättrat hanteringen av stridsresultatet. Nu gör man sitt anfall, motståndaren försvarar sig, om träff slår anfallaren skadan och därefter presenteras resultatet som man sedan fyller i rollformuläret manuellt.</p>
            <h4>Vapenegenskaper (Eon 5)</h4>
            <p>Förbättrat hanteringen av vapenegenskaper och gett de som har direkta effekter på utgången i stridmodulen så dessa läggs till automatiskt. Detaljerna hittas <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/379">här</a> vilka dessa är. De vapen som har dessa egenskaper har blivit uppdaterade i kompendiet.</p>
            <h4>Tillstånd (Eon 5)</h4>
            <p>Lagt till en ny typ av skador - Tillstånd. Dessa är till för att hantera de tillstånd som kan uppstå i stridmodulen och som påverkar rollformuläret. De finns i Eon 5 kompendiumet under Efterverkningar -> Tillstånd. Fler kommer läggas till allt eftersom.</p>
        `;
    }

    if (await CompareVersion(installedVersion, '5.5.3', isDemo)) {
        partMessage += `
        <h4>Förtydliga initiativ stridsmodulen (Eon 5)</h4>
        <p>För att få rätt ordning på de som stred så manipulerade jag värdet på initiativet i sig. Jag har nu fixat till det så för användarna så visas initiativet korrekt nu.</p>
        <h4>Övertag i stridmodulen (Eon 5)</h4>
        <p>Har nu lagt till tre olika fördelar man kan spendera övertag på - Finna blotta, Precision och Öka skada. Dessa kommer upp i skadeformuläret och om man har tillräckligt med övertag kan man använda dessa. De räknas då automatiskt in i resultatet.</p>      
        <h4>Hantering av tillstånd i stridsmodulen (Eon 5)</h4>  
        <p>Om en deltagare i stridsmodulen hade ett tillstånd som var markerat att tickas ner när en fas var över så funkade dett inte som det skulle.<p>
        <h4>Småfixar för Motståndare (Eon 5)</h4>
        <p>Man kunder inte byta en motståndares bild eller ta bort en adderad färdighet.</p>
         `;
    }

    if (await CompareVersion(installedVersion, '5.5.2', isDemo)) {
        partMessage += `
        <h4>Småbuggar (Eon 5)</h4>
        <p>Fixat lite grafikproblem och översättningsfel.</p>
         `;
    }

    if (await CompareVersion(installedVersion, '5.5.1', isDemo)) {
         partMessage += `
         <h4>Påfrestningsskador (Eon 5)</h4>
         <p>Har nu lagt till så man kan hantera påfrestningsskador på rollformuläret. Dessa listas nu under skador.</p>
         <h4>Markering höjning attribut (Eon 5)</h4>
         <p>Enligt reglerna finns det en gräns hur många höjningar man kan göra på ett attribut, dessa kan nu markeras när man editerar ett attribut. Har även lagt till en inställning i Världsinställningarna som bestämmer hur många höjningar man kan göra på ett attribut. Markeringarna är enbart visning och stöd, ej en inbyggd gräns.</p>
          `;
    }

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
            ${headMessage}
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