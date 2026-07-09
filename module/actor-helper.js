import DialogHelper from "./dialog-helper.js";

export default class classActorHelper {
    static HandleDragDrop(sheet, actor, html, element) {
        const original = element;
        if (original.dataset.draggableAttached) return;
        original.dataset.draggableAttached = true;

        let clone = null;
        let offsetX, offsetY;
        let isDragging = false;
        let wasDragged = false;
        let currentHoverContainer = null;
        let dragTimeout;

        original.addEventListener('mousedown', (e) => {
            // Starta bara drag efter en viss fördröjning (click-and-hold)
            dragTimeout = setTimeout(() => {
                isDragging = true;
                wasDragged = true;
                original.dataset.wasDragged = "true";

                clone = original.cloneNode(true);
                document.body.appendChild(clone);

                const rect = original.getBoundingClientRect();
                clone.style.position = 'absolute';
                clone.style.left = `${rect.left}px`;
                clone.style.top = `${rect.top}px`;
                clone.style.width = `${rect.width}px`;
                clone.style.height = `${rect.height}px`;
                clone.style.zIndex = 1000;
                clone.style.pointerEvents = 'none';
                clone.style.opacity = 0.5;
                clone.style.color = '#000';
                clone.style.outline = '2px dashed rgb(147, 147, 147)';
                clone.style.outlineOffset = '-4px';
                clone.style.height = '26px';
                clone.style.lineHeight = '26px';
                clone.classList.add('dragging-clone');

                offsetX = e.clientX - rect.left;
                offsetY = e.clientY - rect.top;
            }, 200); // ← justera fördröjning om du vill
        });

        original.addEventListener('mouseup', () => {
            clearTimeout(dragTimeout); // om släpp sker innan drag aktiveras
        });

        document.addEventListener('mousemove', (e) => {
            if (isDragging && clone) {
                clone.style.left = `${e.clientX - offsetX}px`;
                clone.style.top = `${e.clientY - offsetY}px`;

                // Hitta vilken container vi är över
                let hovered = null;
                const cloneRect = clone.getBoundingClientRect();

                html.find('.container').each((j, containerEl) => {
                    const rect = containerEl.getBoundingClientRect();

                    const isOverlapping =
                        cloneRect.right > rect.left &&
                        cloneRect.left < rect.right &&
                        cloneRect.bottom > rect.top &&
                        cloneRect.top < rect.bottom;

                    if (isOverlapping) hovered = containerEl;
                });

                // Hantera hover-klasser
                if (currentHoverContainer && currentHoverContainer !== hovered) {
                    currentHoverContainer.classList.remove('hover-target');
                }

                if (hovered && currentHoverContainer !== hovered) {
                    hovered.classList.add('hover-target');
                    currentHoverContainer = hovered;
                }

                if (!hovered) {
                    currentHoverContainer = null;
                    html.find('.container').removeClass('hover-target');
                }
            }
        });

        document.addEventListener('mouseup', async (e) => {
            clearTimeout(dragTimeout);
            if (!isDragging || !clone) {
                setTimeout(() => delete original.dataset.wasDragged, 0);
                return;
            }

            isDragging = false;

            const cloneRect = clone.getBoundingClientRect();
            let dropped = false;
            const itemId = clone.dataset?.itemid;

            if (!itemId) {
                console.error("Hittar inte släppta föremålets itemid");
                this.render();
                return;
            }

            const containers = document.querySelectorAll('.container');

            for (const containerEl of containers) {
                containerEl.classList.remove('hover-target'); // 🧹 Ta bort visuell markering
        
                const containerRect = containerEl.getBoundingClientRect();
        
                const isOverlapping =
                    cloneRect.right > containerRect.left &&
                    cloneRect.left < containerRect.right &&
                    cloneRect.bottom > containerRect.top &&
                    cloneRect.top < containerRect.bottom;

                // 🛡️ Kontrollera att containern tillhör samma actor
                const containerActorId = containerEl.dataset?.actorId;
                const isSameActor = containerActorId === actor._id;
        
                if (isOverlapping && isSameActor) {
                    await this.DropToContainer(actor, clone, containerEl);
                    dropped = true;
                    break; // stoppa efter första träffen
                }
            }

            if (!dropped) {
                let target = e.target;
                while (target && target !== document.body) {
                    //if (target.classList?.contains('container')) break;

                    const id = target.id;
                    if (
                        target.tagName === 'DIV' &&
                        typeof id === 'string' &&
                        (id.startsWith('EonActorSheet-Actor-') || id.startsWith('Eon5ActorSheet-Actor-'))
                    ) {
                        const newActorId = id.replace(/^(EonActorSheet|Eon5ActorSheet)-Actor-/, '');
                        await this.DropToActor(actor, clone, newActorId);
                        break;
                    }

                    target = target.parentElement;
                }
            }

            clone.remove();
            clone = null;
            currentHoverContainer = null;

            setTimeout(() => delete original.dataset.wasDragged, 0);

            if (dropped) sheet.render();
        });
    }


