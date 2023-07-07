import { eon } from "./config.js";
import { systemSettings } from "./settings.js";
import * as Templates from "./templates.js";
import { EonActorSheet } from "./actor-sheet.js";
import { EonItemSheet } from "./item-sheet.js";

 /**
 * Compares two version numbers to see if the new one is newer than the old one
 * @param oldVersion   The existing version no: e.g. 1.5.9
 * @param newVersion   The new version no: e.g. 1.5.10
 */
 function _compareVersion(oldVersion, newVersion) {
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

async function doNotice(systemVersion) {
    if (!game.user.isGM) {
      return;
    }
    
    const enrichedMessage = await TextEditor.enrichHTML(
      /*html*/
      `
      <div class="tray-title-area">Eon IV - ${systemVersion}</div>
      <div class="tray-action-area">
          <p>Hej! Detta är en system till det Svenska rollspelet Eon IV. Dock betänk att det är för närvarande i tidig <b>beta-version</b> och skall inte på något sätt tas som en produkt som kan användas skarpt i en kampanj eller liknande.</p> 
          <p>Grundläggande funktioner kan ändras mellan versionerna och ingen hänsyn tas till detta så om du är intresserad att testa och att utvärdera - varsegod och testa på.</p>
      <div>
      <div class="tray-title-area">Mål</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li>Nästa version - Bakgrundsfliken
          <li>v1.0 - När rollformuläret kan hålla information för de saker som finns i grundboken så kommer jag släppa första versionen.</li>
        </ul>
      </div>
      <div class="tray-title-area">Nya saker sedan Alpha 1.5</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li>Slå Härledda attribut.</li>
          <li>Fixat så man nu ser alla egenskaperna på vapen.</li>
        </ul>
      </div>
      <div class="tray-title-area">Nya saker sedan Alpha 1.4</div>
      <div class="tray-action-area">
        <ul style="margin-top: 0">
          <li>Stöd för Dice So Nice.</li>
          <li>Vapen-fliken</li>
          <li>Rustningar-fliken</li>
          <li>Tärningsslag</li>
          <li>Grafik</li>
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

/* ------------------------------------ */
/* 1. Init system						*/
/* ------------------------------------ */
Hooks.once("init", async function() {
    // Register System Settings
	systemSettings();

    CONFIG.EON = eon;
    CONFIG.EON.settings = [];
    CONFIG.EON.settings.bookCombat = game.settings.get("eon-rpg", "bookCombat") == "strid";

    Actors.unregisterSheet("core", ActorSheet);
    Actors.registerSheet("EON", EonActorSheet, { types: ["Rollperson"], makeDefault: true });

    Items.unregisterSheet("core", ItemSheet);
    Items.registerSheet("EOB", EonItemSheet, { makeDefault: true });

    Templates.PreloadHandlebarsTemplates();
    Templates.RegisterHandlebarsHelpers();
    game.EON = await Templates.Setup();
});

/* ------------------------------------ */
/* 2. Setup system						*/
/* ------------------------------------ */
Hooks.once("setup", function () {
    // Do anything after initialization but before
    // ready
});

/* ------------------------------------ */
/* 3. When ready						*/
/* ------------------------------------ */
Hooks.once("ready", async () => {
    // Do anything once the system is ready
	const installedVersion = game.settings.get("eon-rpg", "systemVersion");
  const systemVersion = game.data.system.version;

  if (game.user.isGM) {
      if ((installedVersion !== systemVersion || installedVersion === null)) {
          if (_compareVersion(installedVersion, systemVersion)) {        
              await doNotice(systemVersion);
              game.settings.set("eon-rpg", "systemVersion", systemVersion);
          }
      }
  } 
});

Hooks.on("renderActorSheet", (sheet) => { 
});

Hooks.on("renderItemSheet", (sheet) => { 
    clearHTML(sheet);

    if ((sheet.object.type.toLowerCase().replace(" ", "") == "närstridsvapen") || 
            (sheet.object.type.toLowerCase().replace(" ", "") == "avståndsvapen") || 
            (sheet.object.type.toLowerCase().replace(" ", "") == "sköld")) {
        sheet.element[0].classList.add("vapen");
    }	
});

/* ------------------------------------ */
/* When rendered a sheet    			*/
/* ------------------------------------ */
Hooks.on("renderFormApplication", (sheet) => { 
});

function clearHTML(sheet) {
	sheet.element[0].classList.remove("vapen");
}