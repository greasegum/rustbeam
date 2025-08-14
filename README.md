# VisualBeam Inspector

Professional structural beam inspection system with grid-based defect marking and CAD export capabilities.

## Overview

VisualBeam Inspector is a **field-first sketcher** designed for structural engineers to document beam conditions during bridge inspections. It combines intuitive touch-based sketching with professional CAD-quality outputs.

## Features

- **Grid-Based Defect Marking**: Paint defects on a precise grid overlay with multiple severity levels
- **Professional UI**: Clean, horizontal-only layout maximizing canvas space
- **Multiple Export Formats**: SVG, PNG, PDF, and DXF for CAD integration  
- **Smart Annotations**: Constraint-based annotations that maintain relationships
- **Real-time Contour Generation**: Marching squares algorithm for smooth defect boundaries
- **Comprehensive Beam Catalog**: 150+ standard steel beam profiles

## Tech Stack

- **Frontend**: React + TypeScript
- **Canvas Engine**: Phaser 3 (WebGL/Canvas rendering)
- **State Management**: Zustand with canonical/derived state separation
- **Build Tool**: Vite
- **Deployment**: Node.js Express server

## Architecture

The system follows strict architectural principles:

- **Canonical vs Derived State**: Clear separation between source-of-truth data and computed geometry
- **World Coordinates**: All data stored in real-world units (inches/mm), never screen pixels
- **Constraint-Based Annotations**: Annotations defined by relationships, not absolute positions

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architectural philosophy.

## Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
src/
├── components/        # React UI components (Header, Toolbars, Modals)
├── scenes/           # Phaser scenes for canvas rendering
├── store/            # Zustand store with slices
│   ├── canonical/    # Source-of-truth state
│   └── derived/      # Computed/cached state
├── geometry/         # Geometry algorithms (marching squares, smoothing)
├── data/            # Beam catalog and constants
├── ui/              # UI components (Setup menu)
└── utils/           # Utility functions
```

## Roadmap

See [ROADMAP-FOCUSED.md](./ROADMAP-FOCUSED.md) for the implementation roadmap.

## License

Proprietary - All Rights Reserved