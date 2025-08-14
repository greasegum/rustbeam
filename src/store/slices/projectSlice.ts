import { StateCreator } from 'zustand';
import { AppStore, ProjectMetadata } from '../types';

export interface ProjectSlice {
  project: ProjectMetadata;
  setProjectMetadata: (metadata: Partial<ProjectMetadata>) => void;
  setProjectInfo: (info: Partial<ProjectMetadata>) => void;
}

export const createProjectSlice: StateCreator<
  AppStore,
  [],
  [],
  ProjectSlice
> = (set) => ({
  project: {
    id: crypto.randomUUID(),
    name: 'Bridge A-47',
    beamId: 'Beam 2',
    inspector: 'J. Smith',
    description: '',
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    version: '1.0.0'
  },
  
  setProjectMetadata: (metadata) =>
    set((state) => ({
      project: {
        ...state.project,
        ...metadata,
        modifiedAt: new Date().toISOString()
      }
    })),
    
  setProjectInfo: (info) =>
    set((state) => ({
      project: {
        ...state.project,
        ...info,
        modifiedAt: new Date().toISOString()
      }
    }))
});