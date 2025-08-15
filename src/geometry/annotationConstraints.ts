/**
 * Annotation Constraint System
 * Resolves annotation positions based on constraints and relationships
 */

import { CanonicalAnnotation, WorldPoint, CanonicalBeam, CanonicalGrid } from '../store/canonical/types';
import { DerivedAnnotation } from '../store/derived/types';

export interface ConstraintContext {
  beam: CanonicalBeam;
  grid: CanonicalGrid;
  beamProfile: {
    depth: number;
    flangeThickness: number;
    webThickness: number;
  };
}

export class AnnotationConstraintResolver {
  private context: ConstraintContext;
  
  constructor(context: ConstraintContext) {
    this.context = context;
  }
  
  /**
   * Resolve annotation world position from constraints
   */
  resolveAnnotation(annotation: CanonicalAnnotation): DerivedAnnotation {
    // Start with the anchor position
    let worldAnchor = { ...annotation.anchor };
    
    // Apply constraints if present
    if (annotation.constraints) {
      worldAnchor = this.applyConstraints(annotation, worldAnchor);
    }
    
    // Calculate text box dimensions
    const textBox = this.calculateTextBox(annotation, worldAnchor);
    
    // Generate leader path if needed
    const leaderPath = this.generateLeaderPath(annotation, worldAnchor);
    
    return {
      id: annotation.id,
      worldAnchor,
      worldTextBox: textBox,
      worldLeaderPath: leaderPath,
      visible: true
    };
  }
  
  /**
   * Apply constraints to get final position
   */
  private applyConstraints(
    annotation: CanonicalAnnotation,
    baseAnchor: WorldPoint
  ): WorldPoint {
    const constraints = annotation.constraints!;
    let targetPoint = baseAnchor;
    
    // Apply cell constraint
    if (constraints.targetCell) {
      targetPoint = this.getCellCenter(
        constraints.targetCell.row,
        constraints.targetCell.col
      );
    }
    
    // Apply feature constraint
    if (constraints.targetFeature) {
      targetPoint = this.getFeaturePoint(constraints.targetFeature);
    }
    
    // Apply offset
    if (constraints.offset) {
      targetPoint = {
        x: targetPoint.x + constraints.offset.x,
        y: targetPoint.y + constraints.offset.y
      };
    }
    
    return targetPoint;
  }
  
  /**
   * Get center point of a grid cell in world coordinates
   */
  private getCellCenter(row: number, col: number): WorldPoint {
    const { cellSize } = this.context.grid;
    const { beam, beamProfile } = this.context;
    
    // Calculate grid origin (top-left of grid)
    const gridOriginX = -beam.length / 2;
    const gridOriginY = -beamProfile.depth / 2;
    
    // Calculate cell center
    return {
      x: gridOriginX + (col + 0.5) * cellSize,
      y: gridOriginY + (row + 0.5) * cellSize
    };
  }
  
  /**
   * Get position of a beam feature
   */
  private getFeaturePoint(feature: string): WorldPoint {
    const { beam, beamProfile } = this.context;
    
    switch (feature) {
      case 'beam-top':
        return {
          x: 0,
          y: -beamProfile.depth / 2
        };
        
      case 'beam-bottom':
        return {
          x: 0,
          y: beamProfile.depth / 2
        };
        
      case 'bearing-left':
        return {
          x: -beam.length / 2 + beam.leftBearing,
          y: beamProfile.depth / 2
        };
        
      case 'bearing-right':
        return {
          x: beam.length / 2 - beam.rightBearing,
          y: beamProfile.depth / 2
        };
        
      default:
        return { x: 0, y: 0 };
    }
  }
  
  /**
   * Calculate text box dimensions
   */
  private calculateTextBox(
    annotation: CanonicalAnnotation,
    anchor: WorldPoint
  ): { x: number; y: number; width: number; height: number } {
    // Estimate text dimensions based on content and style
    const charWidth = this.getCharWidth(annotation.style?.fontSize);
    const lineHeight = this.getLineHeight(annotation.style?.fontSize);
    
    const lines = annotation.text.split('\n');
    const maxLineLength = Math.max(...lines.map(l => l.length));
    
    const width = maxLineLength * charWidth;
    const height = lines.length * lineHeight;
    
    // Position based on annotation type
    let x = anchor.x;
    let y = anchor.y;
    
    switch (annotation.type) {
      case 'dimension':
        // Center horizontally, below anchor
        x -= width / 2;
        y += 2; // Small gap
        break;
        
      case 'callout':
        // Offset to avoid overlap
        x += 5;
        y -= height / 2;
        break;
        
      case 'note':
        // Top-left aligned
        break;
        
      case 'leader':
        // Offset from target
        x += 10;
        y -= height / 2;
        break;
    }
    
    return { x, y, width, height };
  }
  
  /**
   * Generate leader line path
   */
  private generateLeaderPath(
    annotation: CanonicalAnnotation,
    anchor: WorldPoint
  ): any[] | undefined {
    if (annotation.type !== 'leader' || !annotation.constraints?.targetCell) {
      return undefined;
    }
    
    const target = this.getCellCenter(
      annotation.constraints.targetCell.row,
      annotation.constraints.targetCell.col
    );
    
    // Simple two-segment leader line
    const midPoint = {
      x: anchor.x,
      y: target.y
    };
    
    return [
      { type: 'move', points: [target] },
      { type: 'line', points: [midPoint] },
      { type: 'line', points: [anchor] }
    ];
  }
  
  /**
   * Get character width for font size
   */
  private getCharWidth(fontSize?: string): number {
    switch (fontSize) {
      case 'small': return 0.4;
      case 'large': return 0.8;
      default: return 0.6; // medium
    }
  }
  
  /**
   * Get line height for font size
   */
  private getLineHeight(fontSize?: string): number {
    switch (fontSize) {
      case 'small': return 0.8;
      case 'large': return 1.6;
      default: return 1.2; // medium
    }
  }
  
  /**
   * Check if two annotations would overlap
   */
  static checkOverlap(a: DerivedAnnotation, b: DerivedAnnotation): boolean {
    const box1 = a.worldTextBox;
    const box2 = b.worldTextBox;
    
    return !(
      box1.x + box1.width < box2.x ||
      box2.x + box2.width < box1.x ||
      box1.y + box1.height < box2.y ||
      box2.y + box2.height < box1.y
    );
  }
  
  /**
   * Resolve overlaps by adjusting positions
   */
  static resolveOverlaps(annotations: DerivedAnnotation[]): DerivedAnnotation[] {
    const resolved = [...annotations];
    const iterations = 3;
    const pushDistance = 2;
    
    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < resolved.length; i++) {
        for (let j = i + 1; j < resolved.length; j++) {
          if (this.checkOverlap(resolved[i], resolved[j])) {
            // Push annotations apart
            const dx = resolved[j].worldAnchor.x - resolved[i].worldAnchor.x;
            const dy = resolved[j].worldAnchor.y - resolved[i].worldAnchor.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            
            const pushX = (dx / dist) * pushDistance;
            const pushY = (dy / dist) * pushDistance;
            
            resolved[j].worldAnchor.x += pushX;
            resolved[j].worldAnchor.y += pushY;
            resolved[j].worldTextBox.x += pushX;
            resolved[j].worldTextBox.y += pushY;
          }
        }
      }
    }
    
    return resolved;
  }
}