// VisualBeam V3 - Mobile Optimized with Three Modes

class VisualBeamV3 {
    constructor() {
        this.loadConfiguration();
        this.initializeState();
        this.init();
    }

    loadConfiguration() {
        const savedConfig = localStorage.getItem('beamConfig');
        if (savedConfig) {
            this.config = JSON.parse(savedConfig);
        } else {
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
                direction: 'south',
                inspector: 'J. Smith'
            };
        }

        // Initialize geometry calculator
        if (typeof BridgeGeometry !== 'undefined') {
            this.geometry = new BridgeGeometry(this.config);
        }
    }

    initializeState() {
        this.state = {
            mode: 'edit',  // edit, annotate, view
            tool: 'mark',
            conditionState: 1,
            brushRadius: 1,  // Brush radius in inches
            gridSize: 1,  // 1" grid
            zoom: 1,
            pan: { x: 0, y: 0 },
            showZones: false,
            showBearings: true,
            showAbutments: true,
            showDimensions: true,
            showGrid: true,
            showPhotos: true,
            ordinateOrigin: 'left',  // 'left' or 'right' - reversible
            defects: [],
            selectedCells: new Set(),
            annotations: [],
            photos: [],
            cellsMarked: 0,
            isDragging: false,
            isPanning: false,
            dragStart: null,
            panStart: null,
            touchStart: null,
            pinchDistance: 0
        };

        // Beam profiles database
        this.profiles = {
            '18wf114': { depth: 18.5, flangeWidth: 11.875, flangeThickness: 1.0, webThickness: 0.5625, weight: 114 },
            '21wf142': { depth: 21.5, flangeWidth: 13.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 142 },
            '24wf160': { depth: 24.625, flangeWidth: 14.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 160 },
            '30wf210': { depth: 30.375, flangeWidth: 15.125, flangeThickness: 1.3125, webThickness: 0.75, weight: 210 },
            '36wf300': { depth: 36.75, flangeWidth: 16.625, flangeThickness: 1.6875, webThickness: 0.9375, weight: 300 }
        };

        this.config.profileData = this.profiles[this.config.profile];
    }

    init() {
        this.svg = document.getElementById('beam-canvas');
        this.setupEventListeners();
        this.updateUI();
        this.calculateScale();
        this.render();
        this.updateStatusBar();
        this.updateViewOrientation();
    }

    setupEventListeners() {
        // Mode switching
        document.querySelectorAll('.mode-tab').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.closest('.mode-tab').dataset.mode));
        });

        // Tool selection for each mode
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tool = e.target.closest('.tool-btn').dataset.tool;
                this.selectTool(tool);
            });
        });

        // Condition state buttons
        document.querySelectorAll('.cs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cs-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (btn.dataset.cs === 'holes') {
                    this.state.conditionState = 'holes';
                } else {
                    this.state.conditionState = parseInt(btn.dataset.cs);
                }
            });
        });

        // Brush radius selector
        document.getElementById('brush-radius')?.addEventListener('change', (e) => {
            this.state.brushRadius = parseInt(e.target.value);
        });

        // View controls
        document.getElementById('zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out')?.addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit')?.addEventListener('click', () => this.fitToExtents());
        
        document.getElementById('touch-zoom-in')?.addEventListener('click', () => this.zoomIn());
        document.getElementById('touch-zoom-out')?.addEventListener('click', () => this.zoomOut());

        // Toggle controls
        document.getElementById('show-dimensions')?.addEventListener('change', (e) => {
            this.state.showDimensions = e.target.checked;
            this.render();
        });

        document.getElementById('show-zones')?.addEventListener('change', (e) => {
            this.state.showZones = e.target.checked;
            this.render();
        });

        document.getElementById('show-grid')?.addEventListener('change', (e) => {
            this.state.showGrid = e.target.checked;
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

        document.getElementById('toggle-grid')?.addEventListener('click', () => {
            this.state.showGrid = !this.state.showGrid;
            this.render();
        });

        // Ordinate origin selector
        document.getElementById('ordinate-origin')?.addEventListener('change', (e) => {
            this.state.ordinateOrigin = e.target.value;
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

        // Action buttons
        document.getElementById('clear-all')?.addEventListener('click', () => this.clearAll());
        document.getElementById('delete-annotation')?.addEventListener('click', () => this.deleteSelectedAnnotation());
        document.getElementById('export-btn')?.addEventListener('click', () => this.exportDrawing());

        // Mobile menu
        document.getElementById('menu-toggle')?.addEventListener('click', () => this.toggleMenu());
        document.getElementById('close-menu')?.addEventListener('click', () => this.closeMenu());
        document.getElementById('menu-save')?.addEventListener('click', () => this.saveProgress());
        document.getElementById('menu-load')?.addEventListener('click', () => this.loadProgress());
        document.getElementById('menu-export')?.addEventListener('click', () => this.exportDrawing());
    }

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
            this.selectTool('mark');
        } else if (mode === 'annotate') {
            this.selectTool('dimension');
        } else if (mode === 'view') {
            this.selectTool('pan');
        }
    }

    selectTool(tool) {
        this.state.tool = tool;
        
        // Update tool button states in current toolbar
        const activeToolbar = document.querySelector('.mode-toolbar.active');
        if (activeToolbar) {
            activeToolbar.querySelectorAll('.tool-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.tool === tool);
            });
        }
        
        // Update cursor
        this.updateCursor();
    }

    updateCursor() {
        const cursors = {
            'mark': 'crosshair',
            'select': 'default',
            'erase': 'not-allowed',
            'pan': 'move',
            'zoom': 'zoom-in',
            'dimension': 'crosshair',
            'text': 'text',
            'arrow': 'crosshair',
            'photo': 'crosshair'
        };
        
        this.svg.style.cursor = cursors[this.state.tool] || 'default';
    }

    updateViewOrientation() {
        // Update view orientation display
        const direction = this.config.direction || 'south';
        const orientationEl = document.getElementById('view-orientation');
        if (orientationEl) {
            orientationEl.textContent = `${direction.toUpperCase()} ELEVATION`;
        }
    }

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

    updateUI() {
        document.getElementById('project-name').textContent = this.config.projectName;
        document.getElementById('beam-id').textContent = this.config.beamId;
    }

    updateStatusBar() {
        const profile = this.config.profileData;
        document.getElementById('beam-profile').textContent = this.config.profile.toUpperCase();
        document.getElementById('beam-length').textContent = `${this.config.lengthFt}'-${this.config.lengthIn}"`;
        document.getElementById('beam-depth').textContent = profile.depth + '"';
        document.getElementById('web-thickness').textContent = profile.webThickness + '"';
        document.getElementById('inspector').textContent = this.config.inspector;
    }

    render() {
        this.clearLayers();
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        const scale = this.scale * this.state.zoom;
        
        // Center the beam in the viewport
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        const beamX = centerX - (beamLength * scale) / 2 + this.state.pan.x;
        const beamY = centerY - (beamDepth * scale) / 2 + this.state.pan.y;
        
        // Draw in correct order (matching sketch reference)
        this.drawAbutments(beamX, beamY, beamLength, beamDepth, scale);
        this.drawBearings(beamX, beamY, beamLength, beamDepth, scale);
        
        if (this.state.showZones) {
            this.drawZones(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        if (this.state.showGrid) {
            this.drawGrid(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawBeam(beamX, beamY, beamLength, beamDepth, scale);
        this.drawDefects(beamX, beamY, scale);
        
        if (this.state.showDimensions) {
            this.drawDimensions(beamX, beamY, beamLength, beamDepth, scale);
            this.drawOrdinates(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawAnnotations(beamX, beamY, scale);
        
        // Update zoom display
        document.querySelectorAll('.zoom-level').forEach(el => {
            el.textContent = Math.round(this.state.zoom * 100) + '%';
        });
    }

    clearLayers() {
        const layers = [
            'background-layer', 'abutment-layer', 'bearing-layer', 
            'zone-layer', 'grid-layer', 'beam-layer', 
            'defect-layer', 'dimension-layer', 'annotation-layer'
        ];
        
        layers.forEach(id => {
            const layer = document.getElementById(id);
            if (layer) {
                while (layer.firstChild) {
                    layer.removeChild(layer.firstChild);
                }
            }
        });
    }

    drawAbutments(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('abutment-layer');
        if (!layer) return;
        
        const seatHeight = 6;  // Height of bridge seat in inches
        const backwallHeight = beamDepth + 12;  // Backwall extends above beam
        
        // Left abutment (as shown in sketch)
        if (this.config.seatLeft > 0) {
            // Bridge seat
            const seatRect = this.createSVGElement('rect', {
                x: x - this.config.seatLeft * scale,
                y: y + beamDepth * scale - seatHeight * scale,
                width: this.config.seatLeft * scale,
                height: seatHeight * scale + 20 * scale,
                class: 'bridge-seat'
            });
            layer.appendChild(seatRect);
            
            // Backwall (vertical at beam end)
            const backwallRect = this.createSVGElement('rect', {
                x: x - this.config.backwallLeft * scale,
                y: y - 6 * scale,
                width: this.config.backwallLeft * scale,
                height: backwallHeight * scale,
                class: 'backwall'
            });
            layer.appendChild(backwallRect);
            
            // Breastwall (drops from inner edge of seat)
            const breastwallRect = this.createSVGElement('rect', {
                x: x - this.config.seatLeft * scale,
                y: y + beamDepth * scale + seatHeight * scale,
                width: 6 * scale,
                height: 24 * scale,
                class: 'breastwall'
            });
            layer.appendChild(breastwallRect);
        }
        
        // Right abutment (mirror)
        if (this.config.seatRight > 0) {
            // Bridge seat
            const seatRect = this.createSVGElement('rect', {
                x: x + beamLength * scale,
                y: y + beamDepth * scale - seatHeight * scale,
                width: this.config.seatRight * scale,
                height: seatHeight * scale + 20 * scale,
                class: 'bridge-seat'
            });
            layer.appendChild(seatRect);
            
            // Backwall
            const backwallRect = this.createSVGElement('rect', {
                x: x + beamLength * scale,
                y: y - 6 * scale,
                width: this.config.backwallRight * scale,
                height: backwallHeight * scale,
                class: 'backwall'
            });
            layer.appendChild(backwallRect);
            
            // Breastwall
            const breastwallRect = this.createSVGElement('rect', {
                x: x + beamLength * scale + this.config.seatRight * scale - 6 * scale,
                y: y + beamDepth * scale + seatHeight * scale,
                width: 6 * scale,
                height: 24 * scale,
                class: 'breastwall'
            });
            layer.appendChild(breastwallRect);
        }
    }

    drawBearings(x, y, beamLength, beamDepth, scale) {
        if (!this.state.showBearings) return;
        
        const layer = document.getElementById('bearing-layer');
        if (!layer) return;
        
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        const bearingOffset = (beamLength - bearingCL) / 2;
        const bearingWidth = 18;
        const bearingHeight = 6;
        const profile = this.config.profileData;
        
        // Bearings sit on bridge seat, under bottom flange
        const bearingY = y + (beamDepth - profile.flangeThickness) * scale;
        
        // Left bearing
        const leftBearing = this.createSVGElement('rect', {
            x: x + bearingOffset * scale - (bearingWidth * scale / 2),
            y: bearingY,
            width: bearingWidth * scale,
            height: bearingHeight * scale,
            rx: 2,
            class: 'bearing'
        });
        layer.appendChild(leftBearing);
        
        // Right bearing
        const rightBearing = this.createSVGElement('rect', {
            x: x + (beamLength - bearingOffset) * scale - (bearingWidth * scale / 2),
            y: bearingY,
            width: bearingWidth * scale,
            height: bearingHeight * scale,
            rx: 2,
            class: 'bearing'
        });
        layer.appendChild(rightBearing);
        
        // Draw bearing centerlines if both dimensions and bearings are shown
        if (this.state.showDimensions) {
            // Left bearing centerline
            const leftCL = this.createSVGElement('line', {
                x1: x + bearingOffset * scale,
                y1: y - 10 * scale,
                x2: x + bearingOffset * scale,
                y2: y + beamDepth * scale + 10 * scale,
                stroke: '#FF5722',
                'stroke-width': 1,
                'stroke-dasharray': '4 2',
                opacity: 0.7
            });
            layer.appendChild(leftCL);
            
            // Right bearing centerline
            const rightCL = this.createSVGElement('line', {
                x1: x + (beamLength - bearingOffset) * scale,
                y1: y - 10 * scale,
                x2: x + (beamLength - bearingOffset) * scale,
                y2: y + beamDepth * scale + 10 * scale,
                stroke: '#FF5722',
                'stroke-width': 1,
                'stroke-dasharray': '4 2',
                opacity: 0.7
            });
            layer.appendChild(rightCL);
            
            // Add CL labels
            const leftLabel = this.createSVGElement('text', {
                x: x + bearingOffset * scale + 5,
                y: y - 15 * scale,
                fill: '#FF5722',
                'font-size': '10',
                'font-weight': 'bold'
            });
            leftLabel.textContent = 'CL';
            layer.appendChild(leftLabel);
            
            const rightLabel = this.createSVGElement('text', {
                x: x + (beamLength - bearingOffset) * scale + 5,
                y: y - 15 * scale,
                fill: '#FF5722',
                'font-size': '10',
                'font-weight': 'bold'
            });
            rightLabel.textContent = 'CL';
            layer.appendChild(rightLabel);
        }
    }

    drawZones(x, y, beamLength, beamDepth, scale) {
        if (!this.geometry) return;
        
        const layer = document.getElementById('zone-layer');
        if (!layer) return;
        
        const zones = this.geometry.getInspectionZones();
        
        // Draw zone overlays
        Object.entries(zones).forEach(([zoneType, zoneData]) => {
            if (Array.isArray(zoneData)) {
                zoneData.forEach(zone => {
                    const rect = this.createSVGElement('rect', {
                        x: x + zone.start * scale,
                        y: y,
                        width: (zone.end - zone.start) * scale,
                        height: beamDepth * scale,
                        class: `zone-overlay zone-${zoneType.toLowerCase()}-area`
                    });
                    layer.appendChild(rect);
                });
            } else if (zoneData && zoneData.start !== undefined) {
                const rect = this.createSVGElement('rect', {
                    x: x + zoneData.start * scale,
                    y: y,
                    width: (zoneData.end - zoneData.start) * scale,
                    height: beamDepth * scale,
                    class: `zone-overlay zone-${zoneType.toLowerCase()}-area`
                });
                layer.appendChild(rect);
            }
        });
    }

    drawGrid(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('grid-layer');
        if (!layer) return;
        
        const gridSize = this.state.gridSize;  // 1" grid size in inches
        const gridSpacing = gridSize * scale;  // Scaled grid spacing
        
        // Create a clipping path for the beam area only
        const clipPath = this.createSVGElement('clipPath', {
            id: 'beam-clip'
        });
        
        // Define beam outline for clipping
        const beamPath = this.createSVGElement('rect', {
            x: x,
            y: y,
            width: beamLength * scale,
            height: beamDepth * scale
        });
        clipPath.appendChild(beamPath);
        
        // Add clipPath to defs
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
        
        // Calculate number of grid cells
        const numCellsX = Math.ceil(beamLength / gridSize);
        const numCellsY = Math.ceil(beamDepth / gridSize);
        
        // Draw grid cells as interactive rectangles (1"x1" grid)
        for (let i = 0; i < numCellsX; i++) {
            for (let j = 0; j < numCellsY; j++) {
                const cellX = x + i * gridSpacing;
                const cellY = y + j * gridSpacing;
                
                // Only draw cells within beam bounds
                if (cellX < x + beamLength * scale && cellY < y + beamDepth * scale) {
                    const cellWidth = Math.min(gridSpacing, x + beamLength * scale - cellX);
                    const cellHeight = Math.min(gridSpacing, y + beamDepth * scale - cellY);
                    
                    // Create interactive grid cell
                    const cell = this.createSVGElement('rect', {
                        x: cellX,
                        y: cellY,
                        width: cellWidth,
                        height: cellHeight,
                        class: 'grid-cell',
                        'data-grid-x': i,
                        'data-grid-y': j,
                        fill: 'none',
                        stroke: 'rgba(0,0,0,0.3)',
                        'stroke-width': 0.5,
                        'pointer-events': 'all'
                    });
                    
                    // Add hover effects
                    cell.addEventListener('mouseenter', (e) => {
                        if (this.state.mode === 'edit' && (this.state.tool === 'mark' || this.state.tool === 'erase')) {
                            e.target.setAttribute('stroke', '#2196F3');
                            e.target.setAttribute('stroke-width', '1');
                            e.target.setAttribute('fill', 'rgba(33, 150, 243, 0.1)');
                        }
                    });
                    
                    cell.addEventListener('mouseleave', (e) => {
                        e.target.setAttribute('stroke', 'rgba(0,0,0,0.3)');
                        e.target.setAttribute('stroke-width', '0.5');
                        e.target.setAttribute('fill', 'none');
                    });
                    
                    gridGroup.appendChild(cell);
                }
            }
        }
        
        // Add major grid lines at 12" intervals (1 foot)
        // Vertical lines at 12" intervals
        for (let i = 0; i <= numCellsX; i++) {
            if (i % 12 === 0) {  // Every 12 inches
                const xPos = x + i * gridSpacing;
                if (xPos <= x + beamLength * scale) {
                    const line = this.createSVGElement('line', {
                        x1: xPos,
                        y1: y,
                        x2: xPos,
                        y2: y + beamDepth * scale,
                        stroke: 'rgba(0,0,0,0.5)',
                        'stroke-width': 1,
                        'pointer-events': 'none'
                    });
                    gridGroup.appendChild(line);
                }
            }
        }
        
        // Horizontal lines at 12" intervals
        for (let j = 0; j <= numCellsY; j++) {
            if (j % 12 === 0) {  // Every 12 inches
                const yPos = y + j * gridSpacing;
                if (yPos <= y + beamDepth * scale) {
                    const line = this.createSVGElement('line', {
                        x1: x,
                        y1: yPos,
                        x2: x + beamLength * scale,
                        y2: yPos,
                        stroke: 'rgba(0,0,0,0.5)',
                        'stroke-width': 1,
                        'pointer-events': 'none'
                    });
                    gridGroup.appendChild(line);
                }
            }
        }
        
        layer.appendChild(gridGroup);
    }

    drawBeam(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('beam-layer');
        if (!layer) return;
        
        const profile = this.config.profileData;
        
        // Create beam group with default CS1 (light green)
        const beamGroup = this.createSVGElement('g', {
            class: 'beam-cs-1'
        });
        
        // Top flange
        if (this.config.topFlangeVisible) {
            const topFlange = this.createSVGElement('rect', {
                x: x,
                y: y,
                width: beamLength * scale,
                height: profile.flangeThickness * scale,
                class: 'beam-flange beam-cs-1'
            });
            beamGroup.appendChild(topFlange);
        }
        
        // Web - horizontal, full length
        const webY = y + profile.flangeThickness * scale;
        const webHeight = (beamDepth - 2 * profile.flangeThickness) * scale;
        const web = this.createSVGElement('rect', {
            x: x,
            y: webY,
            width: beamLength * scale,
            height: webHeight,
            class: 'beam-web beam-cs-1'
        });
        beamGroup.appendChild(web);
        
        // Bottom flange
        const bottomFlange = this.createSVGElement('rect', {
            x: x,
            y: y + (beamDepth - profile.flangeThickness) * scale,
            width: beamLength * scale,
            height: profile.flangeThickness * scale,
            class: 'beam-flange beam-cs-1'
        });
        beamGroup.appendChild(bottomFlange);
        
        layer.appendChild(beamGroup);
    }

    drawDefects(x, y, scale) {
        const layer = document.getElementById('defect-layer');
        if (!layer) return;
        
        this.state.defects.forEach(defect => {
            const csClass = defect.conditionState === 'holes' ? 'defect-cs-holes' : `defect-cs-${defect.conditionState}`;
            const rect = this.createSVGElement('rect', {
                x: x + defect.x * scale,
                y: y + defect.y * scale,
                width: defect.width * scale,
                height: defect.height * scale,
                class: csClass,
                opacity: 0.7
            });
            layer.appendChild(rect);
        });
    }

    drawDimensions(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('dimension-layer');
        if (!layer) return;
        
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        const profile = this.config.profileData;
        
        // Beam length dimension
        this.drawHorizontalDimension(layer, x, x + beamLength * scale, y - 40, 
            `BEAM LENGTH: ${this.config.lengthFt}'-${this.config.lengthIn}"`);
        
        // Span length (bearing CL to CL)
        const bearingOffset = (beamLength - bearingCL) / 2;
        this.drawHorizontalDimension(layer, 
            x + bearingOffset * scale, 
            x + (beamLength - bearingOffset) * scale, 
            y - 20,
            `SPAN LENGTH (BEARING CL TO CL): ${Math.floor(bearingCL/12)}'-${bearingCL%12}"`);
        
        // Abutment-related dimensions (only show when abutments are visible)
        if (this.state.showAbutments) {
            // Breastwall distance
            const breastwallDist = this.config.breastwallFt * 12 + this.config.breastwallIn;
            const breastwallOffset = (beamLength - breastwallDist) / 2;
            this.drawHorizontalDimension(layer,
                x + breastwallOffset * scale,
                x + (beamLength - breastwallOffset) * scale,
                y + beamDepth * scale + 40,
                `BREASTWALL DISTANCE: ${this.config.breastwallFt}'-${this.config.breastwallIn}"`);
            
            // Backwall clearance (at beam ends)
            const backwallClearance = 3; // 3 inches typical
            // Left backwall clearance
            this.drawHorizontalDimension(layer,
                x + beamLength * scale,
                x + beamLength * scale + backwallClearance * scale,
                y - 60,
                `BACKWALL CLEARANCE`);
        }
        
        // Vertical dimensions at ordinate origin (0 end)
        const dimX = this.state.ordinateOrigin === 'left' ? x - 30 : x + beamLength * scale + 30;
        
        // Top flange dimension
        this.drawVerticalDimension(layer, dimX, y, y + profile.flangeThickness * scale, 
            this.formatDimension(profile.flangeThickness));
        
        // Web height dimension
        const webTop = y + profile.flangeThickness * scale;
        const webBottom = y + (beamDepth - profile.flangeThickness) * scale;
        this.drawVerticalDimension(layer, dimX - 20, webTop, webBottom,
            this.formatDimension(beamDepth - 2 * profile.flangeThickness));
        
        // Bottom flange dimension
        this.drawVerticalDimension(layer, dimX, webBottom, y + beamDepth * scale,
            this.formatDimension(profile.flangeThickness));
        
        // Total depth dimension
        this.drawVerticalDimension(layer, dimX - 40, y, y + beamDepth * scale,
            this.formatDimension(beamDepth));
    }

    formatDimension(inches) {
        // Convert decimal inches to feet-inches format
        if (inches >= 12) {
            const feet = Math.floor(inches / 12);
            const remainingInches = inches % 12;
            if (remainingInches === 0) {
                return `${feet}'-0"`;
            } else if (remainingInches % 1 === 0) {
                return `${feet}'-${remainingInches}"`;
            } else {
                // Handle fractions
                const whole = Math.floor(remainingInches);
                const fraction = remainingInches - whole;
                let fractionStr = '';
                if (Math.abs(fraction - 0.5) < 0.01) fractionStr = '1/2';
                else if (Math.abs(fraction - 0.25) < 0.01) fractionStr = '1/4';
                else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = '3/4';
                
                if (whole === 0 && fractionStr) {
                    return `${feet}'-${fractionStr}"`;
                } else if (fractionStr) {
                    return `${feet}'-${whole}-${fractionStr}"`;
                } else {
                    return `${feet}'-${remainingInches.toFixed(1)}"`;
                }
            }
        } else {
            // Less than 12 inches
            if (inches % 1 === 0) {
                return `${inches}"`;
            } else {
                const whole = Math.floor(inches);
                const fraction = inches - whole;
                let fractionStr = '';
                if (Math.abs(fraction - 0.5) < 0.01) fractionStr = '1/2';
                else if (Math.abs(fraction - 0.25) < 0.01) fractionStr = '1/4';
                else if (Math.abs(fraction - 0.75) < 0.01) fractionStr = '3/4';
                
                if (whole === 0 && fractionStr) {
                    return `${fractionStr}"`;
                } else if (fractionStr) {
                    return `${whole}-${fractionStr}"`;
                } else {
                    return `${inches.toFixed(1)}"`;
                }
            }
        }
    }

    drawVerticalDimension(layer, x, y1, y2, text) {
        // Dimension line
        const line = this.createSVGElement('line', {
            x1: x,
            y1: y1,
            x2: x,
            y2: y2,
            class: 'dimension-line'
        });
        layer.appendChild(line);
        
        // End ticks
        const tick1 = this.createSVGElement('line', {
            x1: x - 5,
            y1: y1,
            x2: x + 5,
            y2: y1,
            class: 'dimension-line'
        });
        layer.appendChild(tick1);
        
        const tick2 = this.createSVGElement('line', {
            x1: x - 5,
            y1: y2,
            x2: x + 5,
            y2: y2,
            class: 'dimension-line'
        });
        layer.appendChild(tick2);
        
        // Text - rotated 90 degrees
        const textEl = this.createSVGElement('text', {
            x: x - 10,
            y: (y1 + y2) / 2,
            class: 'dimension-text',
            'text-anchor': 'middle',
            transform: `rotate(-90, ${x - 10}, ${(y1 + y2) / 2})`
        });
        textEl.textContent = text;
        layer.appendChild(textEl);
    }

    drawHorizontalDimension(layer, x1, x2, y, text) {
        // Dimension line
        const line = this.createSVGElement('line', {
            x1: x1,
            y1: y,
            x2: x2,
            y2: y,
            class: 'dimension-line'
        });
        layer.appendChild(line);
        
        // End ticks
        const tick1 = this.createSVGElement('line', {
            x1: x1,
            y1: y - 5,
            x2: x1,
            y2: y + 5,
            class: 'dimension-line'
        });
        layer.appendChild(tick1);
        
        const tick2 = this.createSVGElement('line', {
            x1: x2,
            y1: y - 5,
            x2: x2,
            y2: y + 5,
            class: 'dimension-line'
        });
        layer.appendChild(tick2);
        
        // Text
        const textEl = this.createSVGElement('text', {
            x: (x1 + x2) / 2,
            y: y - 8,
            class: 'dimension-text',
            'text-anchor': 'middle'
        });
        textEl.textContent = text;
        layer.appendChild(textEl);
    }

    drawOrdinates(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('dimension-layer');
        if (!layer) return;
        
        const ordinateY = y + beamDepth * scale + 60;
        
        // Create group for ordinates
        const ordinateGroup = this.createSVGElement('g', {
            class: 'ordinates'
        });
        
        // Draw baseline
        const baseline = this.createSVGElement('line', {
            x1: x - 10,
            y1: ordinateY,
            x2: x + beamLength * scale + 10,
            y2: ordinateY,
            class: 'ordinate-line',
            stroke: '#333',
            'stroke-width': 1
        });
        ordinateGroup.appendChild(baseline);
        
        // Draw origin indicator arrow
        const originX = this.state.ordinateOrigin === 'left' ? x : x + beamLength * scale;
        const arrowDir = this.state.ordinateOrigin === 'left' ? 1 : -1;
        
        const arrow = this.createSVGElement('path', {
            d: `M ${originX} ${ordinateY - 10} L ${originX + 15 * arrowDir} ${ordinateY} L ${originX} ${ordinateY + 10}`,
            fill: '#333',
            class: 'ordinate-arrow'
        });
        ordinateGroup.appendChild(arrow);
        
        // Draw ordinates every 12 inches (1 foot)
        for (let i = 0; i <= beamLength; i += 12) {
            const distance = this.state.ordinateOrigin === 'left' ? i : beamLength - i;
            const xPos = x + i * scale;
            
            // Tick mark
            const tick = this.createSVGElement('line', {
                x1: xPos,
                y1: ordinateY - 8,
                x2: xPos,
                y2: ordinateY + 8,
                stroke: '#333',
                'stroke-width': 1,
                class: 'ordinate-tick'
            });
            ordinateGroup.appendChild(tick);
            
            // Label
            const label = this.createSVGElement('text', {
                x: xPos,
                y: ordinateY + 20,
                class: 'ordinate-text',
                'text-anchor': 'middle',
                'font-size': '10px',
                fill: '#333'
            });
            
            // Format as feet and inches
            const feet = Math.floor(distance / 12);
            const inches = distance % 12;
            label.textContent = inches === 0 ? `${feet}'` : `${feet}'-${inches}"`;
            ordinateGroup.appendChild(label);
        }
        
        // Add label for origin
        const originLabel = this.createSVGElement('text', {
            x: originX + (this.state.ordinateOrigin === 'left' ? -20 : 20),
            y: ordinateY,
            class: 'ordinate-origin-label',
            'text-anchor': this.state.ordinateOrigin === 'left' ? 'end' : 'start',
            'font-size': '11px',
            'font-weight': 'bold',
            fill: '#333'
        });
        originLabel.textContent = '0';
        ordinateGroup.appendChild(originLabel);
        
        // Add instruction text
        const instruction = this.createSVGElement('text', {
            x: x + beamLength * scale / 2,
            y: ordinateY + 35,
            class: 'ordinate-instruction',
            'text-anchor': 'middle',
            'font-size': '9px',
            fill: '#666',
            style: 'font-style: italic'
        });
        instruction.textContent = '(Click to reverse origin)';
        ordinateGroup.appendChild(instruction);
        
        layer.appendChild(ordinateGroup);
    }

    drawAnnotations(x, y, scale) {
        const layer = document.getElementById('annotation-layer');
        if (!layer) return;
        
        this.state.annotations.forEach(annotation => {
            if (annotation.type === 'photo' && this.state.showPhotos) {
                const g = this.createSVGElement('g', {
                    class: 'photo-marker',
                    style: 'cursor: pointer;'
                });
                
                // Outer ring for visibility
                const outerRing = this.createSVGElement('circle', {
                    cx: x + annotation.x * scale,
                    cy: y + annotation.y * scale,
                    r: 18,
                    fill: 'white',
                    stroke: '#FF5722',
                    'stroke-width': 3,
                    opacity: 0.9
                });
                
                // Inner circle
                const circle = this.createSVGElement('circle', {
                    cx: x + annotation.x * scale,
                    cy: y + annotation.y * scale,
                    r: 14,
                    fill: '#FF5722',
                    class: 'photo-marker-circle'
                });
                
                // Camera icon
                const icon = this.createSVGElement('text', {
                    x: x + annotation.x * scale,
                    y: y + annotation.y * scale + 1,
                    fill: 'white',
                    'font-size': '16',
                    'font-family': 'monospace',
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle'
                });
                icon.textContent = '📷';
                
                // Photo number
                const numberBg = this.createSVGElement('circle', {
                    cx: x + annotation.x * scale + 12,
                    cy: y + annotation.y * scale - 12,
                    r: 10,
                    fill: '#333',
                    stroke: 'white',
                    'stroke-width': 2
                });
                
                const text = this.createSVGElement('text', {
                    x: x + annotation.x * scale + 12,
                    y: y + annotation.y * scale - 12,
                    fill: 'white',
                    'font-size': '12',
                    'font-weight': 'bold',
                    'text-anchor': 'middle',
                    'dominant-baseline': 'middle'
                });
                text.textContent = annotation.id;
                
                g.appendChild(outerRing);
                g.appendChild(circle);
                g.appendChild(icon);
                g.appendChild(numberBg);
                g.appendChild(text);
                layer.appendChild(g);
            }
        });
    }

    handleMouseDown(e) {
        const coords = this.getCanvasCoordinates(e);
        
        if (this.state.tool === 'pan') {
            this.state.isPanning = true;
            this.state.panStart = { 
                x: e.clientX - this.state.pan.x, 
                y: e.clientY - this.state.pan.y 
            };
            this.svg.style.cursor = 'grabbing';
        } else if (this.state.tool === 'mark' && this.state.mode === 'edit') {
            this.state.isDragging = true;
            this.state.dragStart = coords;
            this.state.selectedCells.clear();
        }
    }

    handleMouseMove(e) {
        const coords = this.getCanvasCoordinates(e);
        
        // Update coordinate display
        document.getElementById('coord-x').textContent = Math.round(coords.x) + '"';
        document.getElementById('coord-y').textContent = Math.round(coords.y) + '"';
        
        const cellX = Math.floor(coords.x / this.state.gridSize);
        const cellY = Math.floor(coords.y / this.state.gridSize);
        document.getElementById('grid-cell').textContent = `X${cellX}-Y${cellY}`;
        
        if (this.state.isPanning) {
            this.state.pan.x = e.clientX - this.state.panStart.x;
            this.state.pan.y = e.clientY - this.state.panStart.y;
            this.render();
        } else if (this.state.isDragging && this.state.tool === 'mark') {
            this.selectCellsInRegion(this.state.dragStart, coords);
        }
    }

    handleMouseUp(e) {
        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.svg.style.cursor = this.state.tool === 'pan' ? 'move' : 'default';
        } else if (this.state.isDragging) {
            this.state.isDragging = false;
            this.applyDefectsToSelection();
        } else if (this.state.tool === 'mark' && this.state.mode === 'edit') {
            this.markSingleCell(e);
        } else if (this.state.tool === 'erase' && this.state.mode === 'edit') {
            this.eraseCell(e);
        } else if (this.state.tool === 'photo' && this.state.mode === 'annotate') {
            this.addPhotoMarker(e);
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        if (this.state.tool === 'pan') {
            // In pan mode, scrollwheel pans left-right
            const delta = 30;
            // Scrollwheel always pans horizontally in pan mode
            this.state.pan.x += e.deltaY > 0 ? -delta : delta;
            this.render();
        } else if (this.state.tool === 'zoom' || this.state.mode === 'view') {
            // In zoom mode or view mode, scrollwheel zooms
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            this.render();
        }
    }

    handleTouchStart(e) {
        if (e.touches.length === 1) {
            this.touchStart = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY,
                time: Date.now()
            };
        } else if (e.touches.length === 2) {
            // Pinch zoom start
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            this.pinchDistance = Math.sqrt(dx * dx + dy * dy);
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.touchStart) {
            // Pan
            const dx = e.touches[0].clientX - this.touchStart.x;
            const dy = e.touches[0].clientY - this.touchStart.y;
            
            this.state.pan.x += dx;
            this.state.pan.y += dy;
            
            this.touchStart.x = e.touches[0].clientX;
            this.touchStart.y = e.touches[0].clientY;
            
            this.render();
        } else if (e.touches.length === 2 && this.pinchDistance) {
            // Pinch zoom
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            const scale = distance / this.pinchDistance;
            this.state.zoom *= scale;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            
            this.pinchDistance = distance;
            this.render();
        }
    }

    handleTouchEnd(e) {
        this.touchStart = null;
        this.pinchDistance = 0;
    }

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

    selectCellsInRegion(start, end) {
        if (!start || !end) return;
        
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        this.state.selectedCells.clear();
        
        for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
            for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
                this.state.selectedCells.add(`${x},${y}`);
            }
        }
    }

    applyDefectsToSelection() {
        this.state.selectedCells.forEach(cellKey => {
            const [x, y] = cellKey.split(',').map(Number);
            
            const existing = this.state.defects.find(d => 
                d.x === x && d.y === y
            );
            
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
        });
        
        document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        this.state.selectedCells.clear();
        this.render();
    }

    markSingleCell(e) {
        const coords = this.getCanvasCoordinates(e);
        const centerX = coords.x;
        const centerY = coords.y;
        const radius = this.state.brushRadius;
        const gridSize = this.state.gridSize;
        
        // Mark all cells within the brush radius
        for (let dx = -radius + 1; dx <= radius - 1; dx++) {
            for (let dy = -radius + 1; dy <= radius - 1; dy++) {
                // Calculate distance from center to determine if cell is within circular radius
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const cellX = Math.floor((centerX + dx * gridSize) / gridSize) * gridSize;
                    const cellY = Math.floor((centerY + dy * gridSize) / gridSize) * gridSize;
                    
                    // Check if cell is within beam bounds
                    if (cellX >= 0 && cellY >= 0) {
                        const existing = this.state.defects.find(d => 
                            d.x === cellX && d.y === cellY
                        );
                        
                        if (existing) {
                            existing.conditionState = this.state.conditionState;
                        } else {
                            this.state.defects.push({
                                x: cellX,
                                y: cellY,
                                width: gridSize,
                                height: gridSize,
                                conditionState: this.state.conditionState
                            });
                            this.state.cellsMarked++;
                        }
                    }
                }
            }
        }
        
        document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        this.render();
    }

    eraseCell(e) {
        const coords = this.getCanvasCoordinates(e);
        const centerX = coords.x;
        const centerY = coords.y;
        const radius = this.state.brushRadius;
        const gridSize = this.state.gridSize;
        
        // Erase all cells within the brush radius
        for (let dx = -radius + 1; dx <= radius - 1; dx++) {
            for (let dy = -radius + 1; dy <= radius - 1; dy++) {
                const distance = Math.sqrt(dx * dx + dy * dy);
                if (distance <= radius) {
                    const cellX = Math.floor((centerX + dx * gridSize) / gridSize) * gridSize;
                    const cellY = Math.floor((centerY + dy * gridSize) / gridSize) * gridSize;
                    
                    const index = this.state.defects.findIndex(d => 
                        d.x === cellX && d.y === cellY
                    );
                    
                    if (index !== -1) {
                        this.state.defects.splice(index, 1);
                        this.state.cellsMarked = Math.max(0, this.state.cellsMarked - 1);
                    }
                }
            }
        }
        
        document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        this.render();
    }

    addPhotoMarker(e) {
        const coords = this.getCanvasCoordinates(e);
        
        this.state.annotations.push({
            type: 'photo',
            id: this.state.annotations.filter(a => a.type === 'photo').length + 1,
            x: coords.x,
            y: coords.y,
            timestamp: new Date().toISOString()
        });
        
        this.render();
    }

    clearAll() {
        if (confirm('Clear all markings? This cannot be undone.')) {
            this.state.defects = [];
            this.state.cellsMarked = 0;
            document.getElementById('cells-marked').textContent = '0';
            this.render();
        }
    }

    deleteSelectedAnnotation() {
        // Implementation for deleting selected annotation
        console.log('Delete annotation feature to be implemented');
    }

    zoomIn() {
        this.state.zoom = Math.min(4, this.state.zoom * 1.25);
        this.render();
    }

    zoomOut() {
        this.state.zoom = Math.max(0.25, this.state.zoom * 0.8);
        this.render();
    }

    fitToExtents() {
        this.state.zoom = 1;
        this.state.pan = { x: 0, y: 0 };
        this.calculateScale();
        this.render();
    }

    toggleMenu() {
        document.getElementById('mobile-menu')?.classList.add('open');
    }

    closeMenu() {
        document.getElementById('mobile-menu')?.classList.remove('open');
    }

    saveProgress() {
        const saveData = {
            config: this.config,
            state: {
                defects: this.state.defects,
                annotations: this.state.annotations,
                cellsMarked: this.state.cellsMarked
            },
            timestamp: new Date().toISOString()
        };
        
        localStorage.setItem('visualbeam-progress', JSON.stringify(saveData));
        alert('Progress saved successfully!');
        this.closeMenu();
    }

    loadProgress() {
        const saved = localStorage.getItem('visualbeam-progress');
        if (saved) {
            const data = JSON.parse(saved);
            this.state.defects = data.state.defects || [];
            this.state.annotations = data.state.annotations || [];
            this.state.cellsMarked = data.state.cellsMarked || 0;
            document.getElementById('cells-marked').textContent = this.state.cellsMarked;
            this.render();
            alert('Progress loaded successfully!');
        } else {
            alert('No saved progress found.');
        }
        this.closeMenu();
    }

    exportDrawing() {
        // Simple export implementation
        const svgData = new XMLSerializer().serializeToString(this.svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `visualbeam-${this.config.beamId}-${new Date().toISOString().split('T')[0]}.svg`;
        a.click();
        
        URL.revokeObjectURL(url);
        this.closeMenu();
    }

    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new VisualBeamV3();
});