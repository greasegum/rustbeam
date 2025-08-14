/**
 * Refactored Zustand Store with Canonical/Derived Separation
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { CanonicalState, CanonicalAnnotation, WorldPoint } from '../canonical/types';
import { DerivedState } from '../derived/types';
import { GeometryCache, CacheInvalidation } from '../derived/geometryCache';
import { getBeamById } from '../../data/beamCatalog';

interface StoreState {
  // Canonical state (persistable)
  canonical: CanonicalState;
  
  // Derived state (computed/cached)
  derived: DerivedState;
  
  // Geometry cache manager
  geometryCache: GeometryCache;
  
  // Actions for canonical state
  setProjectName: (name: string) => void;
  setBeamProfile: (profileId: string) => void;
  setBeamLength: (length: number) => void;
  setBearingPositions: (left: number, right: number) => void;
  setAbutmentHeights: (left: number, right: number) => void;
  
  markGridCell: (row: number, col: number, defectType?: string, severity?: number) => void;
  clearGridCell: (row: number, col: number) => void;
  clearAllCells: () => void;
  setGridSize: (size: number) => void;
  
  addAnnotation: (annotation: CanonicalAnnotation) => void;
  updateAnnotation: (id: string, updates: Partial<CanonicalAnnotation>) => void;
  removeAnnotation: (id: string) => void;
  
  // Actions for view (affects derived only)
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setRotation: (rotation: number) => void;
  setViewport: (width: number, height: number) => void;
  
  // Serialization
  exportCanonical: () => string;
  importCanonical: (data: CanonicalState) => void;
  
  // Utility
  regenerateDerived: (invalidation?: CacheInvalidation) => void;
}

export const useRefactoredStore = create<StoreState>()(
  devtools(
    subscribeWithSelector((set, get) => {
      const geometryCache = new GeometryCache();
      
      // Initial canonical state
      const initialCanonical: CanonicalState = {
        project: {
          id: crypto.randomUUID(),
          name: 'Untitled Inspection',
          date: new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          version: '1.0.0'
        },
        beam: {
          profileId: 'W12X26',
          length: 240,
          leftBearing: 12,
          rightBearing: 12,
          leftAbutmentHeight: 24,
          rightAbutmentHeight: 24,
          units: 'imperial'
        },
        grid: {
          cellSize: 3,
          cells: new Map()
        },
        annotations: new Map()
      };
      
      // Generate initial derived state
      const initialDerived = geometryCache.updateFromCanonical(initialCanonical);
      
      return {
        canonical: initialCanonical,
        derived: initialDerived,
        geometryCache,
        
        // Project actions
        setProjectName: (name) => set((state) => {
          state.canonical.project.name = name;
          state.canonical.project.modifiedAt = new Date().toISOString();
          return { canonical: { ...state.canonical } };
        }),
        
        // Beam actions
        setBeamProfile: (profileId) => set((state) => {
          const profile = getBeamById(profileId);
          if (!profile) return state;
          
          state.canonical.beam.profileId = profileId;
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          // Regenerate derived state
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            beamGeometry: true,
            gridGeometry: true,
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        setBeamLength: (length) => set((state) => {
          state.canonical.beam.length = length;
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            beamGeometry: true,
            gridGeometry: true,
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        setBearingPositions: (left, right) => set((state) => {
          state.canonical.beam.leftBearing = left;
          state.canonical.beam.rightBearing = right;
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            beamGeometry: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        setAbutmentHeights: (left, right) => set((state) => {
          state.canonical.beam.leftAbutmentHeight = left;
          state.canonical.beam.rightAbutmentHeight = right;
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            beamGeometry: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        // Grid actions
        markGridCell: (row, col, defectType, severity) => set((state) => {
          const key = `${row},${col}`;
          
          if (!defectType) {
            state.canonical.grid.cells.delete(key);
          } else {
            state.canonical.grid.cells.set(key, {
              row,
              col,
              defectType,
              severity: severity || 1
            });
          }
          
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        clearGridCell: (row, col) => set((state) => {
          const key = `${row},${col}`;
          state.canonical.grid.cells.delete(key);
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        clearAllCells: () => set((state) => {
          state.canonical.grid.cells.clear();
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        setGridSize: (size) => set((state) => {
          state.canonical.grid.cellSize = size;
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            gridGeometry: true,
            contours: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        // Annotation actions
        addAnnotation: (annotation) => set((state) => {
          state.canonical.annotations.set(annotation.id, annotation);
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            annotations: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        updateAnnotation: (id, updates) => set((state) => {
          const existing = state.canonical.annotations.get(id);
          if (!existing) return state;
          
          state.canonical.annotations.set(id, { ...existing, ...updates });
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            annotations: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        removeAnnotation: (id) => set((state) => {
          state.canonical.annotations.delete(id);
          state.canonical.project.modifiedAt = new Date().toISOString();
          
          const derived = state.geometryCache.updateFromCanonical(state.canonical, {
            annotations: true
          });
          
          return {
            canonical: { ...state.canonical },
            derived
          };
        }),
        
        // View actions (derived only)
        setZoom: (zoom) => set((state) => {
          state.derived.viewTransform.scale = Math.max(1, Math.min(100, zoom));
          state.geometryCache.updateViewTransform(state.derived.viewTransform);
          return { derived: { ...state.derived } };
        }),
        
        setPan: (x, y) => set((state) => {
          state.derived.viewTransform.offset = { x, y };
          state.geometryCache.updateViewTransform(state.derived.viewTransform);
          return { derived: { ...state.derived } };
        }),
        
        setRotation: (rotation) => set((state) => {
          state.derived.viewTransform.rotation = rotation;
          state.geometryCache.updateViewTransform(state.derived.viewTransform);
          return { derived: { ...state.derived } };
        }),
        
        setViewport: (width, height) => set((state) => {
          state.derived.viewTransform.viewport = { width, height };
          state.geometryCache.updateViewTransform(state.derived.viewTransform);
          return { derived: { ...state.derived } };
        }),
        
        // Serialization
        exportCanonical: () => {
          const state = get();
          return JSON.stringify(state.canonical, (key, value) => {
            if (value instanceof Map) {
              return Array.from(value.entries());
            }
            return value;
          });
        },
        
        importCanonical: (data) => set((state) => {
          // Convert arrays back to Maps
          if (Array.isArray(data.grid.cells)) {
            data.grid.cells = new Map(data.grid.cells);
          }
          if (Array.isArray(data.annotations)) {
            data.annotations = new Map(data.annotations);
          }
          
          const derived = state.geometryCache.updateFromCanonical(data);
          
          return {
            canonical: data,
            derived
          };
        }),
        
        // Utility
        regenerateDerived: (invalidation) => set((state) => {
          const derived = state.geometryCache.updateFromCanonical(
            state.canonical,
            invalidation
          );
          return { derived };
        })
      };
    })
  )
);