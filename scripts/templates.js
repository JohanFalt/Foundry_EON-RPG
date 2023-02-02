/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function () {
    const templatePaths = [
        // Actor Sheet Partials
		"systems/eon-rpg/templates/actors/parts/navigation.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-top.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-bio.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-trait.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-combat.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-equipment.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-mystic.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-magic.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-religion.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-setting.html",
		"systems/eon-rpg/templates/actors/parts/rollperson-sheet-skill.html",
    ];

    /* Load the template parts
		That function is part of foundry, not founding it here is normal
	*/
	return loadTemplates(templatePaths);
};

export async function setup()
{
    try {        
        const {files} = await FilePicker.browse("data", 'systems/eon-rpg/packs');
        let data = await FilePicker.browse("data", "systems/eon-rpg/packs", { bucket: null, extensions: [".json", ".JSON"], wildcard: false });

		let importData = {};

        if (data.files.includes("systems/eon-rpg/packs/karaktarsdrag.json")) {
			const fileData = await fetch(`systems/eon-rpg/packs/karaktarsdrag.json`).then((response) => response.json());
			Object.assign(importData, fileData);
        }

		if (data.files.includes("systems/eon-rpg/packs/arketyper.json")) {
			const fileData = await fetch(`systems/eon-rpg/packs/arketyper.json`).then((response) => response.json());
			Object.assign(importData, fileData);
        }

		if (data.files.includes("systems/eon-rpg/packs/miljoer.json")) {
			const fileData = await fetch(`systems/eon-rpg/packs/miljoer.json`).then((response) => response.json());
			Object.assign(importData, fileData);
        }

		if (data.files.includes("systems/eon-rpg/packs/folkslag.json")) {
			const fileData = await fetch(`systems/eon-rpg/packs/folkslag.json`).then((response) => response.json());
			Object.assign(importData, fileData);
        }

		return importData;		
    } catch(err) {
        return
    }
}