// Bridge Geometry Configuration Module
// Handles the relationships between structural elements

class BridgeGeometry {
    constructor(config) {
        this.config = config;
        this.validate();
    }

    validate() {
        // Ensure bearing C/L doesn't exceed beam length
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        
        if (bearingCL > beamLength) {
            console.warn('Bearing C/L exceeds beam length - adjusting');
            this.config.bearingClFt = this.config.lengthFt - 2; // 2 ft minimum for bearings
            this.config.bearingClIn = 0;
        }

        // Validate backwall distances
        if (this.config.backwallLeft < 0) this.config.backwallLeft = 0;
        if (this.config.backwallRight < 0) this.config.backwallRight = 0;

        // Calculate derived values
        this.calculate();
    }

    calculate() {
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        
        // Calculate bearing offset from each end
        this.bearingOffset = (beamLength - bearingCL) / 2;
        
        // Calculate out-to-out distance
        this.outToOut = beamLength + this.config.backwallLeft + this.config.backwallRight;
        
        // Typical bearing width (simplified - could be configured)
        this.bearingWidth = 18; // inches
        
        // Check if beam is integral (encased)
        this.isIntegralLeft = this.config.backwallLeft === 0;
        this.isIntegralRight = this.config.backwallRight === 0;
        
        // Calculate expansion joint width if not integral
        this.expansionJointLeft = this.isIntegralLeft ? 0 : 2; // inches
        this.expansionJointRight = this.isIntegralRight ? 0 : 2; // inches
    }

    // Get zones for inspection based on bearing locations
    getInspectionZones() {
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        const bearingCL = this.config.bearingClFt * 12 + this.config.bearingClIn;
        const bearingLeft = this.bearingOffset;
        const bearingRight = beamLength - this.bearingOffset;
        
        return {
            zoneA: [
                { start: bearingLeft - 24, end: bearingLeft + 24, label: 'Left Bearing Zone' },
                { start: bearingRight - 24, end: bearingRight + 24, label: 'Right Bearing Zone' }
            ],
            zoneB: [
                { start: bearingCL * 0.25, end: bearingCL * 0.25 + 60, label: 'Quarter Point Left' },
                { start: bearingCL * 0.75 - 60, end: bearingCL * 0.75, label: 'Quarter Point Right' }
            ],
            zoneC: {
                start: (beamLength / 2) - 60,
                end: (beamLength / 2) + 60,
                label: 'Mid-span Zone'
            },
            zoneD: [
                { start: 0, end: 12, label: 'Left End Zone' },
                { start: beamLength - 12, end: beamLength, label: 'Right End Zone' }
            ]
        };
    }

    // Get grid configuration based on inspection type
    getGridConfig(inspectionType) {
        const configs = {
            'detailed': {
                size: 1,
                description: 'Detailed 1" grid for critical areas',
                use: 'Fatigue cracks, detailed section loss'
            },
            'standard': {
                size: 6,
                description: 'Standard 6" grid for general inspection',
                use: 'Condition mapping, paint assessment'
            },
            'routine': {
                size: 12,
                description: 'Routine 12" grid for overall assessment',
                use: 'General condition, large defects'
            },
            'rapid': {
                size: 24,
                description: 'Rapid 24" grid for quick assessment',
                use: 'Emergency inspection, planning'
            }
        };
        
        return configs[inspectionType] || configs['routine'];
    }

    // Calculate deck geometry
    getDeckGeometry() {
        const profile = this.config.profile;
        
        return {
            deckThickness: 8, // inches typical
            haunchHeight: 2, // inches typical
            wearingSurface: 2.5, // inches typical
            topFlangeEmbedment: this.config.topFlangeVisible ? 0 : 2,
            totalDepth: profile.depth + 8 + 2 + 2.5
        };
    }

    // Get bearing details
    getBearingDetails() {
        return {
            type: 'Elastomeric', // Could be configured
            height: 2, // inches
            width: this.bearingWidth,
            length: 24, // inches (perpendicular to beam)
            leftOffset: this.bearingOffset,
            rightOffset: this.bearingOffset,
            skew: 0 // degrees - could be configured
        };
    }

    // Generate title block text
    getTitleBlock() {
        const direction = this.config.direction;
        const beamId = this.config.beamId;
        const projectName = this.config.projectName;
        
        return {
            title: `${beamId}, ${this.capitalize(direction)} Elevation`,
            project: projectName,
            date: new Date().toLocaleDateString(),
            scale: this.getDrawingScale(),
            inspector: this.config.inspector || 'TBD',
            leftEnd: this.getEndLabel(direction, 'left'),
            rightEnd: this.getEndLabel(direction, 'right')
        };
    }

    getEndLabel(direction, side) {
        const labels = {
            'north': { left: 'West', right: 'East' },
            'south': { left: 'East', right: 'West' },
            'east': { left: 'North', right: 'South' },
            'west': { left: 'South', right: 'North' }
        };
        
        return labels[direction]?.[side] || 'Unknown';
    }

    getDrawingScale() {
        const beamLength = this.config.lengthFt * 12 + this.config.lengthIn;
        
        // Standard engineering scales
        if (beamLength <= 240) return '1/4" = 1\'-0"';  // 20 ft
        if (beamLength <= 480) return '1/8" = 1\'-0"';  // 40 ft
        if (beamLength <= 720) return '1/16" = 1\'-0"'; // 60 ft
        return '1/32" = 1\'-0"'; // Longer spans
    }

    capitalize(str) {
        return str ? str.charAt(0).toUpperCase() + str.slice(1) : '';
    }

    // Export configuration for CAD
    exportForCAD() {
        return {
            units: 'inches',
            coordinates: 'absolute',
            origin: { x: 0, y: 0 },
            beam: {
                length: this.config.lengthFt * 12 + this.config.lengthIn,
                profile: this.config.profile,
                depth: this.config.profileData.depth,
                flangeWidth: this.config.profileData.flangeWidth,
                webThickness: this.config.profileData.webThickness
            },
            bearings: {
                left: { x: this.bearingOffset, y: 0 },
                right: { x: (this.config.lengthFt * 12 + this.config.lengthIn) - this.bearingOffset, y: 0 },
                centerline: this.config.bearingClFt * 12 + this.config.bearingClIn
            },
            abutments: {
                backwallLeft: this.config.backwallLeft,
                backwallRight: this.config.backwallRight,
                breastwall: this.config.breastwallFt * 12 + this.config.breastwallIn
            },
            grid: {
                size: this.config.gridSize,
                origin: { x: 0, y: 0 }
            },
            layers: {
                beam: 'BEAM',
                defects: 'DEFECTS',
                dimensions: 'DIMS',
                text: 'TEXT',
                grid: 'GRID'
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BridgeGeometry;
}