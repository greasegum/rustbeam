/**
 * Canonical State Types
 * These represent the authoritative, persistable state of the project.
 * All coordinates are in world space (inches/mm), not screen space.
 */

import { BeamProfile } from '../../types';

// World coordinate point (in measurement units)
export interface WorldPoint {
  x: number;
  y: number;
}

// Grid cell canonical definition
export interface CanonicalCell {
  row: number;
  col: number;
  defectType?: string;
  severity?: number;
  notes?: string;
}

// Annotation canonical definition
export interface CanonicalAnnotation {
  id: string;
  type: 'dimension' | 'note' | 'callout' | 'leader';
  
  // Position in world coordinates
  anchor: WorldPoint;
  
  // Content
  text: string;
  
  // Constraints/relationships
  constraints?: {
    targetCell?: { row: number; col: number };
    targetFeature?: 'beam-top' | 'beam-bottom' | 'bearing-left' | 'bearing-right';
    offset?: WorldPoint; // Offset from constraint target
  };
  
  // Style hints (but not pixel values)
  style?: {
    fontSize?: 'small' | 'medium' | 'large';
    emphasis?: 'normal' | 'bold' | 'critical';
  };
}

// Beam canonical configuration
export interface CanonicalBeam {
  profileId: string;
  length: number;
  
  // Support positions (distance from left end)
  leftBearing: number;
  rightBearing: number;
  
  // Abutment heights
  leftAbutmentHeight: number;
  rightAbutmentHeight: number;
  
  // Measurement units
  units: 'imperial' | 'metric';
}

// Grid canonical configuration  
export interface CanonicalGrid {
  cellSize: number; // In world units
  cells: Map<string, CanonicalCell>; // Sparse storage
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

// Complete canonical state
export interface CanonicalState {
  project: CanonicalProject;
  beam: CanonicalBeam;
  grid: CanonicalGrid;
  annotations: Map<string, CanonicalAnnotation>;
}