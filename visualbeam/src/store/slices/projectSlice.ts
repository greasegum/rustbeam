import { StateCreator } from 'zustand';
import { AppStore, ProjectMetadata } from '../types';

export interface ProjectSlice {
  project: ProjectMetadata;
  setProjectMetadata: (metadata: Partial<ProjectMetadata>) => void;
}

export const createProjectSlice: StateCreator<
  AppStore,
  [],
  [],
  ProjectSlice
> = (set) => ({
  project: {
    id: crypto.randomUUID(),
    name: 'Untitled Inspection',
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
    }))
});