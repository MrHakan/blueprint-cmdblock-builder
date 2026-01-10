/**
 * Blueprint Graph Compiler
 * Converts the node graph into a valid Minecraft command list
 */

class BlueprintCompiler {
    constructor() {
        this.nodes = [];
        this.connections = [];
    }

    compile(nodes, connections) {
        this.nodes = nodes;
        this.connections = connections;

        let output = '';

        // Find execution entry nodes (Command Block or Chat Command nodes without inward exec connections)
        const entryNodes = this.nodes.filter(node => {
            const isEntryType = node.type === NodeTypes.COMMAND_BLOCK || node.type === NodeTypes.CHAT_COMMAND;
            if (!isEntryType) return false;

            const hasInwardExec = this.connections.some(conn =>
                conn.toNode === node && conn.toPin.type === PinTypes.EXEC
            );
            return !hasInwardExec;
        });

        const commands = [];
        const visited = new Set();

        entryNodes.forEach(node => {
            this.traverseExecFlow(node, commands, visited);
        });

        return commands.join('\n');
    }



    traverseExecFlow(node, commands, visited) {
        if (!node) return;

        // Handle Loop specifically (Unrolling)
        if (node.type === NodeTypes.LOOP) {
            // Avoid infinite recursion if loop points back to itself improperly, but we allow re-visiting for the purpose of unrolling
            // For unrolling, we don't strictly "visit" the loop node once, we execute its body multiple times.

            const iterations = this.resolveDataNode(node, { name: 'Count' }) || node.data.iterations || 1;
            const safeIterations = Math.min(Math.max(iterations, 1), 100); // Safety cap

            const bodyConn = this.connections.find(c => c.fromNode === node && c.fromPin.name === 'Loop Body');

            for (let i = 0; i < safeIterations; i++) {
                // Add a comment to demarcate loop iteration
                commands.push(`# Loop Iteration ${i + 1}/${safeIterations}`);
                if (bodyConn) {
                    // We need to pass a new visited set for the body to allow re-usage of nodes if desired, 
                    // OR we assume linear flow. For simple command block generation without functions, 
                    // reusing the same nodes in a flat list means duplicating their command output.
                    // So we treat the body traversal as a new branch.
                    this.traverseExecFlow(bodyConn.toNode, commands, new Set());
                }
            }

            // Continue to 'Completed'
            const completedConn = this.connections.find(c => c.fromNode === node && c.fromPin.name === 'Completed');
            if (completedConn) {
                this.traverseExecFlow(completedConn.toNode, commands, visited);
            }
            return;
        }

        if (visited.has(node)) return;

        // Handle If Condition specifically
        if (node.type === NodeTypes.IF_CONDITION) {
            visited.add(node);
            const type = node.data.conditionType; // e.g., 'if entity'
            const cond = node.data.condition;

            // Branch True
            const trueConn = this.connections.find(c => c.fromNode === node && c.fromPin.name === 'True');
            if (trueConn) {
                commands.push(`# If ${type} ${cond} THEN:`);
                // For true branch, often we want to prefix commands with 'execute if ... run' 
                // BUT since this is a visual graph, simple "then run this" might imply conditional command blocks (Chain Conditional).
                // However, making every subsequent node conditional is complex.
                // ALTERNATIVE: Just emit a comment, or try to wrap.
                // FOR NOW: We will assume the user uses this for logic flow, but without 'functions' in vanilla command blocks, 
                // true branching usually implies 'conditional' chain blocks.
                // Let's implement a simple "Execute if" wrapper for the IMMEDIATE next command only, or just letflow.
                // A better approach for linear command blocks: The compiler is simple. 
                // We will just traverse. The *user* is responsible for setting Command Blocks to 'Conditional' if they want that behavior,
                // OR we generate 'execute if ... run ...' which is cleaner for datapacks but harder for command block chains.

                // Strategy: Just traverse.
                this.traverseExecFlow(trueConn.toNode, commands, visited);
            }

            // Branch False (Unless) - logic is tricky with vanilla blocks. 
            // We'll just traverse false if it exists.
            const falseConn = this.connections.find(c => c.fromNode === node && c.fromPin.name === 'False');
            if (falseConn) {
                commands.push(`# Else / False:`);
                this.traverseExecFlow(falseConn.toNode, commands, visited);
            }
            return;
        }

        visited.add(node);

        // Process current node
        const command = this.compileNode(node);
        if (command) {
            commands.push(command);
        }

        // Handle sequence specifically
        if (node.type === NodeTypes.SEQUENCE) {
            const outputs = NodeDefinitions[node.type].outputs;
            outputs.forEach(pin => {
                const conn = this.connections.find(c => c.fromNode === node && c.fromPin.name === pin.name);
                if (conn) {
                    this.traverseExecFlow(conn.toNode, commands, visited);
                }
            });
            return;
        }

        // Find next execution node
        const execConn = this.connections.find(conn =>
            conn.fromNode === node && conn.fromPin.type === PinTypes.EXEC
        );

        if (execConn) {
            this.traverseExecFlow(execConn.toNode, commands, visited);
        }
    }

