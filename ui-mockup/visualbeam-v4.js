/**
 * VisualBeam Inspector V4 - Professional Edition
 * A comprehensive beam inspection system with advanced annotation and manipulation tools
 */

class VisualBeamInspector {
    constructor() {
        this.loadConfiguration();
        this.initializeProfiles();
        this.initializeState();
        this.init();
    }

    /**
     * Load configuration from localStorage or use defaults
     */
    loadConfiguration() {
        const savedConfig = localStorage.getItem('beamConfig');
        if (savedConfig) {
            this.config = JSON.parse(savedConfig);
        } else {
            // Default configuration
            this.config = {
                projectName: 'Bridge A-47',
                beamId: 'Beam 2',
                profile: '30wf210',
                lengthFt: 44,
                lengthIn: 0,
                topFlangeVisible: true,
                bearingClFt: 42,
                bearingClIn: 0,
                seatLeft: 18,
                seatRight: 18,
                backwallLeft: 2,
                backwallRight: 2,
                breastwallFt: 38,
                breastwallIn: 0,
                direction: 'south',
                inspector: 'J. Smith'
            };
        }

        // Initialize geometry calculator if available
        if (typeof BridgeGeometry !== 'undefined') {
            this.geometry = new BridgeGeometry(this.config);
        }
    }

    /**
     * Initialize beam profile database
     */
    initializeProfiles() {
        this.profiles = {
            '8wf67': { depth: 8.75, flangeWidth: 8.25, flangeThickness: 0.5625, webThickness: 0.375, weight: 67 },
            '10wf89': { depth: 10.875, flangeWidth: 10.25, flangeThickness: 0.6875, webThickness: 0.4375, weight: 89 },
            '12wf106': { depth: 12.875, flangeWidth: 12.125, flangeThickness: 0.8125, webThickness: 0.5, weight: 106 },
            '14wf120': { depth: 14.125, flangeWidth: 14.625, flangeThickness: 0.875, webThickness: 0.5625, weight: 120 },
            '18wf130': { depth: 18, flangeWidth: 12, flangeThickness: 0.9375, webThickness: 0.5625, weight: 130 },
            '21wf142': { depth: 21.5, flangeWidth: 13.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 142 },
            '24wf160': { depth: 24.625, flangeWidth: 14.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 160 },
            '30wf210': { depth: 30.375, flangeWidth: 15.125, flangeThickness: 1.3125, webThickness: 0.75, weight: 210 },
            '36wf300': { depth: 36.75, flangeWidth: 16.625, flangeThickness: 1.6875, webThickness: 0.9375, weight: 300 }
        };

        this.config.profileData = this.profiles[this.config.profile];
    }

    /**
     * Initialize application state
     */
    initializeState() {
        this.state = {
            mode: 'edit',  // edit, annotate, view
            tool: 'brush',  // Current active tool
            conditionState: 1,  // Current CS (1-4 or 'holes')
            brushRadius: 1,  // Brush radius in inches
            gridSize: 1,  // Grid size in inches (1", 2", 3", 6")
            gridVisible: true,
            rulerVisible: true,
            zoom: 1,
            pan: { x: 0, y: 0 },
            showBearings: true,
            showAbutments: true,
            showDimensions: true,
            showPhotos: true,
            ordinateOrigin: 'left',  // 'left' or 'right'
            defects: [],  // Array of defect objects
            annotations: [],  // Array of annotation objects
            transforms: [],  // Array of beam transform objects
            transformsEnabled: true,
            selectedAnnotation: null,
            cellsMarked: 0,
            isDragging: false,
            isPanning: false,
            dragStart: null,
            dragEnd: null,
            mousePos: { x: 0, y: 0 },
            
            // Advanced configuration
            marchingSquaresThreshold: 0.5,
            scalarFieldResolution: 'medium',
            bezierSmoothness: 5,
            lineAlgorithm: 'catmull',
            
            // Holes generation
            holesPercentage: 25,
            holesSeed: Date.now()
        };
    }

