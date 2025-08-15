import { StateCreator } from 'zustand';
import { AppStore, AnnotationState } from '../types';
import { Annotation } from '../../types';

export interface AnnotationSlice {
  annotations: AnnotationState;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
}

export const createAnnotationSlice: StateCreator<
  AppStore,
  [],
  [],
  AnnotationSlice
> = (set) => ({
  annotations: {
    annotations: new Map(),
    selectedAnnotation: null
  },
  
  addAnnotation: (annotation) =>
    set((state) => {
      const annotations = new Map(state.annotations.annotations);
      annotations.set(annotation.id, annotation);
      
      return {
        annotations: {
          ...state.annotations,
          annotations,
          selectedAnnotation: annotation.id
        },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  updateAnnotation: (id, updates) =>
    set((state) => {
      const annotations = new Map(state.annotations.annotations);
      const existing = annotations.get(id);
      
      if (existing) {
        annotations.set(id, { ...existing, ...updates });
      }
      
      return {
        annotations: {
          ...state.annotations,
          annotations
        },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  removeAnnotation: (id) =>
    set((state) => {
      const annotations = new Map(state.annotations.annotations);
      annotations.delete(id);
      
      return {
        annotations: {
          annotations,
          selectedAnnotation: 
            state.annotations.selectedAnnotation === id 
              ? null 
              : state.annotations.selectedAnnotation
        },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  selectAnnotation: (id) =>
    set((state) => ({
      annotations: {
        ...state.annotations,
        selectedAnnotation: id
      }
    }))
});