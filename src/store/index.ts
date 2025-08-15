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
        
        return {
        ...projectSlice,
        ...beamSlice,
        ...bridgeGeometrySlice,
        ...gridSlice,
        ...toolSlice,
        ...annotationSlice,
        ...viewSlice,
        
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
            project: fresh.project,
            beam: fresh.beam,
            bridgeGeometry: fresh.bridgeGeometry,
            grid: fresh.grid,
            tool: fresh.tool,
            annotations: fresh.annotations,
            view: fresh.view
          }));
        }
      };
      },
      {
        name: 'visualbeam-storage',
        partialize: (state) => ({
          project: state.project,
          beam: state.beam,
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
        deserialize: (str) => {
          const data = JSON.parse(str);
          if (data.state?.grid?.cells) {
            data.state.grid.cells = new Map(Array.isArray(data.state.grid.cells) ? data.state.grid.cells : []);
          } else if (data.state?.grid) {
            data.state.grid.cells = new Map();
          }
          if (data.state?.annotations?.annotations) {
            data.state.annotations.annotations = new Map(
              Array.isArray(data.state.annotations.annotations) ? data.state.annotations.annotations : []
            );
          } else if (data.state?.annotations) {
            data.state.annotations.annotations = new Map();
          }
          return data;
        }
      }
    )
  )
);