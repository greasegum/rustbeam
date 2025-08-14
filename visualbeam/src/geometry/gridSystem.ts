/**
 * Grid System Implementation
 * Manages 1" quantized grids for beam inspection
 */

import { GridCell, ZoneGrid, BeamGrid, GridZone, GridCoordinates } from '../store/canonical/gridTypes';
import { BeamProfile } from '../types';

export class GridSystem implements BeamGrid {
  gridSize: 1 = 1;
  topFlange: ZoneGrid;
  web: ZoneGrid;
  bottomFlange: ZoneGrid;
  
  constructor(
    beamLength: number,
    beamProfile: BeamProfile
  ) {
    const dimensions = GridCoordinates.calculateGridDimensions(
      beamLength,
      beamProfile.depth,
      beamProfile.flangeThickness
    );
    
    // Initialize top flange grid (1D)
    this.topFlange = {
      zone: 'top-flange',
      rows: 1,
      cols: dimensions.cols,
      cells: new Map()
    };
    
    // Initialize web grid (2D)
    this.web = {
      zone: 'web',
      rows: dimensions.webRows,
      cols: dimensions.cols,
      cells: new Map()
    };
    
    // Initialize bottom flange grid (1D)
    this.bottomFlange = {
      zone: 'bottom-flange',
      rows: 1,
      cols: dimensions.cols,
      cells: new Map()
    };
  }
  
  /**
   * Mark a cell with defect information
   */
  markCell(
    zone: GridZone,
    row: number,
    col: number,
    defectType?: string,
    severity?: number,
    notes?: string
  ): void {
    const grid = this.getZoneGrid(zone);
    const key = GridCoordinates.getCellKey(row, col);
    
    if (!defectType) {
      // Clear the cell
      grid.cells.delete(key);
    } else {
      // Mark the cell
      grid.cells.set(key, {
        zone,
        row,
        col,
        defectType,
        severity: severity || 1,
        notes
      });
    }
  }
  
  /**
   * Get a specific cell
   */
  getCell(zone: GridZone, row: number, col: number): GridCell | undefined {
    const grid = this.getZoneGrid(zone);
    const key = GridCoordinates.getCellKey(row, col);
    return grid.cells.get(key);
  }
  
  /**
   * Clear all cells in a zone
   */
  clearZone(zone: GridZone): void {
    const grid = this.getZoneGrid(zone);
    grid.cells.clear();
  }
  
  /**
   * Clear all cells
   */
  clearAll(): void {
    this.topFlange.cells.clear();
    this.web.cells.clear();
    this.bottomFlange.cells.clear();
  }
  
  /**
   * Get all marked cells
   */
  getAllCells(): GridCell[] {
    return [
      ...Array.from(this.topFlange.cells.values()),
      ...Array.from(this.web.cells.values()),
      ...Array.from(this.bottomFlange.cells.values())
    ];
  }
  
  /**
   * Get cells by zone
   */
  getCellsByZone(zone: GridZone): GridCell[] {
    const grid = this.getZoneGrid(zone);
    return Array.from(grid.cells.values());
  }
  
  /**
   * Get cells by defect type
   */
  getCellsByDefectType(defectType: string): GridCell[] {
    return this.getAllCells().filter(cell => cell.defectType === defectType);
  }
  
  /**
   * Get cells by severity
   */
  getCellsBySeverity(severity: number): GridCell[] {
    return this.getAllCells().filter(cell => cell.severity === severity);
  }
  
  /**
   * Check if a cell is valid for a zone
   */
  isValidCell(zone: GridZone, row: number, col: number): boolean {
    const grid = this.getZoneGrid(zone);
    return row >= 0 && row < grid.rows && col >= 0 && col < grid.cols;
  }
  
  /**
   * Get neighboring cells (for contour generation)
   */
  getNeighbors(cell: GridCell): GridCell[] {
    const neighbors: GridCell[] = [];
    const offsets = [
      [-1, 0], [1, 0],  // vertical
      [0, -1], [0, 1],  // horizontal
      [-1, -1], [-1, 1], [1, -1], [1, 1]  // diagonal
    ];
    
    for (const [dr, dc] of offsets) {
      const newRow = cell.row + dr;
      const newCol = cell.col + dc;
      
      if (this.isValidCell(cell.zone, newRow, newCol)) {
        const neighbor = this.getCell(cell.zone, newRow, newCol);
        if (neighbor) {
          neighbors.push(neighbor);
        }
      }
    }
    
    return neighbors;
  }
  
  /**
   * Get zone grid
   */
  private getZoneGrid(zone: GridZone): ZoneGrid {
    switch (zone) {
      case 'top-flange':
        return this.topFlange;
      case 'web':
        return this.web;
      case 'bottom-flange':
        return this.bottomFlange;
      default:
        throw new Error(`Invalid zone: ${zone}`);
    }
  }
  
  /**
   * Export to canonical format
   */
  toCanonical(): {
    topFlange: Array<[string, GridCell]>;
    web: Array<[string, GridCell]>;
    bottomFlange: Array<[string, GridCell]>;
  } {
    return {
      topFlange: Array.from(this.topFlange.cells.entries()),
      web: Array.from(this.web.cells.entries()),
      bottomFlange: Array.from(this.bottomFlange.cells.entries())
    };
  }
  
  /**
   * Import from canonical format
   */
  static fromCanonical(
    data: {
      topFlange: Array<[string, GridCell]>;
      web: Array<[string, GridCell]>;
      bottomFlange: Array<[string, GridCell]>;
    },
    beamLength: number,
    beamProfile: BeamProfile
  ): GridSystem {
    const grid = new GridSystem(beamLength, beamProfile);
    
    // Restore cells
    data.topFlange.forEach(([key, cell]) => {
      grid.topFlange.cells.set(key, cell);
    });
    
    data.web.forEach(([key, cell]) => {
      grid.web.cells.set(key, cell);
    });
    
    data.bottomFlange.forEach(([key, cell]) => {
      grid.bottomFlange.cells.set(key, cell);
    });
    
    return grid;
  }
  
  /**
   * Get statistics
   */
  getStatistics(): {
    totalCells: number;
    markedCells: number;
    cellsByZone: Record<GridZone, number>;
    cellsByDefectType: Record<string, number>;
    cellsBySeverity: Record<number, number>;
  } {
    const allCells = this.getAllCells();
    
    const cellsByZone = {
      'top-flange': this.topFlange.cells.size,
      'web': this.web.cells.size,
      'bottom-flange': this.bottomFlange.cells.size
    };
    
    const cellsByDefectType: Record<string, number> = {};
    const cellsBySeverity: Record<number, number> = {};
    
    allCells.forEach(cell => {
      // Count by defect type
      if (cell.defectType) {
        cellsByDefectType[cell.defectType] = (cellsByDefectType[cell.defectType] || 0) + 1;
      }
      
      // Count by severity
      if (cell.severity) {
        cellsBySeverity[cell.severity] = (cellsBySeverity[cell.severity] || 0) + 1;
      }
    });
    
    return {
      totalCells: this.topFlange.cols + (this.web.rows * this.web.cols) + this.bottomFlange.cols,
      markedCells: allCells.length,
      cellsByZone,
      cellsByDefectType,
      cellsBySeverity
    };
  }
}