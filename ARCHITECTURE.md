# VisualBeam Inspector - Architectural Philosophy

## Core Philosophy

VisualBeam Inspector is a **field-first sketcher** for structural beam inspection, not a CAD system. It prioritizes immediate visual feedback, fluid interaction, and professional output quality while maintaining strict architectural discipline around state management and data flow.

## Fundamental Principles

### 1. Canonical vs Derived State Separation

The system maintains a strict distinction between authoritative data and computed geometry:

#### Canonical State (Source of Truth)
- **What**: The minimal, unambiguous data that completely describes the inspection
- **Characteristics**:
  - Persistable and serializable
  - Version-controlled
  - Small in size
  - Coordinate-system agnostic (world space)
- **Examples**:
  - Grid cell definitions with defect metadata
  - Annotation definitions as abstract entities
  - Beam configuration and dimensions
  - Project metadata

#### Derived State (Cached Computations)
- **What**: Geometry and render data computed from canonical state
- **Characteristics**:
  - Ephemeral and regeneratable
  - Performance-optimized
  - View-dependent
  - Can be invalidated and rebuilt
- **Examples**:
  - Contours from marching squares
  - Smoothed bezier paths
  - Screen-space coordinates
  - Collision detection bounds
  - Leader line routing

**Key Insight**: Derived state can live in Zustand alongside canonical state, but it's marked as non-persistable and regenerated on demand. This prevents "truth drift" while maintaining performance.

### 2. World Coordinates as Universal Language

All canonical data uses world coordinates (inches/millimeters), never screen coordinates:

```typescript
// Canonical annotation - world space
{
  anchor: { x: 120, y: 6 },  // 120 inches from origin, 6 inches up
  constraints: {
    targetCell: { row: 2, col: 40 },
    offset: { x: 0, y: 3 }  // 3 inches above cell center
  }
}

// Derived screen geometry - computed at render time
{
  screenAnchor: { x: 1200, y: 60 },  // pixels
  screenTextBox: { x: 1180, y: 45, width: 100, height: 30 }
}
```

This ensures:
- Export geometry matches screen geometry structurally
- Zoom/pan doesn't affect saved data
- Cross-device consistency
- Clean unit conversion

### 3. Constraint-Based Annotation System

Annotations are defined by relationships, not absolute positions:

```typescript
interface CanonicalAnnotation {
  // Abstract definition
  type: 'dimension' | 'leader' | 'callout';
  
  // Relationship to geometry
  constraints?: {
    targetCell?: { row, col };        // Grid attachment
    targetFeature?: 'beam-top';       // Feature attachment
    offset?: { x, y };                 // Relative offset
  };
  
  // Content
  text: string;
  
  // Style hints (not pixels)
  style?: {
    fontSize: 'small' | 'medium' | 'large';  // Semantic, not 12px
    emphasis: 'normal' | 'critical';         // Intent, not color
  };
}
```

Benefits:
- Annotations maintain relationships when geometry changes
- Smart repositioning on collisions
- Consistent layout across different renderers
- Clean semantic meaning in exports

### 4. Modular Codebase (<500 lines per file)

Each module has a single, clear responsibility:

```
src/
├── store/
│   ├── canonical/          # Truth management
│   │   └── types.ts        # ~100 lines
│   ├── derived/            # Cache management
│   │   ├── types.ts        # ~150 lines
│   │   └── geometryCache.ts # ~400 lines
│   └── refactored/
│       └── store.ts        # ~450 lines - Zustand integration
├── geometry/
│   ├── contourGenerator.ts    # ~350 lines - Marching squares
│   ├── coordinates.ts         # ~200 lines - Transformations
│   └── annotationConstraints.ts # ~300 lines - Constraint solver
└── xml/
    ├── serializer.ts      # ~250 lines - Canonical → XML
    └── deserializer.ts    # ~200 lines - XML → Canonical
```

### 5. Performance Through Selective Regeneration

The geometry cache tracks dependencies and regenerates only what's needed:

```typescript
interface CacheInvalidation {
  contours?: boolean;      // Grid cells changed
  annotations?: boolean;   // Annotations changed
  beamGeometry?: boolean; // Beam config changed
  gridGeometry?: boolean; // Grid size changed
  screenSpace?: boolean;  // View transform changed
}

// Changing grid cells only regenerates contours
markGridCell(row, col, defect) => invalidate({ contours: true })

// Changing zoom only clears screen cache
setZoom(2.0) => invalidate({ screenSpace: true })
```

### 6. XML as Canonical-Only Persistence

The XML format mirrors canonical state exactly:

```xml
<visualbeam-project version="1.0">
  <project>
    <name>Bridge Inspection #4</name>
    <date>2024-01-15</date>
  </project>
  
  <beam>
    <profile-id>W12X26</profile-id>
    <length units="imperial">240</length>
  </beam>
  
  <grid>
    <cell-size>3</cell-size>
    <cells>
      <cell row="2" col="40" defect="corrosion" severity="3"/>
    </cells>
  </grid>
  
  <annotations>
    <annotation id="ann-1" type="leader">
      <anchor x="120" y="6"/>
      <constraints>
        <target-cell row="2" col="40"/>
        <offset x="0" y="3"/>
      </constraints>
      <text>Severe corrosion - immediate attention required</text>
    </annotation>
  </annotations>
</visualbeam-project>
```

