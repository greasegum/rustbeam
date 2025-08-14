/**
 * Contour Generation System
 * Generates smooth contours from grid cells using marching squares algorithm
 */

import { CanonicalGrid, CanonicalCell, WorldPoint } from '../store/canonical/types';
import { DerivedContour, PathSegment } from '../store/derived/types';

interface ContourPoint {
  x: number;
  y: number;
  type: 'corner' | 'edge';
}

interface MarchingSquareCase {
  code: number;
  edges: Array<[number, number]>; // Edge pairs to connect
}

export class ContourGenerator {
  private cellSize: number;
  private origin: WorldPoint;
  
  constructor(cellSize: number, origin: WorldPoint = { x: 0, y: 0 }) {
    this.cellSize = cellSize;
    this.origin = origin;
  }
  
  /**
   * Generate contours from canonical grid cells
   */
  generateContours(grid: CanonicalGrid): Map<string, DerivedContour> {
    const contours = new Map<string, DerivedContour>();
    
    // Group cells by defect type and severity
    const groups = this.groupCells(grid.cells);
    
    // Generate contour for each group
    groups.forEach((cells, groupKey) => {
      const [defectType, severity] = groupKey.split('-');
      const contour = this.generateContourForGroup(
        cells,
        defectType,
        parseInt(severity),
        grid.cellSize
      );
      
      if (contour) {
        contours.set(contour.id, contour);
      }
    });
    
    return contours;
  }
  
