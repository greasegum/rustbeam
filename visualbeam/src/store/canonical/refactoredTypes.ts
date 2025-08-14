/**
 * Refactored Canonical State Types with proper grid system
 * Origin (0,0) at bottom-left corner (left beam end, top face of bottom flange)
 */

import { GridCell } from './gridTypes';

// World coordinate point (in inches, origin at bottom-left)
export interface WorldPoint {
  x: number;  // Distance from left end in inches
  y: number;  // Distance from top of bottom flange in inches
}

// Annotation canonical definition with proper world coordinates
export interface CanonicalAnnotation {
  id: string;
  type: 'dimension' | 'note' | 'callout' | 'leader';
  
  // Position in world coordinates (inches from origin)
  anchor: WorldPoint;
  
  // Content
  text: string;
  
  // Constraints/relationships
  constraints?: {
    targetCell?: { 
      zone: 'top-flange' | 'web' | 'bottom-flange';
      row: number; 
      col: number;
    };
    targetFeature?: 'beam-start' | 'beam-end' | 'bearing-left' | 'bearing-right';
    offset?: WorldPoint; // Offset from constraint target in inches
  };
  
  // Style hints (semantic, not pixels)
  style?: {
    fontSize?: 'small' | 'medium' | 'large';
    emphasis?: 'normal' | 'bold' | 'critical';
  };
}

// Beam canonical configuration
export interface CanonicalBeam {
  profileId: string;
  length: number;  // Total length in inches
  
  // Support positions (distance from left end in inches)
  leftBearing: number;
  rightBearing: number;
  
  // Abutment heights (in inches)
  leftAbutmentHeight: number;
  rightAbutmentHeight: number;
  
  // Measurement units for display
  units: 'imperial' | 'metric';
}

// Grid canonical configuration with zone-based storage
export interface CanonicalGrid {
  // Always 1" for this system
  gridSize: 1;
  
  // Cells organized by zone
  topFlange: Map<string, GridCell>;     // 1D grid (row always 0)
  web: Map<string, GridCell>;           // 2D grid
  bottomFlange: Map<string, GridCell>;  // 1D grid (row always 0)
}

// Project canonical metadata
export interface CanonicalProject {
  id: string;
  name: string;
  description?: string;
  location?: string;
  inspector?: string;
  date: string;
  createdAt: string;
  modifiedAt: string;
  version: string;
}

// Complete refactored canonical state
export interface RefactoredCanonicalState {
  project: CanonicalProject;
  beam: CanonicalBeam;
  grid: CanonicalGrid;
  annotations: Map<string, CanonicalAnnotation>;
}

/**
 * Coordinate conversion helpers for the new system
 */
export class WorldCoordinateHelpers {
  /**
   * Convert a grid cell to world coordinates
   * Origin at bottom-left (left end, top of bottom flange)
   */
  static cellToWorld(
    cell: GridCell,
    beamDepth: number,
    flangeThickness: number
  ): WorldPoint {
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
   * Get feature point in world coordinates
   */
  static getFeaturePoint(
    feature: string,
    beam: CanonicalBeam,
    beamDepth: number
  ): WorldPoint {
    switch (feature) {
      case 'beam-start':
        return { x: 0, y: beamDepth / 2 };
        
      case 'beam-end':
        return { x: beam.length, y: beamDepth / 2 };
        
      case 'bearing-left':
        return { x: beam.leftBearing, y: 0 };
        
      case 'bearing-right':
        return { x: beam.length - beam.rightBearing, y: 0 };
        
      default:
        return { x: 0, y: 0 };
    }
  }
  
  /**
   * Check if a point is within beam bounds
   */
  static isInBeamBounds(
    point: WorldPoint,
    beamLength: number,
    beamDepth: number
  ): boolean {
    return point.x >= 0 && 
           point.x <= beamLength && 
           point.y >= 0 && 
           point.y <= beamDepth;
  }
}