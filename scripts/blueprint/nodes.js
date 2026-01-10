// Node Type Definitions for Blueprint Editor

const NodeTypes = {
    // Execution nodes
    COMMAND_BLOCK: 'command_block',
    CHAT_COMMAND: 'chat_command',
    SEQUENCE: 'sequence',

    // Command nodes
    GIVE: 'give',
    SUMMON: 'summon',
    EXECUTE: 'execute',
    SAY: 'say',
    TELLRAW: 'tellraw',
    EFFECT: 'effect',
    TELEPORT: 'teleport',
    SETBLOCK: 'setblock',
    FILL: 'fill',
    KILL: 'kill',
    KILL: 'kill',
    CUSTOM: 'custom',

    // New 1.21+ Commands
    GAMEMODE: 'gamemode',
    TIME: 'time',
    WEATHER: 'weather',
    TICK: 'tick',
    RIDE: 'ride',
    DAMAGE: 'damage',
    ATTRIBUTE: 'attribute',

    // Data nodes
    SELECTOR: 'selector',
    POSITION: 'position',
    NBT: 'nbt',
    ITEM_STACK: 'item_stack',
    TEXT: 'text',
    NUMBER: 'number',

    // Logic nodes
    IF_CONDITION: 'if_condition',
    LOOP: 'loop',
    VARIABLE_GET: 'variable_get',
    VARIABLE_SET: 'variable_set'
};

const PinTypes = {
    EXEC: 'exec',
    DATA: 'data',
    SELECTOR: 'selector',
    STRING: 'string',
    NUMBER: 'number',
    NBT: 'nbt',
    POSITION: 'position',
    ITEM: 'item'
};

// Node category colors
const NodeCategories = {
    execution: { color: '#5a5a5a', label: 'Execution' },
    command: { color: '#2d4a6f', label: 'Commands' },
    selector: { color: '#2d5d4a', label: 'Selectors' },
    data: { color: '#4d2d6f', label: 'Data' },
    logic: { color: '#6f5d2d', label: 'Logic' }
};

