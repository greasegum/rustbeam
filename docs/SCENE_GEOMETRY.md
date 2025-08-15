# Bridge Beam Scene Geometry Documentation

## Coordinate System

The scene uses a **2D Cartesian coordinate system** with:
- **Origin (0,0)**: Center of the beam span
- **X-axis**: Horizontal (positive right, negative left)
- **Y-axis**: Vertical (positive down, negative up)
- **Units**: Inches (world space), converted to pixels for display (scale factor: 10px/inch)

## Parametric Geometry Definition

### Core Parameters

```typescript
interface BridgeGeometry {
  beam: {
    profile: string;        // e.g., "W12X26"
    length: number;         // Total beam length (inches)
    depth: number;          // Beam depth from profile (inches)
    flangeThickness: number;// Top/bottom flange thickness
    webThickness: number;   // Web thickness
  };
  
  bearings: {
    left: {
      distanceFromEnd: number;  // Distance from left beam end to CL bearing
      width: number;             // Bearing plate width
      height: number;            // Total bearing stack height
    };
    right: {
      distanceFromEnd: number;  // Distance from right beam end to CL bearing
      width: number;             // Bearing plate width
      height: number;            // Total bearing stack height
    };
  };
  
  abutments: {
    backwallClearance: number;   // Gap between beam end and backwall
    seatWidth: number;           // DERIVED: (beamLength + 2*backwallClearance - breastwallDistance) / 2
    seatHeight: number;          // Vertical distance from base to seat surface
    totalHeight: number;         // Total abutment height
    footingExtension: number;    // Footing extends beyond backwall
  };
  
  spans: {
    breastwallDistance: number;  // Clear distance between facing brestwalls
    spanLength: number;          // CL bearing to CL bearing (computed)
    clearSpan: number;           // Face to face of beam supports (computed)
  };
}
```

## Geometric Relationships

### 1. Primary Constraints

```javascript
// Span length is derived from bearing positions
spanLength = beamLength - leftBearing.distanceFromEnd - rightBearing.distanceFromEnd

// Breastwall positions are derived from breastwall distance
leftBreastwallX = -(breastwallDistance / 2)
rightBreastwallX = (breastwallDistance / 2)

// Backwall positions include clearance
leftBackwallX = -(beamLength / 2 + backwallClearance)
rightBackwallX = (beamLength / 2 + backwallClearance)

// Seat width is DERIVED from beam geometry and breastwall distance
seatWidth = (beamLength + 2 * backwallClearance - breastwallDistance) / 2

// This ensures the geometric relationship:
// leftBackwallX + seatWidth = leftBreastwallX
// rightBreastwallX + seatWidth = rightBackwallX
```

### 2. Vertical Alignment

All elements align to the beam bottom as the reference plane:

```javascript
beamBottom = beamDepth / 2  // Since origin is at beam center
bearingTop = beamBottom
seatSurfaceY = beamBottom + bearingHeight
abutmentBase = beamBottom + bearingHeight + seatHeight
```

## Robust Parametric JSON Format

