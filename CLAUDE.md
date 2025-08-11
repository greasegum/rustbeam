# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VisualBeam is a Rust-based structural beam inspection system that prioritizes visual excellence, intuitive user experience, and seamless CAD ecosystem integration. The system is designed for field inspections with professional presentation-quality outputs.

### Migration from JavaScript/TypeScript Reference
This Rust implementation draws inspiration from the existing phaserBeam application (React/Phaser 3) while achieving:
- Native performance through compiled Rust code
- Memory safety without garbage collection overhead
- Cross-platform deployment (WASM for web, native for desktop/mobile)
- Enhanced rendering performance through direct GPU access
- Type safety at compile time rather than runtime

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

# Build WASM target for web deployment
wasm-pack build --target web --out-dir pkg

# Run WASM development server
python3 -m http.server 8000 --directory ./www
```

### Rust-Specific Testing Commands
```bash
# Run integration tests
cargo test --test '*'

# Run with coverage
cargo tarpaulin --out Html

# Benchmark performance-critical paths
cargo criterion
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
├── core/                  # Core Rust domain logic
│   ├── beam/             # Beam profiles and structural models
│   ├── geometry/         # Coordinate systems and transformations
│   ├── defect/           # Defect types and severity patterns
│   └── grid/             # Grid-based measurement system
├── ui/                    # User interface components
│   ├── sketching/        # Grid sketching system and gesture recognition
│   ├── visual/           # Visual design system and themes
│   └── feedback/         # Real-time visual feedback mechanisms
├── interaction/          # Smart interaction systems
│   ├── snapping/        # Edge clamping and magnetic boundaries
│   └── annotation/      # Smart annotation placement
├── rendering/           # Rendering engines
│   ├── wgpu/           # Native GPU rendering (desktop)
│   ├── canvas/         # Canvas 2D fallback
│   └── export/         # High-resolution export renderer
├── wasm/               # WebAssembly bindings
│   ├── bindings/       # JS/TS interop layer
│   └── bridge/         # React component bridge
├── native/             # Platform-specific implementations
│   ├── windows/        # Windows-specific code
│   ├── macos/          # macOS-specific code
│   └── linux/          # Linux-specific code
└── cad/                # Hermetic CAD translation layer
    ├── dxf/            # DXF/DWG import/export
    └── xml/            # XML exchange format
```

## Development Phases

The project follows these implementation phases:

### Phase 1: Core Rust Foundation (Weeks 1-4)
- Implement beam profile models and geometry calculations in pure Rust
- Create grid-based coordinate system with measurement logic
- Develop defect type enums and severity classification
- Set up cargo workspace with feature flags for different targets
- Implement core business logic with comprehensive unit tests

### Phase 2: Rendering Infrastructure (Weeks 5-8)
- Integrate wgpu for native GPU-accelerated rendering
- Implement Canvas 2D rendering trait for web fallback
- Create rendering abstraction layer for platform independence
- Build WASM bindings using wasm-bindgen
- Develop basic UI primitives (lines, shapes, text)

### Phase 3: Interactive Canvas (Weeks 9-12)
- Port grid interaction system from phaserBeam reference
- Implement magnetic snapping and edge detection algorithms
- Create gesture recognition for touch/mouse input
- Build annotation placement engine with collision detection
- Add real-time visual feedback system

### Phase 4: Export Pipeline (Weeks 13-16)
- Implement PDF generation using pure Rust libraries
- Create SVG export with proper layering and styling
- Build high-resolution raster export (PNG/JPEG)
- Develop print-optimized layouts with title blocks
- Add batch export capabilities

### Phase 5: CAD Integration (Weeks 17-20)
- Implement DXF parser and generator in Rust
- Create AutoCAD layer mapping system
- Build XML exchange format support
- Develop bidirectional conversion with validation
- Add metadata preservation through XData

### Phase 6: Web Assembly Integration (Weeks 21-24)
- Optimize WASM bundle size through feature flags
- Create TypeScript definitions for Rust APIs
- Build React component wrappers for Rust modules
- Implement efficient data serialization between JS and Rust
- Add progressive enhancement for non-WASM browsers

### Phase 7: Production Readiness (Weeks 25-28)
- Performance optimization and profiling
- Memory leak detection and prevention
- Cross-platform testing (Windows, macOS, Linux, Web)
- Documentation and API reference generation
- Security audit and penetration testing

## Key Implementation Notes

### Rust-Specific Implementation Patterns

#### Memory Management
- Use `Arc<RwLock<T>>` for shared state between UI components
- Implement custom allocators for performance-critical paths
- Leverage Rust's ownership system to prevent memory leaks
- Use `Cow<T>` for efficient string handling in rendering

#### Concurrency Strategy
- Use Rayon for parallel processing of grid cells
- Implement async/await for I/O operations (file export)
- Leverage channels for UI event handling
- Use atomic operations for real-time counters

#### Error Handling
- Define custom error types using `thiserror`
- Implement Result<T, E> for all fallible operations
- Use `anyhow` for application-level error handling
- Provide graceful degradation for rendering failures

### Performance Optimization
- Use dirty rectangle updates for rendering
- Implement level-of-detail switching for complex scenes
- Apply occlusion culling to avoid rendering hidden elements
- Use texture atlasing for efficient GPU memory usage
- Leverage SIMD instructions for coordinate transformations
- Implement zero-copy serialization for WASM bridge

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

## Rust Implementation Benefits

### Performance Advantages
- **Zero-cost abstractions**: High-level code without runtime overhead
- **Compile-time optimization**: LLVM backend produces highly optimized machine code
- **No garbage collection**: Predictable performance without GC pauses
- **Native SIMD support**: Vectorized operations for graphics calculations

### Safety Guarantees
- **Memory safety**: No null pointer dereferences or buffer overflows
- **Thread safety**: Race conditions prevented at compile time
- **Type safety**: Strong typing prevents entire classes of bugs
- **Resource management**: RAII ensures proper cleanup

### Cross-Platform Deployment
- **Native binaries**: Direct compilation for Windows, macOS, Linux
- **WebAssembly**: Near-native performance in browsers
- **Mobile support**: Compile to iOS and Android through Rust toolchains
- **Embedded systems**: Minimal runtime for IoT integration

### Developer Experience
- **Excellent tooling**: Cargo, rustfmt, clippy, rust-analyzer
- **Documentation**: Inline docs with rustdoc
- **Testing**: Built-in test framework with cargo test
- **Benchmarking**: Criterion for performance regression testing