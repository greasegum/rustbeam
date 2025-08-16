import { StateCreator } from 'zustand';
import { AppStore, GridState, CellState } from '../types';
import { DefectType } from '../../types';

export interface GridSlice {
  grid: GridState;
  setGridSize: (size: number) => void;
  markCell: (row: number, col: number, defect?: DefectType, severity?: number) => void;
  clearCell: (row: number, col: number) => void;
  clearAllCells: () => void;
}

export const createGridSlice: StateCreator<
  AppStore,
  [],
  [],
  GridSlice
> = (set, get) => ({
  grid: {
    size: 3,
    rows: 4,
    cols: 80,
    cells: new Map()
  },
  
  setGridSize: (size) =>
    set((state) => {
      // FIXED: Use bridgeGeometry instead of old beam state
      const bridgeGeometry = state.bridgeGeometry;
      if (!bridgeGeometry.profile) return state;
      
      const newRows = Math.ceil(bridgeGeometry.profile.depth / size);
      const newCols = Math.ceil(bridgeGeometry.length / size);
      
      // Remap cells to new grid
      const newCells = new Map<string, CellState>();
      state.grid.cells.forEach((cell) => {
        // Calculate position in new grid
        const oldY = cell.row * state.grid.size;
        const oldX = cell.col * state.grid.size;
        const newRow = Math.floor(oldY / size);
        const newCol = Math.floor(oldX / size);
        const newKey = `${newRow},${newCol}`;
        
        // Merge if cell already exists
        const existing = newCells.get(newKey);
        if (!existing || (cell.severity && (!existing.severity || cell.severity > existing.severity))) {
          newCells.set(newKey, {
            ...cell,
            key: newKey,
            row: newRow,
            col: newCol
          });
        }
      });
      
      return {
        grid: {
          size,
          rows: newRows,
          cols: newCols,
          cells: newCells
        },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  markCell: (row, col, defect, severity) =>
    set((state) => {
      const key = `${row},${col}`;
      const cells = new Map(state.grid.cells);
      
      if (!defect) {
        cells.delete(key);
      } else {
        cells.set(key, {
          key,
          row,
          col,
          defectType: defect,
          severity: severity || 1
        });
      }
      
      return {
        grid: { ...state.grid, cells },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  clearCell: (row, col) =>
    set((state) => {
      const key = `${row},${col}`;
      const cells = new Map(state.grid.cells);
      cells.delete(key);
      
      return {
        grid: { ...state.grid, cells },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  clearAllCells: () =>
    set((state) => ({
      grid: { ...state.grid, cells: new Map() },
      project: {
        ...state.project,
        modifiedAt: new Date().toISOString()
      }
    }))
});