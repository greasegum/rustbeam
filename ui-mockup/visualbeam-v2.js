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
            tool: 'select',
            conditionState: 1,
            inspectionType: 'routine',
            gridSize: 12,
            zoom: 1,
            pan: { x: 0, y: 0 },
            showZones: false,
            showBearings: true,
            showDimensions: false,
            defects: [],
            photos: [],
            cellsMarked: 0
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
    }

    setupEventListeners() {
        // Inspection type buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.inspectionType = btn.dataset.type;
                this.state.gridSize = parseInt(btn.dataset.grid);
                document.getElementById('current-grid').textContent = this.state.gridSize + '"';
                document.getElementById('mode-text').textContent = 
                    this.capitalize(this.state.inspectionType) + ' Inspection';
                this.render();
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
        document.getElementById('toggle-bearings').addEventListener('click', (e) => {
            this.state.showBearings = !this.state.showBearings;
            e.currentTarget.classList.toggle('active', this.state.showBearings);
            this.render();
        });

        document.getElementById('toggle-dimensions').addEventListener('click', (e) => {
            this.state.showDimensions = !this.state.showDimensions;
            e.currentTarget.classList.toggle('active', this.state.showDimensions);
            this.render();
        });

        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.tool = btn.dataset.tool;
                this.updateCursor();
            });
        });

        // Condition state selection
        document.querySelectorAll('.cs-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.cs-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.state.conditionState = parseInt(btn.dataset.cs);
            });
        });

        // Zoom controls
        document.querySelector('.zoom-in').addEventListener('click', () => this.zoom(1.25));
        document.querySelector('.zoom-out').addEventListener('click', () => this.zoom(0.8));
        document.querySelector('.zoom-fit').addEventListener('click', () => this.zoomFit());

        // Canvas events
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('click', (e) => this.handleClick(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    calculateScale() {
        const svgRect = this.svg.getBoundingClientRect();
        const padding = 120;
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        
        const scaleX = (svgRect.width - padding * 2) / beamLength;
        const scaleY = (svgRect.height - padding * 2) / beamDepth;
        
        this.scale = Math.min(scaleX, scaleY, 10);
    }

    render() {
        this.clearLayers();
        
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const beamDepth = this.config.profileData.depth;
        const scale = this.scale * this.state.zoom;
        
        const beamX = centerX - (beamLength * scale) / 2 + this.state.pan.x;
        const beamY = centerY - (beamDepth * scale) / 2 + this.state.pan.y;
        
        // Draw in order
        if (this.state.showBearings) {
            this.drawAbutments(beamX, beamY, beamLength, beamDepth, scale);
            this.drawBearings(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        if (this.state.showZones) {
            this.drawZones(beamX, beamY, beamLength, beamDepth, scale);
        }
        
        this.drawGrid(beamX, beamY, beamLength, beamDepth, scale);
        this.drawBeam(beamX, beamY, beamLength, beamDepth, scale);
        this.drawDefects(beamX, beamY, scale);
        
        if (this.state.showDimensions) {
            this.drawDimensions(beamX, beamY, beamLength, beamDepth, scale);
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
        const bearingOffset = this.geometry.bearingOffset * scale;
        const bearingWidth = 18 * scale;
        const bearingHeight = 8 * scale;
        const bearingY = y + (beamDepth - this.config.profileData.flangeThickness) * scale;
        
        // Left bearing
        const leftBearing = this.createSVGElement('rect', {
            x: x + bearingOffset - bearingWidth/2,
            y: bearingY,
            width: bearingWidth,
            height: bearingHeight,
            rx: 2,
            class: 'bearing'
        });
        layer.appendChild(leftBearing);
        
        // Right bearing
        const rightBearing = this.createSVGElement('rect', {
            x: x + beamLength * scale - bearingOffset - bearingWidth/2,
            y: bearingY,
            width: bearingWidth,
            height: bearingHeight,
            rx: 2,
            class: 'bearing'
        });
        layer.appendChild(rightBearing);
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
        
        // Vertical lines
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
        
        // Horizontal lines on web only
        const webStart = y + this.config.profileData.flangeThickness * scale;
        const webEnd = y + (beamDepth - this.config.profileData.flangeThickness) * scale;
        
        for (let i = 0; i <= (webEnd - webStart) / gridSpacing; i++) {
            const line = this.createSVGElement('line', {
                x1: x,
                y1: webStart + i * gridSpacing,
                x2: x + beamLength * scale,
                y2: webStart + i * gridSpacing,
                class: 'grid-line'
            });
            layer.appendChild(line);
        }
    }

    drawBeam(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('beam-layer');
        const profile = this.config.profileData;
        
        // Top flange
        const topFlange = this.createSVGElement('rect', {
            x: x,
            y: y,
            width: beamLength * scale,
            height: profile.flangeThickness * scale,
            class: this.config.topFlangeVisible ? 'beam-flange' : 'beam-flange hidden'
        });
        layer.appendChild(topFlange);
        
        // Web
        const webX = x + (beamLength * scale - profile.webThickness * scale) / 2;
        const web = this.createSVGElement('rect', {
            x: webX,
            y: y + profile.flangeThickness * scale,
            width: profile.webThickness * scale,
            height: (beamDepth - 2 * profile.flangeThickness) * scale,
            class: 'beam-web'
        });
        layer.appendChild(web);
        
        // Bottom flange
        const bottomFlange = this.createSVGElement('rect', {
            x: x,
            y: y + (beamDepth - profile.flangeThickness) * scale,
            width: beamLength * scale,
            height: profile.flangeThickness * scale,
            class: 'beam-flange'
        });
        layer.appendChild(bottomFlange);
    }

    drawDefects(x, y, scale) {
        const layer = document.getElementById('defect-layer');
        
        this.state.defects.forEach(defect => {
            const rect = this.createSVGElement('rect', {
                x: x + defect.x * scale,
                y: y + defect.y * scale,
                width: defect.width * scale,
                height: defect.height * scale,
                class: `defect-cs-${defect.conditionState}`
            });
            layer.appendChild(rect);
        });
    }

    drawDimensions(x, y, beamLength, beamDepth, scale) {
        const layer = document.getElementById('dimension-layer');
        
        // Beam length dimension
        const dimY = y - 30;
        const line = this.createSVGElement('line', {
            x1: x,
            y1: dimY,
            x2: x + beamLength * scale,
            y2: dimY,
            class: 'dimension-line'
        });
        layer.appendChild(line);
        
        // Dimension text
        const text = this.createSVGElement('text', {
            x: x + (beamLength * scale) / 2,
            y: dimY - 5,
            class: 'dimension-text'
        });
        text.textContent = `${this.config.lengthFt}'-${this.config.lengthIn}"`;
        layer.appendChild(text);
        
        // Bearing C/L dimension
        const bearingOffset = this.geometry.bearingOffset * scale;
        const bearingLine = this.createSVGElement('line', {
            x1: x + bearingOffset,
            y1: y + beamDepth * scale + 20,
            x2: x + beamLength * scale - bearingOffset,
            y2: y + beamDepth * scale + 20,
            class: 'dimension-line',
            'stroke-dasharray': '2,2'
        });
        layer.appendChild(bearingLine);
        
        const bearingText = this.createSVGElement('text', {
            x: x + (beamLength * scale) / 2,
            y: y + beamDepth * scale + 35,
            class: 'dimension-text'
        });
        bearingText.textContent = `C/L ${this.config.bearingClFt}'-${this.config.bearingClIn}"`;
        layer.appendChild(bearingText);
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

    handleMouseMove(e) {
        const rect = this.svg.getBoundingClientRect();
        const scale = this.scale * this.state.zoom;
        
        // Calculate position in inches
        const x = ((e.clientX - rect.left) / scale);
        const y = ((e.clientY - rect.top) / scale);
        
        // Update coordinate display
        document.getElementById('coord-x').textContent = x.toFixed(0) + '"';
        document.getElementById('coord-y').textContent = y.toFixed(0) + '"';
        
        // Calculate grid cell
        const cellX = Math.floor(x / this.state.gridSize);
        const cellY = Math.floor(y / this.state.gridSize);
        document.getElementById('grid-cell').textContent = `X${cellX}-Y${cellY}`;
    }

    handleClick(e) {
        if (this.state.tool === 'mark') {
            this.markDefect(e);
        } else if (this.state.tool === 'photo') {
            this.addPhoto(e);
        }
    }

    markDefect(e) {
        const rect = this.svg.getBoundingClientRect();
        const scale = this.scale * this.state.zoom;
        
        // Get click position in inches
        const x = ((e.clientX - rect.left) / scale);
        const y = ((e.clientY - rect.top) / scale);
        
        // Snap to grid
        const gridX = Math.floor(x / this.state.gridSize) * this.state.gridSize;
        const gridY = Math.floor(y / this.state.gridSize) * this.state.gridSize;
        
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
        const rect = this.svg.getBoundingClientRect();
        const scale = this.scale * this.state.zoom;
        
        const x = ((e.clientX - rect.left) / scale);
        const y = ((e.clientY - rect.top) / scale);
        
        this.state.photos.push({
            id: Date.now(),
            x: x,
            y: y,
            timestamp: new Date().toISOString()
        });
        
        this.render();
    }

    handleWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        this.zoom(delta);
    }

    handleKeyboard(e) {
        switch(e.key) {
            case 's': this.selectTool('select'); break;
            case 'h': this.selectTool('pan'); break;
            case 'm': this.selectTool('mark'); break;
            case 'd': this.selectTool('measure'); break;
            case 'p': this.selectTool('photo'); break;
            case '+': this.zoom(1.25); break;
            case '-': this.zoom(0.8); break;
            case 'f': this.zoomFit(); break;
            case '1': 
            case '2': 
            case '3': 
            case '4': 
                this.setConditionState(parseInt(e.key)); 
                break;
        }
    }

    selectTool(tool) {
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        this.state.tool = tool;
        this.updateCursor();
    }

    setConditionState(cs) {
        document.querySelectorAll('.cs-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.cs) === cs);
        });
        this.state.conditionState = cs;
    }

    zoom(factor) {
        this.state.zoom = Math.max(0.1, Math.min(10, this.state.zoom * factor));
        this.render();
    }

    zoomFit() {
        this.state.zoom = 1;
        this.state.pan = { x: 0, y: 0 };
        this.calculateScale();
        this.render();
    }

    updateCursor() {
        this.svg.style.cursor = {
            'select': 'default',
            'pan': 'move',
            'mark': 'crosshair',
            'measure': 'crosshair',
            'photo': 'copy'
        }[this.state.tool] || 'default';
    }

    updateUI() {
        // Update beam info
        const profile = this.config.profileData;
        document.getElementById('beam-designation').textContent = 
            `${Math.round(profile.depth)}" WF ${profile.weight}#`;
        document.getElementById('beam-length').textContent = 
            `${this.config.lengthFt}'-${this.config.lengthIn}"`;
        document.getElementById('bearing-span').textContent = 
            `${this.config.bearingClFt}'-${this.config.bearingClIn}"`;
        document.getElementById('elevation-direction').textContent = 
            `${this.capitalize(this.config.direction)} Elevation`;
        
        // Update status bar
        document.getElementById('project-name').textContent = this.config.projectName;
        document.getElementById('status-beam').textContent = this.config.beamId;
        document.getElementById('inspector-name').textContent = this.config.inspector;
        
        // Update end labels
        const endLabels = this.geometry.getEndLabels(this.config.direction);
        document.querySelector('#left-end .end-text').textContent = endLabels.left.toUpperCase();
        document.querySelector('#right-end .end-text').textContent = endLabels.right.toUpperCase();
        
        document.querySelector('#left-end .end-condition').textContent = 
            this.config.backwallLeft === 0 ? 'Integral' : 'Expansion';
        document.querySelector('#right-end .end-condition').textContent = 
            this.config.backwallRight === 0 ? 'Integral' : 'Expansion';
    }

    getEndLabels(direction) {
        const labels = {
            'north': { left: 'West', right: 'East' },
            'south': { left: 'East', right: 'West' },
            'east': { left: 'North', right: 'South' },
            'west': { left: 'South', right: 'North' }
        };
        return labels[direction] || labels['south'];
    }

    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    startClock() {
        const updateTime = () => {
            const now = new Date();
            const time = now.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false 
            });
            document.getElementById('timestamp').textContent = time;
        };
        
        updateTime();
        setInterval(updateTime, 60000); // Update every minute
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new VisualBeamV2();
});