import { BeamProfile, DefectType, Annotation } from '../types';

export interface ProjectMetadata {
  id: string;
  name: string;
  beamId?: string;
  inspector?: string;
  description?: string;
  createdAt: string;
  modifiedAt: string;
  version: string;
}

export interface BeamState {
  profile: BeamProfile | null;
  length: number;
  leftBearing: number;
  rightBearing: number;
  leftAbutmentHeight: number;
  rightAbutmentHeight: number;
  backwallClearance: number;
  breastwallDistance: number;  // Distance between facing brestwalls (clear span)
  seatWidth: number;           // Width of bearing seat (breastwall to backwall)
  units: 'imperial' | 'metric';
}

export interface GridState {
  size: number;
  rows: number;
  cols: number;
  cells: Map<string, CellState>;
}

export interface CellState {
  key: string; // "row,col"
  row: number;
  col: number;
  defectType?: DefectType;
  severity?: number;
  notes?: string;
}

export interface ToolState {
  currentTool: 'select' | 'mark' | 'annotate' | 'measure';
  selectedDefect: DefectType | 'none';
  selectedSeverity: number;
  showGrid: boolean;
  showDimensions: boolean;
  snapToGrid: boolean;
}

export interface AnnotationState {
  annotations: Map<string, Annotation>;
  selectedAnnotation: string | null;
}

export interface ViewState {
  zoom: number;
  panX: number;
  panY: number;
  rotation: number;
}

export interface AppStore {
  // Project
  project: ProjectMetadata;
  setProjectMetadata: (metadata: Partial<ProjectMetadata>) => void;
  
  // Beam
  beam: BeamState;
  setBeamProfile: (profile: BeamProfile) => void;
  setBeamDimensions: (dims: Partial<BeamState>) => void;
  
  // Grid
  grid: GridState;
  setGridSize: (size: number) => void;
  markCell: (row: number, col: number, defect?: DefectType, severity?: number) => void;
  clearCell: (row: number, col: number) => void;
  clearAllCells: () => void;
  
  // Tools
  tool: ToolState;
  setCurrentTool: (tool: ToolState['currentTool']) => void;
  setDefectType: (type: DefectType | 'none') => void;
  setSeverity: (severity: number) => void;
  toggleGrid: () => void;
  toggleDimensions: () => void;
  toggleSnap: () => void;
  
  // Annotations
  annotations: AnnotationState;
  addAnnotation: (annotation: Annotation) => void;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  removeAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  
  // View
  view: ViewState;
  setZoom: (zoom: number) => void;
  setPan: (x: number, y: number) => void;
  setRotation: (rotation: number) => void;
  
  // Persistence
  exportToXML: () => string;
  importFromXML: (xml: string) => void;
  reset: () => void;
}