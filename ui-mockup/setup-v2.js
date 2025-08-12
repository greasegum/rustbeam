// VisualBeam Setup V2 - Mobile Optimized

class BeamSetup {
    constructor() {
        this.profiles = {
            '18wf114': { 
                depth: 18.5, 
                flangeWidth: 11.875, 
                flangeThickness: 1.0, 
                webThickness: 0.5625, 
                weight: 114 
            },
            '21wf142': { 
                depth: 21.5, 
                flangeWidth: 13.125, 
                flangeThickness: 1.0625, 
                webThickness: 0.625, 
                weight: 142 
            },
            '24wf160': { 
                depth: 24.625, 
                flangeWidth: 14.125, 
                flangeThickness: 1.0625, 
                webThickness: 0.625, 
                weight: 160 
            },
            '30wf210': { 
                depth: 30.375, 
                flangeWidth: 15.125, 
                flangeThickness: 1.3125, 
                webThickness: 0.75, 
                weight: 210 
            },
            '36wf300': { 
                depth: 36.75, 
                flangeWidth: 16.625, 
                flangeThickness: 1.6875, 
                webThickness: 0.9375, 
                weight: 300 
            }
        };

        this.config = this.loadConfig();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateProfileInfo();
        this.renderElevationPreview();
        this.renderSectionPreview();
    }

    loadConfig() {
        const saved = localStorage.getItem('beamConfig');
        if (saved) {
            return JSON.parse(saved);
        }
        
        return {
            projectName: 'Bridge A-47',
            beamId: 'Beam 2',
            inspector: 'J. Smith',
            direction: 'south',
            profile: '30wf210',
            lengthFt: 44,
            lengthIn: 0,
            topFlangeVisible: true,
            bearingClFt: 42,
            bearingClIn: 0,
            seatLeft: 18,
            seatRight: 18,
            backwallLeft: 2,
            backwallRight: 2
        };
    }

    saveConfig() {
        // Gather all form values
        this.config = {
            projectName: document.getElementById('project-name').value,
            beamId: document.getElementById('beam-id').value,
            inspector: document.getElementById('inspector').value,
            direction: document.getElementById('direction').value,
            profile: document.getElementById('beam-profile').value,
            lengthFt: parseInt(document.getElementById('length-ft').value),
            lengthIn: parseInt(document.getElementById('length-in').value),
            topFlangeVisible: document.getElementById('top-flange-visible').checked,
            bearingClFt: parseInt(document.getElementById('bearing-cl-ft').value),
            bearingClIn: parseInt(document.getElementById('bearing-cl-in').value),
            seatLeft: parseInt(document.getElementById('seat-left').value),
            seatRight: parseInt(document.getElementById('seat-right').value),
            backwallLeft: parseInt(document.getElementById('backwall-left').value),
            backwallRight: parseInt(document.getElementById('backwall-right').value)
        };

        // Add profile data
        this.config.profileData = this.profiles[this.config.profile];

        localStorage.setItem('beamConfig', JSON.stringify(this.config));
        return this.config;
    }

