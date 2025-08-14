# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VisualBeam Inspector is a TypeScript/React-based structural beam inspection system that prioritizes visual excellence, intuitive user experience, and seamless CAD ecosystem integration. The system is designed for field inspections with professional presentation-quality outputs.

### Core Technologies
- **React** for UI components and application shell
- **Phaser 3** for high-performance canvas rendering
- **TypeScript** for type safety and developer experience
- **Zustand** for state management with clean separation of concerns
- **Vite** for fast development and optimized production builds

### Beam Catalog Data
The comprehensive beam catalog is implemented in `src/data/beamCatalog.ts`. This includes:
- Over 150 wide flange (WF) beam profiles from 8" to 36" depths
- Complete dimensional data (depth, web thickness, flange dimensions, weight)
- Helper functions for querying beams by ID, depth range, or weight range
- Calculated properties like cross-sectional area and moment of inertia

## Build and Development Commands

### Development Setup
```bash
# Install dependencies
npm install

# Run development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Start production server
npm start
```

### Testing Commands
```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
tsc --noEmit

# Run linting
npm run lint
```

## Architecture Overview

The system follows a layered architecture with clear separation of concerns:

### Core Layers

1. **User Experience Layer** - Handles fluid sketching interface, visual design system, responsive feedback, and gesture recognition

2. **Presentation Layer** - Manages style engine (themes, colors, line weights), layout engine, typography system, and visual effects

3. **Interaction Layer** - Controls grid interaction, annotation placement, sketch recognition, and smart snapping

4. **Domain Layer** - Contains beam models (visual representation focus), defect patterns, annotation system, and grid logic

5. **Rendering Abstraction Layer** - Provides render strategy interface, composition pipeline, and output formatting

6. **CAD Translation Layer (Hermetic)** - Completely isolated layer for AutoCAD DXF/DWG conversion, Exchange XML, and industry standards compliance

### Key Design Principles

- **Visual Excellence First**: Every rendered element should be publication-ready with professional presentation quality
- **Intuitive User Experience**: Natural sketching with smart assistance and visual feedback
- **Hermetic CAD Compatibility**: Complete separation between internal representation and CAD formats

### Module Organization

```
src/
├── components/           # React UI components
│   ├── Header/          # Application header
│   ├── Toolbar/         # Mode-specific toolbars
│   ├── BottomBar/       # Status bar
│   ├── Setup/           # Setup modal
│   └── Export/          # Export modal
├── scenes/              # Phaser scenes
│   └── MainSceneRefactored.ts
├── store/               # Zustand state management
│   ├── canonical/       # Source-of-truth state
│   ├── derived/         # Computed state
│   └── slices/          # Store slices
├── geometry/            # Geometry algorithms
│   ├── gridSystem.ts
│   ├── contourGenerator.ts
│   └── coordinates.ts
├── data/               # Static data
│   └── beamCatalog.ts
├── ui/                 # Additional UI components
│   └── SetupMenu.tsx
├── utils/              # Utility functions
│   └── fileIO.ts
└── xml/                # XML serialization
    ├── serializer.ts
    └── deserializer.ts
```

## Current Implementation Status

The project is currently in active development with the following completed:

### Completed Features
- ✅ Professional horizontal UI layout with React components
- ✅ Phaser 3 canvas rendering with beam visualization
- ✅ Zustand store with canonical/derived state separation
- ✅ Setup modal with beam configuration
- ✅ Export modal with multiple format options
- ✅ Mode-specific toolbars (Edit, Annotate, View)
- ✅ Comprehensive beam catalog (150+ profiles)

### In Progress
- 🚧 Grid-based defect marking system
- 🚧 Marching squares contour generation
- 🚧 Annotation system with constraints
- 🚧 XML serialization/deserialization

### Planned Features
- 📋 SVG/PDF/DXF export implementation
- 📋 Touch gesture support
- 📋 Smart snapping and alignment guides
- 📋 Print-optimized layouts with title blocks
- 📋 Offline storage with IndexedDB

## Key Implementation Notes

### TypeScript/React Patterns

#### State Management
- Use Zustand for centralized state with clear action boundaries
- Separate canonical (source-of-truth) from derived (computed) state
- Implement selectors for performance optimization
- Use immer for immutable updates when needed

#### Performance Optimization
- Use React.memo for expensive components
- Implement virtual scrolling for large lists
- Debounce expensive computations
- Use Web Workers for heavy processing (marching squares)
#### Error Handling
- Use try-catch blocks for async operations
- Implement error boundaries in React components
- Provide user-friendly error messages
- Log errors for debugging in development

### Canvas Rendering Optimization
- Use Phaser's built-in dirty rectangle updates
- Implement level-of-detail for complex scenes
- Apply viewport culling for off-screen elements
- Use texture atlasing for UI elements
- Batch draw calls where possible

### Visual Testing Strategy
- Implement screenshot comparison tests for visual regression
- Validate cross-browser rendering consistency
- Test print preview accuracy
- Ensure CAD export format compliance

### CAD Translation Requirements
- Maintain complete separation from core domain logic
- Map beam geometry to Polylines/Regions in AutoCAD
- Use standard layer naming conventions
- Preserve metadata through Extended entity data (XData)

### Smart Interaction Features
- Implement magnetic snapping to beam boundaries
- Provide automatic alignment guides
- Support predictive path completion
- Enable smooth curve interpolation for natural drawing

## Core Features from phaserBeam Reference

### Beam Configuration
- Support for standard steel profiles (W-sections, I-beams, channels)
- Configurable dimensions and elevation views
- Grid-based measurement system (imperial and metric)
- Visual zone identification (web, flanges)

### Defect Marking System
- Grid cell-based defect marking
- Multiple defect types (corrosion, cracks, deformation)
- Severity levels with color coding
- Pattern recognition for common defect shapes
- Area calculation and statistics

### Annotation Capabilities
- Dimensional annotations with automatic calculations
- Leader lines with smart routing
- Text blocks with engineering fonts
- Callout bubbles with auto-positioning
- Grid-snap functionality for precision

### Professional Drawing Generation
- Title blocks with project information
- Legend generation for defect types
- Scale indicators and north arrows
- Revision clouds and markers
- Layer management for CAD export

## Export Formats

The system supports multiple export formats optimized for different use cases:
- **PDF**: Vector graphics with professional formatting, title blocks, and legends
- **PNG**: High-DPI raster for documentation (300+ DPI)
- **SVG**: Scalable vector graphics for web integration
- **DXF/DWG**: AutoCAD compatibility with proper layer structure
- **XML**: Industry-standard exchange format with full metadata

## TypeScript/React Implementation Benefits

### Development Advantages
- **Type Safety**: Full TypeScript support with strict mode
- **Hot Module Replacement**: Instant feedback during development
- **Rich Ecosystem**: Extensive library support through npm
- **Component Reusability**: Modular React components

### Performance Features
- **Virtual DOM**: Efficient UI updates through React
- **WebGL Rendering**: Hardware acceleration via Phaser 3
- **Code Splitting**: Optimized bundle sizes with Vite
- **Tree Shaking**: Automatic dead code elimination

### Cross-Platform Support
- **Progressive Web App**: Works offline with service workers
- **Responsive Design**: Adapts to desktop, tablet, and mobile
- **Browser Compatibility**: Runs on all modern browsers
- **Cloud Deployment**: Easy deployment to any web server

### Developer Experience
- **Excellent tooling**: VS Code, TypeScript, ESLint, Prettier
- **Documentation**: JSDoc comments and TypeScript definitions
- **Testing**: Jest/Vitest for unit and integration tests
- **Debugging**: Chrome DevTools with source maps