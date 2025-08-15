/**
 * Geometry Cache Management
 * Manages derived geometry regeneration and invalidation
 */

import { CanonicalState } from '../canonical/types';
import { DerivedState, DerivedContour, DerivedAnnotation, ViewTransform } from './types';
import { ContourGenerator } from '../../geometry/contourGenerator';
import { AnnotationConstraintResolver } from '../../geometry/annotationConstraints';
import { getBeamById } from '../../data/beamCatalog';

export interface CacheInvalidation {
  contours?: boolean;
  annotations?: boolean;
  beamGeometry?: boolean;
  gridGeometry?: boolean;
  screenSpace?: boolean;
}

export class GeometryCache {
  private derivedState: DerivedState;
  private canonicalVersion: number = 0;
  private contourGenerator: ContourGenerator;
  
  constructor() {
    this.derivedState = this.createEmptyDerivedState();
    this.contourGenerator = new ContourGenerator(3); // Default cell size
  }
  
  /**
   * Get current derived state
   */
  getDerivedState(): DerivedState {
    return this.derivedState;
  }
  
  /**
   * Update derived state from canonical state
   */
  updateFromCanonical(
    canonical: CanonicalState,
    invalidation: CacheInvalidation = {}
  ): DerivedState {
    const startTime = performance.now();
    
    // Update contours if needed
    if (invalidation.contours || this.shouldRegenerateContours(canonical)) {
      this.regenerateContours(canonical);
    }
    
    // Update annotations if needed
    if (invalidation.annotations || this.shouldRegenerateAnnotations(canonical)) {
      this.regenerateAnnotations(canonical);
    }
    
    // Update beam geometry if needed
    if (invalidation.beamGeometry || this.shouldRegenerateBeamGeometry(canonical)) {
      this.regenerateBeamGeometry(canonical);
    }
    
    // Update grid geometry if needed
    if (invalidation.gridGeometry || this.shouldRegenerateGridGeometry(canonical)) {
      this.regenerateGridGeometry(canonical);
    }
    
    // Clear screen-space cache if needed
    if (invalidation.screenSpace) {
      this.clearScreenSpaceCache();
    }
    
    // Update cache metadata
    this.derivedState.cacheVersion++;
    this.derivedState.lastRegenerated = performance.now() - startTime;
    
    return this.derivedState;
  }
  
  /**
   * Update view transform
   */
  updateViewTransform(transform: ViewTransform) {
    this.derivedState.viewTransform = transform;
    this.clearScreenSpaceCache();
  }
  
  /**
   * Regenerate contours from grid cells
   */
  private regenerateContours(canonical: CanonicalState) {
    const generator = new ContourGenerator(
      canonical.grid.cellSize,
      { x: -canonical.beam.length / 2, y: 0 }
    );
    
    this.derivedState.contours = generator.generateContours(canonical.grid);
  }
  
  /**
   * Regenerate annotation geometry
   */
  private regenerateAnnotations(canonical: CanonicalState) {
    const beamProfile = getBeamById(canonical.beam.profileId);
    if (!beamProfile) return;
    
    const resolver = new AnnotationConstraintResolver({
      beam: canonical.beam,
      grid: canonical.grid,
      beamProfile: {
        depth: beamProfile.depth,
        flangeThickness: beamProfile.flangeThickness,
        webThickness: beamProfile.webThickness
      }
    });
    
    const annotations = new Map<string, DerivedAnnotation>();
    
    // Resolve each annotation
    const resolved: DerivedAnnotation[] = [];
    canonical.annotations.forEach(annotation => {
      const derivedAnnotation = resolver.resolveAnnotation(annotation);
      resolved.push(derivedAnnotation);
    });
    
    // Resolve overlaps
    const adjusted = AnnotationConstraintResolver.resolveOverlaps(resolved);
    
    // Store in map
    adjusted.forEach(ann => {
      annotations.set(ann.id, ann);
    });
    
    this.derivedState.annotations = annotations;
  }
  