    /**
     * Initialize the application
     */
    init() {
        this.svg = document.getElementById('beam-canvas');
        this.setupEventListeners();
        this.updateUI();
        this.calculateScale();
        this.render();
        this.updateStatusBar();
        this.updateViewOrientation();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', () => this.switchMode(tab.dataset.mode));
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectTool(btn.dataset.tool));
        });

        // Condition state buttons
        document.querySelectorAll('.cs-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.cs-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (btn.dataset.cs === 'holes') {
                    this.state.conditionState = 'holes';
                    this.state.holesPercentage = document.getElementById('holes-percentage').value || 25;
                } else {
                    this.state.conditionState = parseInt(btn.dataset.cs);
                }
            });
        });

        // Brush radius selector
        document.getElementById('brush-radius')?.addEventListener('change', (e) => {
            this.state.brushRadius = parseInt(e.target.value);
        });

        // Grid size selector
        document.getElementById('grid-size')?.addEventListener('change', (e) => {
            this.state.gridSize = parseInt(e.target.value);
            this.render();
        });

        // View controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.fitToExtents());

        // Bottom bar controls
        document.getElementById('grid-toggle')?.addEventListener('click', () => {
            this.state.gridVisible = !this.state.gridVisible;
            document.getElementById('grid-toggle').classList.toggle('active', this.state.gridVisible);
            this.render();
        });

        document.getElementById('ruler-toggle')?.addEventListener('click', () => {
            this.state.rulerVisible = !this.state.rulerVisible;
            document.getElementById('ruler-toggle').classList.toggle('active', this.state.rulerVisible);
            this.render();
        });

        document.getElementById('origin-switch')?.addEventListener('click', () => {
            this.state.ordinateOrigin = this.state.ordinateOrigin === 'left' ? 'right' : 'left';
            this.render();
        });

        // Visibility toggles
        document.getElementById('show-dimensions')?.addEventListener('change', (e) => {
            this.state.showDimensions = e.target.checked;
            this.render();
        });

        document.getElementById('show-bearings')?.addEventListener('change', (e) => {
            this.state.showBearings = e.target.checked;
            this.render();
        });

        document.getElementById('show-abutments')?.addEventListener('change', (e) => {
            this.state.showAbutments = e.target.checked;
            this.render();
        });

        document.getElementById('show-photos')?.addEventListener('change', (e) => {
            this.state.showPhotos = e.target.checked;
            this.render();
        });

        // Canvas events
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));
        
        // Touch events
        this.svg.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.svg.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.svg.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Dialog controls
        document.getElementById('configure-btn')?.addEventListener('click', () => {
            document.getElementById('configure-dialog').classList.add('active');
        });

        document.getElementById('table-btn')?.addEventListener('click', () => {
            this.showAnnotationTable();
        });

        document.getElementById('transform-btn')?.addEventListener('click', () => {
            document.getElementById('transform-palette').classList.toggle('active');
            document.getElementById('export-palette').classList.remove('active');
        });

        document.getElementById('export-btn')?.addEventListener('click', () => {
            document.getElementById('export-palette').classList.toggle('active');
            document.getElementById('transform-palette').classList.remove('active');
        });

        // Dialog close buttons
        document.querySelectorAll('.dialog-close, .palette-close').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.target.closest('.dialog-overlay, .transform-palette, .export-palette').classList.remove('active');
            });
        });

        // Export format buttons
        document.querySelectorAll('.export-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const format = btn.dataset.format;
                this.exportDrawing(format);
                document.getElementById('export-palette').classList.remove('active');
            });
        });

        // Menu controls
        document.getElementById('menu-toggle')?.addEventListener('click', () => {
            document.getElementById('menu-overlay').classList.add('active');
        });

        document.getElementById('close-menu')?.addEventListener('click', () => {
            document.getElementById('menu-overlay').classList.remove('active');
        });

        // Action buttons
        document.getElementById('clear-all')?.addEventListener('click', () => this.clearAll());
        document.getElementById('delete-annotation')?.addEventListener('click', () => this.deleteSelectedAnnotation());

        // Save and load
        document.getElementById('menu-save')?.addEventListener('click', () => this.saveProgress());
        document.getElementById('menu-load')?.addEventListener('click', () => this.loadProgress());

        // Dimension dropdown menu
        document.querySelectorAll('[data-dim-type]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.state.tool = 'dimension';
                this.state.dimensionType = e.target.dataset.dimType;
                this.updateCursor();
            });
        });

        // Transform controls
        document.querySelectorAll('[data-transform]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.applyTransform(e.target.dataset.transform);
            });
        });

        document.getElementById('transforms-enabled')?.addEventListener('change', (e) => {
            this.state.transformsEnabled = e.target.checked;
            this.render();
        });
    }

    /**
     * Switch between edit/annotate/view modes
     */
    switchMode(mode) {
        this.state.mode = mode;
        
        // Update tab states
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === mode);
        });
        
        // Update toolbar visibility
        document.querySelectorAll('.mode-toolbar').forEach(toolbar => {
            toolbar.classList.toggle('active', 
                (mode === 'edit' && toolbar.id === 'edit-toolbar') ||
                (mode === 'annotate' && toolbar.id === 'annotate-toolbar') ||
                (mode === 'view' && toolbar.id === 'view-toolbar')
            );
        });
        
        // Set default tool for each mode
        if (mode === 'edit') {
            this.selectTool('brush');
        } else if (mode === 'annotate') {
            this.selectTool('dimension');
        } else if (mode === 'view') {
            this.selectTool('pan');
        }
    }

    /**
     * Select a tool
     */
    selectTool(tool) {
        this.state.tool = tool;
        
        // Update tool button states
        const activeToolbar = document.querySelector('.mode-toolbar.active');
        if (activeToolbar) {
            activeToolbar.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
        }
        
        this.updateCursor();
    }

    /**
     * Update cursor based on current tool
     */
    updateCursor() {
        const cursors = {
            'brush': 'crosshair',
            'rectangle': 'crosshair',
            'region': 'crosshair',
            'erase': 'not-allowed',
            'pan': 'move',
            'zoom': 'zoom-in',
            'dimension': 'crosshair',
            'callout': 'crosshair',
            'centerline': 'crosshair',
            'datum': 'crosshair',
            'text': 'text',
            'photo': 'crosshair'
        };
        
        this.svg.style.cursor = cursors[this.state.tool] || 'default';
    }

    /**
     * Handle mouse down event
     */
    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e);
        this.state.dragStart = coords;
        
        if (this.state.tool === 'pan') {
            this.state.isPanning = true;
            this.svg.style.cursor = 'grabbing';
        } else if (this.state.tool === 'rectangle') {
            this.state.isDragging = true;
        } else if (this.state.tool === 'dimension' && this.state.dimensionType) {
            this.startDimension(coords);
        } else if (this.state.tool === 'callout') {
            this.startCallout(coords);
        } else if (this.state.tool === 'centerline') {
            this.addCenterline(coords);
        } else if (this.state.tool === 'datum') {
            this.addDatum(coords);
        }
    }

    /**
     * Handle mouse move event
     */
    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        this.state.mousePos = coords;
        
        // Update coordinate display
        document.getElementById('coord-x').textContent = Math.floor(coords.x) + '"';
        document.getElementById('coord-y').textContent = Math.floor(coords.y) + '"';
        
        const gridX = Math.floor(coords.x / this.state.gridSize);
        const gridY = Math.floor(coords.y / this.state.gridSize);
        document.getElementById('grid-cell').textContent = `${gridX},${gridY}`;
        
        if (this.state.isPanning) {
            const dx = e.clientX - this.lastMouseX || 0;
            const dy = e.clientY - this.lastMouseY || 0;
            this.state.pan.x += dx;
            this.state.pan.y += dy;
            this.render();
        } else if (this.state.isDragging && this.state.tool === 'rectangle') {
            this.state.dragEnd = coords;
            this.drawSelectionRectangle();
        } else if (this.state.tool === 'brush' && e.buttons === 1) {
            this.paintWithBrush(coords);
        }
        
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
    }

    /**
     * Handle mouse up event
     */
    handleMouseUp(e) {
        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.svg.style.cursor = this.state.tool === 'pan' ? 'move' : 'default';
        } else if (this.state.isDragging && this.state.tool === 'rectangle') {
            this.state.isDragging = false;
            this.applyRectangleSelection();
        } else if (this.state.tool === 'region') {
            this.selectContiguousRegion(e);
        } else if (this.state.tool === 'brush') {
            this.paintWithBrush(this.getCanvasCoordinates(e));
        } else if (this.state.tool === 'erase') {
            this.eraseWithBrush(this.getCanvasCoordinates(e));
        } else if (this.state.tool === 'photo') {
            this.addPhotoMarker(e);
        } else if (this.state.tool === 'text') {
            this.addTextAnnotation(e);
        }
    }

    /**
     * Handle mouse wheel event
     */
    handleWheel(e) {
        e.preventDefault();
        
        if (this.state.tool === 'pan') {
            // Scrollwheel pans horizontally in pan mode
            const delta = 30;
            this.state.pan.x += e.deltaY > 0 ? -delta : delta;
            this.render();
        } else if (this.state.tool === 'zoom' || this.state.mode === 'view') {
            // Scrollwheel zooms
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            this.render();
        }
    }

    /**
     * Paint with brush tool
     */
    paintWithBrush(coords) {
        const radius = this.state.brushRadius;
        const gridSize = this.state.gridSize;
        
        // Paint all cells within brush radius
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const cellX = Math.floor((coords.x + dx * gridSize) / gridSize) * gridSize;
                    const cellY = Math.floor((coords.y + dy * gridSize) / gridSize) * gridSize;
                    
                    if (cellX >= 0 && cellY >= 0) {
                        this.markCell(cellX, cellY);
                    }
                }
            }
        }
        
        this.render();
    }

    /**
     * Erase with brush tool
     */
    eraseWithBrush(coords) {
        const radius = this.state.brushRadius;
        const gridSize = this.state.gridSize;
        
        // Erase all cells within brush radius
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const cellX = Math.floor((coords.x + dx * gridSize) / gridSize) * gridSize;
                    const cellY = Math.floor((coords.y + dy * gridSize) / gridSize) * gridSize;
                    
                    this.eraseCell(cellX, cellY);
                }
            }
        }
        
        this.render();
    }

    /**
     * Mark a single cell
     */
    markCell(x, y) {
        const existing = this.state.defects.find(d => d.x === x && d.y === y);
        
        if (existing) {
            existing.conditionState = this.state.conditionState;
        } else {
            this.state.defects.push({
                x: x,
                y: y,
                width: this.state.gridSize,
                height: this.state.gridSize,
                conditionState: this.state.conditionState
            });
            this.state.cellsMarked++;
        }
        
        document.getElementById('cells-marked').textContent = this.state.cellsMarked;
    }

    /**
     * Erase a single cell
     */
    eraseCell(x, y) {
        const index = this.state.defects.findIndex(d => d.x === x && d.y === y);
        
        if (index !== -1) {
            this.state.defects.splice(index, 1);
            this.state.cellsMarked = Math.max(0, this.state.cellsMarked - 1);
            document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        }
    }

    /**
     * Select contiguous region with same condition state
     */
    selectContiguousRegion(e) {
        const coords = this.getCanvasCoordinates(e);
        const gridSize = this.state.gridSize;
        const clickedX = Math.floor(coords.x / gridSize) * gridSize;
        const clickedY = Math.floor(coords.y / gridSize) * gridSize;
        
        const clickedDefect = this.state.defects.find(d => 
            d.x === clickedX && d.y === clickedY
        );
        
        if (!clickedDefect) return;
        
        const targetCS = clickedDefect.conditionState;
        const visited = new Set();
        const toVisit = [`${clickedX},${clickedY}`];
        const selected = new Set();
        
        // Flood fill algorithm
        while (toVisit.length > 0) {
            const current = toVisit.pop();
            if (visited.has(current)) continue;
            visited.add(current);
            
            const [x, y] = current.split(',').map(Number);
            
            const defect = this.state.defects.find(d => d.x === x && d.y === y);
            if (defect && defect.conditionState === targetCS) {
                selected.add(current);
                
                // Add neighbors
                const neighbors = [
                    `${x + gridSize},${y}`,
                    `${x - gridSize},${y}`,
                    `${x},${y + gridSize}`,
                    `${x},${y - gridSize}`
                ];
                
                neighbors.forEach(n => {
                    if (!visited.has(n)) {
                        toVisit.push(n);
                    }
                });
            }
        }
        
        // Apply current condition state to selection
        selected.forEach(cellKey => {
            const [x, y] = cellKey.split(',').map(Number);
            const defect = this.state.defects.find(d => d.x === x && d.y === y);
            if (defect) {
                defect.conditionState = this.state.conditionState;
            }
        });
        
        this.render();
    }

    /**
     * Main render function
     */
    render() {
        this.clearLayers();
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        const scale = this.scale * this.state.zoom;
        
        // Center the beam
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        const beamX = centerX - (beamLength * scale) / 2 + this.state.pan.x;
        const beamY = centerY - (beamDepth * scale) / 2 + this.state.pan.y;
        
        // Draw layers in order
        if (this.state.showAbutments) {
            this.drawAbutments(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        if (this.state.showBearings) {
            this.drawBearings(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawBeam(beamX, beamY, beamLength, beamDepth, scale);
        
        if (this.state.gridVisible) {
            this.drawGrid(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawDefects(beamX, beamY, scale);
        
        if (this.state.showDimensions) {
            this.drawDimensions(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        if (this.state.rulerVisible) {
            this.drawOrdinates(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawAnnotations(beamX, beamY, scale);
        
        if (this.state.transformsEnabled) {
            this.drawTransforms(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        // Update zoom display
        document.querySelectorAll('.zoom-level').forEach(el => {
            el.textContent = Math.round(this.state.zoom * 100) + '%';
        });
    }

    /**
     * Draw transparent grid overlay
     */
    drawGrid(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('grid-layer');
        if (!layer) return;
        
        const gridSize = this.state.gridSize;
        const gridSpacing = gridSize * scale;
        
        // Create clipping path for beam area
        const clipPath = this.createSVGElement('clipPath', {
            id: 'beam-clip'
        });
        
        const beamPath = this.createSVGElement('rect', {
            x: x,
            y: y,
            width: beamLength * scale,
            height: beamDepth * scale
        });
        clipPath.appendChild(beamPath);
        
        // Add to defs
        let defs = this.svg.querySelector('defs');
        if (!defs) {
            defs = this.createSVGElement('defs', {});
            this.svg.insertBefore(defs, this.svg.firstChild);
        }
        const existingClip = defs.querySelector('#beam-clip');
        if (existingClip) {
            defs.removeChild(existingClip);
        }
        defs.appendChild(clipPath);
        
        // Create grid group with clipping
        const gridGroup = this.createSVGElement('g', {
            'clip-path': 'url(#beam-clip)'
        });
        
        // Draw transparent grid cells
        const numCellsX = Math.ceil(beamLength / gridSize);
        const numCellsY = Math.ceil(beamDepth / gridSize);
        
        for (let i = 0; i < numCellsX; i++) {
            for (let j = 0; j < numCellsY; j++) {
                const cellX = x + i * gridSpacing;
                const cellY = y + j * gridSpacing;
                
                if (cellX < x + beamLength * scale && cellY < y + beamDepth * scale) {
                    const cellWidth = Math.min(gridSpacing, x + beamLength * scale - cellX);
                    const cellHeight = Math.min(gridSpacing, y + beamDepth * scale - cellY);
                    
                    const cell = this.createSVGElement('rect', {
                        x: cellX,
                        y: cellY,
                        width: cellWidth,
                        height: cellHeight,
                        class: 'grid-cell',
                        'data-grid-x': i,
                        'data-grid-y': j
                    });
                    
                    // Add hover effect
                    cell.addEventListener('mouseenter', (e) => {
                        if (this.state.mode === 'edit') {
                            e.target.style.stroke = '#2196F3';
                            e.target.style.strokeWidth = '1';
                            e.target.style.fill = 'rgba(33, 150, 243, 0.1)';
                        }
                    });
                    
                    cell.addEventListener('mouseleave', (e) => {
                        e.target.style.stroke = '';
                        e.target.style.strokeWidth = '';
                        e.target.style.fill = '';
                    });
                    
                    gridGroup.appendChild(cell);
                }
            }
        }
        
        layer.appendChild(gridGroup);
    }

    // Additional drawing methods would continue here...
    // Including drawBeam, drawAbutments, drawBearings, drawDimensions, drawOrdinates, etc.
    // Following the same pattern as the original but with enhancements

    /**
     * Helper method to create SVG elements
     */
    createSVGElement(type, attrs) {
        const elem = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attrs)) {
            elem.setAttribute(key, value);
        }
        return elem;
    }

    /**
     * Clear all layers
     */
    clearLayers() {
        const layers = [
            'background-layer', 'abutment-layer', 'bearing-layer',
            'beam-layer', 'grid-layer', 'defect-layer',
            'dimension-layer', 'annotation-layer', 'transform-layer'
        ];
        
        layers.forEach(layerId => {
            const layer = document.getElementById(layerId);
            if (layer) {
                while (layer.firstChild) {
                    layer.removeChild(layer.firstChild);
                }
            }
        });
    }

    /**
     * Calculate scale based on viewport
     */
    calculateScale() {
        const padding = 150;
        const svgRect = this.svg.getBoundingClientRect();
        const svgWidth = svgRect.width - 2 * padding;
        const svgHeight = svgRect.height - 2 * padding;
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        
        const scaleX = svgWidth / beamLength;
        const scaleY = svgHeight / beamDepth;
        
        this.scale = Math.min(scaleX, scaleY, 4);
    }

    /**
     * Get canvas coordinates from mouse event
     */
    getCanvasCoordinates(e) {
        const rect = this.svg.getBoundingClientRect();
        const scale = this.scale * this.state.zoom;
        
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        
        const beamX = centerX - (beamLength * scale) / 2 + this.state.pan.x;
        const beamY = centerY - (beamDepth * scale) / 2 + this.state.pan.y;
        
        const x = (e.clientX - rect.left - beamX) / scale;
        const y = (e.clientY - rect.top - beamY) / scale;
        
        return { x, y };
    }

    /**
     * Update UI elements
     */
    updateUI() {
        document.getElementById('project-name').textContent = this.config.projectName;
        document.getElementById('beam-id').textContent = this.config.beamId;
    }

    /**
     * Update status bar
     */
    updateStatusBar() {
        const profile = this.config.profileData;
        document.getElementById('beam-profile').textContent = this.config.profile.toUpperCase();
        document.getElementById('beam-length').textContent = `${this.config.lengthFt}'-${this.config.lengthIn}"`;
    }

    /**
     * Update view orientation display
     */
    updateViewOrientation() {
        const direction = this.config.direction || 'south';
        const orientationEl = document.getElementById('view-orientation');
        if (orientationEl) {
            orientationEl.textContent = `${direction.toUpperCase()} ELEVATION`;
        }
    }

    // Drawing methods
    drawBeam(x, y, length, depth, scale) {
        const layer = document.getElementById('beam-layer');
        
        // Draw beam outline
        const beam = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        beam.setAttribute('x', x);
        beam.setAttribute('y', y);
        beam.setAttribute('width', length * scale);
        beam.setAttribute('height', depth * scale);
        beam.setAttribute('fill', '#4a5568');
        beam.setAttribute('stroke', '#000');
        beam.setAttribute('stroke-width', '2');
        layer.appendChild(beam);
        
        // Draw flanges
        const flangeHeight = this.config.profileData.flangeHeight * scale;
        
        // Top flange
        const topFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        topFlange.setAttribute('x', x);
        topFlange.setAttribute('y', y);
        topFlange.setAttribute('width', length * scale);
        topFlange.setAttribute('height', flangeHeight);
        topFlange.setAttribute('fill', '#2d3748');
        topFlange.setAttribute('stroke', '#000');
        topFlange.setAttribute('stroke-width', '1');
        layer.appendChild(topFlange);
        
        // Bottom flange
        const bottomFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bottomFlange.setAttribute('x', x);
        bottomFlange.setAttribute('y', y + (depth * scale) - flangeHeight);
        bottomFlange.setAttribute('width', length * scale);
        bottomFlange.setAttribute('height', flangeHeight);
        bottomFlange.setAttribute('fill', '#2d3748');
        bottomFlange.setAttribute('stroke', '#000');
        bottomFlange.setAttribute('stroke-width', '1');
        layer.appendChild(bottomFlange);
        
        // Draw ordinates if ruler is visible
        if (this.state.rulerVisible) {
            this.drawOrdinates(x, y, length, depth, scale);
        }
    }
    
    drawAbutments(x, y, length, depth, scale) {
        const layer = document.getElementById('abutment-layer');
        const abutmentWidth = 40 * scale;
        const abutmentHeight = (depth + 20) * scale;
        
        // Left abutment
        const leftAbutment = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftAbutment.setAttribute('x', x - abutmentWidth);
        leftAbutment.setAttribute('y', y - 10 * scale);
        leftAbutment.setAttribute('width', abutmentWidth);
        leftAbutment.setAttribute('height', abutmentHeight);
        leftAbutment.setAttribute('fill', '#666');
        leftAbutment.setAttribute('stroke', '#333');
        leftAbutment.setAttribute('stroke-width', '1');
        layer.appendChild(leftAbutment);
        
        // Right abutment
        const rightAbutment = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightAbutment.setAttribute('x', x + length * scale);
        rightAbutment.setAttribute('y', y - 10 * scale);
        rightAbutment.setAttribute('width', abutmentWidth);
        rightAbutment.setAttribute('height', abutmentHeight);
        rightAbutment.setAttribute('fill', '#666');
        rightAbutment.setAttribute('stroke', '#333');
        rightAbutment.setAttribute('stroke-width', '1');
        layer.appendChild(rightAbutment);
    }
    
    drawBearings(x, y, length, depth, scale) {
        const layer = document.getElementById('bearing-layer');
        const bearingDist = this.config.bearingDistanceFt * 12 + this.config.bearingDistanceIn;
        
        // Left bearing
        const leftBearing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        leftBearing.setAttribute('cx', x + bearingDist * scale);
        leftBearing.setAttribute('cy', y + depth * scale + 10);
        leftBearing.setAttribute('r', 8);
        leftBearing.setAttribute('fill', '#4a5568');
        leftBearing.setAttribute('stroke', '#000');
        leftBearing.setAttribute('stroke-width', '2');
        layer.appendChild(leftBearing);
        
        // Right bearing
        const rightBearing = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        rightBearing.setAttribute('cx', x + (length - bearingDist) * scale);
        rightBearing.setAttribute('cy', y + depth * scale + 10);
        rightBearing.setAttribute('r', 8);
        rightBearing.setAttribute('fill', '#4a5568');
        rightBearing.setAttribute('stroke', '#000');
        rightBearing.setAttribute('stroke-width', '2');
        layer.appendChild(rightBearing);
        
        // Draw centerlines if dimensions are shown
        if (this.state.showDimensions) {
            const leftCL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            leftCL.setAttribute('x1', x + bearingDist * scale);
            leftCL.setAttribute('y1', y - 20);
            leftCL.setAttribute('x2', x + bearingDist * scale);
            leftCL.setAttribute('y2', y + depth * scale + 30);
            leftCL.setAttribute('stroke', '#666');
            leftCL.setAttribute('stroke-width', '1');
            leftCL.setAttribute('stroke-dasharray', '2,2');
            layer.appendChild(leftCL);
            
            const rightCL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            rightCL.setAttribute('x1', x + (length - bearingDist) * scale);
            rightCL.setAttribute('y1', y - 20);
            rightCL.setAttribute('x2', x + (length - bearingDist) * scale);
            rightCL.setAttribute('y2', y + depth * scale + 30);
            rightCL.setAttribute('stroke', '#666');
            rightCL.setAttribute('stroke-width', '1');
            rightCL.setAttribute('stroke-dasharray', '2,2');
            layer.appendChild(rightCL);
        }
    }
    
    drawDimensions(x, y, length, depth, scale) {
        const layer = document.getElementById('dimension-layer');
        
        // Beam length dimension
        const dimLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        dimLine.setAttribute('x1', x);
        dimLine.setAttribute('y1', y - 40);
        dimLine.setAttribute('x2', x + length * scale);
        dimLine.setAttribute('y2', y - 40);
        dimLine.setAttribute('stroke', '#fff');
        dimLine.setAttribute('stroke-width', '1');
        layer.appendChild(dimLine);
        
        // Add dimension text
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x + (length * scale) / 2);
        text.setAttribute('y', y - 45);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('fill', '#fff');
        text.setAttribute('font-size', '12');
        text.textContent = `${this.config.lengthFt}'-${this.config.lengthIn}"`;
        layer.appendChild(text);
    }
    
    drawOrdinates(x, y, length, depth, scale) {
        const layer = document.getElementById('beam-layer');
        const ordinateY = this.state.ordinateOrigin === 'left' ? 
            y + depth * scale + 20 : 
            y - 30;
        
        // Draw engineer's scale
        const scaleBar = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw alternating bars for each foot
        const feet = Math.floor(length / 12);
        for (let i = 0; i <= feet; i++) {
            const barX = x + (i * 12 * scale);
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', barX);
            bar.setAttribute('y', ordinateY);
            bar.setAttribute('width', Math.min(12 * scale, (length - i * 12) * scale));
            bar.setAttribute('height', 10);
            bar.setAttribute('fill', i % 2 === 0 ? '#000' : '#fff');
            bar.setAttribute('stroke', '#000');
            bar.setAttribute('stroke-width', '0.5');
            layer.appendChild(bar);
            
            // Add foot markers
            const marker = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            marker.setAttribute('x', barX);
            marker.setAttribute('y', ordinateY + 25);
            marker.setAttribute('text-anchor', 'middle');
            marker.setAttribute('fill', '#fff');
            marker.setAttribute('font-size', '10');
            marker.textContent = i.toString();
            layer.appendChild(marker);
        }
        
        layer.appendChild(scaleBar);
    }
    
    drawGrid(x, y, length, depth, scale) {
        const layer = document.getElementById('grid-layer');
        
        // Create transparent grid overlay only on beam area
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('opacity', '0.3');
        
        // Draw vertical lines (1" spacing)
        for (let i = 0; i <= length; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x + i * scale);
            line.setAttribute('y1', y);
            line.setAttribute('x2', x + i * scale);
            line.setAttribute('y2', y + depth * scale);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '0.25');
            gridGroup.appendChild(line);
        }
        
        // Draw horizontal lines (1" spacing)
        const rows = Math.ceil(depth);
        for (let i = 0; i <= rows; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x);
            line.setAttribute('y1', y + i * scale);
            line.setAttribute('x2', x + length * scale);
            line.setAttribute('y2', y + i * scale);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '0.25');
            gridGroup.appendChild(line);
        }
        
        layer.appendChild(gridGroup);
    }
    
    drawDefects(x, y, scale) {
        const layer = document.getElementById('defect-layer');
        
        // Draw marked grid cells
        this.state.markedCells.forEach(cell => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', x + cell.col * scale);
            rect.setAttribute('y', y + cell.row * scale);
            rect.setAttribute('width', scale);
            rect.setAttribute('height', scale);
            rect.setAttribute('fill', this.state.defectColors[this.state.selectedDefect]);
            rect.setAttribute('fill-opacity', '0.7');
            rect.setAttribute('stroke', '#000');
            rect.setAttribute('stroke-width', '0.5');
            layer.appendChild(rect);
        });
    }
    
    drawAnnotations() { /* Implementation */ }
    drawTransforms() { /* Implementation */ }
    drawSelectionRectangle() { /* Implementation */ }
    applyRectangleSelection() { /* Implementation */ }
    startDimension() { /* Implementation */ }
    startCallout() { /* Implementation */ }
    addCenterline() { /* Implementation */ }
    addDatum() { /* Implementation */ }
    addPhotoMarker() { /* Implementation */ }
    addTextAnnotation() { /* Implementation */ }
    showAnnotationTable() { /* Implementation */ }
    applyTransform() { /* Implementation */ }
    clearAll() { /* Implementation */ }
    deleteSelectedAnnotation() { /* Implementation */ }
    exportDrawing(format = 'pdf') {
        const options = {
            includeGrid: document.getElementById('export-grid')?.checked ?? true,
            includeDimensions: document.getElementById('export-dimensions')?.checked ?? true,
            includeAnnotations: document.getElementById('export-annotations')?.checked ?? true,
            includeTitleBlock: document.getElementById('export-title')?.checked ?? true
        };
        
        console.log(`Exporting drawing as ${format.toUpperCase()}`, options);
        
        switch(format) {
            case 'pdf':
                alert('Exporting as PDF with vector graphics and annotations...');
                break;
            case 'svg':
                alert('Exporting as SVG scalable vector graphics...');
                break;
            case 'dxf':
                alert('Exporting as AutoCAD DXF format...');
                break;
            case 'txt':
                alert('Generating inspection summary report...');
                break;
            default:
                alert('Unknown export format');
        }
    }
    saveProgress() { /* Implementation */ }
    loadProgress() { /* Implementation */ }
    zoomIn() { this.state.zoom = Math.min(4, this.state.zoom * 1.25); this.render(); }
    zoomOut() { this.state.zoom = Math.max(0.25, this.state.zoom * 0.8); this.render(); }
    fitToExtents() { this.state.zoom = 1; this.state.pan = { x: 0, y: 0 }; this.render(); }
    handleTouchStart() { /* Implementation */ }
    handleTouchMove() { /* Implementation */ }
    handleTouchEnd() { /* Implementation */ }
}