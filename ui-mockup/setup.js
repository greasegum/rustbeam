// VisualBeam Setup Page JavaScript

class BeamSetup {
    constructor() {
        // Beam profiles database
        this.profiles = {
            '36wf300': { depth: 36.75, flangeWidth: 16.625, flangeThickness: 1.6875, webThickness: 0.9375, weight: 300 },
            '36wf280': { depth: 36.5, flangeWidth: 16.625, flangeThickness: 1.5625, webThickness: 0.875, weight: 280 },
            '36wf260': { depth: 36.25, flangeWidth: 16.5, flangeThickness: 1.4375, webThickness: 0.8125, weight: 260 },
            '36wf230': { depth: 35.875, flangeWidth: 16.5, flangeThickness: 1.25, webThickness: 0.75, weight: 230 },
            '33wf240': { depth: 33.5, flangeWidth: 15.875, flangeThickness: 1.375, webThickness: 0.8125, weight: 240 },
            '30wf210': { depth: 30.375, flangeWidth: 15.125, flangeThickness: 1.3125, webThickness: 0.75, weight: 210 },
            '30wf190': { depth: 30.125, flangeWidth: 15.0, flangeThickness: 1.1875, webThickness: 0.6875, weight: 190 },
            '30wf172': { depth: 29.875, flangeWidth: 15.0, flangeThickness: 1.0625, webThickness: 0.625, weight: 172 },
            '27wf177': { depth: 27.375, flangeWidth: 14.125, flangeThickness: 1.1875, webThickness: 0.6875, weight: 177 },
            '24wf160': { depth: 24.625, flangeWidth: 14.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 160 },
            '24wf120': { depth: 24.25, flangeWidth: 12.125, flangeThickness: 0.9375, webThickness: 0.5625, weight: 120 },
            '21wf142': { depth: 21.5, flangeWidth: 13.125, flangeThickness: 1.0625, webThickness: 0.625, weight: 142 },
            '21wf112': { depth: 21.125, flangeWidth: 13.0, flangeThickness: 0.875, webThickness: 0.5, weight: 112 },
            '18wf114': { depth: 18.5, flangeWidth: 11.875, flangeThickness: 1.0, webThickness: 0.5625, weight: 114 },
            '18wf96': { depth: 18.25, flangeWidth: 11.875, flangeThickness: 0.875, webThickness: 0.5, weight: 96 },
            '16wf88': { depth: 16.25, flangeWidth: 11.5, flangeThickness: 0.8125, webThickness: 0.5, weight: 88 },
            '14wf74': { depth: 14.125, flangeWidth: 10.125, flangeThickness: 0.75, webThickness: 0.4375, weight: 74 },
            '12wf58': { depth: 12.125, flangeWidth: 10.0, flangeThickness: 0.625, webThickness: 0.375, weight: 58 },
            '10wf49': { depth: 10.0, flangeWidth: 10.0, flangeThickness: 0.5625, webThickness: 0.375, weight: 49 },
            '8wf31': { depth: 8.0, flangeWidth: 8.0, flangeThickness: 0.4375, webThickness: 0.3125, weight: 31 }
        };

        // Direction mappings for end labels
        this.endLabels = {
            'north': { left: 'West', right: 'East' },
            'south': { left: 'East', right: 'West' },
            'east': { left: 'North', right: 'South' },
            'west': { left: 'South', right: 'North' }
        };

        // Configuration state
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
            backwallRight: 12,
            breastwallFt: 40,
            breastwallIn: 0,
            direction: 'south'
        };

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateAll();
    }

    setupEventListeners() {
        // Profile selection
        document.getElementById('beam-profile').addEventListener('change', (e) => {
            this.config.profile = e.target.value;
            this.updateProfileInfo();
            this.updatePreview();
            this.updateSummary();
        });

        // Length inputs
        document.getElementById('beam-length').addEventListener('input', (e) => {
            this.config.lengthFt = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        document.getElementById('beam-length-inches').addEventListener('input', (e) => {
            this.config.lengthIn = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        // Top flange visibility
        document.querySelectorAll('input[name="top-flange"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.config.topFlangeVisible = e.target.value === 'visible';
                this.updatePreview();
                this.updateSummary();
            });
        });

        // Bearing C/L
        document.getElementById('bearing-cl').addEventListener('input', (e) => {
            this.config.bearingClFt = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        document.getElementById('bearing-cl-inches').addEventListener('input', (e) => {
            this.config.bearingClIn = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        // Backwall distances
        document.getElementById('backwall-left').addEventListener('input', (e) => {
            this.config.backwallLeft = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        document.getElementById('backwall-right').addEventListener('input', (e) => {
            this.config.backwallRight = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        // Breastwall distance
        document.getElementById('breastwall').addEventListener('input', (e) => {
            this.config.breastwallFt = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        document.getElementById('breastwall-inches').addEventListener('input', (e) => {
            this.config.breastwallIn = parseFloat(e.target.value) || 0;
            this.updatePreview();
            this.updateSummary();
        });

        // Direction buttons
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.direction-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.config.direction = btn.dataset.direction;
                this.updateElevationInfo();
                this.updatePreview();
                this.updateSummary();
            });
        });

        // Project info
        document.querySelector('.project-name').addEventListener('input', (e) => {
            this.config.projectName = e.target.value;
            this.updatePreview();
        });

        document.querySelector('.beam-id').addEventListener('input', (e) => {
            this.config.beamId = e.target.value;
            this.updateElevationInfo();
            this.updatePreview();
        });

        // Action buttons
        document.getElementById('btn-continue').addEventListener('click', () => {
            this.saveConfiguration();
            window.location.href = 'visualbeam.html';
        });

        document.getElementById('btn-cancel').addEventListener('click', () => {
            if (confirm('Cancel setup and return to main interface?')) {
                window.location.href = 'visualbeam.html';
            }
        });

        document.getElementById('btn-save').addEventListener('click', () => {
            this.saveTemplate();
        });

        document.getElementById('btn-load').addEventListener('click', () => {
            this.loadTemplate();
        });
    }

    updateAll() {
        this.updateProfileInfo();
        this.updateElevationInfo();
        this.updatePreview();
        this.updateSummary();
    }

    updateProfileInfo() {
        const profile = this.profiles[this.config.profile];
        document.getElementById('profile-depth').textContent = `Depth: ${profile.depth}"`;
        document.getElementById('profile-weight').textContent = `Weight: ${profile.weight} lbs/ft`;
    }

    updateElevationInfo() {
        const direction = this.config.direction;
        const labels = this.endLabels[direction];
        
        // Update title
        const title = `${this.config.beamId}, ${this.capitalize(direction)} Elevation`;
        document.getElementById('elevation-title').textContent = title;
        
        // Update end labels
        document.getElementById('left-end-label').textContent = labels.left;
        document.getElementById('right-end-label').textContent = labels.right;
    }

    updatePreview() {
        const profile = this.profiles[this.config.profile];
        const direction = this.config.direction;
        const labels = this.endLabels[direction];
        
        // Update title
        document.getElementById('preview-title').textContent = 
            `${this.config.beamId}, ${this.capitalize(direction)} Elevation`;
        
        // Update end labels
        document.getElementById('preview-left-label').textContent = labels.left;
        document.getElementById('preview-right-label').textContent = labels.right;
        
        // Update dimensions
        document.getElementById('preview-length').textContent = this.formatDimension(
            this.config.lengthFt, this.config.lengthIn
        );
        document.getElementById('preview-bearing-cl').textContent = this.formatDimension(
            this.config.bearingClFt, this.config.bearingClIn
        );
        document.getElementById('preview-breastwall').textContent = this.formatDimension(
            this.config.breastwallFt, this.config.breastwallIn
        );
        
        // Update profile
        document.getElementById('preview-profile').textContent = 
            `${Math.round(profile.depth)}" WF ${profile.weight}#`;
        
        // Update top flange visibility
        const topFlange = document.getElementById('preview-top-flange');
        if (this.config.topFlangeVisible) {
            topFlange.setAttribute('fill', '#e0e0e0');
            topFlange.setAttribute('stroke-dasharray', 'none');
            topFlange.setAttribute('opacity', '1');
        } else {
            topFlange.setAttribute('fill', '#f8f8f8');
            topFlange.setAttribute('stroke-dasharray', '3,2');
            topFlange.setAttribute('opacity', '0.5');
        }
        
        // Calculate and update beam position based on backwall distances
        const svgWidth = 600;
        const backwallLeftX = 50;
        const backwallRightX = 550;
        
        // If backwall distance is 0, beam end is at backwall
        const beamLeftX = this.config.backwallLeft === 0 ? 
            backwallLeftX : backwallLeftX + 20;
        const beamRightX = this.config.backwallRight === 0 ? 
            backwallRightX : backwallRightX - 20;
        const beamWidth = beamRightX - beamLeftX;
        
        // Update beam dimensions
        const beamElements = document.querySelectorAll('#preview-beam rect');
        beamElements[0].setAttribute('x', beamLeftX);  // Top flange
        beamElements[0].setAttribute('width', beamWidth);
        beamElements[1].setAttribute('x', beamLeftX + beamWidth/2 - 15);  // Web (centered)
        beamElements[2].setAttribute('x', beamLeftX);  // Bottom flange
        beamElements[2].setAttribute('width', beamWidth);
        
        // Update bearing positions
        const bearingSpan = (this.config.bearingClFt * 12 + this.config.bearingClIn);
        const totalLength = (this.config.lengthFt * 12 + this.config.lengthIn);
        const bearingOffset = (totalLength - bearingSpan) / 2;
        
        // Scale bearing positions to SVG coordinates
        const scale = beamWidth / totalLength;
        const leftBearingX = beamLeftX + (bearingOffset * scale);
        const rightBearingX = beamLeftX + ((totalLength - bearingOffset) * scale);
        
        const bearings = document.querySelectorAll('#preview-bearings rect');
        bearings[0].setAttribute('x', leftBearingX - 15);
        bearings[1].setAttribute('x', rightBearingX - 15);
        
        const bearingLines = document.querySelectorAll('#preview-bearings line');
        bearingLines[0].setAttribute('x1', leftBearingX);
        bearingLines[0].setAttribute('x2', leftBearingX);
        bearingLines[1].setAttribute('x1', rightBearingX);
        bearingLines[1].setAttribute('x2', rightBearingX);
    }

    updateSummary() {
        const profile = this.profiles[this.config.profile];
        
        document.getElementById('summary-profile').textContent = 
            `${Math.round(profile.depth)}" WF ${profile.weight}#`;
        document.getElementById('summary-length').textContent = 
            this.formatDimension(this.config.lengthFt, this.config.lengthIn);
        document.getElementById('summary-bearing').textContent = 
            this.formatDimension(this.config.bearingClFt, this.config.bearingClIn);
        document.getElementById('summary-breastwall').textContent = 
            this.formatDimension(this.config.breastwallFt, this.config.breastwallIn);
        document.getElementById('summary-backwall-left').textContent = 
            this.config.backwallLeft + '"';
        document.getElementById('summary-backwall-right').textContent = 
            this.config.backwallRight + '"';
        document.getElementById('summary-top-flange').textContent = 
            this.config.topFlangeVisible ? 'Visible' : 'Greyed Out';
        document.getElementById('summary-direction').textContent = 
            this.capitalize(this.config.direction);
    }

    formatDimension(feet, inches) {
        if (inches === 0) {
            return `${feet}'-0"`;
        } else {
            return `${feet}'-${inches}"`;
        }
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    saveConfiguration() {
        // Save configuration to localStorage for use in main interface
        localStorage.setItem('beamConfig', JSON.stringify(this.config));
        localStorage.setItem('beamConfigTimestamp', new Date().toISOString());
    }

    saveTemplate() {
        const templateName = prompt('Enter template name:');
        if (templateName) {
            const templates = JSON.parse(localStorage.getItem('beamTemplates') || '{}');
            templates[templateName] = this.config;
            localStorage.setItem('beamTemplates', JSON.stringify(templates));
            alert(`Template "${templateName}" saved successfully.`);
        }
    }

    loadTemplate() {
        const templates = JSON.parse(localStorage.getItem('beamTemplates') || '{}');
        const templateNames = Object.keys(templates);
        
        if (templateNames.length === 0) {
            alert('No saved templates found.');
            return;
        }
        
        const templateName = prompt(`Select template:\n${templateNames.join('\n')}`);
        if (templateName && templates[templateName]) {
            this.config = { ...templates[templateName] };
            this.applyConfiguration();
            alert(`Template "${templateName}" loaded.`);
        }
    }

    applyConfiguration() {
        // Apply loaded configuration to form controls
        document.getElementById('beam-profile').value = this.config.profile;
        document.getElementById('beam-length').value = this.config.lengthFt;
        document.getElementById('beam-length-inches').value = this.config.lengthIn;
        document.getElementById('bearing-cl').value = this.config.bearingClFt;
        document.getElementById('bearing-cl-inches').value = this.config.bearingClIn;
        document.getElementById('backwall-left').value = this.config.backwallLeft;
        document.getElementById('backwall-right').value = this.config.backwallRight;
        document.getElementById('breastwall').value = this.config.breastwallFt;
        document.getElementById('breastwall-inches').value = this.config.breastwallIn;
        
        // Set radio buttons
        document.querySelector(`input[name="top-flange"][value="${this.config.topFlangeVisible ? 'visible' : 'greyed'}"]`).checked = true;
        
        // Set direction button
        document.querySelectorAll('.direction-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.direction === this.config.direction);
        });
        
        // Update all displays
        this.updateAll();
    }
}

// Initialize setup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new BeamSetup();
});