    compileNode(node) {
        const def = NodeDefinitions[node.type];

        // Values from connected pins take priority over property data
        const getInputValue = (pinName) => {
            const conn = this.connections.find(c => c.toNode === node && c.toPin.name === pinName);
            if (conn) {
                return this.resolveDataNode(conn.fromNode, conn.fromPin);
            }
            // Fallback to node instance data (properties)
            return node.data[pinName.toLowerCase()] || '';
        };

        switch (node.type) {
            case NodeTypes.COMMAND_BLOCK: {
                const cmd = getInputValue('Command');

                // Check if this node has an incoming execution connection
                const hasInwardExec = this.connections.some(conn =>
                    conn.toNode === node && conn.toPin.type === PinTypes.EXEC
                );

                // If it's part of a chain (has incoming exec), force to Chain ('C'). 
                // Otherwise use user setting (Impulse 'I' or Repeating 'R')
                const blockTypeChar = hasInwardExec ? 'C' : node.data.blockType[0];

                const settings = `[${blockTypeChar}${node.data.conditional ? 'C' : 'U'}${node.data.needsRedstone ? 'N' : 'A'}]`;
                return `# Command block\n${settings} ${cmd}`;
            }
            case NodeTypes.CHAT_COMMAND: {
                const cmd = getInputValue('Command');
                return `# In chat\n${cmd}`;
            }
            case NodeTypes.GIVE: {
                const target = getInputValue('Target') || '@p';
                const item = getInputValue('Item') || node.data.item;
                const count = getInputValue('Count') || node.data.count;
                return `give ${target} ${item} ${count}`;
            }
            case NodeTypes.SUMMON: {
                const entity = node.data.entity;
                const pos = getInputValue('Position') || '~ ~ ~';
                const nbt = getInputValue('NBT') || '';
                return `summon ${entity} ${pos} ${nbt}`;
            }
            case NodeTypes.SAY: {
                const msg = getInputValue('Message') || node.data.message;
                return `say ${msg}`;
            }
            case NodeTypes.TELLRAW: {
                const target = getInputValue('Target') || '@a';
                const text = getInputValue('Text') || node.data.text;
                return `tellraw ${target} ${text}`;
            }
            case NodeTypes.TELEPORT: {
                const target = getInputValue('Target') || '@s';
                const dest = getInputValue('Destination') || `${node.data.x} ${node.data.y} ${node.data.z}`;
                return `tp ${target} ${dest}`;
            }
            case NodeTypes.CUSTOM: {
                return node.data.command;
            }
            case NodeTypes.KILL: {
                const target = getInputValue('Target') || '@e';
                return `kill ${target}`;
            }
            case NodeTypes.SETBLOCK: {
                const pos = getInputValue('Position') || '~ ~ ~';
                return `setblock ${pos} ${node.data.block} ${node.data.mode}`;
            }
            case NodeTypes.FILL: {
                const from = getInputValue('From') || '';
                const to = getInputValue('To') || '';
                let cmd = `fill ${from} ${to} ${node.data.block} ${node.data.mode}`;
                if (node.data.mode === 'replace') {
                    cmd += ` ${node.data.replaceBlock}`;
                }
                return cmd;
            }
            case NodeTypes.EFFECT: {
                const target = getInputValue('Target') || '@s';
                if (node.data.action === 'clear') {
                    return `effect clear ${target} ${node.data.effect}`;
                }
                return `effect give ${target} ${node.data.effect} ${node.data.duration} ${node.data.amplifier}`;
            }
            case NodeTypes.GAMEMODE: {
                const target = getInputValue('Target') || '@s';
                return `gamemode ${node.data.mode} ${target}`;
            }
            case NodeTypes.TIME: {
                const value = node.data.action === 'query' ? node.data.value : (node.data.value || '1000');
                return `time ${node.data.action} ${value}`;
            }
            case NodeTypes.WEATHER: {
                const duration = node.data.duration > 0 ? ` ${node.data.duration}` : '';
                return `weather ${node.data.type}${duration}`;
            }
            case NodeTypes.TICK: {
                // tick freeze, tick unfreeze, tick rate <value>, tick sprint <time>
                let args = '';
                if (node.data.action === 'rate' || node.data.action === 'sprint') {
                    args = ` ${node.data.value}`;
                }
                return `tick ${node.data.action}${args}`;
            }
            case NodeTypes.RIDE: {
                const target = getInputValue('Target') || '@s';
                const vehicle = getInputValue('Vehicle') || '@e[limit=1,sort=nearest]';
                return `ride ${target} ${node.data.action} ${vehicle}`;
            }
            case NodeTypes.DAMAGE: {
                const target = getInputValue('Target') || '@s';
                let cmd = `damage ${target} ${node.data.amount} ${node.data.damageType}`;
                if (node.data.attacker) {
                    cmd += ` by ${node.data.attacker}`;
                }
                return cmd;
            }
            case NodeTypes.ATTRIBUTE: {
                const target = getInputValue('Target') || '@s';
                const attr = node.data.attribute;
                const action = node.data.action;

                // attribute <target> <attribute> get [<scale>]
                if (action === 'get') {
                    return `attribute ${target} ${attr} get`;
                }

                // attribute <target> <attribute> base get
                if (action === 'base_get') {
                    return `attribute ${target} ${attr} base get`;
                }

                // attribute <target> <attribute> base set <value>
                if (action === 'base_set') {
                    return `attribute ${target} ${attr} base set ${node.data.value}`;
                }

                // attribute <target> <attribute> modifier add <uuid> <name> <value> <add|multiply|multiply_base>
                if (action === 'modifier_add') {
                    const uuid = node.data.uuid || '0-0-0-0-0';
                    const name = node.data.name || 'modification';
                    return `attribute ${target} ${attr} modifier add ${uuid} ${name} ${node.data.value} ${node.data.operation}`;
                }

                // attribute <target> <attribute> modifier remove <uuid>
                if (action === 'modifier_remove') {
                    const uuid = node.data.uuid || '0-0-0-0-0';
                    return `attribute ${target} ${attr} modifier remove ${uuid}`;
                }

                // attribute <target> <attribute> modifier value get <uuid> [<scale>]
                if (action === 'modifier_value_get') {
                    const uuid = node.data.uuid || '0-0-0-0-0';
                    return `attribute ${target} ${attr} modifier value get ${uuid}`;
                }

                return '';
            }
            default:
                return '';
        }
    }

