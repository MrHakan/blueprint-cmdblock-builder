/**
 * Command Change Detector
 * Analyzes changes between command strings to determine if they are
 * structural (require new Blueprint nodes) or value-only (just update properties)
 */

class CommandChangeDetector {
    /**
     * Analyze changes between old and new command strings
     * @param {string} oldCommands - Previous command string
     * @param {string} newCommands - New command string
     * @returns {{ type: 'value_only' | 'structural' | 'none', changes: Array }}
     */
    static analyzeChanges(oldCommands, newCommands) {
        const oldParsed = this.parseCommands(oldCommands);
        const newParsed = this.parseCommands(newCommands);

        // No changes
        if (oldCommands === newCommands) {
            return { type: 'none', changes: [] };
        }

        // Different number of commands = structural change
        if (oldParsed.length !== newParsed.length) {
            return {
                type: 'structural',
                changes: [{
                    reason: 'command_count_changed',
                    oldCount: oldParsed.length,
                    newCount: newParsed.length
                }]
            };
        }

        const changes = [];
        let hasStructuralChange = false;

        // Compare each command
        for (let i = 0; i < oldParsed.length; i++) {
            const oldCmd = oldParsed[i];
            const newCmd = newParsed[i];

            // Compare structure (command type, subcommands)
            if (oldCmd.structure !== newCmd.structure) {
                hasStructuralChange = true;
                changes.push({
                    index: i,
                    reason: 'structure_changed',
                    old: oldCmd.structure,
                    new: newCmd.structure
                });
            } else if (oldCmd.raw !== newCmd.raw) {
                // Same structure, different values = value-only change
                changes.push({
                    index: i,
                    reason: 'values_changed',
                    oldValues: oldCmd.values,
                    newValues: newCmd.values
                });
            }
        }

        return {
            type: hasStructuralChange ? 'structural' : 'value_only',
            changes
        };
    }

    /**
     * Parse command string into array of parsed commands
     * @param {string} commandString - Multi-line command string
     * @returns {Array}
     */
    static parseCommands(commandString) {
        if (!commandString) return [];

        const lines = commandString.split('\n');
        const commands = [];
        let currentSettings = null;

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip empty lines
            if (!trimmed) continue;

            // Handle comment markers (# Command block, # In chat, etc.)
            if (trimmed.startsWith('#')) {
                const marker = trimmed.toLowerCase();
                if (marker.includes('command block') || marker.includes('controller')) {
                    currentSettings = { type: 'command_block', marker: trimmed };
                } else if (marker.includes('in chat')) {
                    currentSettings = { type: 'chat', marker: trimmed };
                } else if (marker.includes('setup')) {
                    currentSettings = { type: 'setup', marker: trimmed };
                } else if (marker.includes('manual')) {
                    currentSettings = { type: 'manual', marker: trimmed };
                }
                // Other comments are just comments
                continue;
            }

            // Parse actual commands
            const parsed = this.parseCommand(trimmed);
            parsed.settings = currentSettings;
            commands.push(parsed);
        }

