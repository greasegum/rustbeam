# VisualBeam Inspector - Focused Implementation Roadmap

## Core Truth
VisualBeam Inspector is a **stateful field sketcher** with binary/tri-level grids, marching squares, smoothing, and clean exports. It is NOT a CAD system.

## Stack (Locked)

### Render Core
- **Phaser 3** (Canvas mode) + TypeScript
  - Buttery pan/zoom out of the box
  - Hit-testing that works
  - Draw-time ergonomics
  - Treats as view + immediate feedback layer

### App Shell
- **Vanilla TypeScript** with minimal event bus
  - Simple dialogs, toolbar, export panel
  - Web Components if needed
  - NO React in the render loop
  - If React used: quarantined to chrome only, talks through action boundary

### State Management
- **Single small store** (Zustand or plain TS)
  - Normalized beam profile
  - Raster severity grid (Uint8Array)
  - Vector contours per iso-level (raw + smoothed)
  - Marks/notes
  - Current tool
  - Phaser reads, gestures dispatch coarse actions

### Processing
- **Web Worker** for marching squares + smoothing
  - Debounced raster→contour pass per iso
  - Chaikin smoothing (buttery) or DP-simplify + cubic (CAD-like)
  - Snap-to-face clamp (no leaks outside W-shape)
  - Message with compact payload, return polylines
  - Store both raw and smoothed versions

### Storage
- **XML** as canonical format (small, focused)
  ```xml
  <visualbeam-sketch version="1.0">
    <grid dims="256,256">
      <!-- base64 Uint8Array -->
    </grid>
    <contours>
      <iso level="CS1">
        <raw>polyline data</raw>
        <path format="svgPath">smoothed path</path>
      </iso>
    </contours>
  </visualbeam-sketch>
  ```
- **Dexie/IndexedDB** for offline projects
- **Zod** for TS schema validation

### Exports
- **SVG** first (publication-ready, data attributes)
- **PNG** second (from canvas)
- **JSON** mirror as courtesy
- **PDF** via pdf-lib when needed
- **DXF** path-only behind flag (no dimension entities)

## Phase 1: Core Sketcher (Week 1-2)

### Canvas Setup
- [ ] Initialize Phaser 3 game in Canvas mode
- [ ] Set up TypeScript config with strict mode
- [ ] Create beam W-shape mask/bounds
- [ ] Implement pan/zoom with touch support
- [ ] Add grid overlay (binary/tri-level)

### Basic Interaction
- [ ] Paint tool (click/drag to fill cells)
- [ ] Erase tool
- [ ] Grid snapping
- [ ] Touch gestures
- [ ] Hover preview

## Phase 2: State & Actions (Week 3)

### Store Setup
- [ ] Define state shape (profile, grid, contours, tool)
- [ ] Create action boundary
- [ ] Implement paint/erase actions
- [ ] Add undo/redo (action replay)
- [ ] Connect Phaser to store (read-only)

### Grid Management
- [ ] Uint8Array for severity levels (0-4)
- [ ] Dirty region tracking
- [ ] Grid-to-canvas coordinate mapping
- [ ] Flood fill algorithm
- [ ] Selection lasso

## Phase 3: Marching Squares (Week 4-5)

### Worker Setup
- [ ] Create Web Worker scaffold
- [ ] Message protocol (grid window + iso level)
- [ ] Implement marching squares
- [ ] Return polylines per iso-level
- [ ] Cache raw contours

### Smoothing
- [ ] Chaikin algorithm (default)
- [ ] DP-simplify option
- [ ] Face clamping (no leaks)
- [ ] Store both raw and smoothed
- [ ] Tunable smoothing parameters

## Phase 4: Visual Polish (Week 6)

### Rendering
- [ ] Layer system (grid, paint, contours, annotations)
- [ ] CS1-CS4 color palette
- [ ] Hover halos
- [ ] Selection highlights
- [ ] Smooth animations

### UI Chrome
- [ ] Tool palette (paint, erase, select)
- [ ] Condition state selector
- [ ] Zoom controls
- [ ] Grid size selector
- [ ] Save/Load buttons

## Phase 5: XML & Persistence (Week 7)

### Schema
- [ ] Define minimal XSD
- [ ] Grid serialization (base64)
- [ ] Contour storage (raw + smoothed)
- [ ] Coordinate normalization
- [ ] Version handling

### Save/Load
- [ ] Zod validation schemas
- [ ] XML serialization
- [ ] XML parsing
- [ ] IndexedDB integration
- [ ] Project thumbnails

## Phase 6: Exports (Week 8)

### SVG Export
- [ ] Convert contours to SVG paths
- [ ] Add data attributes (face, iso-level)
- [ ] Proper viewBox scaling
- [ ] Layer organization
- [ ] Style embedding

### Other Formats
- [ ] PNG from canvas
- [ ] JSON mirror
- [ ] PDF with title block (via pdf-lib)
- [ ] Basic DXF paths (no entities)

## Performance Guardrails

### Hard Limits
- Grid max: **512×512**
- Frame budget: **16ms** interaction, **33ms** during smoothing
- Contour count: **1000 per iso-level**
- Worker SLA: **≤100ms** for 128×128 dirty window
- File size: **<5MB** for typical project

### Optimization Triggers
- If grid >256×256: tile-based dirty regions
- If contours >500: LOD system
- If smoothing >50ms: reduce quality
- If file >5MB: compression

## What We're NOT Building

- ❌ Full CAD system
- ❌ Dimension entities
- ❌ Complex constraints
- ❌ Block definitions
- ❌ 3D anything
- ❌ BIM integration
- ❌ Parametric modeling
- ❌ Assembly management
- ❌ Real-time collaboration
- ❌ Cloud rendering

## Success Metrics

### Performance
- 60 FPS during pan/zoom
- <50ms paint response
- <100ms contour generation
- <1s full export

### Usability
- Single tap to paint
- Two-finger pan/zoom
- 3 taps to export
- Works on 2018 iPad

### Quality
- Clean SVG paths
- No contour leaks
- Smooth curves
- Readable exports

## Future Considerations (Not Now)

### Phase 2 Accelerators
- Rust/WASM for heavy processing
- Multi-resolution grids
- Advanced interpolation
- GPU acceleration

### Nice-to-Haves
- Animation timeline
- Layer management
- Custom brushes
- Vector annotations

## Development Workflow

### Daily
1. Work in feature branches
2. Test on real tablet
3. Profile performance
4. Commit working code

### Weekly
1. Performance audit
2. Tablet testing
3. Export validation
4. Code cleanup

## The Mantras

1. **"It's a sketcher, not CAD"**
2. **"If it's slow on tablet, it's broken"**
3. **"Contours are derived, grid is truth"**
4. **"Export clean vectors, not entities"**
5. **"When in doubt, ship less"**

---

This is a 8-week path to a **working field sketcher** that does one thing well: capture beam conditions as painted grids, generate smooth contours, and export clean vectors. Everything else is noise.