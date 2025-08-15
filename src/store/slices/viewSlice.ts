import { StateCreator } from 'zustand';
import { AppStore, ViewState } from '../types';

export interface ViewSlice {
  view: ViewState;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setRotation: (rotation: number) => void;
}

export const createViewSlice: StateCreator<
  AppStore,
  [],
  [],
  ViewSlice
> = (set) => ({
  view: {
    zoom: 1,
    panX: 0,
    panY: 0,
    rotation: 0
  },
  
  setZoom: (zoom) =>
    set((state) => ({
      view: { 
        ...state.view, 
        zoom: Math.max(0.25, Math.min(4, zoom)) 
      }
    })),
  
  setPan: (x, y) =>
    set((state) => ({
      view: { ...state.view, panX: x, panY: y }
    })),
  
  setRotation: (rotation) =>
    set((state) => ({
      view: { 
        ...state.view, 
        rotation: rotation % 360 
      }
    }))
});