// Node definitions
const NodeDefinitions = {
    // === EXECUTION NODES ===
    [NodeTypes.COMMAND_BLOCK]: {
        title: 'Command Block',
        category: 'execution',
        description: 'Creates a command block entry',
        tooltip: `
<h3>Command Block</h3>
<p><strong>Logic:</strong> Executes a Minecraft command. Can be Impulse (once), Chain (sequence), or Repeating (tick loop).</p>
<p><strong>Usage:</strong> Connect an execution line to "Exec". Enter the command in the property panel or connect a String.</p>
<p><strong>Note:</strong> Automatically becomes "Chain" type if it has an incoming execution connection.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Output', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'blockType', label: 'Block Type', type: 'select', options: ['Repeating', 'Chain', 'Impulse'], default: 'Repeating' },
            { name: 'conditional', label: 'Conditional', type: 'checkbox', default: false },
            { name: 'needsRedstone', label: 'Needs Redstone', type: 'checkbox', default: false }
        ]
    },

    [NodeTypes.CHAT_COMMAND]: {
        title: 'Chat Command',
        category: 'execution',
        description: 'Command to run in chat',
        tooltip: `
<h3>Chat Command</h3>
<p><strong>Logic:</strong> Represents a command entered in the chat window, not a command block.</p>
<p><strong>Usage:</strong> Use as an entry point for testing sequences without placing blocks.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ]
    },

    [NodeTypes.SEQUENCE]: {
        title: 'Sequence',
        category: 'execution',
        description: 'Execute multiple commands in order',
        tooltip: `
<h3>Sequence</h3>
<p><strong>Logic:</strong> Splits the execution flow into multiple sequential branches.</p>
<p><strong>Usage:</strong> Connect "Exec" input, then connect "Then 0", "Then 1", etc. to different command chains.</p>
<p><strong>Example:</strong> Use to run initialization commands before a main loop.</p>
`,
        tooltip: `
<h3>Sequence</h3>
<p><strong>Logic:</strong> Splits the execution flow into multiple sequential branches.</p>
<p><strong>Usage:</strong> Connect "Exec" input, then connect "Then 0", "Then 1", etc. to different command chains.</p>
<p><strong>Example:</strong> Use to run initialization commands before a main loop.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        outputs: [
            { name: 'Then 0', type: PinTypes.EXEC },
            { name: 'Then 1', type: PinTypes.EXEC },
            { name: 'Then 2', type: PinTypes.EXEC }
        ]
    },

    // === COMMAND NODES ===
    [NodeTypes.GIVE]: {
        title: 'Give',
        category: 'command',
        description: '/give command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR },
            { name: 'Item', type: PinTypes.ITEM },
            { name: 'Count', type: PinTypes.NUMBER }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'item', label: 'Item ID', type: 'minecraft_item', default: 'minecraft:diamond' },
            { name: 'count', label: 'Count', type: 'number', default: 1, min: 1, max: 64 }
        ]
    },

    [NodeTypes.SUMMON]: {
        title: 'Summon',
        category: 'command',
        description: '/summon command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Position', type: PinTypes.POSITION },
            { name: 'NBT', type: PinTypes.NBT }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'entity', label: 'Entity Type', type: 'minecraft_entity', default: 'minecraft:pig' }
        ]
    },

    [NodeTypes.EXECUTE]: {
        title: 'Execute',
        category: 'command',
        description: '/execute command with conditions',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'As', type: PinTypes.SELECTOR },
            { name: 'At', type: PinTypes.SELECTOR },
            { name: 'Run', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'positioned', label: 'Positioned', type: 'text', default: '' },
            { name: 'rotated', label: 'Rotated', type: 'text', default: '' }
        ]
    },

    [NodeTypes.SAY]: {
        title: 'Say',
        category: 'command',
        description: '/say command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Message', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'message', label: 'Message', type: 'text', default: 'Hello World!' }
        ]
    },

    [NodeTypes.TELLRAW]: {
        title: 'Tellraw',
        category: 'command',
        description: '/tellraw with JSON text',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR },
            { name: 'Text', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'text', label: 'Text', type: 'textarea', default: '{"text":"Hello!","color":"gold"}' }
        ]
    },

    [NodeTypes.EFFECT]: {
        title: 'Effect',
        category: 'command',
        description: '/effect give/clear',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'action', label: 'Action', type: 'select', options: ['give', 'clear'], default: 'give' },
            { name: 'effect', label: 'Effect', type: 'text', default: 'minecraft:speed' },
            { name: 'duration', label: 'Duration', type: 'number', default: 30 },
            { name: 'amplifier', label: 'Amplifier', type: 'number', default: 0 }
        ]
    },

    [NodeTypes.TELEPORT]: {
        title: 'Teleport',
        category: 'command',
        description: '/tp command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR },
            { name: 'Destination', type: PinTypes.POSITION }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'x', label: 'X', type: 'text', default: '~' },
            { name: 'y', label: 'Y', type: 'text', default: '~' },
            { name: 'z', label: 'Z', type: 'text', default: '~' }
        ]
    },

    [NodeTypes.SETBLOCK]: {
        title: 'Setblock',
        category: 'command',
        description: '/setblock command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Position', type: PinTypes.POSITION }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'block', label: 'Block', type: 'minecraft_block', default: 'minecraft:stone' },
            { name: 'mode', label: 'Mode', type: 'select', options: ['replace', 'destroy', 'keep'], default: 'replace' }
        ]
    },

    [NodeTypes.FILL]: {
        title: 'Fill',
        category: 'command',
        description: '/fill command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'From', type: PinTypes.POSITION },
            { name: 'To', type: PinTypes.POSITION }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'block', label: 'Block', type: 'minecraft_block', default: 'minecraft:stone' },
            { name: 'mode', label: 'Mode', type: 'select', options: ['replace', 'destroy', 'keep', 'hollow', 'outline'], default: 'replace' },
            { name: 'replaceBlock', label: 'Replace Filter', type: 'minecraft_block', default: 'minecraft:air' }
        ]
    },

    [NodeTypes.KILL]: {
        title: 'Kill',
        category: 'command',
        description: '/kill command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ]
    },

    [NodeTypes.CUSTOM]: {
        title: 'Custom Command',
        category: 'command',
        description: 'Write any command',
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'command', label: 'Command', type: 'textarea', default: 'say Hello' }
        ]
    },

    [NodeTypes.GAMEMODE]: {
        title: 'Gamemode',
        category: 'command',
        description: 'Set player game mode',
        tooltip: `
<h3>Gamemode</h3>
<p><strong>Logic:</strong> Sets the game mode for a target.</p>
<p><strong>Usage:</strong> Select mode (survival, creative, etc.) and target.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'mode', label: 'Mode', type: 'select', options: ['survival', 'creative', 'adventure', 'spectator'], default: 'creative' }
        ]
    },

    [NodeTypes.TIME]: {
        title: 'Time',
        category: 'command',
        description: 'Set or query world time',
        tooltip: `
<h3>Time</h3>
<p><strong>Logic:</strong> Controls or queries the day-night cycle.</p>
<p><strong>Usage:</strong> Set 'Action' (Set/Add/Query) and 'Value'.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'action', label: 'Action', type: 'select', options: ['set', 'add', 'query'], default: 'set' },
            { name: 'value', label: 'Value', type: 'text', default: 'day' }
        ]
    },

    [NodeTypes.WEATHER]: {
        title: 'Weather',
        category: 'command',
        description: 'Set world weather',
        tooltip: `
<h3>Weather</h3>
<p><strong>Logic:</strong> Changes weather (clear, rain, thunder).</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'type', label: 'Type', type: 'select', options: ['clear', 'rain', 'thunder'], default: 'clear' },
            { name: 'duration', label: 'Duration (ticks)', type: 'number', default: 0 }
        ]
    },

    [NodeTypes.TICK]: {
        title: 'Tick',
        category: 'command',
        description: 'Control game tick rate',
        tooltip: `
<h3>Tick</h3>
<p><strong>Logic:</strong> Freezes, sprints, or changes game speed.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'action', label: 'Action', type: 'select', options: ['freeze', 'unfreeze', 'rate', 'sprint'], default: 'freeze' },
            { name: 'value', label: 'Value/Time', type: 'text', default: '' }
        ]
    },

    [NodeTypes.RIDE]: {
        title: 'Ride',
        category: 'command',
        description: 'Make entities ride others',
        tooltip: `
<h3>Ride</h3>
<p><strong>Logic:</strong> Mounts or dismounts entities.</p>
<p><strong>Usage:</strong> Select target (rider) and vehicle.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR },
            { name: 'Vehicle', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'action', label: 'Action', type: 'select', options: ['mount', 'dismount'], default: 'mount' }
        ]
    },

    [NodeTypes.DAMAGE]: {
        title: 'Damage',
        category: 'command',
        description: 'Inflict damage on entities',
        tooltip: `
<h3>Damage</h3>
<p><strong>Logic:</strong> Deals damage to entities.</p>
<p><strong>Usage:</strong> Target, Amount, Damage Type (optional).</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'amount', label: 'Amount', type: 'number', default: 1 },
            { name: 'damageType', label: 'Type', type: 'text', default: 'minecraft:generic' },
            { name: 'attacker', label: 'Attacker (opt)', type: 'text', default: '' }
        ]
    },

    [NodeTypes.ATTRIBUTE]: {
        title: 'Attribute',
        category: 'command',
        description: 'Modify entity attributes',
        tooltip: `
<h3>Attribute</h3>
<p><strong>Logic:</strong> Gets, Sets, or Modifies entity attributes (like Max Health, Speed).</p>
<p><strong>Usage:</strong> Select Attribute and Action. For modifiers, provide UUID, Name, and Amount.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Target', type: PinTypes.SELECTOR }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Command', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'attribute', label: 'Attribute', type: 'minecraft_attribute', default: 'generic.max_health' },
            { name: 'action', label: 'Action', type: 'select', options: ['get', 'base_get', 'base_set', 'modifier_add', 'modifier_remove', 'modifier_value_get'], default: 'base_get' },
            { name: 'value', label: 'Value (Amount)', type: 'number', default: 0 },
            { name: 'operation', label: 'Operation (Mod)', type: 'select', options: ['add', 'multiply', 'multiply_base'], default: 'add' },
            { name: 'uuid', label: 'UUID (Mod)', type: 'text', default: '' },
            { name: 'name', label: 'Name (Mod)', type: 'text', default: '' }
        ]
    },

    // === DATA NODES ===
    [NodeTypes.SELECTOR]: {
        title: 'Selector',
        category: 'selector',
        description: 'Entity selector (@a, @p, @e, etc)',
        inputs: [],
        outputs: [
            { name: 'Selector', type: PinTypes.SELECTOR }
        ],
        properties: [
            { name: 'base', label: 'Base', type: 'select', options: ['@a', '@p', '@e', '@r', '@s', '@n'], default: '@a' },
            { name: 'type', label: 'Type', type: 'text', default: '' },
            { name: 'tag', label: 'Tag', type: 'text', default: '' },
            { name: 'name', label: 'Name', type: 'text', default: '' },
            { name: 'limit', label: 'Limit', type: 'number', default: 0 },
            { name: 'distance', label: 'Distance', type: 'text', default: '' }
        ]
    },

    [NodeTypes.POSITION]: {
        title: 'Position',
        category: 'data',
        description: '3D coordinates',
        inputs: [],
        outputs: [
            { name: 'Position', type: PinTypes.POSITION }
        ],
        properties: [
            { name: 'x', label: 'X', type: 'text', default: '~' },
            { name: 'y', label: 'Y', type: 'text', default: '~' },
            { name: 'z', label: 'Z', type: 'text', default: '~' },
            { name: 'type', label: 'Type', type: 'select', options: ['Absolute', 'Relative (~)', 'Local (^)'], default: 'Relative (~)' }
        ]
    },

    [NodeTypes.NBT]: {
        title: 'NBT Data',
        category: 'data',
        description: 'NBT compound data',
        inputs: [],
        outputs: [
            { name: 'NBT', type: PinTypes.NBT }
        ],
        properties: [
            { name: 'data', label: 'NBT Data', type: 'textarea', default: '{}' }
        ]
    },

    [NodeTypes.ITEM_STACK]: {
        title: 'Item Stack',
        category: 'data',
        description: 'Item with components',
        inputs: [
            { name: 'NBT', type: PinTypes.NBT }
        ],
        outputs: [
            { name: 'Item', type: PinTypes.ITEM }
        ],
        properties: [
            { name: 'item', label: 'Item ID', type: 'minecraft_item', default: 'minecraft:diamond' },
            { name: 'count', label: 'Count', type: 'number', default: 1 },
            { name: 'components', label: 'Components', type: 'textarea', default: '' }
        ]
    },

    [NodeTypes.TEXT]: {
        title: 'Text',
        category: 'data',
        description: 'String value',
        inputs: [],
        outputs: [
            { name: 'String', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'value', label: 'Value', type: 'text', default: '' }
        ]
    },

    [NodeTypes.NUMBER]: {
        title: 'Number',
        category: 'data',
        description: 'Numeric value',
        inputs: [],
        outputs: [
            { name: 'Number', type: PinTypes.NUMBER }
        ],
        properties: [
            { name: 'value', label: 'Value', type: 'number', default: 0 }
        ]
    },

    // === LOGIC NODES ===
    [NodeTypes.IF_CONDITION]: {
        title: 'If Condition',
        category: 'logic',
        description: 'Conditional branch',
        tooltip: `
<h3>If Condition</h3>
<p><strong>Logic:</strong> Branches execution based on a condition (like 'execute if').</p>
<p><strong>Usage:</strong> Select check type (Block, Entity, Score). Connect "True" output to commands to run if match.</p>
<p><strong>Combines With:</strong> Command Blocks (Chain) or other Logic nodes.</p>
`,
        tooltip: `
<h3>If Condition</h3>
<p><strong>Logic:</strong> Branches execution based on a condition (like 'execute if').</p>
<p><strong>Usage:</strong> Select check type (Block, Entity, Score). Connect "True" output to commands to run if match.</p>
<p><strong>Combines With:</strong> Command Blocks (Chain) or other Logic nodes.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Condition', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'True', type: PinTypes.EXEC },
            { name: 'False', type: PinTypes.EXEC }
        ],
        properties: [
            { name: 'conditionType', label: 'Type', type: 'select', options: ['if block', 'if entity', 'if score', 'unless block', 'unless entity'], default: 'if entity' },
            { name: 'condition', label: 'Condition', type: 'text', default: '@s' }
        ]
    },

    [NodeTypes.LOOP]: {
        title: 'Loop',
        category: 'logic',
        description: 'Repeat actions multiple times',
        tooltip: `
<h3>Loop</h3>
<p><strong>Logic:</strong> Repeats the "Loop Body" execution flow N times (Unrolled).</p>
<p><strong>Usage:</strong> Set "Iterations" or connect a Number pin. Connect "Loop Body" to the commands to repeat.</p>
<p><strong>Combines With:</strong> Chain Command Blocks.</p>
`,
        tooltip: `
<h3>Loop</h3>
<p><strong>Logic:</strong> Repeats the "Loop Body" execution flow N times (Unrolled).</p>
<p><strong>Usage:</strong> Set "Iterations" or connect a Number pin. Connect "Loop Body" to the commands to repeat.</p>
<p><strong>Combines With:</strong> Chain Command Blocks.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Count', type: PinTypes.NUMBER }
        ],
        outputs: [
            { name: 'Loop Body', type: PinTypes.EXEC },
            { name: 'Completed', type: PinTypes.EXEC }
        ],
        properties: [
            { name: 'iterations', label: 'Iterations', type: 'number', default: 5, min: 1, max: 100 }
        ]
    },

    [NodeTypes.VARIABLE_GET]: {
        title: 'Get Variable',
        category: 'logic',
        description: 'Get a stored value',
        tooltip: `
<h3>Get Variable</h3>
<p><strong>Usage:</strong> Retrieves the value of a defined variable.</p>
`,
        inputs: [],
        outputs: [
            { name: 'Value', type: PinTypes.STRING }
        ],
        properties: [
            { name: 'name', label: 'Variable Name', type: 'text', default: 'myVar' }
        ]
    },

    [NodeTypes.VARIABLE_SET]: {
        title: 'Set Variable',
        category: 'logic',
        description: 'Store a value',
        tooltip: `
<h3>Set Variable</h3>
<p><strong>Usage:</strong> Sets a variable's value.</p>
<p><strong>Note:</strong> Variables are compile-time data helpers.</p>
`,
        inputs: [
            { name: 'Exec', type: PinTypes.EXEC },
            { name: 'Value', type: PinTypes.STRING }
        ],
        outputs: [
            { name: 'Exec', type: PinTypes.EXEC }
        ],
        properties: [
            { name: 'name', label: 'Variable Name', type: 'text', default: 'myVar' }
        ]
    }
};

// Get palette items organized by category
function getPaletteItems() {
    const categories = {};

    for (const [nodeType, definition] of Object.entries(NodeDefinitions)) {
        const cat = definition.category;
        if (!categories[cat]) {
            categories[cat] = {
                ...NodeCategories[cat],
                nodes: []
            };
        }
        categories[cat].nodes.push({
            type: nodeType,
            title: definition.title,
            description: definition.description
        });
    }

    return categories;
}
