import { StateCreator } from 'zustand';
import { AppStore, BeamState } from '../types';
import { BeamProfile } from '../../types';
import { getBeamById } from '../../data/beamCatalog';

// Helper to compute derived seat width
const computeSeatWidth = (beamLength: number, backwallClearance: number, breastwallDistance: number): number => {
  return (beamLength + 2 * backwallClearance - breastwallDistance) / 2;
};

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
    backwallClearance: 2,
    breastwallDistance: 200,  // Distance between facing brestwalls (clear span)
    seatWidth: 22,           // DERIVED: (240 + 2*2 - 200) / 2 = 44/2 = 22
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
      let newBeam = { ...state.beam, ...dims };
      
      // Automatically compute seat width when relevant parameters change
      const length = dims.length !== undefined ? dims.length : state.beam.length;
      const backwallClearance = dims.backwallClearance !== undefined ? dims.backwallClearance : state.beam.backwallClearance;
      const breastwallDistance = dims.breastwallDistance !== undefined ? dims.breastwallDistance : state.beam.breastwallDistance;
      
      // Always recompute seat width based on the formula
      newBeam.seatWidth = computeSeatWidth(length, backwallClearance, breastwallDistance);
      
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
      
      // Recompute seat width with new length
      const seatWidth = computeSeatWidth(length, state.beam.backwallClearance, state.beam.breastwallDistance);
      
      return {
        beam: { ...state.beam, length, seatWidth },
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