/**
 * Zone-based Contour Generation
 * Generates contours separately for each zone (top flange, web, bottom flange)
 */

import { GridCell, GridZone, GridCoordinates } from '../store/canonical/gridTypes';
import { DerivedContour, PathSegment } from '../store/derived/types';
import { WorldPoint } from '../store/canonical/refactoredTypes';
import { GridSystem } from './gridSystem';

interface ContourGroup {
  zone: GridZone;
  defectType: string;
  severity: number;
  cells: GridCell[];
}

export class ZoneContourGenerator {
  private gridSystem: GridSystem;
  private beamDepth: number;
  private flangeThickness: number;
  
  constructor(
    gridSystem: GridSystem,
    beamDepth: number,
    flangeThickness: number
  ) {
    this.gridSystem = gridSystem;
    this.beamDepth = beamDepth;
    this.flangeThickness = flangeThickness;
  }
  
  /**
   * Generate all contours from the grid system
   */
  generateContours(): Map<string, DerivedContour> {
    const contours = new Map<string, DerivedContour>();
    
    // Process each zone separately
    const zones: GridZone[] = ['top-flange', 'web', 'bottom-flange'];
    
    for (const zone of zones) {
      const zoneContours = this.generateZoneContours(zone);
      zoneContours.forEach((contour, id) => {
        contours.set(id, contour);
      });
    }
    
    return contours;
  }
  
  /**
   * Generate contours for a specific zone
   */
  private generateZoneContours(zone: GridZone): Map<string, DerivedContour> {
    const contours = new Map<string, DerivedContour>();
    const cells = this.gridSystem.getCellsByZone(zone);
    
    // Group cells by defect type and severity
    const groups = this.groupCells(cells, zone);
    
    // Generate contour for each group
    groups.forEach(group => {
      const contour = this.generateContourForGroup(group);
      if (contour) {
        contours.set(contour.id, contour);
      }
    });
    
    return contours;
  }
  
  /**
   * Group cells by defect type and severity
   */
  private groupCells(cells: GridCell[], zone: GridZone): ContourGroup[] {
    const groupMap = new Map<string, ContourGroup>();
    
    cells.forEach(cell => {
      if (cell.defectType && cell.severity) {
        const key = `${zone}-${cell.defectType}-${cell.severity}`;
        
        if (!groupMap.has(key)) {
          groupMap.set(key, {
            zone,
            defectType: cell.defectType,
            severity: cell.severity,
            cells: []
          });
        }
        
        groupMap.get(key)!.cells.push(cell);
      }
    });
    
    return Array.from(groupMap.values());
  }
  
  /**
   * Generate a contour for a group of cells
   */
  private generateContourForGroup(group: ContourGroup): DerivedContour | null {
    if (group.cells.length === 0) return null;
    
    // Get boundary points
    const boundaryPoints = this.extractBoundary(group.cells, group.zone);
    
    // Convert to world coordinates
    const worldPoints = boundaryPoints.map(cell => 
      GridCoordinates.cellToWorld(cell, this.beamDepth, this.flangeThickness)
    );
    
    // Smooth the path
    const smoothPath = this.smoothPath(worldPoints);
    
    // Convert to path segments
    const worldPath = this.pointsToSegments(smoothPath);
    
    // Calculate bounds and area
    const worldBounds = this.calculateBounds(smoothPath);
    const area = this.calculateArea(smoothPath);
    
    return {
      id: `contour-${group.zone}-${group.defectType}-${group.severity}-${Date.now()}`,
      defectType: group.defectType,
      severity: group.severity,
      worldPath,
      worldBounds,
      cellCount: group.cells.length,
      area
    };
  }
  
  /**
   * Extract boundary cells using simple edge detection
   */
  private extractBoundary(cells: GridCell[], zone: GridZone): GridCell[] {
    const cellSet = new Set<string>();
    cells.forEach(cell => {
      cellSet.add(GridCoordinates.getCellKey(cell.row, cell.col));
    });
    
    const boundary: GridCell[] = [];
    
    cells.forEach(cell => {
      // Check if cell is on boundary (has at least one empty neighbor)
      const neighbors = this.getNeighborKeys(cell.row, cell.col, zone);
      const isBoundary = neighbors.some(key => !cellSet.has(key));
      
      if (isBoundary) {
        boundary.push(cell);
      }
    });
    
    // Sort boundary cells for consistent ordering
    return this.sortBoundary(boundary);
  }
  