    resolveDataNode(node, pin) {
        // Recursively resolve data nodes
        const getInputValue = (pinName) => {
            const conn = this.connections.find(c => c.toNode === node && c.toPin.name === pinName);
            if (conn) {
                return this.resolveDataNode(conn.fromNode, conn.fromPin);
            }
            // Use property data if no connection
            return node.data[pinName.toLowerCase()] || '';
        };

        const def = NodeDefinitions[node.type];

        // If this is a command node being treated as data (e.g., its output is plugged into a Command Block)
        if (def.category === 'command' && (pin.name === 'Command' || pin.name === 'Output')) {
            return this.compileNode(node);
        }

        switch (node.type) {
            case NodeTypes.SELECTOR: {
                let s = node.data.base;
                const args = [];
                if (node.data.type) args.push(`type=${node.data.type}`);
                if (node.data.tag) args.push(`tag=${node.data.tag}`);
                if (node.data.name) args.push(`name=${node.data.name}`);
                if (node.data.limit > 0) args.push(`limit=${node.data.limit}`);
                if (node.data.distance) args.push(`distance=${node.data.distance}`);

                if (args.length > 0) s += `[${args.join(',')}]`;
                return s;
            }
            case NodeTypes.POSITION: {
                const prefix = node.data.type.includes('Relative') ? '~' : (node.data.type.includes('Local') ? '^' : '');
                return `${prefix}${node.data.x} ${prefix}${node.data.y} ${prefix}${node.data.z}`;
            }
            case NodeTypes.NBT: {
                return node.data.data;
            }
            case NodeTypes.TEXT: {
                return node.data.value;
            }
            case NodeTypes.NUMBER: {
                return node.data.value;
            }
            case NodeTypes.ITEM_STACK: {
                let itm = node.data.item;
                const nbt = getInputValue('NBT') || node.data.components;
                if (nbt) itm += nbt;
                return itm;
            }
            case NodeTypes.VARIABLE_GET: {
                return `$(${node.data.name})`;
            }
            default: {
                return node.data.value || '';
            }
        }
    }
}

window.blueprintCompiler = new BlueprintCompiler();
