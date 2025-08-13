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
                bearingDistanceFt: 1,  // Distance from beam end to bearing CL
                bearingDistanceIn: 0,
                backwallClearanceFt: 0,  // Clearance between beam end and abutment
                backwallClearanceIn: 2,
                breastwallFt: 2,  // Distance from bearing CL to breastwall
                breastwallIn: 6,
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
        
        // Middle mouse button (button === 1) for zooming in edit mode
        if (e.button === 1 && this.state.mode === 'edit') {
            e.preventDefault();
            this.state.isMiddleMouseDown = true;
            this.state.zoomStart = { x: e.clientX, y: e.clientY };
            this.state.initialZoom = this.state.zoom;
            this.svg.style.cursor = 'zoom-in';
            return;
        }
        
        if (this.state.tool === 'pan') {
            this.state.isPanning = true;
            this.state.panStart = {
                x: e.clientX - this.state.pan.x,
                y: e.clientY - this.state.pan.y
            };
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
        
        // Handle middle mouse zoom drag
        if (this.state.isMiddleMouseDown) {
            const deltaY = e.clientY - this.state.zoomStart.y;
            const zoomFactor = 1 - deltaY * 0.005;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.initialZoom * zoomFactor));
            this.render();
            document.querySelectorAll('.zoom-level').forEach(el => {
                el.textContent = Math.round(this.state.zoom * 100) + '%';
            });
            return;
        }
        
        if (this.state.isPanning) {
            this.state.pan.x = e.clientX - this.state.panStart.x;
            this.state.pan.y = e.clientY - this.state.panStart.y;
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
        // Reset middle mouse zoom
        if (this.state.isMiddleMouseDown) {
            this.state.isMiddleMouseDown = false;
            this.svg.style.cursor = 'default';
            this.updateCursor();
            return;
        }
        
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
        
        if (this.state.mode === 'edit') {
            // In edit mode, scrollwheel always pans left-right
            const delta = 30;
            this.state.pan.x += e.deltaY > 0 ? -delta : delta;
            this.render();
        } else if (this.state.tool === 'pan') {
            // In pan mode, scrollwheel pans horizontally
            const delta = 30;
            this.state.pan.x += e.deltaY > 0 ? -delta : delta;
            this.render();
        } else if (this.state.tool === 'zoom' || this.state.mode === 'view') {
            // In zoom mode or view mode, scrollwheel zooms
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            this.render();
            document.querySelectorAll('.zoom-level').forEach(el => {
                el.textContent = Math.round(this.state.zoom * 100) + '%';
            });
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
        
        // Always center on beam's axial centerline
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        // Position beam so its center (both horizontal and vertical) is at canvas center
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
        const padding = 120; // Increased padding for dimensions
        const svgRect = this.svg.getBoundingClientRect();
        const svgWidth = svgRect.width - 2 * padding;
        const svgHeight = svgRect.height - 2 * padding;
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        
        // Calculate total scene width including abutments and clearances
        const breastwallDist = (this.config.breastwallFt || 2) * 12 + (this.config.breastwallIn || 6);
        const bearingDist = (this.config.bearingDistanceFt || 1) * 12 + (this.config.bearingDistanceIn || 0);
        const backwallClearance = (this.config.backwallClearanceFt || 0) * 12 + (this.config.backwallClearanceIn || 2);
        const abutmentWidth = breastwallDist + bearingDist;
        
        // Total width = beam + 2*(backwall clearance + abutment width) + dimension space
        const totalWidth = beamLength + 2 * (backwallClearance + abutmentWidth) + 24; // Extra 24" for dims
        const totalHeight = beamDepth + 80; // Allow 80" total vertical space for dims
        
        const scaleX = svgWidth / totalWidth;
        const scaleY = svgHeight / totalHeight;
        
        this.scale = Math.min(scaleX, scaleY, 3); // Max scale of 3 for clarity
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
        
        // Calculate flange dimensions - very thin flanges as shown in normalized coords
        const flangeHeight = depth * scale * 0.125; // About 1/8 of depth
        const webHeight = depth * scale * 0.75; // Rest is web
        
        // Draw beam flanges and web as separate rectangles for clarity
        // Top flange
        const topFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        topFlange.setAttribute('x', x);
        topFlange.setAttribute('y', y);
        topFlange.setAttribute('width', length * scale);
        topFlange.setAttribute('height', flangeHeight);
        topFlange.setAttribute('fill', '#00ff00');
        topFlange.setAttribute('stroke', '#000');
        topFlange.setAttribute('stroke-width', '2');
        layer.appendChild(topFlange);
        
        // Web
        const web = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        web.setAttribute('x', x);
        web.setAttribute('y', y + flangeHeight);
        web.setAttribute('width', length * scale);
        web.setAttribute('height', webHeight);
        web.setAttribute('fill', '#00ff00');
        web.setAttribute('stroke', '#000');
        web.setAttribute('stroke-width', '2');
        layer.appendChild(web);
        
        // Bottom flange
        const bottomFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bottomFlange.setAttribute('x', x);
        bottomFlange.setAttribute('y', y + flangeHeight + webHeight);
        bottomFlange.setAttribute('width', length * scale);
        bottomFlange.setAttribute('height', flangeHeight);
        bottomFlange.setAttribute('fill', '#00ff00');
        bottomFlange.setAttribute('stroke', '#000');
        bottomFlange.setAttribute('stroke-width', '2');
        layer.appendChild(bottomFlange);
        
        // Draw beam end dimensions if visible
        if (this.state.showDimensions) {
            this.drawBeamEndDimensions(x, y, depth, scale);
        }
        
        // Draw ordinates if ruler is visible
        if (this.state.rulerVisible) {
            this.drawOrdinates(x, y, length, depth, scale);
        }
    }
    
    drawAbutments(x, y, length, depth, scale) {
        const layer = document.getElementById('abutment-layer');
        
        // Get parametric dimensions from config with defaults
        const bearingDist = ((this.config.bearingDistanceFt || 1) * 12 + (this.config.bearingDistanceIn || 0));
        const backwallClearance = ((this.config.backwallClearanceFt || 0) * 12 + (this.config.backwallClearanceIn || 2));
        const breastwallDist = ((this.config.breastwallFt || 2) * 12 + (this.config.breastwallIn || 6));
        
        // Calculate seat width to extend past bearing centerline by half bearing width
        const bearingWidth = 18; // Standard 18" bearing width
        const seatWidth = (bearingDist + bearingWidth/2 + 6) * scale; // Seat extends past bearing center + 6" extra
        const abutmentWidth = (breastwallDist + bearingDist) * scale; // Total abutment width
        
        // Vertical proportions
        const seatHeight = 6 * scale; // 6" seat height (not used in simple L-shape)
        const abutmentTotalHeight = depth * scale + 36 * scale; // Extends 36" below beam
        const abutmentTopExtension = 10 * scale; // Extends 10" above beam top
        
        // LEFT ABUTMENT - Simple L-shape with seat under bearing
        const leftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate left abutment points to align seat under bearing
        const leftBearingCenterX = x + bearingDist * scale; // Bearing center position
        const leftBackwallX = x - backwallClearance * scale - abutmentWidth;
        const leftBreastwallX = leftBearingCenterX - breastwallDist * scale; // Breastwall is breastwallDist from bearing CL
        const leftSeatEndX = x - backwallClearance * scale; // Where seat meets beam end
        
        // Build L-shaped abutment path with seat positioned under bearing
        let leftD = `M ${leftBackwallX} ${y - abutmentTopExtension} `; // Start at top of backwall
        leftD += `L ${leftBreastwallX} ${y - abutmentTopExtension} `; // Across top to breastwall
        leftD += `L ${leftBreastwallX} ${y + depth * scale} `; // Down breastwall to seat level
        leftD += `L ${leftSeatEndX} ${y + depth * scale} `; // Across seat to beam end
        leftD += `L ${leftSeatEndX} ${y + abutmentTotalHeight} `; // Down to base
        leftD += `L ${leftBackwallX} ${y + abutmentTotalHeight} `; // Across base to backwall
        leftD += `L ${leftBackwallX} ${y - abutmentTopExtension} `; // Up backwall to top
        leftD += `Z`; // Close path
        
        leftPath.setAttribute('d', leftD);
        leftPath.setAttribute('fill', '#808080');
        leftPath.setAttribute('stroke', '#000');
        leftPath.setAttribute('stroke-width', '2');
        layer.appendChild(leftPath);
        
        // Add backwall emphasis line for left abutment
        const leftBackwallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        leftBackwallLine.setAttribute('x1', leftBackwallX);
        leftBackwallLine.setAttribute('y1', y - abutmentTopExtension);
        leftBackwallLine.setAttribute('x2', leftBackwallX);
        leftBackwallLine.setAttribute('y2', y + abutmentTotalHeight);
        leftBackwallLine.setAttribute('stroke', '#000');
        leftBackwallLine.setAttribute('stroke-width', '3');
        layer.appendChild(leftBackwallLine);
        
        // RIGHT ABUTMENT - Mirrored L-shape
        const rightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Calculate right abutment points to align seat under bearing
        const rightBearingCenterX = x + (length - bearingDist) * scale; // Bearing center position
        const rightSeatEndX = x + length * scale + backwallClearance * scale; // Where seat meets beam end
        const rightBreastwallX = rightBearingCenterX + breastwallDist * scale; // Breastwall is breastwallDist from bearing CL
        const rightBackwallX = x + length * scale + backwallClearance * scale + abutmentWidth;
        
        // Build L-shaped abutment path with seat positioned under bearing
        let rightD = `M ${rightSeatEndX} ${y + depth * scale} `; // Start at seat/beam junction
        rightD += `L ${rightSeatEndX} ${y + abutmentTotalHeight} `; // Down to base
        rightD += `L ${rightBackwallX} ${y + abutmentTotalHeight} `; // Across base to backwall
        rightD += `L ${rightBackwallX} ${y - abutmentTopExtension} `; // Up backwall to top
        rightD += `L ${rightBreastwallX} ${y - abutmentTopExtension} `; // Across top to breastwall
        rightD += `L ${rightBreastwallX} ${y + depth * scale} `; // Down breastwall to seat level
        rightD += `L ${rightSeatEndX} ${y + depth * scale} `; // Back to start
        rightD += `Z`; // Close path
        
        rightPath.setAttribute('d', rightD);
        rightPath.setAttribute('fill', '#808080');
        rightPath.setAttribute('stroke', '#000');
        rightPath.setAttribute('stroke-width', '2');
        layer.appendChild(rightPath);
        
        // Add backwall emphasis line for right abutment
        const rightBackwallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        rightBackwallLine.setAttribute('x1', rightBackwallX);
        rightBackwallLine.setAttribute('y1', y - abutmentTopExtension);
        rightBackwallLine.setAttribute('x2', rightBackwallX);
        rightBackwallLine.setAttribute('y2', y + abutmentTotalHeight);
        rightBackwallLine.setAttribute('stroke', '#000');
        rightBackwallLine.setAttribute('stroke-width', '3');
        layer.appendChild(rightBackwallLine);
    }
    
    drawBearings(x, y, length, depth, scale) {
        const layer = document.getElementById('bearing-layer');
        
        // Get bearing positions from config - these are distances from beam ends
        const bearingDist = ((this.config.bearingDistanceFt || 1) * 12 + (this.config.bearingDistanceIn || 0));
        const backwallClearance = ((this.config.backwallClearanceFt || 0) * 12 + (this.config.backwallClearanceIn || 2));
        
        // Bearings are positioned at bearingDist from each end of beam
        const leftBearingPos = bearingDist * scale;
        const rightBearingPos = (length - bearingDist) * scale;
        const bearingWidth = 18 * scale; // Standard 18" bearing width
        const bearingHeight = 3 * scale; // 3" bearing pad thickness
        
        // Bearings sit just below the beam
        const bearingY = y + depth * scale;
        
        // LEFT BEARING - Two stacked rectangles
        const leftBearingX = x + leftBearingPos - bearingWidth / 2;
        
        // Top rectangle of left bearing
        const leftTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftTop.setAttribute('x', leftBearingX);
        leftTop.setAttribute('y', bearingY);
        leftTop.setAttribute('width', bearingWidth);
        leftTop.setAttribute('height', bearingHeight);
        leftTop.setAttribute('fill', '#00ff00'); // Same green as beam
        leftTop.setAttribute('stroke', '#000');
        leftTop.setAttribute('stroke-width', '1');
        layer.appendChild(leftTop);
        
        // Bottom rectangle of left bearing
        const leftBottom = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        leftBottom.setAttribute('x', leftBearingX);
        leftBottom.setAttribute('y', bearingY + bearingHeight);
        leftBottom.setAttribute('width', bearingWidth);
        leftBottom.setAttribute('height', bearingHeight);
        leftBottom.setAttribute('fill', '#00ff00'); // Same green as beam
        leftBottom.setAttribute('stroke', '#000');
        leftBottom.setAttribute('stroke-width', '1');
        layer.appendChild(leftBottom);
        
        // RIGHT BEARING - Two stacked rectangles
        const rightBearingX = x + rightBearingPos - bearingWidth / 2;
        
        // Top rectangle of right bearing
        const rightTop = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightTop.setAttribute('x', rightBearingX);
        rightTop.setAttribute('y', bearingY);
        rightTop.setAttribute('width', bearingWidth);
        rightTop.setAttribute('height', bearingHeight);
        rightTop.setAttribute('fill', '#00ff00'); // Same green as beam
        rightTop.setAttribute('stroke', '#000');
        rightTop.setAttribute('stroke-width', '1');
        layer.appendChild(rightTop);
        
        // Bottom rectangle of right bearing
        const rightBottom = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rightBottom.setAttribute('x', rightBearingX);
        rightBottom.setAttribute('y', bearingY + bearingHeight);
        rightBottom.setAttribute('width', bearingWidth);
        rightBottom.setAttribute('height', bearingHeight);
        rightBottom.setAttribute('fill', '#00ff00'); // Same green as beam
        rightBottom.setAttribute('stroke', '#000');
        rightBottom.setAttribute('stroke-width', '1');
        layer.appendChild(rightBottom);
        
        // Draw bearing centerlines if dimensions are shown
        if (this.state.showDimensions) {
            // Left bearing centerline
            const leftCL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            leftCL.setAttribute('x1', x + leftBearingPos);
            leftCL.setAttribute('y1', y - 10 * scale);
            leftCL.setAttribute('x2', x + leftBearingPos);
            leftCL.setAttribute('y2', y + depth * scale + 10 * scale);
            leftCL.setAttribute('stroke', '#FF5722');
            leftCL.setAttribute('stroke-width', '1');
            leftCL.setAttribute('stroke-dasharray', '4 2');
            leftCL.setAttribute('opacity', '0.7');
            layer.appendChild(leftCL);
            
            // Right bearing centerline
            const rightCL = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            rightCL.setAttribute('x1', x + rightBearingPos);
            rightCL.setAttribute('y1', y - 10 * scale);
            rightCL.setAttribute('x2', x + rightBearingPos);
            rightCL.setAttribute('y2', y + depth * scale + 10 * scale);
            rightCL.setAttribute('stroke', '#FF5722');
            rightCL.setAttribute('stroke-width', '1');
            rightCL.setAttribute('stroke-dasharray', '4 2');
            rightCL.setAttribute('opacity', '0.7');
            layer.appendChild(rightCL);
        }
    }
    
    drawDimensions(x, y, length, depth, scale) {
        const layer = document.getElementById('dimension-layer');
        
        // Get parametric dimensions
        const bearingDist = ((this.config.bearingDistanceFt || 1) * 12 + (this.config.bearingDistanceIn || 0));
        const backwallClearance = ((this.config.backwallClearanceFt || 0) * 12 + (this.config.backwallClearanceIn || 2));
        const breastwallDist = ((this.config.breastwallFt || 2) * 12 + (this.config.breastwallIn || 6));
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        
        // Helper function to draw dimension line with arrows and text
        const drawDimLine = (x1, y1, x2, y2, label, offset = 0, textWidth = 60) => {
            // Dimension line
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1);
            line.setAttribute('y1', y1);
            line.setAttribute('x2', x2);
            line.setAttribute('y2', y2);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '1');
            layer.appendChild(line);
            
            // Arrows
            const isHorizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
            if (isHorizontal) {
                // Left arrow
                const leftArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                leftArrow.setAttribute('d', `M ${x1} ${y1} L ${x1 + 5} ${y1 - 3} L ${x1 + 5} ${y1 + 3} Z`);
                leftArrow.setAttribute('fill', '#000');
                layer.appendChild(leftArrow);
                
                // Right arrow
                const rightArrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                rightArrow.setAttribute('d', `M ${x2} ${y2} L ${x2 - 5} ${y2 - 3} L ${x2 - 5} ${y2 + 3} Z`);
                rightArrow.setAttribute('fill', '#000');
                layer.appendChild(rightArrow);
            }
            
            // Text with background
            const textX = (x1 + x2) / 2;
            const textY = (y1 + y2) / 2 + offset;
            
            const textBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            textBg.setAttribute('x', textX - textWidth/2);
            textBg.setAttribute('y', textY - 10);
            textBg.setAttribute('width', textWidth);
            textBg.setAttribute('height', '15');
            textBg.setAttribute('fill', 'white');
            textBg.setAttribute('stroke', '#ccc');
            textBg.setAttribute('stroke-width', '0.5');
            layer.appendChild(textBg);
            
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', textX);
            text.setAttribute('y', textY);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('fill', '#000');
            text.setAttribute('font-size', '11');
            text.setAttribute('font-weight', 'bold');
            text.textContent = label;
            layer.appendChild(text);
        };
        
        // Dimension line vertical positions (harmonized spacing)
        const dimLevel1 = y - 60;  // Top level - overall length
        const dimLevel2 = y - 35;  // Second level - bearing distances
        const dimLevel3 = y + depth * scale + 25; // Bottom level - bearing C/L
        const dimLevel4 = y + depth * scale + 50; // Bottom level 2 - clearances
        
        // Calculate bearing positions
        const leftBearingX = x + bearingDist * scale;
        const rightBearingX = x + (length - bearingDist) * scale;
        const leftBreastwallX = leftBearingX - breastwallDist * scale;
        const rightBreastwallX = rightBearingX + breastwallDist * scale;
        
        // Draw vertical extension lines for key positions
        const drawExtensionLine = (xPos, label = '', yStart = y - 70, yEnd = y + depth * scale + 70) => {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', xPos);
            line.setAttribute('y1', yStart);
            line.setAttribute('x2', xPos);
            line.setAttribute('y2', yEnd);
            line.setAttribute('stroke', '#666');
            line.setAttribute('stroke-width', '0.5');
            line.setAttribute('stroke-dasharray', '3 3');
            layer.appendChild(line);
            
            if (label) {
                const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                text.setAttribute('x', xPos);
                text.setAttribute('y', yStart - 5);
                text.setAttribute('text-anchor', 'middle');
                text.setAttribute('fill', '#666');
                text.setAttribute('font-size', '9');
                text.textContent = label;
                layer.appendChild(text);
            }
        };
        
        // Draw extension lines for critical alignments
        drawExtensionLine(leftBearingX, 'BRG');
        drawExtensionLine(rightBearingX, 'BRG');
        drawExtensionLine(leftBreastwallX, 'BW');
        drawExtensionLine(rightBreastwallX, 'BW');
        
        // 1. Overall beam length dimension (top level)
        drawDimLine(x, dimLevel1, x + length * scale, dimLevel1, 
                   `${this.config.lengthFt}'-${this.config.lengthIn}"`, -5, 70);
        
        // 2. Bearing distance from ends (second level)
        drawDimLine(x, dimLevel2, leftBearingX, dimLevel2, 
                   `${Math.floor(bearingDist/12)}'-${bearingDist%12}"`, -5, 50);
        drawDimLine(rightBearingX, dimLevel2, x + length * scale, dimLevel2, 
                   `${Math.floor(bearingDist/12)}'-${bearingDist%12}"`, -5, 50);
        
        // 3. Bearing C/L dimension (bottom)
        drawDimLine(leftBearingX, dimLevel3, rightBearingX, dimLevel3, 
                   `${Math.floor(bearingCL/12)}'-${bearingCL%12}" BRG C/L`, -5, 80);
        
        // 4. Breastwall dimensions
        drawDimLine(leftBreastwallX, dimLevel3 - 20, leftBearingX, dimLevel3 - 20,
                   `${Math.floor(breastwallDist/12)}'-${breastwallDist%12}" BW`, -5, 50);
        drawDimLine(rightBearingX, dimLevel3 - 20, rightBreastwallX, dimLevel3 - 20,
                   `${Math.floor(breastwallDist/12)}'-${breastwallDist%12}" BW`, -5, 50);
        
        // 5. Backwall clearance dimensions if present
        if (backwallClearance > 0) {
            // Left backwall clearance
            drawDimLine(x - backwallClearance * scale, dimLevel4, x, dimLevel4, 
                       `${Math.floor(backwallClearance/12)}'-${backwallClearance%12}" CLR`, -5, 60);
            
            // Right backwall clearance
            drawDimLine(x + length * scale, dimLevel4, x + length * scale + backwallClearance * scale, dimLevel4,
                       `${Math.floor(backwallClearance/12)}'-${backwallClearance%12}" CLR`, -5, 60);
        }
    }
    
    drawBeamEndDimensions(x, y, depth, scale) {
        const layer = document.getElementById('dimension-layer');
        const flangeHeight = this.config.profileData.flangeHeight;
        const webHeight = this.config.profileData.depth - 2 * flangeHeight;
        
        // Right side dimensions
        const dimX = x - 60;
        
        // Top flange dimension
        const topFlangeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Dimension line with arrows
        const topLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        topLine.setAttribute('x1', dimX);
        topLine.setAttribute('y1', y);
        topLine.setAttribute('x2', dimX);
        topLine.setAttribute('y2', y + flangeHeight * scale);
        topLine.setAttribute('stroke', '#000');
        topLine.setAttribute('stroke-width', '1');
        topFlangeGroup.appendChild(topLine);
        
        // Extension lines
        const ext1 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ext1.setAttribute('x1', dimX - 5);
        ext1.setAttribute('y1', y);
        ext1.setAttribute('x2', x);
        ext1.setAttribute('y2', y);
        ext1.setAttribute('stroke', '#000');
        ext1.setAttribute('stroke-width', '0.5');
        topFlangeGroup.appendChild(ext1);
        
        const ext2 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ext2.setAttribute('x1', dimX - 5);
        ext2.setAttribute('y1', y + flangeHeight * scale);
        ext2.setAttribute('x2', x);
        ext2.setAttribute('y2', y + flangeHeight * scale);
        ext2.setAttribute('stroke', '#000');
        ext2.setAttribute('stroke-width', '0.5');
        topFlangeGroup.appendChild(ext2);
        
        // Text (convert to fractional inches)
        const topText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        topText.setAttribute('x', dimX - 10);
        topText.setAttribute('y', y + flangeHeight * scale / 2);
        topText.setAttribute('text-anchor', 'end');
        topText.setAttribute('fill', '#000');
        topText.setAttribute('font-size', '10');
        topText.textContent = this.formatInches(flangeHeight);
        topFlangeGroup.appendChild(topText);
        
        layer.appendChild(topFlangeGroup);
        
        // Web dimension
        const webGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const webLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        webLine.setAttribute('x1', dimX);
        webLine.setAttribute('y1', y + flangeHeight * scale);
        webLine.setAttribute('x2', dimX);
        webLine.setAttribute('y2', y + (flangeHeight + webHeight) * scale);
        webLine.setAttribute('stroke', '#000');
        webLine.setAttribute('stroke-width', '1');
        webGroup.appendChild(webLine);
        
        const webText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        webText.setAttribute('x', dimX - 10);
        webText.setAttribute('y', y + (flangeHeight + webHeight/2) * scale);
        webText.setAttribute('text-anchor', 'end');
        webText.setAttribute('fill', '#000');
        webText.setAttribute('font-size', '10');
        webText.textContent = this.formatInches(webHeight);
        webGroup.appendChild(webText);
        
        layer.appendChild(webGroup);
        
        // Bottom flange dimension
        const bottomFlangeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const bottomDimLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        bottomDimLine.setAttribute('x1', dimX);
        bottomDimLine.setAttribute('y1', y + (depth - flangeHeight) * scale);
        bottomDimLine.setAttribute('x2', dimX);
        bottomDimLine.setAttribute('y2', y + depth * scale);
        bottomDimLine.setAttribute('stroke', '#000');
        bottomDimLine.setAttribute('stroke-width', '1');
        bottomFlangeGroup.appendChild(bottomDimLine);
        
        const ext3 = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        ext3.setAttribute('x1', dimX - 5);
        ext3.setAttribute('y1', y + depth * scale);
        ext3.setAttribute('x2', x);
        ext3.setAttribute('y2', y + depth * scale);
        ext3.setAttribute('stroke', '#000');
        ext3.setAttribute('stroke-width', '0.5');
        bottomFlangeGroup.appendChild(ext3);
        
        const bottomText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        bottomText.setAttribute('x', dimX - 10);
        bottomText.setAttribute('y', y + (depth - flangeHeight/2) * scale);
        bottomText.setAttribute('text-anchor', 'end');
        bottomText.setAttribute('fill', '#000');
        bottomText.setAttribute('font-size', '10');
        bottomText.textContent = this.formatInches(flangeHeight);
        bottomFlangeGroup.appendChild(bottomText);
        
        layer.appendChild(bottomFlangeGroup);
        
        // Overall depth dimension
        const overallDimX = dimX - 30;
        const overallGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        const overallLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        overallLine.setAttribute('x1', overallDimX);
        overallLine.setAttribute('y1', y);
        overallLine.setAttribute('x2', overallDimX);
        overallLine.setAttribute('y2', y + depth * scale);
        overallLine.setAttribute('stroke', '#000');
        overallLine.setAttribute('stroke-width', '1');
        overallGroup.appendChild(overallLine);
        
        const overallText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        overallText.setAttribute('x', overallDimX - 10);
        overallText.setAttribute('y', y + depth * scale / 2);
        overallText.setAttribute('text-anchor', 'end');
        overallText.setAttribute('fill', '#000');
        overallText.setAttribute('font-size', '10');
        overallText.textContent = this.formatInches(depth);
        overallGroup.appendChild(overallText);
        
        layer.appendChild(overallGroup);
    }
    
    formatInches(inches) {
        const feet = Math.floor(inches / 12);
        const remainingInches = inches % 12;
        
        // Convert decimal inches to fractions
        const wholePart = Math.floor(remainingInches);
        const decimalPart = remainingInches - wholePart;
        
        let fraction = '';
        if (decimalPart > 0) {
            // Common fractions
            if (Math.abs(decimalPart - 0.5) < 0.01) fraction = '1/2';
            else if (Math.abs(decimalPart - 0.25) < 0.01) fraction = '1/4';
            else if (Math.abs(decimalPart - 0.75) < 0.01) fraction = '3/4';
            else if (Math.abs(decimalPart - 0.125) < 0.01) fraction = '1/8';
            else if (Math.abs(decimalPart - 0.375) < 0.01) fraction = '3/8';
            else if (Math.abs(decimalPart - 0.625) < 0.01) fraction = '5/8';
            else if (Math.abs(decimalPart - 0.875) < 0.01) fraction = '7/8';
            else if (Math.abs(decimalPart - 0.0625) < 0.01) fraction = '1/16';
            else if (Math.abs(decimalPart - 0.1875) < 0.01) fraction = '3/16';
            else if (Math.abs(decimalPart - 0.3125) < 0.01) fraction = '5/16';
            else if (Math.abs(decimalPart - 0.4375) < 0.01) fraction = '7/16';
            else if (Math.abs(decimalPart - 0.5625) < 0.01) fraction = '9/16';
            else if (Math.abs(decimalPart - 0.6875) < 0.01) fraction = '11/16';
            else if (Math.abs(decimalPart - 0.8125) < 0.01) fraction = '13/16';
            else if (Math.abs(decimalPart - 0.9375) < 0.01) fraction = '15/16';
        }
        
        if (feet > 0) {
            if (wholePart > 0 || fraction) {
                const inchPart = wholePart > 0 ? 
                    (fraction ? `${wholePart}-${fraction}` : `${wholePart}`) : 
                    fraction;
                return `${feet}'-${inchPart}"`;
            } else {
                return `${feet}'-0"`;
            }
        } else {
            if (wholePart > 0) {
                return fraction ? `${wholePart}-${fraction}"` : `${wholePart}"`;
            } else if (fraction) {
                return `${fraction}"`;
            } else {
                return '0"';
            }
        }
    }
    
    drawOrdinates(x, y, length, depth, scale) {
        const layer = document.getElementById('dimension-layer');
        
        // Always draw at bottom, origin just affects numbering direction
        const ordinateY = y + depth * scale + 60;
        const barHeight = 10;
        
        // Create group for ordinates
        const ordinateGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        
        // Draw engineer's scale with alternating black and white bars
        for (let i = 0; i < length; i += 12) {
            const xPos = x + i * scale;
            const barWidth = Math.min(12, length - i) * scale;
            const footIndex = i / 12;
            
            // Alternate between black and white
            const fillColor = footIndex % 2 === 0 ? '#000' : '#fff';
            
            // Draw the bar
            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', xPos);
            bar.setAttribute('y', ordinateY - barHeight / 2);
            bar.setAttribute('width', barWidth);
            bar.setAttribute('height', barHeight);
            bar.setAttribute('fill', fillColor);
            bar.setAttribute('stroke', '#000');
            bar.setAttribute('stroke-width', '1');
            ordinateGroup.appendChild(bar);
            
            // Add inch subdivisions for each foot
            if (barWidth === 12 * scale) {
                for (let j = 1; j < 12; j++) {
                    const inchX = xPos + j * scale;
                    const tickHeight = j % 3 === 0 ? 6 : 3; // Longer ticks at 3" intervals
                    
                    const inchTick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    inchTick.setAttribute('x1', inchX);
                    inchTick.setAttribute('y1', ordinateY - tickHeight);
                    inchTick.setAttribute('x2', inchX);
                    inchTick.setAttribute('y2', ordinateY + tickHeight);
                    inchTick.setAttribute('stroke', fillColor === '#000' ? '#fff' : '#000');
                    inchTick.setAttribute('stroke-width', '0.5');
                    ordinateGroup.appendChild(inchTick);
                }
            }
            
            // Add foot numbers (reverse if origin is right)
            const footNumber = this.state.ordinateOrigin === 'left' ? footIndex : Math.floor(length / 12) - footIndex;
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', xPos);
            label.setAttribute('y', ordinateY + 20);
            label.setAttribute('text-anchor', 'start');
            label.setAttribute('fill', '#fff');
            label.setAttribute('font-size', '12');
            label.setAttribute('font-weight', 'bold');
            label.textContent = footNumber.toString();
            ordinateGroup.appendChild(label);
        }
        
        // Add final foot marker if needed
        const totalFeet = Math.floor(length / 12);
        const finalX = x + totalFeet * 12 * scale;
        const finalNumber = this.state.ordinateOrigin === 'left' ? totalFeet : 0;
        const finalLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        finalLabel.setAttribute('x', finalX);
        finalLabel.setAttribute('y', ordinateY + 20);
        finalLabel.setAttribute('text-anchor', 'start');
        finalLabel.setAttribute('fill', '#fff');
        finalLabel.setAttribute('font-size', '12');
        finalLabel.setAttribute('font-weight', 'bold');
        finalLabel.textContent = finalNumber.toString();
        ordinateGroup.appendChild(finalLabel);
        
        layer.appendChild(ordinateGroup);
    }
    
    drawGrid(x, y, length, depth, scale) {
        const layer = document.getElementById('grid-layer');
        
        // Create grid overlay with better visibility
        const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        gridGroup.setAttribute('opacity', '0.5'); // More visible
        
        // Draw vertical lines (1" spacing)
        for (let i = 0; i <= length; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x + i * scale);
            line.setAttribute('y1', y);
            line.setAttribute('x2', x + i * scale);
            line.setAttribute('y2', y + depth * scale);
            line.setAttribute('stroke', '#000');
            line.setAttribute('stroke-width', '0.5'); // Thicker lines
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
            line.setAttribute('stroke-width', '0.5'); // Thicker lines
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