  /**
   * Regenerate beam geometry
   */
  private regenerateBeamGeometry(canonical: CanonicalState) {
    const profile = getBeamById(canonical.beam.profileId);
    if (!profile) return;
    
    const halfLength = canonical.beam.length / 2;
    const halfDepth = profile.depth / 2;
    
    this.derivedState.beamGeometry = {
      worldOutline: {
        topFlange: {
          start: { x: -halfLength, y: -halfDepth + profile.flangeThickness / 2 },
          end: { x: halfLength, y: -halfDepth + profile.flangeThickness / 2 }
        },
        bottomFlange: {
          start: { x: -halfLength, y: halfDepth - profile.flangeThickness / 2 },
          end: { x: halfLength, y: halfDepth - profile.flangeThickness / 2 }
        },
        web: {
          start: { x: -halfLength, y: 0 },
          end: { x: halfLength, y: 0 }
        }
      },
      worldFeatures: {
        bearings: [
          {
            x: -halfLength + canonical.beam.leftBearing,
            y: halfDepth,
            type: 'left' as const
          },
          {
            x: halfLength - canonical.beam.rightBearing,
            y: halfDepth,
            type: 'right' as const
          }
        ],
        abutments: [
          {
            x: -halfLength,
            y: halfDepth,
            height: canonical.beam.leftAbutmentHeight,
            type: 'left' as const
          },
          {
            x: halfLength,
            y: halfDepth,
            height: canonical.beam.rightAbutmentHeight,
            type: 'right' as const
          }
        ]
      }
    };
  }
  
  /**
   * Regenerate grid geometry
   */
  private regenerateGridGeometry(canonical: CanonicalState) {
    const profile = getBeamById(canonical.beam.profileId);
    if (!profile) return;
    
    const cols = Math.ceil(canonical.beam.length / canonical.grid.cellSize);
    const rows = Math.ceil(profile.depth / canonical.grid.cellSize);
    
    this.derivedState.gridGeometry = {
      worldGrid: {
        rows,
        cols,
        cellWidth: canonical.grid.cellSize,
        cellHeight: canonical.grid.cellSize,
        origin: {
          x: -canonical.beam.length / 2,
          y: -profile.depth / 2
        }
      }
    };
  }
  
  /**
   * Clear screen-space cache
   */
  private clearScreenSpaceCache() {
    // Clear screen-space data from contours
    this.derivedState.contours.forEach(contour => {
      contour.screenPath = undefined;
      contour.screenBounds = undefined;
    });
    
    // Clear screen-space data from annotations
    this.derivedState.annotations.forEach(annotation => {
      annotation.screenAnchor = undefined;
      annotation.screenTextBox = undefined;
      annotation.screenLeaderPath = undefined;
      annotation.collisionBox = undefined;
    });
    
    // Clear screen-space beam geometry
    if (this.derivedState.beamGeometry) {
      this.derivedState.beamGeometry.screenOutline = undefined;
      this.derivedState.beamGeometry.screenFeatures = undefined;
    }
    
    // Clear screen-space grid
    if (this.derivedState.gridGeometry) {
      this.derivedState.gridGeometry.screenGrid = undefined;
    }
  }
  
  /**
   * Check if contours need regeneration
   */
  private shouldRegenerateContours(canonical: CanonicalState): boolean {
    // Simple version check - in production would be more sophisticated
    return true; // Always regenerate for now
  }
  
  /**
   * Check if annotations need regeneration
   */
  private shouldRegenerateAnnotations(canonical: CanonicalState): boolean {
    return true; // Always regenerate for now
  }
  
  /**
   * Check if beam geometry needs regeneration
   */
  private shouldRegenerateBeamGeometry(canonical: CanonicalState): boolean {
    return true; // Always regenerate for now
  }
  
  /**
   * Check if grid geometry needs regeneration
   */
  private shouldRegenerateGridGeometry(canonical: CanonicalState): boolean {
    return true; // Always regenerate for now
  }
  
  /**
   * Create empty derived state
   */
  private createEmptyDerivedState(): DerivedState {
    return {
      contours: new Map(),
      annotations: new Map(),
      beamGeometry: null,
      gridGeometry: null,
      viewTransform: {
        scale: 10,
        offset: { x: 0, y: 0 },
        rotation: 0,
        viewport: { width: 800, height: 600 }
      },
      cacheVersion: 0,
      lastRegenerated: 0
    };
  }
}