window.registerDatapackLanguage = function (monaco) {

    const commands_types = ["In chat", "Command blocks", "Manual", "Setup"];

    const command_list = Object.keys(commands_structure.children);
    const command = /^[a-z]+/;
    const execute_run = /run /;
    const selector = /@[parens]/;
    const selectors_keys = /([a-zA-Z_][\w-]*)(?=\s*=)/;
    const snbt_keys = /([a-zA-Z_][\w-]*)(?=\s*:)/;
    const numbers = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?[bslfdBSLFD]?|\~|\^/;
    const range = /\.\./;
    const uuid = /[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+-[0-9a-f]+/;
    const boolean = /\btrue\b|\bfalse\b/;
    const escaped_text = /(\"([^\"\\]*(?:\\.[^\"\\]*)*)\")|'([^'\\]*(?:\\.[^'\\]*)*)'/;
    const signs = /[\=\,\.\+\-\:;\\]/;
    const fakeplayer = /#[\w-]+/;
    const all_commands_types = /^# ([Ss]etup|[Cc]ommand blocks?|[Ii]n chat|[Cc]ontroller|[Mm]anual).*$/
    const target_selectors = ["@p", "@a", "@r", "@e", "@n", "@s"];
    const target_args = ['x=', 'y=', 'z=', 'distance=', 'dx=', 'dy=', 'dz=', 'x_rotation=', 'y_rotation=', 'scores=', 'name=', 'type=', 'nbt=', 'level=', 'advancements=', 'limit=', 'sort=', 'tag=', 'gamemode=', 'team=', 'predicate='];

    update_parers = [
        'minecraft:function',
        'minecraft:loot_modifier',
        'minecraft:loot_predicate',
        'minecraft:loot_table'
    ];
    parsers_suggest = {
        "minecraft:angle": ['~ ~'],
        "minecraft:block_pos": ['~ ~ ~', '^ ^ ^', '0 64 0'],
        "minecraft:block_predicate": [],
        "minecraft:block_state": registries.block,
        "brigadier:bool": [],
        "brigadier:double": [],
        "brigadier:float": [],
        "brigadier:integer": [],
        "brigadier:long": [],
        "brigadier:string": [],
        "minecraft:color": ['aqua', 'black', 'blue', 'dark_aqua', 'dark_blue', 'dark_gray', 'dark_green', 'dark_purple', 'dark_red', 'gold', 'gray', 'green', 'light_purple', 'red', 'reset', 'white', 'yellow'],
        "minecraft:column_pos": ['~ ~'],
        "minecraft:component": [],
        "minecraft:dimension": ['minecraft:overworld', 'minecraft:the_nether', 'minecraft:the_end'],
        "minecraft:entity": ['@s', '@a', '@e', '@n', '@p', '@r'],
        "minecraft:entity_anchor": ['eyes', 'feet'],
        "minecraft:function": ['function'],
        "minecraft:game_profile": ['@s', '@a', '@p', '@r'],
        "minecraft:gamemode": ['survival', 'creative', 'adventure', 'spectator'],
        "minecraft:heightmap": ['motion_blocking', 'motion_blocking_no_leaves', 'ocean_floor', 'world_surface'],
        "minecraft:hex_color": ['#FF0000', '#00FF00', '#0000FF'],
        "minecraft:int_range": ['-2147483648..2147483647'],
        "minecraft:item_predicate": [],
        "minecraft:item_slot": [],
        "minecraft:item_slots": ['weapon'],
        "minecraft:item_stack": registries.item,
        "minecraft:loot_modifier": ['item_modifier'],
        "minecraft:loot_predicate": ['predicate'],
        "minecraft:loot_table": ['loot_table'],
        "minecraft:message": [],
        "minecraft:nbt_compound_tag": [],
        "minecraft:nbt_path": [],
        "minecraft:nbt_tag": [],
        "minecraft:objective": [],
        "minecraft:objective_criteria": [],
        "minecraft:operation": ['%=', '*=', '+=', '-=', '/=', '<', '=', '>', '><'],
        "minecraft:particle": registries.particle_type,
        "minecraft:resource": [],
        "minecraft:resource_key": [],
        "minecraft:resource_location": ['example:resource_location'],
        "minecraft:resource_or_tag": ['minecraft:plains'],
        "minecraft:resource_or_tag_key": ['#minecraft:village'],
        "minecraft:resource_selector": ['minecraft:always_pass'],
        "minecraft:rotation": ['~ ~'],
        "minecraft:score_holder": ['#this', '@s', '@a', '@e', '@n', '@p', '@r'],
        "minecraft:scoreboard_slot": ['sidebar', 'list', 'belowName'],
        "minecraft:style": ['{"color":"red"}'],
        "minecraft:swizzle": ['x', 'y', 'z', 'xy', 'yz', 'xz', 'xyz'],
        "minecraft:team": ['red', 'green', 'blue'],
        "minecraft:template_mirror": ['front_back', 'left_right', 'none'],
        "minecraft:template_rotation": ['180', 'clockwise_90', 'counterclockwise_90', 'none'],
        "minecraft:time": [],
        "minecraft:vec2": ['~ ~', '^ ^'],
        "minecraft:vec3": ['~ ~ ~', '^ ^ ^', '0 64 0']
    };

    // Thanks, u/Ericristian_bros.
    parsers_suggest["minecraft:objective_criteria"] = (() => {
        const objectiveBase = [
            'dummy', 'trigger', 'deathCount', 'playerKillCount', 'totalKillCount', 'health', 'xp', 'level', 'food', 'air', 'armor'
        ];
        const teamColors = parsers_suggest["minecraft:color"] || [];
        const items = registries.item || [];
        const entities = registries.entity_type || [];
        const custom_stat = registries.custom_stat || [];
        const teamkill = teamColors.map(color => `teamkill.${color}`);
        const killedByTeam = teamColors.map(color => `killedByTeam.${color}`);
        const mined = items.map(items => `mined:${items}`);
        const broken = items.map(items => `broken:${items}`);
        const crafted = items.map(items => `crafted:${items}`);
        const used = items.map(items => `used:${items}`);
        const picked_up = items.map(items => `picked_up:${items}`);
        const dropped = items.map(items => `dropped:${items}`);
        const killed = entities.map(entities => `killed:${entities}`);
        const killedBy = entities.map(entities => `killed_by:${entities}`);

        const custom = custom_stat.map(custom_stat => `custom:${custom_stat}`);

        delete items
        delete entities
        delete teamColors
        delete custom_stat

        return [...objectiveBase, ...teamkill, ...killedByTeam, ...mined, ...broken, ...crafted, ...used, ...picked_up, ...dropped, ...killed, ...custom, ...killedBy];
    })();

    monaco.languages.register({ id: "gallang" });
    monaco.languages.setMonarchTokensProvider("gallang", {
        tokenizer: {
            root: [
                [all_commands_types, "commands-type"],
                [/^#:.*$/, "temp-comment"],
                [/^#.*$/, "comment"],
                ["", "", "general"]
            ],

            execute_run: [
                [/\s+/, ""],
                [/[a-z]+/, "command", "@pop"],
            ],

            json: [
                [/\[|{/, "json1", "json2"],
                [/\]|}/, "json3", "@pop"],
                ["", "", "general"],
            ],

            json2: [
                [/\[|{/, "json2", "json3"],
                [/\]|}/, "json1", "@pop"],
                ["", "", "general"],
            ],

            json3: [
                [/\[|{/, "json3", "json"],
                [/\]|}/, "json2", "@pop"],
                ["", "", "general"],
            ],

            sign: [
                [/\|/, "sign-delimiter"],
                [/[\w+\s+]/, "sign-text"],
                ['', "", "@pop"],
            ],

            general: [
                [all_commands_types, "commands-type"],
                [/^\[.*_?sign\](\s+)?/, "sign", "sign"],
                [/^\[.*_?wool\](\s+)?/, "wool", "@pop"],
                [/^\[.*_?button\](\s+)?/, "button", "@pop"],
                [/^\[[RCI][UC][AN]\](\s+)?/, "block-settings", "@pop"],
                [/^#:.*$/, "temp-comment"],
                [/^#.*$/, "comment"],
                [/"([^"\\]|\\.)*"\s*:/, 'key', "@pop"],
                [/\[|{/, "json1", "json2"],
                [command, "command", "@pop"],
                [execute_run, "execute-run", "execute_run"],
                [selector, "selector", "@pop"],
                [selectors_keys, "selectors-keys", "@pop"],
                [snbt_keys, "snbt-keys", "@pop"],
                [uuid, "numbers", "@pop"],
                [numbers, "numbers", "@pop"],
                [range, "range", "@pop"],
                [signs, "signs", "@pop"],
                [boolean, "boolean", "@pop"],
                [fakeplayer, "fakeplayer", "@pop"],
                [escaped_text, "escaped-text", "@pop"],
                [/./, "", "@pop"],
            ],
        }

    });

    monaco.editor.defineTheme("gallang-dark", {
        base: "vs-dark",
        colors: {
            "editor.background": "#444444"
        },
        inherit: true,
        rules: [
            { token: "json1", foreground: 'ffd700' },
            { token: "json2", foreground: 'da70d6' },
            { token: "json3", foreground: '179fff' },

            { token: 'temp-comment', foreground: 'C8F3A9' },
            { token: 'comment', foreground: '98c379' },
            { token: 'file-type', foreground: 'FFD700' },
            { token: 'key', foreground: 'e06c75' },
            { token: 'string', foreground: '98c379' },
            { token: 'boolean', foreground: '56b6c2' },
            { token: 'null', foreground: '569CD6' },
            { token: 'delimiter', foreground: 'D4D4D4' },
            { token: 'delimiter.bracket', foreground: 'D4D4D4' },
            { token: 'delimiter.array', foreground: 'D4D4D4' },

            { token: "command", foreground: "c678dd" },
            { token: "execute-run", foreground: "e5c07b" },
            { token: "resource-name", foreground: "61afef" },
            { token: "selector", foreground: "e5c07b" },
            { token: "selectors-keys", foreground: "e06c75" },
            { token: "fakeplayer", foreground: "e06c75" },
            { token: "snbt-keys", foreground: "e06c75" },
            { token: "numbers", foreground: "d19a66" },
            { token: "range", foreground: "e06c75" },
            { token: "signs", foreground: "c678dd" },
            { token: "escaped-text", foreground: "98c379" },

            { token: "commands-type", foreground: "FFD700" },
            { token: "sign", foreground: "b8945f" },
            { token: "sign-delimiter", foreground: "e74133" },
            { token: "sign-text", foreground: "4caf50" },
            { token: "wool", foreground: "f1c44c" },
            { token: "button", foreground: "989895" },
            { token: "block-settings", foreground: "FFD700" },

            { token: "", foreground: "FFFFFF" }
        ]
    });

    monaco.languages.registerFoldingRangeProvider('gallang', {
        provideFoldingRanges: function (model, context, token) {
            const ranges = [];
            const lines = model.getLineCount();

            for (let i = 1; i <= lines; i++) {
                const lineContent = model.getLineContent(i);
                const regexp = new RegExp(`# ${commands_types.join("|")}?`);

                if (regexp.test(lineContent)) {
                    const start = i;
                    let end = i + 1;

                    while (
                        end <= lines &&
                        !regexp.test(model.getLineContent(end))
                    ) {
                        end++;
                    }

                    if (end > start + 1) {
                        ranges.push({
                            start,
                            end: end - 1,
                            kind: monaco.languages.FoldingRangeKind.Region
                        });
                    }

                    i = end - 1;
                }
            }

            return ranges;
        }
    });

    monaco.languages.setLanguageConfiguration('gallang', {
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: "'", close: "'", notIn: ['string', 'comment'] },
        ],
        surroundingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"' },
            { open: "'", close: "'" },
        ]
    });

    monaco.languages.registerCompletionItemProvider('gallang', {
        triggerCharacters: [' '],
        provideCompletionItems(model, position) {
            const this_line = model.getLineContent(position.lineNumber);
            const tokens = tokenizeCommand(this_line.slice(0, position.column));
            const node = traverseCommandTree(commands_structure, tokens);
            const node_suggests = getSuggestionsAtNode(node);

            let suggestions = [];
            if (this_line.startsWith("#")) {
                if (position.column === 3) {
                    suggestions = commands_types.map((file_type, index) => ({
                        label: file_type,
                        kind: monaco.languages.CompletionItemKind.Value,
                        insertText: file_type,
                        sortText: String(index).padStart(5, '0')
                    }));
                }
                return { suggestions };
            } else if (node_suggests) {
                suggestions = node_suggests.map((suggest, index) => ({
                    label: suggest,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: suggest,
                    sortText: String(index).padStart(5, '0')
                }));
            } else if ((this_line === "" || position.column === 1 || !this_line.includes(" ")) && !this_line.startsWith("#")) {

                suggestions = command_list.map((command, index) => ({
                    label: command,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: command,
                    sortText: String(index).padStart(5, '0')
                }));
            } else if (/@([parens])\[\s*(tag=[^,\]]+,\s*)?[^\]]*$/.test(
                model.getLineContent(position.lineNumber).slice(0, position.column - 1)
            )) {
                suggestions = target_args.map((target_arg, index) => ({
                    label: target_arg,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: target_arg,
                    sortText: String(index).padStart(5, '0')
                }));
            }
            return { suggestions };
        }
    });


    function tokenizeCommand(line) {
        const result = [];
        let token = '';
        let lines = line.trim().split(' ').entries();
        let nesting = 0;

        for (let [i, char] of lines) {
            result.push(token || char);
            token = '';
        }

        if (token) result.push(token);
        return result;
    }

    function traverseCommandTree(root, tokens) {
        let new_tokens;
        let current = root;
        tokens.forEach((token, i) => {
            if (current.children?.[token]) {
                current = current.children[token];
            } else {
                const argKey = Object.keys(current.children || {}).find(
                    key => current.children[key].type === 'argument'
                );
                if (argKey) {
                    current = current.children[argKey];
                } else {
                    return null;
                }
            }


            if (token === 'run') {
                current = root;
                return;
            }

            if (current.redirect) {
                const redirectPath = Array.isArray(current.redirect) ? current.redirect : [current.redirect];
                for (const path of redirectPath) {
                    const redirectedNode = resolveRedirectPath(root, path);
                    if (redirectedNode) {
                        current = redirectedNode;
                        break;
                    }
                }
            }

        });

        return current;
    }


    function resolveRedirectPath(root, pathString) {
        const path = pathString.split(' ');
        let node = root;
        for (const key of path) {
            if (!node.children?.[key]) return null;
            node = node.children[key];
        }
        return node;
    }

    function getSuggestionsAtNode(node) {
        suggestions = [];

        if (!node || !node.children) return suggestions;

        for (const [key, child] of Object.entries(node.children)) {
            if (!key) return;

            if (child.type === 'literal') {
                suggestions.push(key);
            } else if (child.type === 'argument' && child.parser) {
                const parser = child.parser;
                let parser_item = parsers_suggest[parser];
                if (update_parers.includes(parser)) {
                    suggestions = [...new Set([...suggestions, ...get_registries(parser_item)])];
                } else if (['minecraft:objective'].includes(parser)) {
                    let objectives = [];
                    const add_objectives = new RegExp(`scoreboard objectives add ([a-zA-Z0-9\\-+._]+)`);
                    editor.getValue().split(/\n|\r|\t/).forEach(line => {
                        if (add_objectives.test(line))
                            objectives.push(line.match(add_objectives)[1]);
                    });
                    suggestions = [...new Set([...suggestions, ...objectives])];
                } else if (['minecraft:resource_key'].includes(parser)) {
                    const file_type = child.properties.registry.split(':')[1];
                    suggestions = [...new Set([...suggestions, ...get_registries(file_type)])];
                } else if (['minecraft:resource_or_tag'].includes(parser)) {
                    const file_type = child.properties.registry.split(':')[1];
                    suggestions = [...new Set([...suggestions, ...get_registries(file_type)])];
                    suggestions = [...new Set([...suggestions, ...get_registries(`tag/${file_type}`)])];
                } else if (parser_item) {
                    suggestions = [...new Set([...suggestions, ...parser_item])];
                } else if (!parser_item)
                    suggestions.push(`<${key}>`);
            }

        }

        return suggestions;
    }

    function get_registries(file_type) {
        const is_file = new RegExp(`^# (${file_type}) ([a-z0-9_.-]+:[a-z0-9_./-]+)$`);
        let new_registres = [];
        editor.getValue().split(/\n|\r|\t/).forEach(line => {
            if (is_file.test(line))
                new_registres.push(line.split(' ')[2]);
        });
        if (registries[file_type])
            new_registres.push(...registries[file_type].map((entry) => `minecraft:${entry}`));
        return new_registres;
    }


}

const all_commands_types = /^# ([Ss]etup|[Cc]ommand blocks?|[Ii]n chat|[Cc]ontroller|[Mm]anual).*$/;
const lables = {
    "RU": '<label title="Repeating Uncoditional."><img src="/assets/repeating_command_block.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "RC": '<label title="Repeating Coditional."><img src="/assets/repeating_command_block_conditional.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "CU": '<label title="Chain Uncoditional."><img src="/assets/chain_command_block.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "CC": '<label title="Chain Coditional."><img src="/assets/chain_command_block_conditional.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "IU": '<label title="Impulse Uncoditional."><img src="/assets/command_block.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "IC": '<label title="Impulse Coditional."><img src="/assets/command_block_conditional.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>',
    "chat": '<label title="Without creating a command block."><img src="/assets/chat.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>'
};

function gallabLineNumbers(lineNumber) {
    const line_text = editor.getModel().getLineContent(lineNumber);
    let new_lineNumber = -1;
    let line_label = lables.CU;


    const sign_line = line_text.match(/\[(.*_?sign)\]/)
    if (sign_line) {
        return `<label title="The function will be run once when the world is loaded."><img src="/assets/${sign_line[1]}.png" width="16" height="16" style="transform: translateY(4px) scale(1.375)"></label>`;
    }

    if (all_commands_types.test(line_text) || !line_text || /^#/.test(line_text)) {
        return '';
    } else {
        let prev_line_offset = 0;
        let prev_line = '';
        while (prev_line_offset < lineNumber - 1) {
            prev_line_offset++;
            prev_line = editor.getModel().getLineContent(lineNumber - prev_line_offset)
            if (all_commands_types.test(prev_line) || !/^(#|\[.*_?sign\])/.test(prev_line))
                break;
        }

        if (prev_line.match(/# ([Ss]etup)|([Mm]anual)/))
            line_label = lables.IU;
        else if (prev_line.match(/# ([Cc]ommand blocks?)|([Cc]ontroller)/))
            line_label = lables.RU;

        const settings = line_text.match(/\[[RCI][UC][AN]\]/);
        if (settings) {
            const short_settings = settings[0].substring(1, 3);
            line_label = lables[short_settings]
        }


        for (new_lineNumber = 0; lineNumber > 0; lineNumber--) {
            const line = editor.getModel().getLineContent(lineNumber);
            if (line && !line.startsWith('#') && !line.match(/\[(.*_?sign)\]/))
                new_lineNumber++;
            if (all_commands_types.test(line)) {
                if (/# [Ii]n chat/.test(line))
                    line_label = lables.chat;
                break;
            } else if (lineNumber == 1)
                line_label = lables.chat;
        }
        return `${new_lineNumber} ${line_label}`;
    }
}
