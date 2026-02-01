/**
 * Blueprint Node Editor Engine
 * Handles rendering, interaction, nodes, and connections
 */

class BlueprintEditor {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.svg = document.getElementById('connectionsSvg');
        this.nodeLayer = document.getElementById('nodeLayer');
        this.paletteContent = document.getElementById('paletteContent');
        this.propertiesContent = document.getElementById('propertiesContent');
        this.commandOutput = document.getElementById('commandOutput');

        this.nodes = [];
        this.connections = [];
        this.selectedNodes = new Set();
        this.draggedNode = null;
        this.activePin = null;

        // Viewport transform
        this.offset = { x: 0, y: 0 };
        this.zoom = 1;

        // Mouse state
        this.isPanning = false;
        this.lastMousePos = { x: 0, y: 0 };

        this.init();
        this.createAssetPickerUI();
    }

    createAssetPickerUI() {
        const picker = document.createElement('div');
        picker.className = 'asset-picker-modal';
        picker.style.display = 'none';
        picker.innerHTML = `
            <div class="asset-picker-content">
                <div class="asset-picker-header">
                    <span class="asset-picker-title">Select Asset</span>
                    <button class="asset-picker-close">&times;</button>
                </div>
                <input type="text" class="asset-picker-search" placeholder="Search assets...">
                <div class="asset-picker-grid"></div>
            </div>
        `;
        document.body.appendChild(picker);

        this.assetPicker = {
            el: picker,
            grid: picker.querySelector('.asset-picker-grid'),
            search: picker.querySelector('.asset-picker-search'),
            close: picker.querySelector('.asset-picker-close'),
            callback: null
        };

        this.assetPicker.close.addEventListener('click', () => this.closeAssetPicker());
        this.assetPicker.search.addEventListener('input', (e) => this.renderAssetGrid(e.target.value));
        picker.addEventListener('click', (e) => {
            if (e.target === picker) this.closeAssetPicker();
        });
    }

    openAssetPicker(currentValue, callback, type = 'item') {
        this.assetPicker.callback = callback;
        this.assetPicker.type = type;
        this.assetPicker.el.style.display = 'flex';
        this.assetPicker.search.value = '';
        this.assetPicker.search.focus();
        this.renderAssetGrid('');
    }

    closeAssetPicker() {
        this.assetPicker.el.style.display = 'none';
        this.assetPicker.callback = null;
    }

    renderAssetGrid(filter) {
        this.assetPicker.grid.innerHTML = '';
        const filterText = filter.toLowerCase();

        // MC_ASSETS is defined in asset-data.js
        if (typeof MC_ASSETS === 'undefined') return;

        let source = MC_ASSETS;
        if (this.assetPicker.type === 'entity' && typeof MC_ENTITIES !== 'undefined') source = MC_ENTITIES;
        if (this.assetPicker.type === 'attribute' && typeof MC_ATTRIBUTES !== 'undefined') source = MC_ATTRIBUTES;

        source.forEach(assetId => {
            if (assetId.includes(filterText)) {
                const item = document.createElement('div');
                item.className = 'asset-item';
                item.title = assetId;

                // Use different icon path or fallback for entities if needed
                // For now assuming we might not have entity icons, but standard path is okay-ish or fallback
                const iconPath = this.assetPicker.type === 'entity'
                    ? `/assets/minecraft-id/minecraft_${assetId}_spawn_egg.png` // Try spawn egg for entity icon? Or assume same path
                    : `/assets/minecraft-id/minecraft_${assetId}.png`;

                // Actually, let's keep it simple: if it's an entity, we can try using the spawn egg icon if available,
                // or just the generic path. 
                // Many entity IDs match spawn egg names (e.g. 'pig' -> 'pig_spawn_egg' exists in ASSETS but 'pig' doesn't have icon)
                // Let's try to be smart: if entity, append _spawn_egg for the ICON URL ONLY if it helps.
                // But simpler: just use the ID. If 404, the fallback logic handles it.

                let displayIcon = `/assets/minecraft-id/minecraft_${assetId}.png`;
                if (this.assetPicker.type === 'entity') {
                    // Use Mob Head icons
                    displayIcon = `/assets/mob-heads/${assetId}.png`;
                }
                if (this.assetPicker.type === 'attribute') {
                    // Generic icon for attributes
                    displayIcon = `/assets/minecraft-id/minecraft_attribute.png`; // You might not have this, but fallback handles it
                }

                item.innerHTML = `
                    <div class="asset-icon" style="background-image: url('${displayIcon}')"></div>
                    <span class="asset-name">${assetId.replace(/_/g, ' ')}</span>
                `;
                item.addEventListener('click', () => {
                    if (this.assetPicker.callback) {
                        this.assetPicker.callback(`minecraft:${assetId}`);
                    }
                    this.closeAssetPicker();
                });
                this.assetPicker.grid.appendChild(item);
            }
        });
    }

    init() {
        this.renderPalette();
        this.setupEventListeners();
        this.updateTransform();

        // Add an initial node
        this.addNode(NodeTypes.COMMAND_BLOCK, 100, 100);
    }

    renderPalette() {
        const categories = getPaletteItems();
        this.paletteContent.innerHTML = '';

        for (const [catKey, cat] of Object.entries(categories)) {
            const catDiv = document.createElement('div');
            catDiv.className = 'palette-category';

            const title = document.createElement('div');
            title.className = 'category-title';
            title.textContent = cat.label;
            catDiv.appendChild(title);

            const nodesList = document.createElement('div');
            nodesList.className = 'category-nodes';

            cat.nodes.forEach(node => {
                const nodeDiv = document.createElement('div');
                nodeDiv.className = `palette-node ${catKey}`;
                nodeDiv.innerHTML = `<div class="node-icon"></div><span>${node.title}</span>`;
                // nodeDiv.title = node.description; // Remote default tooltip
                nodeDiv.draggable = true;

                // Add Custom Tooltip Events
                if (node.tooltip) {
                    nodeDiv.addEventListener('mouseenter', (e) => this.showTooltip(e, node.tooltip));
                    nodeDiv.addEventListener('mouseleave', () => this.hideTooltip());
                    nodeDiv.addEventListener('mousemove', (e) => this.moveTooltip(e));
                }

                nodeDiv.addEventListener('dragstart', (e) => {
                    e.dataTransfer.setData('nodeType', node.type);
                });

                nodesList.appendChild(nodeDiv);
            });

            catDiv.appendChild(nodesList);
            this.paletteContent.appendChild(catDiv);
        }
    }

    // Tooltip Implementation
    showTooltip(e, content) {
        if (this.tooltipEl) this.tooltipEl.remove();

        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'custom-tooltip';
        this.tooltipEl.innerHTML = content;
        document.body.appendChild(this.tooltipEl);

        this.moveTooltip(e);
    }

    hideTooltip() {
        if (this.tooltipEl) {
            this.tooltipEl.remove();
            this.tooltipEl = null;
        }
    }

    moveTooltip(e) {
        if (!this.tooltipEl) return;

        const offset = 15;
        let left = e.clientX + offset;
        let top = e.clientY + offset;

        // Boundary checks
        const rect = this.tooltipEl.getBoundingClientRect();
        if (left + rect.width > window.innerWidth) {
            left = e.clientX - rect.width - offset;
        }
        if (top + rect.height > window.innerHeight) {
            top = e.clientY - rect.height - offset;
        }

        this.tooltipEl.style.left = `${left}px`;
        this.tooltipEl.style.top = `${top}px`;
    }

    setupEventListeners() {
        // Canvas Interaction
        this.container.addEventListener('mousedown', (e) => {
            if (e.target === this.container || e.target.id === 'canvasGrid') {
                if (e.button === 0) { // Left click
                    this.clearSelection();
                } else if (e.button === 1 || e.button === 2) { // Middle or Right click
                    this.isPanning = true;
                    this.container.classList.add('grabbing');
                }
            }
            this.lastMousePos = { x: e.clientX, y: e.clientY };
        });

        window.addEventListener('mousemove', (e) => {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;
            this.lastMousePos = { x: e.clientX, y: e.clientY };

            if (this.isPanning) {
                this.offset.x += dx;
                this.offset.y += dy;
                this.updateTransform();
            } else if (this.draggedNode) {
                this.draggedNode.x += dx / this.zoom;
                this.draggedNode.y += dy / this.zoom;
                this.draggedNode.updateElement();
                this.renderConnections();
            } else if (this.activePin) {
                this.updateTempConnection(e);
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (this.activePin) {
                const target = e.target;
                const pinConnector = target.closest('.pin-connector');
                if (pinConnector) {
                    const nodeEl = target.closest('.node');
                    const node = this.nodes.find(n => n.element === nodeEl);
                    if (node) {
                        const pinName = pinConnector.getAttribute('data-pin-name');
                        const isInput = pinConnector.parentElement.classList.contains('input-pin');
                        const def = NodeDefinitions[node.type];
                        const pinData = isInput
                            ? def.inputs.find(p => p.name === pinName)
                            : def.outputs.find(p => p.name === pinName);

                        if (pinData) {
                            this.tryConnect(node, pinData, isInput ? 'input' : 'output');
                        }
                    }
                }
                this.removeTempConnection();
                this.activePin = null;
            }
            this.isPanning = false;
            this.container.classList.remove('grabbing');
            this.draggedNode = null;
        });

        this.container.addEventListener('wheel', (e) => {
            e.preventDefault();
            const delta = -Math.sign(e.deltaY) * 0.1;
            const newZoom = Math.min(Math.max(this.zoom + delta, 0.2), 2);

            // Zoom towards mouse
            const rect = this.container.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const beforeX = (mouseX - this.offset.x) / this.zoom;
            const beforeY = (mouseY - this.offset.y) / this.zoom;

            this.zoom = newZoom;

            this.offset.x = mouseX - beforeX * this.zoom;
            this.offset.y = mouseY - beforeY * this.zoom;

            this.updateTransform();
        }, { passive: false });

        // Drop handling
        this.container.addEventListener('dragover', (e) => e.preventDefault());
        this.container.addEventListener('drop', (e) => {
            e.preventDefault();
            const type = e.dataTransfer.getData('nodeType');
            if (type) {
                const rect = this.container.getBoundingClientRect();
                const x = (e.clientX - rect.left - this.offset.x) / this.zoom;
                const y = (e.clientY - rect.top - this.offset.y) / this.zoom;
                this.addNode(type, x, y);
            }
        });

        // Keyboard events
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                    this.removeSelectedNodes();
                }
            }
        });

        // Prevent context menu to allow custom interaction
        this.container.addEventListener('contextmenu', e => e.preventDefault());
    }

    addNode(type, x, y) {
        const definition = NodeDefinitions[type];
        if (!definition) return;

        const node = new NodeInstance(this, type, x, y);
        this.nodes.push(node);
        this.nodeLayer.appendChild(node.element);
        this.renderConnections();
        this.compile();
        return node;
    }

    removeSelectedNodes() {
        this.selectedNodes.forEach(node => {
            // Remove connections
            this.connections = this.connections.filter(conn => {
                return conn.fromNode !== node && conn.toNode !== node;
            });

            // Remove element
            node.element.remove();

            // Remove from list
            const index = this.nodes.indexOf(node);
            if (index > -1) this.nodes.splice(index, 1);
        });
        this.selectedNodes.clear();
        this.showProperties(null);
        this.renderConnections();
        this.compile();
    }

    updateTransform() {
        this.nodeLayer.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.zoom})`;
        this.svg.style.transform = `translate(${this.offset.x}px, ${this.offset.y}px) scale(${this.zoom})`;
        document.getElementById('canvasGrid').style.backgroundPosition = `${this.offset.x}px ${this.offset.y}px`;
    }

    renderConnections() {
        // Clear SVG (except defs and tempPath)
        const paths = this.svg.querySelectorAll('.connection-line:not(#tempPath)');
        paths.forEach(p => p.remove());

        this.connections.forEach(conn => {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            const start = conn.fromNode.getPinPosition(conn.fromPin, 'output');
            const end = conn.toNode.getPinPosition(conn.toPin, 'input');

            const dx = Math.abs(end.x - start.x) * 0.5;
            const d = `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${end.x - dx} ${end.y}, ${end.x} ${end.y}`;

            path.setAttribute('d', d);
            path.classList.add('connection-line', conn.type);

            path.addEventListener('click', () => {
                const idx = this.connections.indexOf(conn);
                if (idx > -1) {
                    this.connections.splice(idx, 1);
                    this.renderConnections();
                    this.compile();
                }
            });

            this.svg.appendChild(path);
        });
    }

    updateTempConnection(e) {
        let tempPath = document.getElementById('tempPath');
        if (!tempPath) {
            tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tempPath.id = 'tempPath';
            this.svg.appendChild(tempPath);
        }

        const rect = this.container.getBoundingClientRect();
        const start = this.activePin.node.getPinPosition(this.activePin.pin, this.activePin.type);
        const mouseX = (e.clientX - rect.left - this.offset.x) / this.zoom;
        const mouseY = (e.clientY - rect.top - this.offset.y) / this.zoom;

        const dx = Math.abs(mouseX - start.x) * 0.5;
        const d = this.activePin.type === 'output'
            ? `M ${start.x} ${start.y} C ${start.x + dx} ${start.y}, ${mouseX - dx} ${mouseY}, ${mouseX} ${mouseY}`
            : `M ${mouseX} ${mouseY} C ${mouseX + dx} ${mouseY}, ${start.x - dx} ${start.y}, ${start.x} ${start.y}`;

        tempPath.setAttribute('d', d);
        tempPath.classList.add('connection-line', this.activePin.pin.type);
    }

    removeTempConnection() {
        const tempPath = document.getElementById('tempPath');
        if (tempPath) tempPath.remove();
    }

    tryConnect(targetNode, targetPin, targetType) {
        if (!this.activePin) return;

        // Validation
        if (this.activePin.node === targetNode) return; // Same node
        if (this.activePin.type === targetType) return; // Same side
        if (this.activePin.pin.type !== targetPin.type) return; // Type mismatch

        const sourceNode = this.activePin.type === 'output' ? this.activePin.node : targetNode;
        const sourcePin = this.activePin.type === 'output' ? this.activePin.pin : targetPin;
        const destNode = this.activePin.type === 'output' ? targetNode : this.activePin.node;
        const destPin = this.activePin.type === 'output' ? targetPin : this.activePin.pin;

        // Clear existing connections for input pins (many-to-one)
        this.connections = this.connections.filter(conn => {
            return !(conn.toNode === destNode && conn.toPin === destPin);
        });

        this.connections.push({
            fromNode: sourceNode,
            fromPin: sourcePin,
            toNode: destNode,
            toPin: destPin,
            type: sourcePin.type
        });

        this.activePin = null;
        this.renderConnections();
        this.compile();
    }

    clearSelection() {
        this.selectedNodes.forEach(n => n.element.classList.remove('selected'));
        this.selectedNodes.clear();
        this.showProperties(null);
    }

    selectNode(node, append = false) {
        if (!append) this.clearSelection();
        this.selectedNodes.add(node);
        node.element.classList.add('selected');
        this.showProperties(node);
    }

    showProperties(node) {
        if (!node) {
            this.propertiesContent.innerHTML = '<div class="empty-state">Select a node to edit properties</div>';
            return;
        }

        const definition = NodeDefinitions[node.type];
        this.propertiesContent.innerHTML = '';

        const header = document.createElement('div');
        header.className = 'properties-header';
        header.innerHTML = `<i class="fas fa-cube"></i> ${definition.title}`;
        this.propertiesContent.appendChild(header);

        if (definition.properties) {
            definition.properties.forEach(prop => {
                const group = document.createElement('div');
                group.className = 'property-group';

                const label = document.createElement('div');
                label.className = 'property-label';
                label.textContent = prop.label;
                group.appendChild(label);

                let input;

                if (prop.type === 'select') {
                    input = document.createElement('select');
                    input.className = 'property-input';
                    prop.options.forEach(opt => {
                        const o = document.createElement('option');
                        o.value = opt;
                        o.textContent = opt;
                        input.appendChild(o);
                    });
                    input.value = node.data[prop.name] !== undefined ? node.data[prop.name] : (prop.default || '');
                    input.addEventListener('change', () => {
                        node.data[prop.name] = input.value;
                        this.compile();
                    });
                } else if (prop.type === 'textarea') {
                    input = document.createElement('textarea');
                    input.className = 'property-input';
                    input.rows = 4;
                    input.value = node.data[prop.name] !== undefined ? node.data[prop.name] : (prop.default || '');
                    input.addEventListener('input', () => {
                        node.data[prop.name] = input.value;
                        this.compile();
                    });
                } else if (['minecraft_item', 'minecraft_block', 'minecraft_entity', 'minecraft_attribute'].includes(prop.type)) {
                    input = document.createElement('div');
                    input.className = 'asset-selector';
                    const currentValue = node.data[prop.name] !== undefined ? node.data[prop.name] : (prop.default || '');
                    const assetId = currentValue.replace('minecraft:', '');

                    const updateDisplay = (val) => {
                        const id = val.replace('minecraft:', '');
                        input.innerHTML = `
                            <div class="asset-preview">
                                <img src="/assets/minecraft-id/minecraft_${id}.png" onerror="this.src='/assets/minecraft-id/minecraft_barrier.png'">
                                <span>${id}</span>
                            </div>
                            <button class="asset-change-btn">Change</button>
                        `;
                        input.querySelector('.asset-change-btn').addEventListener('click', () => {
                            let pickType = 'item';
                            if (prop.type === 'minecraft_entity') pickType = 'entity';
                            if (prop.type === 'minecraft_attribute') pickType = 'attribute';

                            this.openAssetPicker(val, (newVal) => {
                                node.data[prop.name] = newVal;
                                updateDisplay(newVal);
                                this.compile();
                            }, pickType);
                        });
                    };

                    updateDisplay(currentValue);
                } else {
                    input = document.createElement('input');
                    input.className = 'property-input';
                    input.type = prop.type === 'checkbox' ? 'checkbox' : prop.type;
                    if (prop.type === 'checkbox') {
                        input.checked = node.data[prop.name] !== undefined ? node.data[prop.name] : (prop.default || false);
                        input.addEventListener('change', () => {
                            node.data[prop.name] = input.checked;
                            this.compile();
                        });
                    } else {
                        input.value = node.data[prop.name] !== undefined ? node.data[prop.name] : (prop.default || '');
                        input.addEventListener('input', () => {
                            node.data[prop.name] = input.value;
                            this.compile();
                        });
                    }
                }

                if (input) {
                    group.appendChild(input);
                    this.propertiesContent.appendChild(group);
                }
            });
        }
    }

    compile() {
        if (window.blueprintCompiler) {
            const startTime = performance.now();
            const commands = window.blueprintCompiler.compile(this.nodes, this.connections);
            const endTime = performance.now();

            this.commandOutput.value = commands;

            // Log compilation info
            if (typeof logCompiler === 'function') {
                const nodeCount = this.nodes.length;
                const connCount = this.connections.length;
                const cmdCount = commands.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
                const time = (endTime - startTime).toFixed(2);

                logCompiler(`Compiled ${nodeCount} nodes, ${connCount} connections → ${cmdCount} commands (${time}ms)`, 'info');
            }

            // Auto-sync to CBA
            if (typeof syncToCBA === 'function' && commands.trim()) {
                syncToCBA(commands);
            }
        }
    }

    clearCanvas() {
        if (confirm('Clear all nodes?')) {
            this.nodes.forEach(n => n.element.remove());
            this.nodes = [];
            this.connections = [];
            this.selectedNodes.clear();
            this.renderConnections();
            this.compile();
        }
    }

    exportCommands() {
        const text = this.commandOutput.value;
        if (window.opener && !window.opener.closed) {
            window.opener.editor.setValue(text);
            alert('Commands exported back to main CBA window!');
        } else {
            // Local storage fallback
            localStorage.setItem('command_blocks_myInput', text);
            alert('Commands saved to memory. Open the main page to see them.');
        }
    }

    saveGraph() {
        const saveData = {
            version: 1,
            viewport: { x: this.offset.x, y: this.offset.y, zoom: this.zoom },
            nodes: this.nodes.map(node => ({
                id: this.nodes.indexOf(node),
                type: node.type,
                x: node.x,
                y: node.y,
                data: { ...node.data }
            })),
            connections: this.connections.map(conn => ({
                fromNodeId: this.nodes.indexOf(conn.fromNode),
                fromPinName: conn.fromPin.name,
                toNodeId: this.nodes.indexOf(conn.toNode),
                toPinName: conn.toPin.name,
                type: conn.type
            }))
        };

        const json = JSON.stringify(saveData, null, 2);
        localStorage.setItem('blueprint_graph', json);

        // Also offer download
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'blueprint_graph.json';
        a.click();
        URL.revokeObjectURL(url);

        if (typeof showNotification === 'function') {
            showNotification('Graph saved successfully!', 'success');
        } else {
            alert('Graph saved to localStorage and downloaded as file.');
        }
    }

    loadGraph() {
        // First try to load from file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        this.restoreGraph(JSON.parse(ev.target.result));
                    } catch (err) {
                        alert('Failed to load graph: ' + err.message);
                    }
                };
                reader.readAsText(file);
            }
        };
        input.click();

        // If user cancels file dialog, offer localStorage option
        setTimeout(() => {
            if (!input.files || input.files.length === 0) {
                const saved = localStorage.getItem('blueprint_graph');
                if (saved && confirm('Load from localStorage instead?')) {
                    try {
                        this.restoreGraph(JSON.parse(saved));
                    } catch (err) {
                        alert('Failed to load graph: ' + err.message);
                    }
                }
            }
        }, 1000);
    }

    restoreGraph(saveData) {
        // Clear current
        this.nodes.forEach(n => n.element.remove());
        this.nodes = [];
        this.connections = [];
        this.selectedNodes.clear();

        // Restore viewport
        if (saveData.viewport) {
            this.offset = { x: saveData.viewport.x, y: saveData.viewport.y };
            this.zoom = saveData.viewport.zoom || 1;
            this.updateTransform();
        }

        // Restore nodes
        const nodeMap = new Map();
        saveData.nodes.forEach(nodeData => {
            const node = this.addNode(nodeData.type, nodeData.x, nodeData.y);
            if (node) {
                node.data = { ...nodeData.data };
                nodeMap.set(nodeData.id, node);
            }
        });

        // Restore connections
        saveData.connections.forEach(connData => {
            const fromNode = nodeMap.get(connData.fromNodeId);
            const toNode = nodeMap.get(connData.toNodeId);

            if (fromNode && toNode) {
                const fromDef = NodeDefinitions[fromNode.type];
                const toDef = NodeDefinitions[toNode.type];
                const fromPin = fromDef.outputs.find(p => p.name === connData.fromPinName);
                const toPin = toDef.inputs.find(p => p.name === connData.toPinName);

                if (fromPin && toPin) {
                    this.connections.push({
                        fromNode,
                        fromPin,
                        toNode,
                        toPin,
                        type: connData.type
                    });
                }
            }
        });

        this.renderConnections();
        this.compile();

        if (typeof showNotification === 'function') {
            showNotification('Graph loaded successfully!', 'success');
        }
    }
}

class NodeInstance {
    constructor(editor, type, x, y) {
        this.editor = editor;
        this.type = type;
        this.x = x;
        this.y = y;
        this.data = {};

        const def = NodeDefinitions[type];
        // Init default data
        if (def.properties) {
            def.properties.forEach(p => {
                this.data[p.name] = p.default;
            });
        }

        this.createFallbackData();
        this.createElement();
    }

    createFallbackData() {
        // Ensure inputs have default values if not connected
        const def = NodeDefinitions[this.type];
        if (def.inputs) {
            def.inputs.forEach(input => {
                if (input.type !== PinTypes.EXEC) {
                    this.data[`_input_${input.name}`] = '';
                }
            });
        }
    }

    createElement() {
        const def = NodeDefinitions[this.type];
        const el = document.createElement('div');
        el.className = `node ${def.category}`;
        el.style.left = `${this.x}px`;
        el.style.top = `${this.y}px`;

        if (def.tooltip) {
            el.addEventListener('mouseenter', (e) => this.editor.showTooltip(e, def.tooltip));
            el.addEventListener('mouseleave', () => this.editor.hideTooltip());
            el.addEventListener('mousemove', (e) => this.editor.moveTooltip(e));
        }

        const header = document.createElement('div');
        header.className = 'node-header';
        header.innerHTML = `<div class="node-type-icon"></div><span>${def.title}</span>`;
        el.appendChild(header);

        const content = document.createElement('div');
        content.className = 'node-content';

        const rows = document.createElement('div');
        rows.className = 'node-rows';

        // Combine inputs and outputs into rows
        const maxRows = Math.max(def.inputs ? def.inputs.length : 0, def.outputs ? def.outputs.length : 0);

        for (let i = 0; i < maxRows; i++) {
            const row = document.createElement('div');
            row.className = 'node-row';

            // Input Pin
            if (def.inputs && def.inputs[i]) {
                const input = def.inputs[i];
                const pin = document.createElement('div');
                pin.className = 'pin input-pin';
                pin.innerHTML = `<div class="pin-connector ${input.type}${input.type === 'exec' ? ' exec' : ' data'}" data-pin-name="${input.name}"></div><span>${input.name}</span>`;

                pin.querySelector('.pin-connector').addEventListener('mousedown', (e) => {
                    e.stopPropagation();

                    // Check for existing connection
                    const existingConnIndex = this.editor.connections.findIndex(c => c.toNode === this && c.toPin === input);

                    if (existingConnIndex !== -1) {
                        // Detach existing connection and "pick it up"
                        const conn = this.editor.connections[existingConnIndex];
                        this.editor.connections.splice(existingConnIndex, 1);
                        this.editor.activePin = { node: conn.fromNode, pin: conn.fromPin, type: 'output' };
                        this.editor.renderConnections();
                        this.editor.compile();
                    } else {
                        // Standard behavior: Start dragging from this input
                        this.editor.activePin = { node: this, pin: input, type: 'input' };
                    }
                });

                row.appendChild(pin);
            } else {
                row.appendChild(document.createElement('div'));
            }

            // Output Pin
            if (def.outputs && def.outputs[i]) {
                const output = def.outputs[i];
                const pin = document.createElement('div');
                pin.className = 'pin output-pin';
                pin.innerHTML = `<span>${output.name}</span><div class="pin-connector ${output.type}${output.type === 'exec' ? ' exec' : ' data'}" data-pin-name="${output.name}"></div>`;

                pin.querySelector('.pin-connector').addEventListener('mousedown', (e) => {
                    e.stopPropagation();
                    this.editor.activePin = { node: this, pin: output, type: 'output' };
                });

                row.appendChild(pin);
            }

            content.appendChild(row);
        }

        el.appendChild(content);

        el.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.editor.selectNode(this, e.ctrlKey);
            this.editor.draggedNode = this;
        });

        this.element = el;
    }

    updateElement() {
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;
    }

    getPinPosition(pin, type) {
        const pinEl = this.element.querySelector(`.${type}-pin .pin-connector[data-pin-name="${pin.name}"]`);
        if (!pinEl) return { x: this.x, y: this.y };

        const rect = pinEl.getBoundingClientRect();
        const canvasRect = this.editor.container.getBoundingClientRect();

        return {
            x: (rect.left + rect.width / 2 - canvasRect.left - this.editor.offset.x) / this.editor.zoom,
            y: (rect.top + rect.height / 2 - canvasRect.top - this.editor.offset.y) / this.editor.zoom
        };
    }
}
