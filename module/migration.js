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
 * Sends version text to chat
 * @param systemVersion The new system version
 */
export async function DoNotice(systemVersion, installedVersion) {
    if (!game.user.isGM) {
      return;
    }

    let patch200 = false;
    let partMessage = "";

    try {
      // add the new setting in settings.js
      patch200 = game.settings.get('eon-rpg', 'patch200');      
    } 
    catch (e) {
    }

    if (!patch200) {
      game.settings.set('eon-rpg', 'patch200', true);

      partMessage += `
        <li>Skarp version</li>
        <li>Fliken Bakgrund</li>
        <li>Bonus på tärningsslag med vapen</li>
        <li>Grafik</li>`;
    }    

    if (await CompareVersion(installedVersion, '2.0.3')) {
        partMessage += `<li>[BAKGRUND] Texten under karaktärsdragen sparas inte. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/102">#102</a></li>`;
    }

    if (await CompareVersion(installedVersion, '2.0.2')) {
        partMessage += `
            <li>[VAPEN] Problem med att vapen bytte från närstridsvapen till avståndsvapen utan anledning. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/107">#107</a></li>
            <li>[VAPEN] Vapenskadan räknar inte alltid ihop grundskada och vapenskada. <a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues/106">#106</a></li>`;
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

    let support =  `
        <div class="tray-title-area">Länkar</div>
        <div class="tray-action-area">
            <ul style="margin-top: 0">
            <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG">Projektets källkod</a></li>
            <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG/discussions/landing">Diskussion</a></li>
            <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues">Rapportera önskemål eller fel</a></li>
            <li><a href="https://raw.githubusercontent.com/JohanFalt/Foundry_EON-RPG/main/LICENSE">Licensierad under MIT Licensen</a></li>
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