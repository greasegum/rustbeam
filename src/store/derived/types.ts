/**
 * Derived State Types
 * These represent computed, cached geometry and render-time data.
 * Regenerated from canonical state when needed.
 */

// Screen coordinate point (in pixels)
export interface ScreenPoint {
  x: number;
  y: number;
}

// Path segment for contours
export interface PathSegment {
  type: 'move' | 'line' | 'curve';
  points: ScreenPoint[];
  controlPoints?: ScreenPoint[]; // For bezier curves
}

// Contour derived from grid cells
export interface DerivedContour {
  id: string;
  defectType: string;
  severity: number;
  
  // World-space geometry (for exports)
  worldPath: PathSegment[];
  worldBounds: {
    min: { x: number; y: number };
    max: { x: number; y: number };
  };
  
  // Screen-space geometry (for rendering)
  screenPath?: PathSegment[];
  screenBounds?: {
    min: ScreenPoint;
    max: ScreenPoint;
  };
  
  // Metadata
  cellCount: number;
  area: number; // In world units squared
}

// Annotation derived geometry
export interface DerivedAnnotation {
  id: string;
  
  // World-space layout
  worldAnchor: { x: number; y: number };
  worldTextBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  worldLeaderPath?: PathSegment[];
  
  // Screen-space layout (computed during render)
  screenAnchor?: ScreenPoint;
  screenTextBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  screenLeaderPath?: PathSegment[];
  
  // Layout metadata
  collisionBox?: {
    min: ScreenPoint;
    max: ScreenPoint;
  };
  visible: boolean;
}

// Beam derived geometry
export interface DerivedBeamGeometry {
  // World-space beam outline
  worldOutline: {
    topFlange: { start: { x: number; y: number }; end: { x: number; y: number } };
    bottomFlange: { start: { x: number; y: number }; end: { x: number; y: number } };
    web: { start: { x: number; y: number }; end: { x: number; y: number } };
  };
  
  // World-space features
  worldFeatures: {
    bearings: Array<{ x: number; y: number; type: 'left' | 'right' }>;
    abutments: Array<{
      x: number;
      y: number;
      height: number;
      type: 'left' | 'right';
    }>;
  };
  
  // Screen-space versions (computed during render)
  screenOutline?: any;
  screenFeatures?: any;
}

// Grid derived geometry
export interface DerivedGridGeometry {
  // World-space grid
  worldGrid: {
    rows: number;
    cols: number;
    cellWidth: number;
    cellHeight: number;
    origin: { x: number; y: number };
  };
  
  // Screen-space grid (computed during render)
  screenGrid?: {
    visibleRows: { start: number; end: number };
    visibleCols: { start: number; end: number };
    cellWidth: number;
    cellHeight: number;
    origin: ScreenPoint;
  };
}

// View transformation
export interface ViewTransform {
  scale: number; // Pixels per world unit
  offset: ScreenPoint; // Pan offset
  rotation: number; // Radians
  viewport: {
    width: number;
    height: number;
  };
}

// Complete derived state
export interface DerivedState {
  contours: Map<string, DerivedContour>;
  annotations: Map<string, DerivedAnnotation>;
  beamGeometry: DerivedBeamGeometry | null;
  gridGeometry: DerivedGridGeometry | null;
  viewTransform: ViewTransform;
  
  // Cache metadata
  cacheVersion: number;
  lastRegenerated: number; // Timestamp
}