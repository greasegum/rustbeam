/**
 * World Coordinate System
 * Handles transformations between world space and screen space
 */

import { WorldPoint } from '../store/canonical/types';
import { ScreenPoint, ViewTransform } from '../store/derived/types';

export class CoordinateSystem {
  private transform: ViewTransform;
  
  constructor(transform: ViewTransform) {
    this.transform = transform;
  }
  
  /**
   * Update the view transform
   */
  setTransform(transform: ViewTransform) {
    this.transform = transform;
  }
  
  /**
   * Convert world coordinates to screen coordinates
   */
  worldToScreen(world: WorldPoint): ScreenPoint {
    // Apply scale
    let x = world.x * this.transform.scale;
    let y = world.y * this.transform.scale;
    
    // Apply rotation if needed
    if (this.transform.rotation !== 0) {
      const cos = Math.cos(this.transform.rotation);
      const sin = Math.sin(this.transform.rotation);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      x = rx;
      y = ry;
    }
    
    // Apply pan offset and center in viewport
    x += this.transform.offset.x + this.transform.viewport.width / 2;
    y += this.transform.offset.y + this.transform.viewport.height / 2;
    
    return { x, y };
  }
  
  /**
   * Convert screen coordinates to world coordinates
   */
  screenToWorld(screen: ScreenPoint): WorldPoint {
    // Remove viewport centering and pan offset
    let x = screen.x - this.transform.offset.x - this.transform.viewport.width / 2;
    let y = screen.y - this.transform.offset.y - this.transform.viewport.height / 2;
    
    // Apply inverse rotation if needed
    if (this.transform.rotation !== 0) {
      const cos = Math.cos(-this.transform.rotation);
      const sin = Math.sin(-this.transform.rotation);
      const rx = x * cos - y * sin;
      const ry = x * sin + y * cos;
      x = rx;
      y = ry;
    }
    
    // Apply inverse scale
    x /= this.transform.scale;
    y /= this.transform.scale;
    
    return { x, y };
  }
  
  /**
   * Get the visible world bounds for the current viewport
   */
  getVisibleWorldBounds(): {
    min: WorldPoint;
    max: WorldPoint;
  } {
    // Convert viewport corners to world space
    const topLeft = this.screenToWorld({ x: 0, y: 0 });
    const bottomRight = this.screenToWorld({
      x: this.transform.viewport.width,
      y: this.transform.viewport.height
    });
    
    // Account for rotation by checking all corners
    const topRight = this.screenToWorld({
      x: this.transform.viewport.width,
      y: 0
    });
    const bottomLeft = this.screenToWorld({
      x: 0,
      y: this.transform.viewport.height
    });
    
    // Find actual bounds
    const xs = [topLeft.x, topRight.x, bottomLeft.x, bottomRight.x];
    const ys = [topLeft.y, topRight.y, bottomLeft.y, bottomRight.y];
    
    return {
      min: {
        x: Math.min(...xs),
        y: Math.min(...ys)
      },
      max: {
        x: Math.max(...xs),
        y: Math.max(...ys)
      }
    };
  }
  
  /**
   * Calculate scale to fit world bounds in viewport
   */
  static calculateFitScale(
    worldBounds: { width: number; height: number },
    viewport: { width: number; height: number },
    padding: number = 20
  ): number {
    const availableWidth = viewport.width - padding * 2;
    const availableHeight = viewport.height - padding * 2;
    
    const scaleX = availableWidth / worldBounds.width;
    const scaleY = availableHeight / worldBounds.height;
    
    return Math.min(scaleX, scaleY);
  }
  
  /**
   * Snap a world point to grid
   */
  static snapToGrid(point: WorldPoint, gridSize: number): WorldPoint {
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    };
  }
  
  /**
   * Calculate distance between two world points
   */
  static worldDistance(a: WorldPoint, b: WorldPoint): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * Calculate angle between two world points
   */
  static worldAngle(from: WorldPoint, to: WorldPoint): number {
    return Math.atan2(to.y - from.y, to.x - from.x);
  }
  
  /**
   * Interpolate between two world points
   */
  static lerp(a: WorldPoint, b: WorldPoint, t: number): WorldPoint {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t
    };
  }
}