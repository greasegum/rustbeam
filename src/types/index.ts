export interface BeamProfile {
  id: string;
  depth: number;
  weight: number;
  webThickness: number;
  flangeWidth: number;
  flangeThickness: number;
  area: number;
  momentOfInertia: number;
}

export interface GridCell {
  row: number;
  col: number;
  x: number;
  y: number;
  width: number;
  height: number;
  defectType?: DefectType;
  severity?: number;
}

export type DefectType = 'corrosion' | 'crack' | 'deformation' | 'missing';

export interface BeamConfiguration {
  profile: BeamProfile;
  length: number;
  leftBearing: number;
  rightBearing: number;
  gridSize: number;
  showDimensions: boolean;
  units: 'imperial' | 'metric';
}

export interface AppState {
  config: BeamConfiguration;
  selectedTool: 'select' | 'mark' | 'annotate';
  selectedDefect: DefectType | 'none';
  selectedSeverity: number;
  grid: GridCell[][];
  annotations: Annotation[];
}

export interface Annotation {
  id: string;
  x: number;
  y: number;
  text: string;
  type: 'dimension' | 'note' | 'callout';
}