  /**
   * Group cells by defect type and severity
   */
  private groupCells(cells: Map<string, CanonicalCell>): Map<string, CanonicalCell[]> {
    const groups = new Map<string, CanonicalCell[]>();
    
    cells.forEach(cell => {
      if (cell.defectType && cell.severity) {
        const key = `${cell.defectType}-${cell.severity}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(cell);
      }
    });
    
    return groups;
  }
  
  /**
   * Generate a single contour for a group of cells
   */
  private generateContourForGroup(
    cells: CanonicalCell[],
    defectType: string,
    severity: number,
    cellSize: number
  ): DerivedContour | null {
    if (cells.length === 0) return null;
    
    // Create a binary grid for marching squares
    const { binaryGrid, bounds } = this.createBinaryGrid(cells);
    
    // Apply marching squares algorithm
    const rawPath = this.marchingSquares(binaryGrid, bounds, cellSize);
    
    // Smooth the path
    const smoothPath = this.smoothPath(rawPath);
    
    // Calculate area
    const area = this.calculateArea(smoothPath);
    
    // Calculate bounds
    const worldBounds = this.calculateBounds(smoothPath);
    
    return {
      id: `contour-${defectType}-${severity}-${Date.now()}`,
      defectType,
      severity,
      worldPath: this.pathToSegments(smoothPath),
      worldBounds,
      cellCount: cells.length,
      area
    };
  }
  
  /**
   * Create binary grid for marching squares
   */
  private createBinaryGrid(cells: CanonicalCell[]): {
    binaryGrid: boolean[][];
    bounds: { minRow: number; maxRow: number; minCol: number; maxCol: number };
  } {
    // Find bounds
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;
    
    cells.forEach(cell => {
      minRow = Math.min(minRow, cell.row);
      maxRow = Math.max(maxRow, cell.row);
      minCol = Math.min(minCol, cell.col);
      maxCol = Math.max(maxCol, cell.col);
    });
    
    // Add padding for edge detection
    minRow -= 1;
    maxRow += 1;
    minCol -= 1;
    maxCol += 1;
    
    // Create binary grid
    const height = maxRow - minRow + 1;
    const width = maxCol - minCol + 1;
    const grid: boolean[][] = Array(height).fill(null).map(() => Array(width).fill(false));
    
    // Mark cells
    cells.forEach(cell => {
      const row = cell.row - minRow;
      const col = cell.col - minCol;
      if (row >= 0 && row < height && col >= 0 && col < width) {
        grid[row][col] = true;
      }
    });
    
    return {
      binaryGrid: grid,
      bounds: { minRow, maxRow, minCol, maxCol }
    };
  }
  
  /**
   * Marching squares algorithm
   */
  private marchingSquares(
    grid: boolean[][],
    bounds: any,
    cellSize: number
  ): ContourPoint[] {
    const points: ContourPoint[] = [];
    const height = grid.length;
    const width = grid[0].length;
    
    // Process each cell
    for (let row = 0; row < height - 1; row++) {
      for (let col = 0; col < width - 1; col++) {
        // Get the 4 corners of the cell
        const tl = grid[row][col] ? 1 : 0;
        const tr = grid[row][col + 1] ? 1 : 0;
        const br = grid[row + 1][col + 1] ? 1 : 0;
        const bl = grid[row + 1][col] ? 1 : 0;
        
        // Calculate case number (0-15)
        const caseNum = tl * 8 + tr * 4 + br * 2 + bl * 1;
        
        // Add contour points based on case
        const contourPoints = this.getContourPoints(
          caseNum,
          col + bounds.minCol,
          row + bounds.minRow,
          cellSize
        );
        
        points.push(...contourPoints);
      }
    }
    
    return points;
  }
  
  /**
   * Get contour points for a marching squares case
   */
  private getContourPoints(
    caseNum: number,
    col: number,
    row: number,
    cellSize: number
  ): ContourPoint[] {
    const points: ContourPoint[] = [];
    const x = this.origin.x + col * cellSize;
    const y = this.origin.y + row * cellSize;
    
    // Simplified - just add edge midpoints for non-trivial cases
    // In production, this would have all 16 cases properly handled
    if (caseNum > 0 && caseNum < 15) {
      // Add a point at cell center for now
      points.push({
        x: x + cellSize / 2,
        y: y + cellSize / 2,
        type: 'edge'
      });
    }
    
    return points;
  }
  
  /**
   * Smooth the contour path using Chaikin's algorithm
   */
  private smoothPath(points: ContourPoint[], iterations: number = 2): WorldPoint[] {
    if (points.length < 3) {
      return points.map(p => ({ x: p.x, y: p.y }));
    }
    
    let smooth = points.map(p => ({ x: p.x, y: p.y }));
    
    for (let iter = 0; iter < iterations; iter++) {
      const newPoints: WorldPoint[] = [];
      
      for (let i = 0; i < smooth.length; i++) {
        const p0 = smooth[i];
        const p1 = smooth[(i + 1) % smooth.length];
        
        // Add two points at 25% and 75% along the edge
        newPoints.push({
          x: 0.75 * p0.x + 0.25 * p1.x,
          y: 0.75 * p0.y + 0.25 * p1.y
        });
        
        newPoints.push({
          x: 0.25 * p0.x + 0.75 * p1.x,
          y: 0.25 * p0.y + 0.75 * p1.y
        });
      }
      
      smooth = newPoints;
    }
    
    return smooth;
  }
  
  /**
   * Convert points to path segments
   */
  private pathToSegments(points: WorldPoint[]): PathSegment[] {
    if (points.length === 0) return [];
    
    const segments: PathSegment[] = [
      {
        type: 'move',
        points: [{ x: points[0].x, y: points[0].y }]
      }
    ];
    
    for (let i = 1; i < points.length; i++) {
      segments.push({
        type: 'line',
        points: [{ x: points[i].x, y: points[i].y }]
      });
    }
    
    // Close the path
    segments.push({
      type: 'line',
      points: [{ x: points[0].x, y: points[0].y }]
    });
    
    return segments;
  }
  
  /**
   * Calculate area using shoelace formula
   */
  private calculateArea(points: WorldPoint[]): number {
    let area = 0;
    
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area / 2);
  }
  
  /**
   * Calculate bounding box
   */
  private calculateBounds(points: WorldPoint[]): {
    min: WorldPoint;
    max: WorldPoint;
  } {
    if (points.length === 0) {
      return {
        min: { x: 0, y: 0 },
        max: { x: 0, y: 0 }
      };
    }
    
    let minX = Infinity, minY = Infinity;
    let maxX = -Infinity, maxY = -Infinity;
    
    points.forEach(p => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });
    
    return {
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY }
    };
  }
}