# Bridge Geometry Documentation

## Concrete Abutment Steel Beam Bridge with Composite Deck

### Structural Configuration

```
CROSS SECTION (Looking along bridge)

    ┌─────────────────────────────────┐ ← Wearing Surface (2-3")
    ├─────────────────────────────────┤ ← Concrete Deck (7-9")
    │  ┌───┐  ┌───┐  ┌───┐  ┌───┐   │ ← Haunch (1-3")
    │  ├───┤  ├───┤  ├───┤  ├───┤   │ ← Top Flanges (embedded)
    │  │   │  │   │  │   │  │   │   │ ← Webs
    └──┴───┴──┴───┴──┴───┴──┴───┴───┘ ← Bottom Flanges
       Beam 1  Beam 2  Beam 3  Beam 4
```

### Key Measurements

#### Longitudinal (Along Bridge)
1. **Beam Length**: Total physical length of steel beam
2. **Bearing C/L to C/L**: Distance between bearing centerlines (design span)
3. **Backwall to Beam End**: 
   - 0" = Integral/encased connection
   - 6-12" = Typical expansion joint
   - 12-24" = Seismic/special requirements

4. **Breastwall to Breastwall**: Clear hydraulic opening

#### Vertical Stack
1. **Total Depth**: Deck top to beam bottom
2. **Structural Depth**: Deck structural thickness + beam depth
3. **Clear Height**: Bottom of beam to ground/water

### Measurement Relationships

```javascript
// Key formulas
Bearing_CL = Beam_Length - (2 × Bearing_Offset_From_End)
Clear_Opening = Breastwall_Distance
Out_to_Out = Beam_Length + Backwall_Left + Backwall_Right

// Typical values
Bearing_Offset = 6" to 24" (from beam end)
Bearing_Width = 12" to 24"
Abutment_Width = 24" to 48"
```

### Inspection Access Scenarios

#### Top Flange Conditions
1. **Fully Visible**: 
   - Fascia beams with deck overhang
   - Open joints between deck sections
   - Access hatches in deck

2. **Not Visible (Greyed Out)**:
   - Interior beams with composite deck
   - Embedded in concrete haunch
   - Covered by stay-in-place forms

3. **Partially Visible**:
   - Through deck drains
   - At expansion joints
   - Edge of deck overhang

### Defect Marking Grid System

#### Web Grid (2D)
- Horizontal: Length divided by grid size (6", 12", 24")
- Vertical: Web height divided by grid size

#### Flange Grid (1D for bottom, conditional for top)
- Length divided by grid size
- Width typically one cell (full flange width)

### Elevation Direction Convention

The elevation direction determines:
1. **Title Block Text**: "Beam X, [Direction] Elevation"
2. **End Labels**: Based on compass orientation

| View Direction | Left End | Right End |
|---------------|----------|-----------|
| North         | West     | East      |
| South         | East     | West      |
| East          | North    | South     |
| West          | South    | North     |

### Critical Zones for Inspection

1. **Zone A - Bearing Areas** (0-2 ft from bearing)
   - High shear stress
   - Moisture accumulation
   - Bearing deterioration

2. **Zone B - Quarter Points** (L/4 and 3L/4)
   - Transition zones
   - Fatigue-prone areas

3. **Zone C - Mid-span** (L/2 ± 5 ft)
   - Maximum positive moment
   - Bottom flange tension cracks

4. **Zone D - Ends** (0-1 ft from beam end)
   - Joint leakage damage
   - Corrosion from deicing salts
   - Impact damage

### Standard Grid Overlays

```
1" Grid (Detailed Inspection):
- Used for critical areas
- Fatigue crack mapping
- Detailed section loss

6" Grid (Standard Inspection):
- General condition mapping
- Paint system assessment
- Minor section loss

12" Grid (Routine Inspection):
- Overall condition assessment
- Large area defects
- Preliminary surveys

24" Grid (Rapid Assessment):
- Emergency inspections
- Overall structural evaluation
- Planning-level assessment
```

### Coordinate System

```
Origin (0,0): Bottom left corner of beam (South/East elevations)
              Top left corner (North/West elevations)
X-axis: Along beam length (inches)
Y-axis: Along beam depth (inches)

Grid Cell ID: X##-Y##
Example: X120-Y18 = 120" from left, 18" from bottom
```

### Data Recording Standards

Each marked cell records:
- Condition State (1-4)
- Defect Type (if applicable)
- Percentage of cell affected
- Inspector notes
- Photo reference number

### Export Considerations

The inspection data must translate to:
1. **NBIS Ratings**: Element-level condition states
2. **CAD Drawings**: Scaled defect mapping
3. **Reports**: Quantified deterioration
4. **Maintenance**: Work order generation