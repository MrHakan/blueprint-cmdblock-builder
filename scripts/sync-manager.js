/**
 * SyncManager - Unified synchronization between CBA and Blueprint editors
 * 
 * This class manages bidirectional sync through localStorage, allowing
 * both editors to stay in sync even across browser tabs.
 */

class SyncManager {
    constructor() {
        this.STORAGE_KEY = 'cba_blueprint_sync';
        this.listeners = [];
        this.debounceTimer = null;
        this.lastUpdateTime = 0;
        this.isUpdating = false;

        // Listen for changes from other tabs
        window.addEventListener('storage', (e) => {
            if (e.key === this.STORAGE_KEY && !this.isUpdating) {
                this.notifyListeners('external');
            }
        });
    }

    /**
     * Get the current sync state from localStorage
     * @returns {{ commands: string, graph: object, lastEditor: string, timestamp: number } | null}
     */
    getState() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('[SyncManager] Error reading state:', e);
            return null;
        }
    }

    /**
     * Save sync state to localStorage
     * @param {object} state - State to save
     * @param {string} source - Which editor made the change ('cba' or 'blueprint')
     */
    saveState(state, source) {
        this.isUpdating = true;
        try {
            const fullState = {
                ...state,
                lastEditor: source,
                timestamp: Date.now()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(fullState));
            this.lastUpdateTime = fullState.timestamp;

            // BACKWARD COMPATIBILITY: Also save to original storage formats
            // Update galLab format (used by getStorage/setStorage in common.js)
            if (state.commands !== undefined) {
                let galLab = JSON.parse(localStorage.getItem('galLab')) || {};
                galLab.myInput = state.commands;
                localStorage.setItem('galLab', JSON.stringify(galLab));
            }

            // Update command_blocks format (used by Blueprint)
            let cbData = JSON.parse(localStorage.getItem('command_blocks')) || {};
            if (state.commands !== undefined) {
                cbData.myInput = state.commands;
            }
            if (state.graph !== undefined) {
                cbData.blueprintGraph = state.graph;
            }
            localStorage.setItem('command_blocks', JSON.stringify(cbData));

            // Notify local listeners
            setTimeout(() => {
                this.notifyListeners('local');
                this.isUpdating = false;
            }, 10);
        } catch (e) {
            console.error('[SyncManager] Error saving state:', e);
            this.isUpdating = false;
        }
    }

    /**
     * Update commands (called by CBA)
     * @param {string} commands - Command text
     */
    updateCommands(commands) {
        // Debounce rapid updates
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            const current = this.getState() || {};
            this.saveState({
                ...current,
                commands: commands
            }, 'cba');
        }, 300);
    }

    /**
     * Update graph (called by Blueprint)
     * @param {object} graph - Serialized graph data
     * @param {string} commands - Compiled commands
     */
    updateGraph(graph, commands) {
        // Debounce rapid updates
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.saveState({
                commands: commands,
                graph: graph
            }, 'blueprint');
        }, 300);
    }

    /**
     * Get current commands (with fallback to old formats)
     * @returns {string}
     */
    getCommands() {
        const state = this.getState();
        if (state?.commands) {
            return state.commands;
        }

        // Fallback to old formats
        try {
            // Try galLab format first
            const galLab = JSON.parse(localStorage.getItem('galLab')) || {};
            if (galLab.myInput) {
                return galLab.myInput;
            }

            // Try command_blocks format
            const cbData = JSON.parse(localStorage.getItem('command_blocks')) || {};
            if (cbData.myInput) {
                return cbData.myInput;
            }
        } catch (e) {
            console.error('[SyncManager] Error reading old formats:', e);
        }

        return '';
    }

    /**
     * Get current graph
     * @returns {object | null}
     */
    getGraph() {
        const state = this.getState();
        return state?.graph || null;
    }

    /**
     * Get last editor that made changes
     * @returns {string | null}
     */
    getLastEditor() {
        const state = this.getState();
        return state?.lastEditor || null;
    }

    /**
     * Subscribe to sync updates
     * @param {Function} callback - Called when sync state changes
     * @returns {Function} Unsubscribe function
     */
    subscribe(callback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Notify all listeners of a change
     * @param {string} source - 'local' or 'external'
     */
    notifyListeners(source) {
        const state = this.getState();
        this.listeners.forEach(cb => {
            try {
                cb(state, source);
            } catch (e) {
                console.error('[SyncManager] Listener error:', e);
            }
        });
    }

    /**
     * Clear all sync data
     */
    clear() {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    /**
     * Migrate from old storage format
     */
    migrateFromOldFormat() {
        try {
            const oldData = localStorage.getItem('command_blocks');
            if (oldData) {
                const parsed = JSON.parse(oldData);
                if (parsed.myInput && !this.getState()) {
                    this.saveState({
                        commands: parsed.myInput,
                        graph: parsed.blueprintGraph || null
                    }, 'cba');
                    console.log('[SyncManager] Migrated from old format');
                }
            }
        } catch (e) {
            console.error('[SyncManager] Migration error:', e);
        }
    }
}

// Global instance
window.syncManager = new SyncManager();

// Auto-migrate on load
window.syncManager.migrateFromOldFormat();