  /**
   * Get neighbor cell keys
   */
  private getNeighborKeys(row: number, col: number, zone: GridZone): string[] {
    const keys: string[] = [];
    
    // For flanges (1D), only check horizontal neighbors
    if (zone === 'top-flange' || zone === 'bottom-flange') {
      keys.push(GridCoordinates.getCellKey(0, col - 1));
      keys.push(GridCoordinates.getCellKey(0, col + 1));
    } else {
      // For web (2D), check all 8 neighbors
      const offsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1],           [0, 1],
        [1, -1],  [1, 0],  [1, 1]
      ];
      
      offsets.forEach(([dr, dc]) => {
        keys.push(GridCoordinates.getCellKey(row + dr, col + dc));
      });
    }
    
    return keys;
  }
  
  /**
   * Sort boundary cells for consistent traversal
   */
  private sortBoundary(cells: GridCell[]): GridCell[] {
    if (cells.length === 0) return cells;
    
    // Simple sort by angle from centroid
    const centroid = this.calculateCentroid(cells);
    
    return cells.sort((a, b) => {
      const angleA = Math.atan2(
        a.row - centroid.row,
        a.col - centroid.col
      );
      const angleB = Math.atan2(
        b.row - centroid.row,
        b.col - centroid.col
      );
      return angleA - angleB;
    });
  }
  
  /**
   * Calculate centroid of cells
   */
  private calculateCentroid(cells: GridCell[]): { row: number; col: number } {
    const sum = cells.reduce(
      (acc, cell) => ({
        row: acc.row + cell.row,
        col: acc.col + cell.col
      }),
      { row: 0, col: 0 }
    );
    
    return {
      row: sum.row / cells.length,
      col: sum.col / cells.length
    };
  }
  
  /**
   * Smooth path using simple averaging
   */
  private smoothPath(points: WorldPoint[], iterations: number = 2): WorldPoint[] {
    if (points.length < 3) return points;
    
    let smooth = [...points];
    
    for (let iter = 0; iter < iterations; iter++) {
      const newPoints: WorldPoint[] = [];
      
      for (let i = 0; i < smooth.length; i++) {
        const prev = smooth[(i - 1 + smooth.length) % smooth.length];
        const curr = smooth[i];
        const next = smooth[(i + 1) % smooth.length];
        
        // Average with neighbors
        newPoints.push({
          x: (prev.x + 2 * curr.x + next.x) / 4,
          y: (prev.y + 2 * curr.y + next.y) / 4
        });
      }
      
      smooth = newPoints;
    }
    
    return smooth;
  }
  
  /**
   * Convert points to path segments
   */
  private pointsToSegments(points: WorldPoint[]): PathSegment[] {
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
    if (points.length > 2) {
      segments.push({
        type: 'line',
        points: [{ x: points[0].x, y: points[0].y }]
      });
    }
    
    return segments;
  }
  
  /**
   * Calculate bounds
   */
  private calculateBounds(points: WorldPoint[]): {
    min: WorldPoint;
    max: WorldPoint;
  } {
    if (points.length === 0) {
      return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
    }
    
    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    
    return {
      min: { x: Math.min(...xs), y: Math.min(...ys) },
      max: { x: Math.max(...xs), y: Math.max(...ys) }
    };
  }
  
  /**
   * Calculate area using shoelace formula
   */
  private calculateArea(points: WorldPoint[]): number {
    if (points.length < 3) return 0;
    
    let area = 0;
    for (let i = 0; i < points.length; i++) {
      const j = (i + 1) % points.length;
      area += points[i].x * points[j].y;
      area -= points[j].x * points[i].y;
    }
    
    return Math.abs(area / 2);
  }
}