        return commands;
    }

    /**
     * Parse a single command into structure and values
     * @param {string} command - Single command line
     * @returns {{ raw: string, structure: string, values: object, commandType: string }}
     */
    static parseCommand(command) {
        const raw = command;
        let cmd = command;

        // Handle CBA settings prefix like [RUA], [CCA], etc.
        let settings = null;
        const settingsMatch = cmd.match(/^(\[.*?\])+\s*/);
        if (settingsMatch) {
            settings = settingsMatch[0].trim();
            cmd = cmd.slice(settingsMatch[0].length);
        }

        // Remove leading slash if present
        if (cmd.startsWith('/')) {
            cmd = cmd.slice(1);
        }

        const parts = this.tokenizeCommand(cmd);
        const commandType = parts[0] || '';

        // Build structure string (command type + key structural tokens)
        const structureParts = [commandType];
        const values = {};

        // Analyze based on command type
        switch (commandType) {
            case 'give':
                structureParts.push('give');
                values.target = parts[1] || '';
                values.item = parts[2] || '';
                values.count = parts[3] || '';
                break;

            case 'summon':
                structureParts.push('summon');
                values.entity = parts[1] || '';
                values.position = parts.slice(2, 5).join(' ');
                values.nbt = parts.slice(5).join(' ');
                break;

            case 'say':
                structureParts.push('say');
                values.message = parts.slice(1).join(' ');
                break;

            case 'tellraw':
                structureParts.push('tellraw');
                values.target = parts[1] || '';
                values.json = parts.slice(2).join(' ');
                break;

            case 'tp':
            case 'teleport':
                structureParts.push('tp');
                values.target = parts[1] || '';
                values.destination = parts.slice(2).join(' ');
                break;

            case 'effect':
                structureParts.push('effect', parts[1] || ''); // give/clear is structural
                values.target = parts[2] || '';
                values.effect = parts[3] || '';
                values.duration = parts[4] || '';
                values.amplifier = parts[5] || '';
                break;

            case 'gamemode':
                structureParts.push('gamemode', parts[1] || ''); // mode is structural
                values.target = parts[2] || '';
                break;

            case 'setblock':
                structureParts.push('setblock');
                values.position = parts.slice(1, 4).join(' ');
                values.block = parts[4] || '';
                values.mode = parts[5] || '';
                break;

            case 'fill':
                structureParts.push('fill');
                values.from = parts.slice(1, 4).join(' ');
                values.to = parts.slice(4, 7).join(' ');
                values.block = parts[7] || '';
                values.mode = parts[8] || '';
                break;

            case 'execute':
                // Execute is complex - treat subcommands as structural
                structureParts.push('execute');
                // Find 'run' and treat everything before as structure
                const runIndex = parts.indexOf('run');
                if (runIndex !== -1) {
                    structureParts.push(...parts.slice(1, runIndex + 1));
                    values.command = parts.slice(runIndex + 1).join(' ');
                } else {
                    structureParts.push(...parts.slice(1));
                }
                break;

            case 'kill':
                structureParts.push('kill');
                values.target = parts[1] || '';
                break;

            case 'time':
                structureParts.push('time', parts[1] || ''); // set/add/query is structural
                values.value = parts[2] || '';
                break;

            case 'weather':
                structureParts.push('weather', parts[1] || ''); // weather type is structural
                values.duration = parts[2] || '';
                break;

            default:
                // For unknown commands, treat everything as values
                structureParts.push(commandType);
                values.args = parts.slice(1).join(' ');
        }

        // Add settings to structure if present
        if (settings) {
            structureParts.unshift(settings);
        }

        return {
            raw,
            structure: structureParts.join('|'),
            values,
            commandType,
            settings
        };
    }

    /**
     * Tokenize command respecting brackets and quotes
     * @param {string} command - Command string
     * @returns {string[]}
     */
    static tokenizeCommand(command) {
        const tokens = [];
        let current = '';
        let depth = 0;
        let inQuote = false;
        let quoteChar = '';

        for (let i = 0; i < command.length; i++) {
            const char = command[i];

            if (inQuote) {
                current += char;
                if (char === quoteChar && command[i - 1] !== '\\') {
                    inQuote = false;
                }
                continue;
            }

            if (char === '"' || char === "'") {
                inQuote = true;
                quoteChar = char;
                current += char;
                continue;
            }

            if (char === '[' || char === '{' || char === '(') {
                depth++;
                current += char;
                continue;
            }

            if (char === ']' || char === '}' || char === ')') {
                depth--;
                current += char;
                continue;
            }

            if (char === ' ' && depth === 0) {
                if (current) {
                    tokens.push(current);
                    current = '';
                }
                continue;
            }

            current += char;
        }

        if (current) {
            tokens.push(current);
        }

        return tokens;
    }

    /**
     * Check if change requires a warning (structural change)
     * @param {string} oldCommands 
     * @param {string} newCommands 
     * @returns {boolean}
     */
    static requiresWarning(oldCommands, newCommands) {
        const result = this.analyzeChanges(oldCommands, newCommands);
        return result.type === 'structural';
    }
}

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.CommandChangeDetector = CommandChangeDetector;
}
