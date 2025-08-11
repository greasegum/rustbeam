# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VisualBeam is a Rust-based structural beam inspection system that prioritizes visual excellence, intuitive user experience, and seamless CAD ecosystem integration. The system is designed for field inspections with professional presentation-quality outputs.

## Build and Development Commands

### Rust Project Setup (once implemented)
```bash
# Build the project
cargo build --release

# Run tests
cargo test

# Run a specific test
cargo test test_name

# Check code without building
cargo check

# Format code
cargo fmt

# Run linter
cargo clippy -- -D warnings

# Run benchmarks
cargo bench

# Generate documentation
cargo doc --open
```

### Development Server (once web UI is implemented)
```bash
# Run development server with hot reload
cargo watch -x run

# Run with specific features
cargo run --features "dev-tools"
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
├── ui/                    # User experience and presentation layers
│   ├── sketching/        # Grid sketching system and gesture recognition
│   ├── visual/           # Visual design system and themes
│   └── feedback/         # Real-time visual feedback mechanisms
├── interaction/          # Smart interaction systems
│   ├── snapping/        # Edge clamping and magnetic boundaries
│   └── annotation/      # Smart annotation placement
├── domain/              # Core business logic
│   ├── beam/           # Beam model and geometry
│   ├── defect/         # Defect patterns and visualization
│   └── grid/           # Grid logic and interaction
├── rendering/          # Rendering abstraction and strategies
│   ├── realtime/      # WebGL/Canvas 60fps renderer
│   └── export/        # High-resolution export renderer
└── cad/               # Hermetic CAD translation layer
    ├── dxf/          # DXF/DWG import/export
    └── xml/          # XML exchange format
```

## Development Phases

The project follows these implementation phases:

1. **Phase 1: Visual Foundation** - Design system, core rendering pipeline, basic interaction framework
2. **Phase 2: Smart Interactions** - Grid snapping, edge detection, sketch recognition, annotation tools
3. **Phase 3: Export Excellence** - PDF generation, high-quality raster export, SVG output
4. **Phase 4: CAD Integration** - DXF/DWG translation, XML schema, bidirectional conversion
5. **Phase 5: Polish and Enhancement** - Advanced visual effects, performance optimization

## Key Implementation Notes

### Performance Optimization
- Use dirty rectangle updates for rendering
- Implement level-of-detail switching for complex scenes
- Apply occlusion culling to avoid rendering hidden elements
- Use texture atlasing for efficient GPU memory usage

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

## Export Formats

The system supports multiple export formats optimized for different use cases:
- **PDF**: Vector graphics with professional formatting
- **PNG**: High-DPI for documents
- **SVG**: Web integration
- **DXF/DWG**: AutoCAD compatibility
- **XML**: Industry-standard exchange format