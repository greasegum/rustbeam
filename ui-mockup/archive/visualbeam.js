// VisualBeam - Scale-Accurate Beam Rendering

class VisualBeam {
    constructor() {
        // Load configuration from setup page if available
        this.loadConfiguration();
        
        // Beam profiles with actual dimensions (inches)
        this.beamProfiles = {
            '36wf300': { depth: 36.75, flangeWidth: 16.625, flangeThickness: 1.6875, webThickness: 0.9375, weight: 300 },
            '30wf210': { depth: 30.375, flangeWidth: 15.125, flangeThickness: 1.3125, webThickness: 0.75, weight: 210 },
            '24wf160': { depth: 24.625, flangeWidth: 14.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 160 },
            '21wf142': { depth: 21.5, flangeWidth: 13.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 142 },
            '18wf114': { depth: 18.5, flangeWidth: 11.875, flangeThickness: 1.0, webThickness: 0.5625, weight: 114 },
            '14wf74': { depth: 14.125, flangeWidth: 10.125, flangeThickness: 0.75, webThickness: 0.4375, weight: 74 },
            '12wf58': { depth: 12.125, flangeWidth: 10.0, flangeThickness: 0.625, webThickness: 0.375, weight: 58 },
            '10wf49': { depth: 10.0, flangeWidth: 10.0, flangeThickness: 0.5625, webThickness: 0.375, weight: 49 },
            '8wf31': { depth: 8.0, flangeWidth: 8.0, flangeThickness: 0.4375, webThickness: 0.3125, weight: 31 }
        };

        this.state = {
            profile: '36wf300',
            length: 40, // feet
            topFlangeVisible: true,
            gridSize: 12, // inches
            conditionState: 1,
            tool: 'select',
            zoom: 1,
            pan: { x: 0, y: 0 },
            defects: [],
            scale: 1 // pixels per inch
        };

        this.svg = null;
        this.init();
    }

    init() {
        this.svg = document.getElementById('beam-canvas');
        this.setupEventListeners();
        this.calculateScale();
        this.render();
    }

