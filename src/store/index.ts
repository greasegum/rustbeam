import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AppStore } from './types';
import { createProjectSlice } from './slices/projectSlice';
import { createBeamSlice } from './slices/beamSlice';
import { createBridgeGeometrySlice } from './slices/bridgeGeometrySlice';
import { createGridSlice } from './slices/gridSlice';
import { createToolSlice } from './slices/toolSlice';
import { createAnnotationSlice } from './slices/annotationSlice';
import { createViewSlice } from './slices/viewSlice';
import { XMLSerializer } from '../xml/serializer';
import { XMLDeserializer } from '../xml/deserializer';

const initialState = {
  ...createProjectSlice,
  ...createBeamSlice,
  ...createGridSlice,
  ...createToolSlice,
  ...createAnnotationSlice,
  ...createViewSlice
};

export const useStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => {
        // Create initial slices
        const projectSlice = createProjectSlice(set, get, {} as any);
        const beamSlice = createBeamSlice(set, get, {} as any);
        const bridgeGeometrySlice = createBridgeGeometrySlice(set, get, {} as any);
        const gridSlice = createGridSlice(set, get, {} as any);
        const toolSlice = createToolSlice(set, get, {} as any);
        const annotationSlice = createAnnotationSlice(set, get, {} as any);
        const viewSlice = createViewSlice(set, get, {} as any);
        
        // Ensure Maps are properly initialized
        if (!(gridSlice.grid.cells instanceof Map)) {
          gridSlice.grid.cells = new Map();
        }
        if (!(annotationSlice.annotations.annotations instanceof Map)) {
          annotationSlice.annotations.annotations = new Map();
        }
        
        // Migration: Initialize bridgeGeometry from legacy beam state if missing
        if (!bridgeGeometrySlice.bridgeGeometry.profile && beamSlice.beam.profile) {
          console.log('🔄 Migrating legacy beam state to bridgeGeometry');
          bridgeGeometrySlice.bridgeGeometry = {
            profile: beamSlice.beam.profile,
            length: beamSlice.beam.length,
            units: beamSlice.beam.units,
            bearings: {
              left: {
                distance: beamSlice.beam.leftBearing,
                plates: {
                  lower: { width: 8, length: 8, thickness: 1 },
                  upper: { width: 8, length: 8, thickness: 1 }
                }
              },
              right: {
                distance: beamSlice.beam.rightBearing,
                plates: {
                  lower: { width: 8, length: 8, thickness: 1 },
                  upper: { width: 8, length: 8, thickness: 1 }
                }
              }
            },
            abutments: {
              left: {
                height: beamSlice.beam.leftAbutmentHeight,
                backwallClearance: beamSlice.beam.backwallClearance,
                seatWidth: beamSlice.beam.seatWidth,
                chamfer: 4
              },
              right: {
                height: beamSlice.beam.rightAbutmentHeight,
                backwallClearance: beamSlice.beam.backwallClearance,
                seatWidth: beamSlice.beam.seatWidth,
                chamfer: 4
              }
            },
            constraints: {
              breastwallDistance: beamSlice.beam.breastwallDistance,
              minimumClearance: 1
            }
          };
          console.log('✅ Migration completed, bridgeGeometry:', bridgeGeometrySlice.bridgeGeometry);
        }
        
        return {
        // Project and core state
        project: projectSlice.project,
        setProjectMetadata: projectSlice.setProjectMetadata,
        
        // Legacy beam state (for compatibility, but functions come from bridgeGeometrySlice)
        beam: beamSlice.beam,
        setBeamDimensions: beamSlice.setBeamDimensions, // Legacy function for compatibility
        
        // New bridge geometry (this provides the actual functions)
        bridgeGeometry: bridgeGeometrySlice.bridgeGeometry,
        setBeamProfile: bridgeGeometrySlice.setBeamProfile,
        setBeamLength: bridgeGeometrySlice.setBeamLength,
        setBeamUnits: bridgeGeometrySlice.setBeamUnits,
        setBearingDistance: bridgeGeometrySlice.setBearingDistance,
        setBearingPlates: bridgeGeometrySlice.setBearingPlates,
        setAbutmentHeight: bridgeGeometrySlice.setAbutmentHeight,
        setBackwallClearance: bridgeGeometrySlice.setBackwallClearance,
        setAbutmentChamfer: bridgeGeometrySlice.setAbutmentChamfer,
        setBreastwallDistance: bridgeGeometrySlice.setBreastwallDistance,
        setMinimumClearance: bridgeGeometrySlice.setMinimumClearance,
        setBridgeGeometry: bridgeGeometrySlice.setBridgeGeometry,
        resetBridgeGeometry: bridgeGeometrySlice.resetBridgeGeometry,
        
        // Grid
        grid: gridSlice.grid,
        setGridSize: gridSlice.setGridSize,
        markCell: gridSlice.markCell,
        clearCell: gridSlice.clearCell,
        clearAllCells: gridSlice.clearAllCells,
        
        // Tools
        tool: toolSlice.tool,
        setCurrentTool: toolSlice.setCurrentTool,
        setDefectType: toolSlice.setDefectType,
        setSeverity: toolSlice.setSeverity,
        toggleGrid: toolSlice.toggleGrid,
        toggleDimensions: toolSlice.toggleDimensions,
        toggleSnap: toolSlice.toggleSnap,
        
        // Annotations
        annotations: annotationSlice.annotations,
        addAnnotation: annotationSlice.addAnnotation,
        updateAnnotation: annotationSlice.updateAnnotation,
        removeAnnotation: annotationSlice.removeAnnotation,
        selectAnnotation: annotationSlice.selectAnnotation,
        
        // View
        view: viewSlice.view,
        setZoom: viewSlice.setZoom,
        setPan: viewSlice.setPan,
        setRotation: viewSlice.setRotation,
        
        exportToXML: () => {
          const state = get();
          const serializer = new XMLSerializer();
          return serializer.serialize({
            project: state.project,
            beam: state.beam,
            grid: state.grid,
            annotations: state.annotations,
            tool: state.tool,
            view: state.view
          });
        },
        
        importFromXML: (xml: string) => {
          const deserializer = new XMLDeserializer();
          const data = deserializer.deserialize(xml);
          
          set((state) => ({
            ...state,
            ...data,
            project: {
              ...state.project,
              ...data.project,
              modifiedAt: new Date().toISOString()
            }
          }));
        },
        
        reset: () => {
          const fresh = {
            ...createProjectSlice(set, get, {} as any),
            ...createBeamSlice(set, get, {} as any),
            ...createBridgeGeometrySlice(set, get, {} as any),
            ...createGridSlice(set, get, {} as any),
            ...createToolSlice(set, get, {} as any),
            ...createAnnotationSlice(set, get, {} as any),
            ...createViewSlice(set, get, {} as any)
          };
          
          set(() => ({
            // Project
            project: fresh.project,
            setProjectMetadata: fresh.setProjectMetadata,
            
            // Legacy beam (for compatibility)
            beam: fresh.beam,
            setBeamDimensions: fresh.setBeamDimensions,
            
            // Bridge geometry (new)
            bridgeGeometry: fresh.bridgeGeometry,
            setBeamProfile: fresh.setBeamProfile,
            setBeamLength: fresh.setBeamLength,
            setBeamUnits: fresh.setBeamUnits,
            setBearingDistance: fresh.setBearingDistance,
            setBearingPlates: fresh.setBearingPlates,
            setAbutmentHeight: fresh.setAbutmentHeight,
            setBackwallClearance: fresh.setBackwallClearance,
            setAbutmentChamfer: fresh.setAbutmentChamfer,
            setBreastwallDistance: fresh.setBreastwallDistance,
            setMinimumClearance: fresh.setMinimumClearance,
            setBridgeGeometry: fresh.setBridgeGeometry,
            resetBridgeGeometry: fresh.resetBridgeGeometry,
            
            // Grid
            grid: fresh.grid,
            setGridSize: fresh.setGridSize,
            markCell: fresh.markCell,
            clearCell: fresh.clearCell,
            clearAllCells: fresh.clearAllCells,
            
            // Tools
            tool: fresh.tool,
            setCurrentTool: fresh.setCurrentTool,
            setDefectType: fresh.setDefectType,
            setSeverity: fresh.setSeverity,
            toggleGrid: fresh.toggleGrid,
            toggleDimensions: fresh.toggleDimensions,
            toggleSnap: fresh.toggleSnap,
            
            // Annotations
            annotations: fresh.annotations,
            addAnnotation: fresh.addAnnotation,
            updateAnnotation: fresh.updateAnnotation,
            removeAnnotation: fresh.removeAnnotation,
            selectAnnotation: fresh.selectAnnotation,
            
            // View
            view: fresh.view,
            setZoom: fresh.setZoom,
            setPan: fresh.setPan,
            setRotation: fresh.setRotation
          }));
        }
      };
      },
      {
        name: 'visualbeam-storage',
        partialize: (state) => ({
          project: state.project,
          beam: state.beam, // Legacy - maintain for compatibility
          bridgeGeometry: state.bridgeGeometry, // New unified geometry state
          grid: { 
            ...state.grid, 
            cells: state.grid.cells instanceof Map 
              ? Array.from(state.grid.cells.entries()) 
              : []
          },
          tool: state.tool,
          annotations: {
            ...state.annotations,
            annotations: state.annotations.annotations instanceof Map
              ? Array.from(state.annotations.annotations.entries())
              : []
          },
          view: state.view
        }),
        onRehydrateStorage: () => (state) => {
          if (state?.grid?.cells) {
            state.grid.cells = new Map(Array.isArray(state.grid.cells) ? state.grid.cells : []);
          } else if (state?.grid) {
            state.grid.cells = new Map();
          }
          if (state?.annotations?.annotations) {
            state.annotations.annotations = new Map(Array.isArray(state.annotations.annotations) ? state.annotations.annotations : []);
          } else if (state?.annotations) {
            state.annotations.annotations = new Map();
          }
        }
      }
    )
  )
);