import { DialogMigrationWizard } from "./dialog-migration-wizard.js";

export default class MigrationWizard {
    /**
     * Shows a migration wizard dialog with multiple messages (one per page)
     * Only displays to GM users
     * @param {Array<string|Object>} messages - Array of messages to display. Can be strings or objects with title/content
     * @param {string} [readMessageSetting] - Optional setting name to set when checkbox is checked on last page (e.g., 'readmessage01', 'readmessage02')
     * @returns {Promise<void>} Resolves when the dialog is closed (för att kunna visa nästa wizard i kedja)
     */
    static show(messages, readMessageSetting = null) {
        return new Promise((resolve) => {
            // Only show to GM users
            if (!game.user.isGM) {
                resolve();
                return;
            }

            // Validate input
            if (!messages || !Array.isArray(messages) || messages.length === 0) {
                console.warn("MigrationWizard.show() called with invalid messages array");
                resolve();
                return;
            }

            // Normalize messages to strings (in case objects are passed)
            const normalizedMessages = messages.map(msg => {
                if (typeof msg === 'string') {
                    return msg;
                } else if (msg && typeof msg === 'object') {
                    return msg.content || msg.title || String(msg);
                } else {
                    return String(msg);
                }
            });

            const wizard = new DialogMigrationWizard(normalizedMessages, readMessageSetting, resolve);
            wizard.render(true);
        });
    }
}