import { StateCreator } from 'zustand';
import { AppStore, ToolState } from '../types';
import { DefectType } from '../../types';

export interface ToolSlice {
  tool: ToolState;
  setCurrentTool: (tool: ToolState['currentTool']) => void;
  setDefectType: (type: DefectType | 'none') => void;
  setSeverity: (severity: number) => void;
  toggleGrid: () => void;
  toggleDimensions: () => void;
  toggleSnap: () => void;
}

export const createToolSlice: StateCreator<
  AppStore,
  [],
  [],
  ToolSlice
> = (set) => ({
  tool: {
    currentTool: 'select',
    selectedDefect: 'none',
    selectedSeverity: 1,
    showGrid: true,
    showDimensions: true,
    snapToGrid: true
  },
  
  setCurrentTool: (tool) =>
    set((state) => ({
      tool: { ...state.tool, currentTool: tool }
    })),
  
  setDefectType: (type) =>
    set((state) => ({
      tool: { ...state.tool, selectedDefect: type }
    })),
  
  setSeverity: (severity) =>
    set((state) => ({
      tool: { ...state.tool, selectedSeverity: severity }
    })),
  
  toggleGrid: () =>
    set((state) => ({
      tool: { ...state.tool, showGrid: !state.tool.showGrid }
    })),
  
  toggleDimensions: () =>
    set((state) => ({
      tool: { ...state.tool, showDimensions: !state.tool.showDimensions }
    })),
  
  toggleSnap: () =>
    set((state) => ({
      tool: { ...state.tool, snapToGrid: !state.tool.snapToGrid }
    }))
});