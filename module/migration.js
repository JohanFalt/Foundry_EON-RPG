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
export async function DoNotice(systemVersion) {
    if (!game.user.isGM) {
      return;
    }
    
    const enrichedMessage = await TextEditor.enrichHTML(
      /*html*/
      `
      <div class="tray-title-area">Eon IV - ${systemVersion}</div>
      <div class="tray-action-area">
          <p>Hej! Detta är en system till det Svenska rollspelet Eon IV. Dock betänk att det är för närvarande i <b>beta-version</b> och skall inte på något sätt tas som en produkt som kan användas skarpt i en kampanj eller liknande.</p> 
          <p>Grundläggande funktioner kan ändras mellan versionerna och ingen hänsyn tas till detta så om du är intresserad att testa och att utvärdera - varsegod och testa på.</p>
      <div>
      <div class="tray-title-area">Mål</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li>När rollformuläret kan hålla information för de saker som finns i grundboken så kommer jag släppa första versionen.</li>
        </ul>
      </div>
      <div class="tray-title-area">Nya saker i Alpha 1.7</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li>Fliken Religion</li>
          <li>Lagt in alla utrustningsföremål från grundboken</li>
          <li>Lägga till permanenta/tillfälliga bonus på attribut</li>
          <li>Alla Foundry items kan nu skapas i världen</li>
          <li>Grafik</li>
          <li>En stor hög med buggar</li>
        </ul>
      </div>
      <div class="tray-title-area">Stöd mitt arbete</div>
      <div class="tray-action-area">
        <a href="https://ko-fi.com/johanfk"><img src="https://ko-fi.com/img/githubbutton_sm.svg" /></a>
      </div>
      <div class="tray-title-area">Länkar</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG">Projektets källkod</a></li>
          <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG/discussions/landing">Diskussion</a></li>
          <li><a href="https://github.com/JohanFalt/Foundry_EON-RPG/issues">Rapportera önskemål eller fel</a></li>
          <li><a href="https://raw.githubusercontent.com/JohanFalt/Foundry_EON-RPG/main/LICENSE">Licensierad under MIT Licensen</a></li>
        </ul>
      </div>
      `,
      { async: true }
    );
    await ChatMessage.create({
      user: game.user.id,
      content: enrichedMessage,
      type: CONST.CHAT_MESSAGE_TYPES.OTHER
    });
}