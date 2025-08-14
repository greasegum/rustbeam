import { StateCreator } from 'zustand';
import { AppStore, BeamState } from '../types';
import { BeamProfile } from '../../types';
import { getBeamById } from '../../data/beamCatalog';

export interface BeamSlice {
  beam: BeamState;
  setBeamProfile: (profile: BeamProfile) => void;
  setBeamDimensions: (dims: Partial<BeamState>) => void;
  setBeamLength: (length: number) => void;
  setBearings: (left: number, right: number) => void;
}

export const createBeamSlice: StateCreator<
  AppStore,
  [],
  [],
  BeamSlice
> = (set, get) => ({
  beam: {
    profile: getBeamById('W12X26') || null,
    length: 240,
    leftBearing: 12,
    rightBearing: 12,
    leftAbutmentHeight: 24,
    rightAbutmentHeight: 24,
    units: 'imperial'
  },
  
  setBeamProfile: (profile) =>
    set((state) => {
      // Recalculate grid when beam changes
      const grid = state.grid;
      const newRows = Math.ceil(profile.depth / grid.size);
      const newCols = Math.ceil(state.beam.length / grid.size);
      
      return {
        beam: { ...state.beam, profile },
        grid: { ...grid, rows: newRows, cols: newCols },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  setBeamDimensions: (dims) =>
    set((state) => {
      const newBeam = { ...state.beam, ...dims };
      const grid = state.grid;
      
      // Recalculate grid if length changes
      let newGrid = grid;
      if (dims.length !== undefined) {
        const newCols = Math.ceil(dims.length / grid.size);
        newGrid = { ...grid, cols: newCols };
      }
      
      return {
        beam: newBeam,
        grid: newGrid,
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
    
  setBeamLength: (length) =>
    set((state) => {
      const grid = state.grid;
      const newCols = Math.ceil(length / grid.size);
      
      return {
        beam: { ...state.beam, length },
        grid: { ...grid, cols: newCols },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
    
  setBearings: (left, right) =>
    set((state) => ({
      beam: { 
        ...state.beam, 
        leftBearing: left,
        rightBearing: right
      },
      project: {
        ...state.project,
        modifiedAt: new Date().toISOString()
      }
    }))
});