No derived data in the save file means:
- Small file sizes
- Clean version control diffs
- No stale cached data
- Deterministic regeneration

### 7. Renderer Agnosticism

The same derived geometry feeds multiple renderers:

```typescript
// Phaser renderer
function renderToPhaser(derived: DerivedState) {
  derived.contours.forEach(contour => {
    const graphics = scene.add.graphics();
    drawPath(graphics, contour.screenPath);
  });
}

// SVG exporter
function exportToSVG(derived: DerivedState) {
  const svg = createSVG();
  derived.contours.forEach(contour => {
    const path = svgPath(contour.worldPath);
    svg.append(path);
  });
}

// PDF exporter
function exportToPDF(derived: DerivedState) {
  const doc = new PDFDocument();
  derived.contours.forEach(contour => {
    doc.path(contour.worldPath);
  });
}
```

All exporters work from the same derived geometry, ensuring visual consistency.

## Implementation Patterns

### State Update Flow

```typescript
// User action
markCell(row: 5, col: 10, defect: 'crack')
  ↓
// Update canonical state
canonical.grid.cells.set('5,10', { row: 5, col: 10, defect: 'crack' })
  ↓
// Invalidate affected caches
geometryCache.invalidate({ contours: true })
  ↓
// Regenerate derived geometry
contourGenerator.generateContours(canonical.grid)
  ↓
// Update screen if visible
if (isVisible(contour)) renderContour(contour)
```

### Coordinate Transformation Pipeline

```typescript
// Canonical (world) → Derived (world) → Screen
Cell { row: 5, col: 10 }
  ↓ (cell to world)
World { x: 30, y: 15 }  // 10 * 3" = 30", 5 * 3" = 15"
  ↓ (constraint resolution)
World { x: 30, y: 18 }  // After 3" offset
  ↓ (view transform)
Screen { x: 450, y: 270 }  // At zoom 15px/inch
```

### Cache Invalidation Strategy

```typescript
class GeometryCache {
  private version = {
    canonical: 0,
    contours: 0,
    annotations: 0,
    view: 0
  };
  
  updateFromCanonical(canonical: CanonicalState, invalidation: CacheInvalidation) {
    if (invalidation.contours || this.version.canonical !== canonical.version) {
      this.regenerateContours(canonical);
      this.version.contours++;
    }
    
    if (invalidation.annotations) {
      this.regenerateAnnotations(canonical);
      this.version.annotations++;
    }
    
    // Screen space always invalidated by view changes
    if (invalidation.screenSpace) {
      this.clearScreenCache();
      this.version.view++;
    }
  }
}
```

## Technology Stack Rationale

### Core Technologies

- **TypeScript**: Type safety without runtime overhead
- **Phaser 3**: Battle-tested 2D renderer with excellent performance
- **Zustand**: Minimal state management that doesn't fight React
- **Vite**: Fast builds with excellent DX

### Architectural Decisions

1. **Phaser over Canvas API**: Provides sprite batching, input handling, and camera system out of the box

2. **Zustand over Redux**: Less boilerplate, better TypeScript inference, natural for derived state

3. **Web Workers for Marching Squares**: Keeps UI thread responsive during contour generation

4. **XML over JSON for Persistence**: Industry standard for CAD interchange, validates against schema

5. **Client-side Only**: No backend complexity, works offline, data stays with user

## Performance Guardrails

### Target Metrics
- **Grid size**: Up to 1000x1000 cells
- **Contour generation**: <100ms for typical defect patterns
- **Pan/zoom**: 60fps on tablet hardware
- **File load**: <500ms for typical project

### Optimization Strategies
- Spatial indexing for visible cell queries
- Dirty rectangle tracking for partial redraws
- LOD switching for zoomed-out views
- Contour simplification at small scales
- Debounced regeneration during rapid edits

## Future Evolution

The architecture supports these future enhancements without breaking changes:

1. **Multi-beam Projects**: Canonical state can add a `beams` array
2. **3D Visualization**: Derived state can include 3D geometry
3. **Collaborative Editing**: Canonical state operations are already atomic
4. **Undo/Redo**: Canonical state is immutable-friendly
5. **Cloud Sync**: Only canonical state needs synchronization
6. **Plugin System**: Renderers and exporters are already pluggable

## Guiding Questions

When making architectural decisions, ask:

1. **Is this canonical or derived?** If it can be computed, it's derived.
2. **What invalidations does this change trigger?** Minimize the cascade.
3. **Does this belong in world or screen space?** Default to world.
4. **Can this be regenerated deterministically?** If yes, don't persist it.
5. **Is this module doing one thing well?** If not, split it.

## Conclusion

VisualBeam Inspector's architecture prioritizes:
- **Correctness** through canonical/derived separation
- **Performance** through selective regeneration
- **Maintainability** through modular design
- **Flexibility** through renderer agnosticism
- **Reliability** through deterministic computation

The system is a field-first sketcher that happens to export professional drawings, not a CAD system that happens to work on tablets. Every architectural decision flows from this core identity.