# VisualBeam UI Mockup

This is the UI mockup for the VisualBeam structural beam inspection system. It provides a visual reference and interactive prototype for the application interface before Rust/WASM integration.

## Design Principles

Based on professional engineering drawing standards:
- **High contrast** for clarity (matching the green/pink color scheme from inspection drawings)
- **Grid-based layout** for precise defect marking
- **Professional typography** using monospace fonts for measurements
- **Clean, technical appearance** following CAD/engineering software conventions

## Viewing the Mockup

1. Open `index.html` in a modern web browser
2. Or use a local server:
   ```bash
   python3 -m http.server 8000
   # Then navigate to http://localhost:8000/ui-mockup/
   ```

## Key Features Demonstrated

### 1. Main Canvas Area
- Engineering drawing visualization with grid system
- Beam cross-section rendering (green for intact, pink/red for defects)
- Interactive defect marking capabilities
- Dimension lines and annotations

### 2. Left Sidebar - Tools
- **Beam Configuration**: Profile selection, dimensions, grid size
- **Defect Marking**: Four defect types with severity levels
- **Annotation Tools**: Dimensions, text notes, leader lines, photo markers

### 3. Right Sidebar - Properties
- **Properties Panel**: Details of selected elements
- **Statistics**: Real-time inspection metrics
- **History/Layers**: (Tabs for future implementation)

### 4. Professional Features
- Title block and legend (engineering drawing standard)
- Scale indicators
- Export options (PDF, DWG, PNG)
- Responsive design for tablet use

## Color Palette

Matches engineering inspection drawing standards:
- `#4CAF50` - Intact beam sections (green)
- `#FF6B9D` - Defect areas (pink/red)
- `#333333` - Grid lines and annotations (black)
- Severity gradients from yellow (low) to red (critical)

## Interactive Elements

The mockup includes basic interactivity:
- Tool selection and activation
- Canvas drawing simulation
- Modal dialogs for export
- Responsive hover states
- Cursor position tracking

## Next Steps

1. **WASM Integration**: Connect Rust backend via WebAssembly
2. **Canvas Rendering**: Implement wgpu or Canvas 2D renderer
3. **Data Binding**: Connect UI to Rust data structures
4. **Real Grid System**: Implement actual grid-based measurement
5. **Export Pipeline**: Wire up PDF/DWG generation

## Files

- `index.html` - Main HTML structure
- `styles.css` - Core application styles
- `components.css` - Component-specific and engineering drawing styles
- `app.js` - Interactive demo JavaScript (to be replaced with WASM)

## Strategic Value

This mockup serves as:
1. **Visual specification** for the development team
2. **User testing prototype** for early feedback
3. **Reference implementation** for the Rust/WASM version
4. **Documentation** of the intended user experience

The design directly mirrors professional engineering inspection drawings, ensuring familiarity for field inspectors and engineers.