    setupEventListeners() {
        // Profile selection
        document.getElementById('beam-profile').addEventListener('change', (e) => {
            this.state.profile = e.target.value;
            this.updateStatus();
            this.calculateScale();
            this.render();
        });

        // Length input
        document.getElementById('beam-length').addEventListener('input', (e) => {
            this.state.length = parseFloat(e.target.value) || 1;
            this.updateStatus();
            this.calculateScale();
            this.render();
        });

        // Grid size
        document.getElementById('grid-size').addEventListener('change', (e) => {
            this.state.gridSize = parseInt(e.target.value);
            this.updateStatus();
            this.render();
        });

        // Top flange toggle
        document.getElementById('top-flange-toggle').addEventListener('click', (e) => {
            this.state.topFlangeVisible = !this.state.topFlangeVisible;
            e.currentTarget.classList.toggle('active');
            const topFlange = e.currentTarget.querySelector('.top-flange');
            topFlange.setAttribute('opacity', this.state.topFlangeVisible ? '1' : '0.3');
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

        // Canvas mouse events
        this.svg.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.svg.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.svg.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.svg.addEventListener('wheel', (e) => this.handleWheel(e));

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            document.getElementById('export-dialog').showModal();
        });

        // Dialog close
        document.querySelector('.dialog-close').addEventListener('click', () => {
            document.getElementById('export-dialog').close();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    calculateScale() {
        const profile = this.beamProfiles[this.state.profile];
        const lengthInches = this.state.length * 12;
        
        // Get SVG dimensions
        const svgRect = this.svg.getBoundingClientRect();
        const padding = 100; // pixels
        
        // Calculate scale to fit beam in viewport
        const scaleX = (svgRect.width - padding * 2) / lengthInches;
        const scaleY = (svgRect.height - padding * 2) / profile.depth;
        
        // Use smaller scale to ensure beam fits
        this.state.scale = Math.min(scaleX, scaleY, 10); // Cap at 10 pixels per inch
    }

    render() {
        const profile = this.beamProfiles[this.state.profile];
        const lengthInches = this.state.length * 12;
        const scale = this.state.scale * this.state.zoom;
        
        // Clear SVG
        this.clearLayers();
        
        // Get SVG dimensions
        const svgRect = this.svg.getBoundingClientRect();
        const centerX = svgRect.width / 2;
        const centerY = svgRect.height / 2;
        
        // Calculate beam position (centered)
        const beamX = centerX - (lengthInches * scale) / 2 + this.state.pan.x;
        const beamY = centerY - (profile.depth * scale) / 2 + this.state.pan.y;
        
        // Draw grid
        this.drawGrid(beamX, beamY, lengthInches * scale, profile.depth * scale);
        
        // Draw beam
        this.drawBeam(beamX, beamY, profile, lengthInches, scale);
        
        // Draw defects
        this.drawDefects(beamX, beamY, scale);
        
        // Update zoom display
        document.querySelector('.zoom-level').textContent = Math.round(this.state.zoom * 100) + '%';
    }

    clearLayers() {
        ['grid-layer', 'beam-layer', 'defect-layer', 'annotation-layer'].forEach(id => {
            const layer = document.getElementById(id);
            while (layer.firstChild) {
                layer.removeChild(layer.firstChild);
            }
        });
    }

    drawGrid(x, y, width, height) {
        const gridLayer = document.getElementById('grid-layer');
        const gridSpacing = this.state.gridSize * this.state.scale * this.state.zoom;
        
        // Vertical lines
        for (let i = 0; i <= width / gridSpacing; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const xPos = x + i * gridSpacing;
            line.setAttribute('x1', xPos);
            line.setAttribute('y1', y);
            line.setAttribute('x2', xPos);
            line.setAttribute('y2', y + height);
            line.setAttribute('class', i % 12 === 0 ? 'grid-line-major' : 'grid-line');
            gridLayer.appendChild(line);
        }
        
        // Horizontal lines (for 2D grid on web)
        const webStart = y + (this.state.topFlangeVisible ? 
            this.beamProfiles[this.state.profile].flangeThickness * this.state.scale * this.state.zoom : 0);
        const webEnd = y + height - 
            this.beamProfiles[this.state.profile].flangeThickness * this.state.scale * this.state.zoom;
        
        for (let i = 0; i <= (webEnd - webStart) / gridSpacing; i++) {
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            const yPos = webStart + i * gridSpacing;
            line.setAttribute('x1', x);
            line.setAttribute('y1', yPos);
            line.setAttribute('x2', x + width);
            line.setAttribute('y2', yPos);
            line.setAttribute('class', 'grid-line');
            gridLayer.appendChild(line);
        }
    }

    drawBeam(x, y, profile, lengthInches, scale) {
        const beamLayer = document.getElementById('beam-layer');
        
        // Top flange
        if (this.state.topFlangeVisible) {
            const topFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            topFlange.setAttribute('x', x);
            topFlange.setAttribute('y', y);
            topFlange.setAttribute('width', lengthInches * scale);
            topFlange.setAttribute('height', profile.flangeThickness * scale);
            topFlange.setAttribute('class', 'beam-flange');
            beamLayer.appendChild(topFlange);
        } else {
            // Draw greyed out top flange
            const topFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            topFlange.setAttribute('x', x);
            topFlange.setAttribute('y', y);
            topFlange.setAttribute('width', lengthInches * scale);
            topFlange.setAttribute('height', profile.flangeThickness * scale);
            topFlange.setAttribute('class', 'beam-flange hidden');
            beamLayer.appendChild(topFlange);
        }
        
        // Web
        const webX = x + (lengthInches * scale - profile.webThickness * scale) / 2;
        const webY = y + profile.flangeThickness * scale;
        const webHeight = (profile.depth - 2 * profile.flangeThickness) * scale;
        
        const web = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        web.setAttribute('x', webX);
        web.setAttribute('y', webY);
        web.setAttribute('width', profile.webThickness * scale);
        web.setAttribute('height', webHeight);
        web.setAttribute('class', 'beam-web');
        beamLayer.appendChild(web);
        
        // Bottom flange
        const bottomFlange = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bottomFlange.setAttribute('x', x);
        bottomFlange.setAttribute('y', y + (profile.depth - profile.flangeThickness) * scale);
        bottomFlange.setAttribute('width', lengthInches * scale);
        bottomFlange.setAttribute('height', profile.flangeThickness * scale);
        bottomFlange.setAttribute('class', 'beam-flange');
        beamLayer.appendChild(bottomFlange);
        
        // Add click handler for marking defects
        [web, bottomFlange].forEach(element => {
            if (this.state.topFlangeVisible) {
                beamLayer.firstChild.addEventListener('click', (e) => this.handleBeamClick(e, 'top-flange'));
            }
            element.addEventListener('click', (e) => {
                const type = element === web ? 'web' : 'bottom-flange';
                this.handleBeamClick(e, type);
            });
        });
    }

    drawDefects(beamX, beamY, scale) {
        const defectLayer = document.getElementById('defect-layer');
        
        this.state.defects.forEach(defect => {
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', beamX + defect.x * scale);
            rect.setAttribute('y', beamY + defect.y * scale);
            rect.setAttribute('width', defect.width * scale);
            rect.setAttribute('height', defect.height * scale);
            rect.setAttribute('class', `defect-cs-${defect.conditionState}`);
            defectLayer.appendChild(rect);
        });
    }

    handleBeamClick(e, location) {
        if (this.state.tool !== 'mark') return;
        
        const rect = this.svg.getBoundingClientRect();
        const scale = this.state.scale * this.state.zoom;
        const gridSize = this.state.gridSize;
        
        // Get click position relative to beam
        const clickX = (e.clientX - rect.left) / scale;
        const clickY = (e.clientY - rect.top) / scale;
        
        // Snap to grid
        const gridX = Math.floor(clickX / gridSize) * gridSize;
        const gridY = Math.floor(clickY / gridSize) * gridSize;
        
        // Add defect
        this.state.defects.push({
            x: gridX,
            y: gridY,
            width: gridSize,
            height: gridSize,
            conditionState: this.state.conditionState,
            location: location
        });
        
        this.render();
    }

    handleMouseMove(e) {
        const rect = this.svg.getBoundingClientRect();
        const scale = this.state.scale * this.state.zoom;
        
        // Convert to inches
        const x = ((e.clientX - rect.left) / scale).toFixed(0);
        const y = ((e.clientY - rect.top) / scale).toFixed(0);
        
        // Update cursor display
        document.getElementById('cursor-x').textContent = x + '"';
        document.getElementById('cursor-y').textContent = y + '"';
        document.getElementById('status-coords').textContent = `${x}", ${y}"`;
    }

    handleMouseDown(e) {
        if (this.state.tool === 'pan') {
            this.isPanning = true;
            this.panStart = { x: e.clientX - this.state.pan.x, y: e.clientY - this.state.pan.y };
        }
    }

    handleMouseUp(e) {
        this.isPanning = false;
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
            case 'n': this.selectTool('note'); break;
            case '+': this.zoom(1.25); break;
            case '-': this.zoom(0.8); break;
            case 'f': this.zoomFit(); break;
            case '1': this.setConditionState(1); break;
            case '2': this.setConditionState(2); break;
            case '3': this.setConditionState(3); break;
            case '4': this.setConditionState(4); break;
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
        const canvas = document.querySelector('.canvas-area');
        canvas.style.cursor = {
            'select': 'default',
            'pan': 'move',
            'mark': 'crosshair',
            'measure': 'crosshair',
            'note': 'text'
        }[this.state.tool] || 'default';
    }

    updateStatus() {
        const profile = this.beamProfiles[this.state.profile];
        document.getElementById('status-beam').textContent = 
            `${Math.round(profile.depth)}" WF ${profile.weight}#`;
        document.getElementById('status-length').textContent = 
            `${this.state.length}'-0"`;
        document.getElementById('status-scale').textContent = 
            `1:${Math.round(48 / this.state.scale)}`;
        document.getElementById('status-grid').textContent = 
            `${this.state.gridSize}" × ${this.state.gridSize}"`;
    }

    loadConfiguration() {
        const savedConfig = localStorage.getItem('beamConfig');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                
                // Apply configuration to state
                this.state.profile = config.profile || '36wf300';
                this.state.length = config.lengthFt || 40;
                this.state.topFlangeVisible = config.topFlangeVisible !== false;
                
                // Store additional config for reference
                this.config = config;
                
                // Update UI elements if they exist
                setTimeout(() => {
                    if (document.getElementById('beam-profile')) {
                        document.getElementById('beam-profile').value = this.state.profile;
                    }
                    if (document.getElementById('beam-length')) {
                        document.getElementById('beam-length').value = this.state.length;
                    }
                    if (document.getElementById('top-flange-toggle')) {
                        const toggle = document.getElementById('top-flange-toggle');
                        toggle.classList.toggle('active', !this.state.topFlangeVisible);
                        const topFlange = toggle.querySelector('.top-flange');
                        if (topFlange) {
                            topFlange.setAttribute('opacity', this.state.topFlangeVisible ? '1' : '0.3');
                        }
                    }
                    
                    // Update title with direction and beam ID
                    if (config.beamId && config.direction) {
                        const title = `${config.beamId}, ${this.capitalize(config.direction)} Elevation`;
                        // Add title to canvas
                        this.beamTitle = title;
                        
                        // Set end labels based on direction
                        this.endLabels = this.getEndLabels(config.direction);
                    }
                    
                    this.updateStatus();
                }, 100);
            } catch (e) {
                console.error('Failed to load beam configuration:', e);
            }
        }
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

    capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    new VisualBeam();
});