    setupEventListeners() {
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.target.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Preview tab switching
        document.querySelectorAll('.preview-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.target.dataset.view;
                this.switchPreview(view);
            });
        });

        // Profile change
        document.getElementById('beam-profile').addEventListener('change', (e) => {
            this.config.profile = e.target.value;
            this.updateProfileInfo();
            this.renderElevationPreview();
            this.renderSectionPreview();
        });

        // Form changes trigger preview update
        const formInputs = document.querySelectorAll('input, select');
        formInputs.forEach(input => {
            input.addEventListener('change', () => {
                this.renderElevationPreview();
                this.renderSectionPreview();
            });
        });

        // Action buttons
        document.getElementById('proceed-btn').addEventListener('click', () => this.proceedToInspection());
        document.getElementById('mobile-proceed').addEventListener('click', () => this.proceedToInspection());
        document.getElementById('save-config').addEventListener('click', () => {
            this.saveConfig();
            this.showMessage('Configuration saved');
        });
        document.getElementById('reset-config').addEventListener('click', () => this.resetConfig());

        // Populate form with saved config
        this.populateForm();
    }

    populateForm() {
        document.getElementById('project-name').value = this.config.projectName;
        document.getElementById('beam-id').value = this.config.beamId;
        document.getElementById('inspector').value = this.config.inspector;
        document.getElementById('direction').value = this.config.direction;
        document.getElementById('beam-profile').value = this.config.profile;
        document.getElementById('length-ft').value = this.config.lengthFt;
        document.getElementById('length-in').value = this.config.lengthIn;
        document.getElementById('top-flange-visible').checked = this.config.topFlangeVisible;
        document.getElementById('bearing-cl-ft').value = this.config.bearingClFt;
        document.getElementById('bearing-cl-in').value = this.config.bearingClIn;
        document.getElementById('seat-left').value = this.config.seatLeft;
        document.getElementById('seat-right').value = this.config.seatRight;
        document.getElementById('backwall-left').value = this.config.backwallLeft;
        document.getElementById('backwall-right').value = this.config.backwallRight;
    }

    switchTab(tab) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tab}-tab`);
        });
    }

    switchPreview(view) {
        // Update preview tabs
        document.querySelectorAll('.preview-tab').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === view);
        });

        // Update preview content
        document.querySelectorAll('.preview-container').forEach(container => {
            const isActive = 
                (view === 'elevation' && container.id === 'elevation-preview') ||
                (view === 'section' && container.id === 'section-preview');
            container.classList.toggle('active', isActive);
        });
    }

    updateProfileInfo() {
        const profile = this.profiles[this.config.profile];
        document.getElementById('profile-depth').textContent = profile.depth + '"';
        document.getElementById('profile-weight').textContent = profile.weight + ' lb/ft';
        document.getElementById('profile-flange').textContent = 
            `${profile.flangeWidth}" × ${profile.flangeThickness}"`;
        document.getElementById('profile-web').textContent = profile.webThickness + '"';
    }

    renderElevationPreview() {
        const svg = document.getElementById('elevation-svg');
        const beamLength = parseInt(document.getElementById('length-ft').value) * 12 + 
                          parseInt(document.getElementById('length-in').value);
        const bearingCL = parseInt(document.getElementById('bearing-cl-ft').value) * 12 + 
                         parseInt(document.getElementById('bearing-cl-in').value);
        const profile = this.profiles[document.getElementById('beam-profile').value];
        const topFlangeVisible = document.getElementById('top-flange-visible').checked;
        
        // Calculate scale
        const padding = 100;
        const availableWidth = 800 - 2 * padding;
        const scale = Math.min(availableWidth / beamLength, 10);
        
        const centerX = 400;
        const centerY = 200;
        const beamX = centerX - (beamLength * scale) / 2;
        const beamY = centerY - (profile.depth * scale) / 2;
        
        // Clear existing elements
        this.clearSVGGroup('elevation-abutments');
        this.clearSVGGroup('elevation-beam');
        this.clearSVGGroup('elevation-bearings');
        this.clearSVGGroup('elevation-dimensions');
        
        // Draw abutments (monolithic structure)
        this.drawAbutments(beamX, beamY, beamLength, profile.depth, scale);
        
        // Draw beam
        this.drawBeam(beamX, beamY, beamLength, profile, scale, topFlangeVisible);
        
        // Draw bearings
        this.drawBearings(beamX, beamY, beamLength, bearingCL, profile.depth, scale);
        
        // Draw dimensions
        this.drawDimensions(beamX, beamY, beamLength, bearingCL, profile.depth, scale);
    }

    drawAbutments(x, y, beamLength, beamDepth, scale) {
        const group = document.getElementById('elevation-abutments');
        const seatLeft = parseInt(document.getElementById('seat-left').value);
        const seatRight = parseInt(document.getElementById('seat-right').value);
        const backwallLeft = parseInt(document.getElementById('backwall-left').value);
        const backwallRight = parseInt(document.getElementById('backwall-right').value);
        
        // Left abutment (monolithic)
        if (seatLeft > 0) {
            // Bridge seat (horizontal surface)
            const seatRect = this.createSVGElement('rect', {
                x: x - seatLeft * scale,
                y: y + beamDepth * scale - 4 * scale,
                width: seatLeft * scale,
                height: 20 * scale,
                class: 'bridge-seat'
            });
            group.appendChild(seatRect);
            
            // Backwall (vertical at beam end)
            const backwallRect = this.createSVGElement('rect', {
                x: x - backwallLeft * scale,
                y: y - 10 * scale,
                width: backwallLeft * scale,
                height: (beamDepth + 10) * scale,
                class: 'backwall'
            });
            group.appendChild(backwallRect);
            
            // Breastwall (drops from inner edge of seat)
            const breastwallRect = this.createSVGElement('rect', {
                x: x - seatLeft * scale,
                y: y + beamDepth * scale + 16 * scale,
                width: 4 * scale,
                height: 30 * scale,
                class: 'breastwall'
            });
            group.appendChild(breastwallRect);
        }
        
        // Right abutment (mirror)
        if (seatRight > 0) {
            // Bridge seat
            const seatRect = this.createSVGElement('rect', {
                x: x + beamLength * scale,
                y: y + beamDepth * scale - 4 * scale,
                width: seatRight * scale,
                height: 20 * scale,
                class: 'bridge-seat'
            });
            group.appendChild(seatRect);
            
            // Backwall
            const backwallRect = this.createSVGElement('rect', {
                x: x + beamLength * scale,
                y: y - 10 * scale,
                width: backwallRight * scale,
                height: (beamDepth + 10) * scale,
                class: 'backwall'
            });
            group.appendChild(backwallRect);
            
            // Breastwall
            const breastwallRect = this.createSVGElement('rect', {
                x: x + beamLength * scale + seatRight * scale - 4 * scale,
                y: y + beamDepth * scale + 16 * scale,
                width: 4 * scale,
                height: 30 * scale,
                class: 'breastwall'
            });
            group.appendChild(breastwallRect);
        }
    }

    drawBeam(x, y, beamLength, profile, scale, topFlangeVisible) {
        const group = document.getElementById('elevation-beam');
        
        // Top flange
        if (topFlangeVisible) {
            const topFlange = this.createSVGElement('rect', {
                x: x,
                y: y,
                width: beamLength * scale,
                height: profile.flangeThickness * scale,
                class: 'beam-flange'
            });
            group.appendChild(topFlange);
        } else {
            const topFlange = this.createSVGElement('rect', {
                x: x,
                y: y,
                width: beamLength * scale,
                height: profile.flangeThickness * scale,
                class: 'beam-hidden'
            });
            group.appendChild(topFlange);
        }
        
        // Web (full length between flanges)
        const web = this.createSVGElement('rect', {
            x: x,
            y: y + profile.flangeThickness * scale,
            width: beamLength * scale,
            height: (profile.depth - 2 * profile.flangeThickness) * scale,
            class: 'beam-web'
        });
        group.appendChild(web);
        
        // Bottom flange
        const bottomFlange = this.createSVGElement('rect', {
            x: x,
            y: y + (profile.depth - profile.flangeThickness) * scale,
            width: beamLength * scale,
            height: profile.flangeThickness * scale,
            class: 'beam-flange'
        });
        group.appendChild(bottomFlange);
    }

    drawBearings(x, y, beamLength, bearingCL, beamDepth, scale) {
        const group = document.getElementById('elevation-bearings');
        const bearingOffset = (beamLength - bearingCL) / 2;
        const bearingWidth = 18;
        const bearingHeight = 8;
        
        // Left bearing
        const leftBearing = this.createSVGElement('rect', {
            x: x + bearingOffset * scale - (bearingWidth * scale / 2),
            y: y + beamDepth * scale - bearingHeight * scale,
            width: bearingWidth * scale,
            height: bearingHeight * scale,
            rx: 2,
            class: 'bearing'
        });
        group.appendChild(leftBearing);
        
        // Right bearing
        const rightBearing = this.createSVGElement('rect', {
            x: x + (beamLength - bearingOffset) * scale - (bearingWidth * scale / 2),
            y: y + beamDepth * scale - bearingHeight * scale,
            width: bearingWidth * scale,
            height: bearingHeight * scale,
            rx: 2,
            class: 'bearing'
        });
        group.appendChild(rightBearing);
    }

    drawDimensions(x, y, beamLength, bearingCL, beamDepth, scale) {
        const group = document.getElementById('elevation-dimensions');
        
        // Beam length dimension
        const dimY = y + beamDepth * scale + 60;
        const line = this.createSVGElement('line', {
            x1: x,
            y1: dimY,
            x2: x + beamLength * scale,
            y2: dimY,
            class: 'dimension-line'
        });
        group.appendChild(line);
        
        // End ticks
        const tick1 = this.createSVGElement('line', {
            x1: x,
            y1: dimY - 5,
            x2: x,
            y2: dimY + 5,
            class: 'dimension-line'
        });
        group.appendChild(tick1);
        
        const tick2 = this.createSVGElement('line', {
            x1: x + beamLength * scale,
            y1: dimY - 5,
            x2: x + beamLength * scale,
            y2: dimY + 5,
            class: 'dimension-line'
        });
        group.appendChild(tick2);
        
        // Dimension text
        const lengthFt = Math.floor(beamLength / 12);
        const lengthIn = beamLength % 12;
        const text = this.createSVGElement('text', {
            x: x + (beamLength * scale) / 2,
            y: dimY + 15,
            class: 'dimension-text'
        });
        text.textContent = `${lengthFt}'-${lengthIn}"`;
        group.appendChild(text);
        
        // Bearing C/L dimension
        const bearingOffset = (beamLength - bearingCL) / 2;
        const bearingLine = this.createSVGElement('line', {
            x1: x + bearingOffset * scale,
            y1: dimY + 25,
            x2: x + (beamLength - bearingOffset) * scale,
            y2: dimY + 25,
            class: 'dimension-line'
        });
        group.appendChild(bearingLine);
        
        const bearingText = this.createSVGElement('text', {
            x: x + (beamLength * scale) / 2,
            y: dimY + 40,
            class: 'dimension-text'
        });
        const bearingFt = Math.floor(bearingCL / 12);
        const bearingIn = bearingCL % 12;
        bearingText.textContent = `Bearing C/L: ${bearingFt}'-${bearingIn}"`;
        group.appendChild(bearingText);
    }

    renderSectionPreview() {
        const svg = document.getElementById('section-svg');
        const profile = this.profiles[document.getElementById('beam-profile').value];
        const topFlangeVisible = document.getElementById('top-flange-visible').checked;
        
        // Clear existing elements
        this.clearSVGGroup('section-beam');
        this.clearSVGGroup('section-labels');
        
        // Calculate scale to fit
        const padding = 50;
        const availableSize = 300;
        const scale = availableSize / Math.max(profile.depth, profile.flangeWidth);
        
        const centerX = 200;
        const centerY = 200;
        const beamX = centerX - (profile.flangeWidth * scale) / 2;
        const beamY = centerY - (profile.depth * scale) / 2;
        
        const group = document.getElementById('section-beam');
        
        // Top flange
        if (topFlangeVisible) {
            const topFlange = this.createSVGElement('rect', {
                x: beamX,
                y: beamY,
                width: profile.flangeWidth * scale,
                height: profile.flangeThickness * scale,
                class: 'beam-flange'
            });
            group.appendChild(topFlange);
        } else {
            const topFlange = this.createSVGElement('rect', {
                x: beamX,
                y: beamY,
                width: profile.flangeWidth * scale,
                height: profile.flangeThickness * scale,
                class: 'beam-hidden'
            });
            group.appendChild(topFlange);
        }
        
        // Web (centered)
        const webX = centerX - (profile.webThickness * scale) / 2;
        const web = this.createSVGElement('rect', {
            x: webX,
            y: beamY + profile.flangeThickness * scale,
            width: profile.webThickness * scale,
            height: (profile.depth - 2 * profile.flangeThickness) * scale,
            class: 'beam-web'
        });
        group.appendChild(web);
        
        // Bottom flange
        const bottomFlange = this.createSVGElement('rect', {
            x: beamX,
            y: beamY + (profile.depth - profile.flangeThickness) * scale,
            width: profile.flangeWidth * scale,
            height: profile.flangeThickness * scale,
            class: 'beam-flange'
        });
        group.appendChild(bottomFlange);
        
        // Add labels
        const labelGroup = document.getElementById('section-labels');
        
        // Depth label
        const depthLabel = this.createSVGElement('text', {
            x: beamX - 30,
            y: centerY,
            class: 'section-label',
            'text-anchor': 'middle'
        });
        depthLabel.textContent = profile.depth + '"';
        labelGroup.appendChild(depthLabel);
        
        // Flange width label
        const flangeLabel = this.createSVGElement('text', {
            x: centerX,
            y: beamY - 10,
            class: 'section-label',
            'text-anchor': 'middle'
        });
        flangeLabel.textContent = profile.flangeWidth + '"';
        labelGroup.appendChild(flangeLabel);
        
        // Web thickness label
        const webLabel = this.createSVGElement('text', {
            x: centerX,
            y: centerY,
            class: 'section-label',
            'text-anchor': 'middle'
        });
        webLabel.textContent = `Web: ${profile.webThickness}"`;
        labelGroup.appendChild(webLabel);
    }

    clearSVGGroup(groupId) {
        const group = document.getElementById(groupId);
        while (group.firstChild) {
            group.removeChild(group.firstChild);
        }
    }

    createSVGElement(type, attributes) {
        const element = document.createElementNS('http://www.w3.org/2000/svg', type);
        for (const [key, value] of Object.entries(attributes)) {
            element.setAttribute(key, value);
        }
        return element;
    }

    proceedToInspection() {
        this.saveConfig();
        window.location.href = 'visualbeam-v3.html';
    }

    resetConfig() {
        if (confirm('Reset all settings to defaults?')) {
            localStorage.removeItem('beamConfig');
            location.reload();
        }
    }

    showMessage(msg) {
        const status = document.getElementById('preview-status');
        status.textContent = msg;
        setTimeout(() => {
            status.textContent = 'Preview updates automatically';
        }, 2000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.beamSetup = new BeamSetup();
});