    static async DropToContainer(actor, clone, destination) {
        const itemId = clone.dataset.itemid;
        const containerItemId = destination.dataset.itemid;

        const draggedItem = await actor.items.get(itemId);        
        const containerItem = await actor.items.get(containerItemId);        

        const itemData = foundry.utils.duplicate(draggedItem);
        itemData.system.installningar.forvaringid = containerItemId;
        itemData.system.installningar.buren = containerItem.system.installningar.buren;
        draggedItem.update(itemData);        
    }    

    static async DropToActor(actor, clone, destinationId) {
        if (destinationId == actor._id) {
            // samme rollformulär ignorera
            return false;
        }

        const itemId = clone.dataset.itemid;
        const item = actor.items.get(itemId);
        let containerItems = [];
        const destinationActor = game.actors.get(destinationId);

        const itemData = foundry.utils.duplicate(item);
        itemData.system.installningar.eon = destinationActor.system.installningar.eon;

        // undersök om föremålet var en behållare
        if (itemData.system.installningar.forvaring) {
            containerItems = (actor?.items || []).filter(item => item.system.installningar.forvaringid == itemData._id);
        }

        // lägg till det nya föremålet
        const createdItem = await destinationActor.createEmbeddedDocuments("Item", [itemData]);

        console.log("Flyttat itemData " + itemData.name);

        // om föremålet var en behållare med items lägg till dem med och flytta över dem till det nya rollformuläret
        for (const citem of containerItems) {
            const citemData = foundry.utils.duplicate(citem);
            citemData.system.installningar.forvaringid = createdItem[0]._id;
            citemData.system.installningar.eon = itemData.system.installningar.eon;
            await destinationActor.createEmbeddedDocuments("Item", [citemData]);

            actor.deleteEmbeddedDocuments("Item", [citem._id]);
        }
        
        // ta bort det gamla föremålet
        actor.deleteEmbeddedDocuments("Item", [itemId]); 

        return true;
    } 

    static async OnsheetChange(event, actor) {
        const element = event.currentTarget;
		const dataset = element.dataset;

		const source = dataset.source;
        const actorData = foundry.utils.duplicate(actor);

        if (source == "miljo") {
            const miljoSelect = document.getElementById("miljo");

            if (miljoSelect.value == "custom") {
                DialogHelper.AttributeEditDialog(actor, "bakgrund", source);
                return;
            }

            return;
        }
        if (source == "arketyp") {
            const arketypSelect = document.getElementById("arketyp");
            
            if (arketypSelect.value == "custom") {
                DialogHelper.AttributeEditDialog(actor, "bakgrund", source);
                return;
            }

            return;
        }        
        if (source == "valmaende") {
            let ruta = document.getElementById("fokus_varde");

            const oldIndex = Number(dataset.value);
            const newIndex = Number(ruta.value);

            if (newIndex < oldIndex) {

                actorData.system.egenskap.fokus.varde = newIndex;
                actorData.system.egenskap.fokus.max = newIndex;
                
                await actor.update(actorData);
                return true;                
            }    
            
            return;
        }
        if (source == "karaktarsdrag") {
            const index = Number(dataset.index);
            let property = dataset.name;

            if (property.includes(".")) {
                let properties = property.split(".");

                if (properties.length == 2) {
                    const value1 = properties[0];
                    const value2 = properties[1];
                    property = property.replace(".", "_");

                    const karaktarsdragInput = document.getElementById(
                        actor._id + "_" + source + "_" + property + "_" + index
                    );
                    const newValue = karaktarsdragInput.value;

                    actorData.system.egenskap.karaktärsdrag[index][value1][value2] = newValue;
                }
                else {
                    return;
                }                
            }
            else {
                const karaktarsdragInput = document.getElementById(
                    actor._id + "_" + source + "_" + property + "_" + index
                );
                const newValue = karaktarsdragInput.value;

                actorData.system.egenskap.karaktärsdrag[index][property] = newValue;
            }
            
            await actor.update(actorData);
            return true;
        }
        if (source == "lakningstakt") {
            let value = parseInt(element.value);
            actorData.system.strid.lakningstakt = value;
            await this.actor.update(actorData);
            return;
        }
    }
}