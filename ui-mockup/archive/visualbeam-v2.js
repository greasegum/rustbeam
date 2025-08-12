// VisualBeam V2 - Bridge Geometry Aware Inspector

class VisualBeamV2 {
    constructor() {
        this.loadConfiguration();
        this.initializeState();
        this.init();
    }

    loadConfiguration() {
        // Load saved configuration from setup page
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
                backwallLeft: 12,
                backwallRight: 0,
                breastwallFt: 40,
                breastwallIn: 0,
                direction: 'south',
                inspector: 'J. Smith'
            };
        }

        // Initialize geometry calculator
        this.geometry = new BridgeGeometry(this.config);
    }

    initializeState() {
        this.state = {
            tool: 'mark',
            conditionState: 1,  // Start in CS1 (Good)
            gridSize: 1,  // Default to 1" grid
            zoom: 1,
            pan: { x: 0, y: 0 },
            showZones: false,
            showBearings: true,
            showDimensions: true,
            defects: [],
            selectedCells: [],
            photos: [],
            cellsMarked: 0,
            isDragging: false,
            isPanning: false,
            dragStart: null,
            panStart: null
        };

        // Beam profiles database
        this.profiles = {
            '30wf210': { depth: 30.375, flangeWidth: 15.125, flangeThickness: 1.3125, webThickness: 0.75, weight: 210 },
            '36wf300': { depth: 36.75, flangeWidth: 16.625, flangeThickness: 1.6875, webThickness: 0.9375, weight: 300 },
            '24wf160': { depth: 24.625, flangeWidth: 14.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 160 },
            '21wf142': { depth: 21.5, flangeWidth: 13.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 142 },
            '18wf114': { depth: 18.5, flangeWidth: 11.875, flangeThickness: 1.0, webThickness: 0.5625, weight: 114 }
        };

        this.config.profileData = this.profiles[this.config.profile];
    }

    init() {
        this.svg = document.getElementById('beam-canvas');
        this.setupEventListeners();
        this.updateUI();
        this.calculateScale();
        this.render();
        this.startClock();
        this.updateStatusBar();
    }

    setupEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.tool = btn.dataset.tool;
                
                // Update cursor
                if (this.state.tool === 'pan') {
                    this.svg.style.cursor = 'move';
                } else if (this.state.tool === 'mark') {
                    this.svg.style.cursor = 'crosshair';
                } else if (this.state.tool === 'zoom') {
                    this.svg.style.cursor = 'zoom-in';
                } else {
                    this.svg.style.cursor = 'default';
                }
            });
        });

        // Zone toggle
        document.getElementById('show-zones').addEventListener('click', (e) => {
            this.state.showZones = !this.state.showZones;
            e.currentTarget.classList.toggle('active', this.state.showZones);
            document.getElementById('zone-legend').style.display = 
                this.state.showZones ? 'block' : 'none';
            this.render();
        });

        // Toggle buttons
        document.getElementById('toggle-bearings').addEventListener('change', (e) => {
            this.state.showBearings = e.target.checked;
            this.render();
        });

        document.getElementById('toggle-dimensions').addEventListener('change', (e) => {
            this.state.showDimensions = e.target.checked;
            this.render();
        });

        // Condition state buttons
        document.querySelectorAll('.cs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cs-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.conditionState = parseInt(btn.dataset.cs);
            });
        });

        // Zoom controls
        document.getElementById('zoom-in').addEventListener('click', () => this.zoomIn());
        document.getElementById('zoom-out').addEventListener('click', () => this.zoomOut());
        document.getElementById('zoom-fit').addEventListener('click', () => this.fitToExtents());

        // Mouse events on canvas
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));
        this.svg.addEventListener('click', (e) => this.handleClick(e));

        // Clear selection
        document.getElementById('clear-selection').addEventListener('click', () => {
            this.state.selectedCells = [];
            this.render();
        });
    }

    updateStatusBar() {
        // Update beam properties in status bar
        const profile = this.config.profileData;
        document.getElementById('beam-profile').textContent = this.config.profile.toUpperCase();
        document.getElementById('beam-weight').textContent = profile.weight + ' lb/ft';
        document.getElementById('beam-depth').textContent = profile.depth + '"';
        document.getElementById('web-thickness').textContent = profile.webThickness + '"';
        document.getElementById('flange-width').textContent = profile.flangeWidth + '"';
        document.getElementById('flange-thickness').textContent = profile.flangeThickness + '"';
    }

    calculateScale() {
        const padding = 150;  // Room for dimensions and labels
        const svgWidth = this.svg.clientWidth - 2 * padding;
        const svgHeight = this.svg.clientHeight - 2 * padding;
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        
        // Calculate scale to fit
        const scaleX = svgWidth / beamLength;
        const scaleY = svgHeight / beamDepth;
        
        this.scale = Math.min(scaleX, scaleY, 4);  // Max 4 pixels per inch
    }

    updateUI() {
        // Update header information
        document.getElementById('project-name').textContent = this.config.projectName;
        document.getElementById('beam-id').textContent = this.config.beamId;
        document.getElementById('inspector').textContent = this.config.inspector;
        document.getElementById('direction').textContent = this.config.direction.toUpperCase();
        
        // Update grid size display
        document.getElementById('current-grid').textContent = this.state.gridSize + '"';
    }

    startClock() {
        const updateClock = () => {
            const now = new Date();
            document.getElementById('current-time').textContent = 
                now.toLocaleTimeString('en-US', { hour12: false });
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    render() {
        this.clearLayers();
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        const scale = this.scale * this.state.zoom;
        
        // Apply pan transform
        const beamX = 100 + this.state.pan.x;
        const beamY = 100 + this.state.pan.y;
        
        // Draw components in order
        this.drawAbutments(beamX, beamY, beamLength, beamDepth, scale);
        this.drawBearings(beamX, beamY, beamLength, beamDepth, scale);
        
        if (this.state.showZones) {
            this.drawZones(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawGrid(beamX, beamY, beamLength, beamDepth, scale);
        this.drawBeam(beamX, beamY, beamLength, beamDepth, scale);
        this.drawDefects(beamX, beamY, scale);
        this.drawContours(beamX, beamY, scale);
        
        if (this.state.showDimensions) {
            this.drawDimensions(beamX, beamY, beamLength, beamDepth, scale);
            this.drawOrdinates(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawPhotos(beamX, beamY, scale);
        
        // Update zoom display
        document.querySelector('.zoom-level').textContent = Math.round(this.state.zoom * 100) + '%';
    }

    clearLayers() {
        const layers = [
            'background-layer', 'abutment-layer', 'bearing-layer', 
            'zone-layer', 'grid-layer', 'beam-layer', 
            'defect-layer', 'dimension-layer', 'annotation-layer'
        ];
        
        layers.forEach(id => {
            const layer = document.getElementById(id);
            while (layer?.firstChild) {
                layer.removeChild(layer.firstChild);
            }
        });
    }

    drawAbutments(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('abutment-layer');
        
        // Left abutment
        if (this.config.backwallLeft > 0) {
            const rect = this.createSVGElement('rect', {
                x: x - 30,
                y: y + beamDepth * scale - 40,
                width: 25,
                height: 60,
                class: 'abutment'
            });
            layer.appendChild(rect);
        }
        
        // Right abutment
        if (this.config.backwallRight > 0) {
            const rect = this.createSVGElement('rect', {
                x: x + beamLength * scale + 5,
                y: y + beamDepth * scale - 40,
                width: 25,
                height: 60,
                class: 'abutment'
            });
            layer.appendChild(rect);
        }
    }

    drawBearings(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('bearing-layer');
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        const bearingOffset = (beamLength - bearingCL) / 2;
        const bearingWidth = 18;
        const bearingHeight = 8;
        const bearingY = y + (beamDepth - this.config.profileData.flangeThickness) * scale;
        
        // Validate bearing position (must be between beam end and breastwall)
        const breastwallDist = this.config.breastwallFt * 12 + this.config.breastwallIn;
        const maxBearingOffset = (beamLength - breastwallDist) / 2;
        const validBearingOffset = Math.min(bearingOffset, maxBearingOffset);
        
        if (this.state.showBearings) {
            // Left bearing
            const leftBearing = this.createSVGElement('rect', {
                x: x + validBearingOffset * scale - (bearingWidth * scale / 2),
                y: bearingY,
                width: bearingWidth * scale,
                height: bearingHeight * scale,
                rx: 2,
                class: 'bearing'
            });
            layer.appendChild(leftBearing);
            
            // Right bearing  
            const rightBearing = this.createSVGElement('rect', {
                x: x + (beamLength - validBearingOffset) * scale - (bearingWidth * scale / 2),
                y: bearingY,
                width: bearingWidth * scale,
                height: bearingHeight * scale,
                rx: 2,
                class: 'bearing'
            });
            layer.appendChild(rightBearing);
        }
    }

    drawZones(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('zone-layer');
        const zones = this.geometry.getInspectionZones();
        
        // Zone A - Bearing areas
        zones.zoneA.forEach(zone => {
            const rect = this.createSVGElement('rect', {
                x: x + zone.start * scale,
                y: y,
                width: (zone.end - zone.start) * scale,
                height: beamDepth * scale,
                class: 'zone-overlay zone-a-area'
            });
            layer.appendChild(rect);
        });
        
        // Zone B - Quarter points
        zones.zoneB.forEach(zone => {
            const rect = this.createSVGElement('rect', {
                x: x + zone.start * scale,
                y: y,
                width: (zone.end - zone.start) * scale,
                height: beamDepth * scale,
                class: 'zone-overlay zone-b-area'
            });
            layer.appendChild(rect);
        });
        
        // Zone C - Mid-span
        const zoneC = zones.zoneC;
        const rectC = this.createSVGElement('rect', {
            x: x + zoneC.start * scale,
            y: y,
            width: (zoneC.end - zoneC.start) * scale,
            height: beamDepth * scale,
            class: 'zone-overlay zone-c-area'
        });
        layer.appendChild(rectC);
        
        // Zone D - Ends
        zones.zoneD.forEach(zone => {
            const rect = this.createSVGElement('rect', {
                x: x + zone.start * scale,
                y: y,
                width: (zone.end - zone.start) * scale,
                height: beamDepth * scale,
                class: 'zone-overlay zone-d-area'
            });
            layer.appendChild(rect);
        });
    }

    drawGrid(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('grid-layer');
        const gridSpacing = this.state.gridSize * scale;
        const profile = this.config.profileData;
        
        // Vertical lines (full height through entire beam)
        for (let i = 0; i <= beamLength / this.state.gridSize; i++) {
            const line = this.createSVGElement('line', {
                x1: x + i * gridSpacing,
                y1: y,
                x2: x + i * gridSpacing,
                y2: y + beamDepth * scale,
                class: i % 12 === 0 ? 'grid-line-major' : 'grid-line'
            });
            layer.appendChild(line);
        }
        
        // Horizontal lines - separate for flanges and web
        const numHorizontalLines = Math.ceil(beamDepth / this.state.gridSize);
        
        for (let i = 0; i <= numHorizontalLines; i++) {
            const yPos = y + i * gridSpacing;
            
            // Check if this line is in web or flange region
            const isInTopFlange = i * this.state.gridSize <= profile.flangeThickness;
            const isInBottomFlange = i * this.state.gridSize >= (beamDepth - profile.flangeThickness);
            const isInWeb = !isInTopFlange && !isInBottomFlange;
            
            if (yPos <= y + beamDepth * scale) {
                const line = this.createSVGElement('line', {
                    x1: x,
                    y1: yPos,
                    x2: x + beamLength * scale,
                    y2: yPos,
                    class: i % 12 === 0 ? 'grid-line-major' : 'grid-line'
                });
                layer.appendChild(line);
            }
        }
    }

    drawBeam(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('beam-layer');
        const profile = this.config.profileData;
        
        // Initialize entire beam as CS1 (Good condition - light green)
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
        
        // Web - runs horizontally the full length of the beam
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
        
        this.state.defects.forEach(defect => {
            const rect = this.createSVGElement('rect', {
                x: x + defect.x * scale,
                y: y + defect.y * scale,
                width: defect.width * scale,
                height: defect.height * scale,
                class: `defect-cs-${defect.conditionState}`,
                opacity: 0.7
            });
            layer.appendChild(rect);
        });
    }

    drawContours(x, y, scale) {
        // Implement marching squares algorithm for selected regions
        if (this.state.selectedCells.length === 0) return;
        
        const layer = document.getElementById('defect-layer');
        const contourPath = this.getMarchingSquaresContour(this.state.selectedCells);
        
        if (contourPath) {
            const path = this.createSVGElement('path', {
                d: this.scaleContourPath(contourPath, x, y, scale),
                class: 'contour-line',
                fill: 'none',
                stroke: '#ff0000',
                'stroke-width': 2,
                'stroke-dasharray': '5,5'
            });
            layer.appendChild(path);
        }
    }

    getMarchingSquaresContour(cells) {
        // Simplified marching squares implementation
        // This would need a full implementation for production
        if (cells.length === 0) return null;
        
        // Find bounds
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        cells.forEach(cell => {
            minX = Math.min(minX, cell.x);
            minY = Math.min(minY, cell.y);
            maxX = Math.max(maxX, cell.x + this.state.gridSize);
            maxY = Math.max(maxY, cell.y + this.state.gridSize);
        });
        
        // Create simple bounding path
        return `M ${minX} ${minY} L ${maxX} ${minY} L ${maxX} ${maxY} L ${minX} ${maxY} Z`;
    }

    scaleContourPath(path, x, y, scale) {
        // Scale the path coordinates
        return path.replace(/(\d+\.?\d*)/g, (match, p1) => {
            const num = parseFloat(p1);
            return (num * scale + (path.indexOf(p1) % 2 === 0 ? x : y)).toFixed(2);
        });
    }

    drawDimensions(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('dimension-layer');
        const profile = this.config.profileData;
        
        // Vertical dimensions on the left
        const dimX = x - 60;
        
        // Overall depth
        this.drawVerticalDimension(layer, dimX - 20, y, y + beamDepth * scale, 
            `${profile.depth}"`, 'dimension-line');
        
        // Top flange thickness
        if (this.config.topFlangeVisible) {
            this.drawVerticalDimension(layer, dimX, y, y + profile.flangeThickness * scale,
                `${profile.flangeThickness}"`, 'dimension-line-minor');
        }
        
        // Web height
        const webTop = y + profile.flangeThickness * scale;
        const webBottom = y + (beamDepth - profile.flangeThickness) * scale;
        this.drawVerticalDimension(layer, dimX, webTop, webBottom,
            `${(beamDepth - 2 * profile.flangeThickness).toFixed(3)}"`, 'dimension-line-minor');
        
        // Bottom flange thickness
        this.drawVerticalDimension(layer, dimX, webBottom, y + beamDepth * scale,
            `${profile.flangeThickness}"`, 'dimension-line-minor');
        
        // Horizontal beam length dimension at top
        const dimY = y - 30;
        this.drawHorizontalDimension(layer, x, x + beamLength * scale, dimY,
            `${this.config.lengthFt}'-${this.config.lengthIn}"`, 'dimension-line');
    }

    drawOrdinates(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('dimension-layer');
        const ordinateY = y + beamDepth * scale + 40;
        
        // Draw ordinates every 12 inches
        for (let i = 0; i <= beamLength; i += 12) {
            const xPos = x + i * scale;
            
            // Tick mark
            const tick = this.createSVGElement('line', {
                x1: xPos,
                y1: ordinateY - 5,
                x2: xPos,
                y2: ordinateY + 5,
                class: 'ordinate-tick'
            });
            layer.appendChild(tick);
            
            // Label
            const label = this.createSVGElement('text', {
                x: xPos,
                y: ordinateY + 20,
                class: 'ordinate-text'
            });
            label.textContent = i + '"';
            layer.appendChild(label);
        }
        
        // Ordinate baseline
        const baseline = this.createSVGElement('line', {
            x1: x,
            y1: ordinateY,
            x2: x + beamLength * scale,
            y2: ordinateY,
            class: 'ordinate-line'
        });
        layer.appendChild(baseline);
    }

    drawVerticalDimension(layer, x, y1, y2, text, className) {
        // Dimension line
        const line = this.createSVGElement('line', {
            x1: x,
            y1: y1,
            x2: x,
            y2: y2,
            class: className
        });
        layer.appendChild(line);
        
        // End ticks
        const tick1 = this.createSVGElement('line', {
            x1: x - 5,
            y1: y1,
            x2: x + 5,
            y2: y1,
            class: className
        });
        layer.appendChild(tick1);
        
        const tick2 = this.createSVGElement('line', {
            x1: x - 5,
            y1: y2,
            x2: x + 5,
            y2: y2,
            class: className
        });
        layer.appendChild(tick2);
        
        // Text
        const textEl = this.createSVGElement('text', {
            x: x - 10,
            y: (y1 + y2) / 2,
            class: 'dimension-text-vertical',
            transform: `rotate(-90, ${x - 10}, ${(y1 + y2) / 2})`
        });
        textEl.textContent = text;
        layer.appendChild(textEl);
    }

    drawHorizontalDimension(layer, x1, x2, y, text, className) {
        // Dimension line
        const line = this.createSVGElement('line', {
            x1: x1,
            y1: y,
            x2: x2,
            y2: y,
            class: className
        });
        layer.appendChild(line);
        
        // End ticks
        const tick1 = this.createSVGElement('line', {
            x1: x1,
            y1: y - 5,
            x2: x1,
            y2: y + 5,
            class: className
        });
        layer.appendChild(tick1);
        
        const tick2 = this.createSVGElement('line', {
            x1: x2,
            y1: y - 5,
            x2: x2,
            y2: y + 5,
            class: className
        });
        layer.appendChild(tick2);
        
        // Text
        const textEl = this.createSVGElement('text', {
            x: (x1 + x2) / 2,
            y: y - 8,
            class: 'dimension-text'
        });
        textEl.textContent = text;
        layer.appendChild(textEl);
    }

    drawPhotos(x, y, scale) {
        const layer = document.getElementById('annotation-layer');
        
        this.state.photos.forEach((photo, index) => {
            const g = this.createSVGElement('g', {
                class: 'photo-marker',
                'data-photo-id': photo.id
            });
            
            const circle = this.createSVGElement('circle', {
                cx: x + photo.x * scale,
                cy: y + photo.y * scale,
                r: 12,
                class: 'photo-marker-circle'
            });
            
            const text = this.createSVGElement('text', {
                x: x + photo.x * scale,
                y: y + photo.y * scale,
                class: 'photo-marker-text'
            });
            text.textContent = index + 1;
            
            g.appendChild(circle);
            g.appendChild(text);
            layer.appendChild(g);
        });
    }

    handleMouseDown(e) {
        if (this.state.tool === 'pan') {
            this.state.isPanning = true;
            this.state.panStart = { x: e.clientX - this.state.pan.x, y: e.clientY - this.state.pan.y };
            this.svg.style.cursor = 'grabbing';
        } else if (this.state.tool === 'mark') {
            this.state.isDragging = true;
            this.state.dragStart = this.getBeamCoordinates(e);
        }
    }

    handleMouseMove(e) {
        const coords = this.getBeamCoordinates(e);
        
        // Update coordinate display
        document.getElementById('coord-x').textContent = coords.x.toFixed(0) + '"';
        document.getElementById('coord-y').textContent = coords.y.toFixed(0) + '"';
        
        // Calculate grid cell
        const cellX = Math.floor(coords.x / this.state.gridSize);
        const cellY = Math.floor(coords.y / this.state.gridSize);
        document.getElementById('grid-cell').textContent = `X${cellX}-Y${cellY}`;
        
        if (this.state.isPanning) {
            this.state.pan.x = e.clientX - this.state.panStart.x;
            this.state.pan.y = e.clientY - this.state.panStart.y;
            this.render();
        } else if (this.state.isDragging && this.state.tool === 'mark') {
            // Select cells while dragging
            this.selectCellsInRegion(this.state.dragStart, coords);
        }
    }

    handleMouseUp(e) {
        if (this.state.isPanning) {
            this.state.isPanning = false;
            this.svg.style.cursor = this.state.tool === 'pan' ? 'move' : 'default';
        } else if (this.state.isDragging) {
            this.state.isDragging = false;
            const coords = this.getBeamCoordinates(e);
            this.selectCellsInRegion(this.state.dragStart, coords);
            this.applyDefectsToSelection();
        }
    }

    handleClick(e) {
        if (this.state.tool === 'mark' && !this.state.isDragging) {
            this.markDefect(e);
        } else if (this.state.tool === 'photo') {
            this.addPhoto(e);
        } else if (this.state.tool === 'zoom') {
            const zoomFactor = e.shiftKey ? 0.8 : 1.25;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            this.render();
        }
    }

    handleWheel(e) {
        e.preventDefault();
        
        if (this.state.tool === 'pan') {
            // Pan with mouse wheel
            const delta = 20;
            if (e.shiftKey) {
                this.state.pan.x += e.deltaY > 0 ? -delta : delta;
            } else {
                this.state.pan.y += e.deltaY > 0 ? -delta : delta;
            }
            this.render();
        } else {
            // Zoom with mouse wheel
            const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
            this.state.zoom *= zoomFactor;
            this.state.zoom = Math.max(0.25, Math.min(4, this.state.zoom));
            this.render();
        }
    }

    getBeamCoordinates(e) {
        const rect = this.svg.getBoundingClientRect();
        const scale = this.scale * this.state.zoom;
        
        // Calculate position in inches, accounting for pan
        const x = (e.clientX - rect.left - 100 - this.state.pan.x) / scale;
        const y = (e.clientY - rect.top - 100 - this.state.pan.y) / scale;
        
        return { x, y };
    }

    selectCellsInRegion(start, end) {
        if (!start || !end) return;
        
        const minX = Math.min(start.x, end.x);
        const maxX = Math.max(start.x, end.x);
        const minY = Math.min(start.y, end.y);
        const maxY = Math.max(start.y, end.y);
        
        this.state.selectedCells = [];
        
        // Add all grid cells in the region
        for (let x = Math.floor(minX / this.state.gridSize) * this.state.gridSize; 
             x <= maxX; 
             x += this.state.gridSize) {
            for (let y = Math.floor(minY / this.state.gridSize) * this.state.gridSize; 
                 y <= maxY; 
                 y += this.state.gridSize) {
                this.state.selectedCells.push({ x, y });
            }
        }
        
        this.render();
    }

    applyDefectsToSelection() {
        this.state.selectedCells.forEach(cell => {
            // Check if defect already exists at this location
            const existing = this.state.defects.find(d => 
                d.x === cell.x && d.y === cell.y
            );
            
            if (existing) {
                // Update condition state
                existing.conditionState = this.state.conditionState;
            } else {
                // Add new defect
                this.state.defects.push({
                    x: cell.x,
                    y: cell.y,
                    width: this.state.gridSize,
                    height: this.state.gridSize,
                    conditionState: this.state.conditionState
                });
                this.state.cellsMarked++;
            }
        });
        
        document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        this.state.selectedCells = [];
        this.render();
    }

    markDefect(e) {
        const coords = this.getBeamCoordinates(e);
        
        // Snap to grid
        const gridX = Math.floor(coords.x / this.state.gridSize) * this.state.gridSize;
        const gridY = Math.floor(coords.y / this.state.gridSize) * this.state.gridSize;
        
        // Check if cell already marked
        const existing = this.state.defects.find(d => 
            d.x === gridX && d.y === gridY
        );
        
        if (existing) {
            // Update condition state
            existing.conditionState = this.state.conditionState;
        } else {
            // Add new defect
            this.state.defects.push({
                x: gridX,
                y: gridY,
                width: this.state.gridSize,
                height: this.state.gridSize,
                conditionState: this.state.conditionState
            });
            this.state.cellsMarked++;
            document.getElementById('cells-marked').textContent = this.state.cellsMarked;
        }
        
        this.render();
    }

    addPhoto(e) {
        const coords = this.getBeamCoordinates(e);
        
        this.state.photos.push({
            id: Date.now(),
            x: coords.x,
            y: coords.y,
            timestamp: new Date().toISOString()
        });
        
        this.render();
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
    window.app = new VisualBeamV2();
});