```json
{
  "version": "1.0",
  "units": "imperial",
  "origin": {
    "x": 0,
    "y": 0,
    "description": "Center of beam span"
  },
  
  "elements": {
    "beam": {
      "type": "structural-beam",
      "profile": "W12X26",
      "geometry": {
        "length": 240,
        "depth": 12.22,
        "flangeWidth": 6.49,
        "flangeThickness": 0.38,
        "webThickness": 0.23
      },
      "position": {
        "x": 0,
        "y": 0
      },
      "zones": [
        {
          "id": "top-flange",
          "bounds": { "yMin": -6.11, "yMax": -5.73 }
        },
        {
          "id": "web",
          "bounds": { "yMin": -5.73, "yMax": 5.73 }
        },
        {
          "id": "bottom-flange",
          "bounds": { "yMin": 5.73, "yMax": 6.11 }
        }
      ]
    },
    
    "bearings": [
      {
        "id": "bearing-left",
        "type": "elastomeric-bearing",
        "position": {
          "x": -108,  // -(length/2 - distanceFromEnd)
          "y": 6.11   // beam bottom
        },
        "geometry": {
          "width": 4,
          "layers": [
            { "height": 1, "material": "steel", "color": "#A8E6CF" },
            { "height": 1, "material": "elastomer", "color": "#FFD3B6" }
          ]
        }
      },
      {
        "id": "bearing-right",
        "type": "elastomeric-bearing",
        "position": {
          "x": 108,
          "y": 6.11
        },
        "geometry": {
          "width": 4,
          "layers": [
            { "height": 1, "material": "steel", "color": "#A8E6CF" },
            { "height": 1, "material": "elastomer", "color": "#FFD3B6" }
          ]
        }
      }
    ],
    
    "abutments": [
      {
        "id": "abutment-left",
        "type": "stepped-abutment",
        "vertices": [
          { "x": -100, "y": 8.11 },     // Breastwall top
          { "x": -100, "y": 15.11 },    // Breastwall at seat
          { "x": -122, "y": 15.11 },    // Backwall at seat
          { "x": -122, "y": 32.11 },    // Backwall bottom
          { "x": -124, "y": 32.11 },    // Footing extension
          { "x": -124, "y": 8.11 }      // Footing top
        ],
        "parameters": {
          "backwallClearance": 2,
          "seatWidth": 22,
          "seatHeight": 7,
          "totalHeight": 24
        }
      },
      {
        "id": "abutment-right",
        "type": "stepped-abutment",
        "vertices": [
          { "x": 122, "y": 32.11 },     // Backwall bottom
          { "x": 124, "y": 32.11 },     // Footing extension
          { "x": 124, "y": 8.11 },      // Footing top
          { "x": 100, "y": 8.11 },      // Breastwall top
          { "x": 100, "y": 15.11 },     // Breastwall at seat
          { "x": 122, "y": 15.11 }      // Backwall at seat
        ],
        "parameters": {
          "backwallClearance": 2,
          "seatWidth": 22,
          "seatHeight": 7,
          "totalHeight": 24
        }
      }
    ]
  },
  
  "dimensions": [
    {
      "id": "beam-length",
      "type": "linear",
      "start": { "x": -120, "y": -20 },
      "end": { "x": 120, "y": -20 },
      "value": 240,
      "label": "Beam Length"
    },
    {
      "id": "span-length",
      "type": "linear",
      "start": { "x": -108, "y": -15 },
      "end": { "x": 108, "y": -15 },
      "value": 216,
      "label": "Span (CL-CL)"
    },
    {
      "id": "breastwall-distance",
      "type": "linear",
      "start": { "x": -100, "y": -25 },
      "end": { "x": 100, "y": -25 },
      "value": 200,
      "label": "Breastwall Distance"
    },
    {
      "id": "seat-width-left",
      "type": "linear",
      "start": { "x": -122, "y": 10 },
      "end": { "x": -100, "y": 10 },
      "value": 22,
      "label": "Seat Width"
    },
    {
      "id": "backwall-clearance-left",
      "type": "linear",
      "start": { "x": -122, "y": -10 },
      "end": { "x": -120, "y": -10 },
      "value": 2,
      "label": "Clearance"
    }
  ],
  
  "constraints": [
    {
      "type": "symmetric",
      "elements": ["abutment-left", "abutment-right"],
      "axis": "y"
    },
    {
      "type": "aligned",
      "elements": ["bearing-left", "bearing-right"],
      "property": "y"
    },
    {
      "type": "coincident",
      "point1": { "element": "bearing-left", "vertex": "top" },
      "point2": { "element": "beam", "vertex": "bottom-center" }
    },
    {
      "type": "horizontal",
      "elements": [
        { "element": "abutment-left", "edge": "seat" },
        { "element": "abutment-right", "edge": "seat" }
      ]
    }
  ],
  
  "grid": {
    "size": 3,
    "origin": { "x": -120, "y": -6.11 },
    "extent": { "width": 240, "height": 12.22 }
  }
}
```

## Key Geometric Principles

### 1. **Parametric Relationships**
All geometry is driven by key parameters with derived values computed automatically:

**Example**: For a 240" beam with 2" backwall clearance and 200" breastwall distance:
```
seatWidth = (beamLength + 2 * backwallClearance - breastwallDistance) / 2
seatWidth = (240 + 2 * 2 - 200) / 2
seatWidth = (240 + 4 - 200) / 2
seatWidth = 44 / 2
seatWidth = 22 inches
```

Changing any of these parameters automatically updates:
- Seat width (recomputed)
- Beam end positions
- Backwall positions
- Abutment geometry
- Grid extent
- Dimension lines

### 2. **Constraint-Based Layout**
Elements maintain relationships through constraints:
- Bearings remain centered on their positions
- Abutment seats stay horizontal
- Symmetric elements mirror across Y-axis

### 3. **Zone-Based Organization**
The beam is divided into zones for defect tracking:
- Top flange zone
- Web zone  
- Bottom flange zone

### 4. **Grid Overlay**
A regular grid (default 3" cells) overlays the beam for precise defect marking:
- Grid aligns to beam bounds
- Cells can be marked with defect types and severity
- Grid transforms with view but stores in world coordinates

## Rendering Pipeline

```
1. Parse Parameters
   ↓
2. Calculate Derived Values (spans, positions)
   ↓
3. Apply Constraints
   ↓
4. Transform to Screen Space (scale × world coordinates)
   ↓
5. Render in Order:
   - Abutments (background)
   - Beam body
   - Beam zones
   - Bearings
   - Grid overlay
   - Dimensions (foreground)
   - Annotations (top)
```

## Benefits of This Approach

1. **Maintainability**: Changes to parameters automatically propagate
2. **Accuracy**: Precise geometric relationships are enforced
3. **Flexibility**: Easy to add new elements or constraints
4. **Interoperability**: JSON format can be exported/imported
5. **Documentation**: Self-describing geometry with clear semantics