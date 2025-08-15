/**
 * Grid System Types
 * 1" quantized grids with proper coordinate system
 * Origin (0,0) at bottom-left corner (left beam end, top face of bottom flange)
 */

export type GridZone = 'top-flange' | 'web' | 'bottom-flange';

/**
 * Grid cell in 1" quantized space
 * For flanges: row is always 0 (1D grid)
 * For web: row 0 is at bottom of web, increasing upward
 */
export interface GridCell {
  zone: GridZone;
  row: number;  // Y coordinate in 1" increments from zone bottom
  col: number;  // X coordinate in 1" increments from left end
  defectType?: string;
  severity?: number;
  notes?: string;
}

/**
 * Convert grid cell to world coordinates (inches)
 * Origin at bottom-left corner of beam
 */
export interface GridToWorld {
  (cell: GridCell, beamDepth: number): { x: number; y: number };
}

/**
 * Grid configuration for a beam zone
 */
export interface ZoneGrid {
  zone: GridZone;
  rows: number;  // 1 for flanges, variable for web
  cols: number;  // Length of beam in inches
  cells: Map<string, GridCell>;  // Sparse storage: "row,col" -> cell
}

/**
 * Complete grid system for a beam
 */
export interface BeamGrid {
  // Grid dimensions (all in 1" units)
  gridSize: 1;  // Always 1" for this system
  
  // Zone grids
  topFlange: ZoneGrid;
  web: ZoneGrid;
  bottomFlange: ZoneGrid;
  
  // Helper to get all marked cells
  getAllCells(): GridCell[];
  
  // Helper to get cells by zone
  getCellsByZone(zone: GridZone): GridCell[];
}

/**
 * Grid coordinate helpers
 */
export class GridCoordinates {
  /**
   * Convert grid cell to world coordinates
   * Origin (0,0) at bottom-left corner (left end, top of bottom flange)
   */
  static cellToWorld(
    cell: GridCell,
    beamDepth: number,
    flangeThickness: number
  ): { x: number; y: number } {
    // X is always col inches from left
    const x = cell.col;
    
    // Y depends on zone
    let y: number;
    switch (cell.zone) {
      case 'bottom-flange':
        // Bottom flange top surface is at y=0
        y = 0;
        break;
        
      case 'web':
        // Web starts at flangeThickness, each row is 1" up
        y = flangeThickness + cell.row;
        break;
        
      case 'top-flange':
        // Top flange bottom surface is at (beamDepth - flangeThickness)
        y = beamDepth - flangeThickness;
        break;
        
      default:
        y = 0;
    }
    
    return { x, y };
  }
  
  /**
   * Get cell key for map storage
   */
  static getCellKey(row: number, col: number): string {
    return `${row},${col}`;
  }
  
  /**
   * Parse cell key
   */
  static parseCellKey(key: string): { row: number; col: number } {
    const [row, col] = key.split(',').map(Number);
    return { row, col };
  }
  
  /**
   * Calculate grid dimensions for a beam
   */
  static calculateGridDimensions(
    beamLength: number,
    beamDepth: number,
    flangeThickness: number
  ): {
    topFlangeRows: number;
    webRows: number;
    bottomFlangeRows: number;
    cols: number;
  } {
    // All dimensions in 1" increments
    const cols = Math.ceil(beamLength);
    const webHeight = beamDepth - (2 * flangeThickness);
    const webRows = Math.ceil(webHeight);
    
    return {
      topFlangeRows: 1,      // Always 1 row for flanges
      webRows,
      bottomFlangeRows: 1,   // Always 1 row for flanges
      cols
    };
  }
}