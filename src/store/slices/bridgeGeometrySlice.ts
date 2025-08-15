import { StateCreator } from 'zustand';
import { AppStore } from '../types';
import { BeamProfile } from '../../types';
import { getBeamById } from '../../data/beamCatalog';

// Unified bridge geometry state that includes beam, bearings, and abutments
export interface BridgeGeometry {
  // Beam properties
  profile: BeamProfile | null;
  length: number;
  units: 'imperial' | 'metric';
  
  // Bearing configuration
  bearings: {
    left: {
      distance: number;    // Distance from beam end
      plates: {
        lower: { width: number; length: number; thickness: number };
        upper: { width: number; length: number; thickness: number };
      };
    };
    right: {
      distance: number;    // Distance from beam end  
      plates: {
        lower: { width: number; length: number; thickness: number };
        upper: { width: number; length: number; thickness: number };
      };
    };
  };
  
  // Abutment configuration
  abutments: {
    left: {
      height: number;
      backwallClearance: number;
      seatWidth: number;      // DERIVED from other parameters
      chamfer: number;        // Step-back distance for upper portion
    };
    right: {
      height: number;
      backwallClearance: number;
      seatWidth: number;      // DERIVED from other parameters  
      chamfer: number;        // Step-back distance for upper portion
    };
  };
  
  // Global geometric constraints
  constraints: {
    breastwallDistance: number;  // Clear span between facing breastwalls
    minimumClearance: number;    // Minimum clearance requirements
  };
}

// Helper functions for derived calculations
const computeSeatWidth = (
  beamLength: number, 
  backwallClearance: number, 
  breastwallDistance: number
): number => {
  return (beamLength + 2 * backwallClearance - breastwallDistance) / 2;
};

const computeBearingPlateSize = (profile: BeamProfile | null) => {
  if (!profile) return { width: 8, length: 8, thickness: 1 };
  
  return {
    // Size plates relative to flange dimensions with minimum sizes
    width: Math.max(profile.flangeWidth + 2, 8),
    length: Math.max(profile.flangeWidth + 2, 8), 
    thickness: Math.max(profile.flangeThickness * 1.5, 1)
  };
};

export interface BridgeGeometrySlice {
  bridgeGeometry: BridgeGeometry;
  
  // Beam operations
  setBeamProfile: (profile: BeamProfile) => void;
  setBeamLength: (length: number) => void;
  setBeamUnits: (units: 'imperial' | 'metric') => void;
  
  // Bearing operations  
  setBearingDistance: (side: 'left' | 'right', distance: number) => void;
  setBearingPlates: (side: 'left' | 'right', plates: BridgeGeometry['bearings']['left']['plates']) => void;
  
  // Abutment operations
  setAbutmentHeight: (side: 'left' | 'right', height: number) => void;
  setBackwallClearance: (side: 'left' | 'right', clearance: number) => void;
  setAbutmentChamfer: (side: 'left' | 'right', chamfer: number) => void;
  
  // Constraint operations
  setBreastwallDistance: (distance: number) => void;
  setMinimumClearance: (clearance: number) => void;
  
  // Bulk operations
  setBridgeGeometry: (geometry: Partial<BridgeGeometry>) => void;
  resetBridgeGeometry: () => void;
}

// Default bridge geometry state
const createDefaultBridgeGeometry = (): BridgeGeometry => {
  const defaultProfile = getBeamById('W12X26');
  const defaultPlateSize = computeBearingPlateSize(defaultProfile);
  
  return {
    profile: defaultProfile,
    length: 240,
    units: 'imperial',
    
    bearings: {
      left: {
        distance: 12,
        plates: {
          lower: defaultPlateSize,
          upper: defaultPlateSize
        }
      },
      right: {
        distance: 12,
        plates: {
          lower: defaultPlateSize,
          upper: defaultPlateSize
        }
      }
    },
    
    abutments: {
      left: {
        height: 24,
        backwallClearance: 2,
        seatWidth: 22, // Will be recalculated
        chamfer: 4
      },
      right: {
        height: 24,
        backwallClearance: 2,
        seatWidth: 22, // Will be recalculated
        chamfer: 4
      }
    },
    
    constraints: {
      breastwallDistance: 200,
      minimumClearance: 1
    }
  };
};

export const createBridgeGeometrySlice: StateCreator<
  AppStore,
  [],
  [],
  BridgeGeometrySlice
> = (set, get) => ({
  bridgeGeometry: createDefaultBridgeGeometry(),
  
  setBeamProfile: (profile) =>
    set((state) => {
      const newPlateSize = computeBearingPlateSize(profile);
      const geometry = state.bridgeGeometry;
      
      // Update grid when beam changes (if grid exists in store)
      const grid = state.grid;
      const newRows = Math.ceil(profile.depth / grid.size);
      const newCols = Math.ceil(geometry.length / grid.size);
      
      return {
        bridgeGeometry: {
          ...geometry,
          profile,
          bearings: {
            left: {
              ...geometry.bearings.left,
              plates: {
                lower: newPlateSize,
                upper: newPlateSize
              }
            },
            right: {
              ...geometry.bearings.right,
              plates: {
                lower: newPlateSize,
                upper: newPlateSize
              }
            }
          }
        },
        grid: { ...grid, rows: newRows, cols: newCols },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  setBeamLength: (length) =>
    set((state) => {
      const geometry = state.bridgeGeometry;
      
      // Recalculate seat widths with new length
      const leftSeatWidth = computeSeatWidth(
        length, 
        geometry.abutments.left.backwallClearance, 
        geometry.constraints.breastwallDistance
      );
      const rightSeatWidth = computeSeatWidth(
        length,
        geometry.abutments.right.backwallClearance,
        geometry.constraints.breastwallDistance
      );
      
      // Update grid columns
      const grid = state.grid;
      const newCols = Math.ceil(length / grid.size);
      
      return {
        bridgeGeometry: {
          ...geometry,
          length,
          abutments: {
            left: { ...geometry.abutments.left, seatWidth: leftSeatWidth },
            right: { ...geometry.abutments.right, seatWidth: rightSeatWidth }
          }
        },
        grid: { ...grid, cols: newCols },
        project: {
          ...state.project,
          modifiedAt: new Date().toISOString()
        }
      };
    }),
  
  setBeamUnits: (units) =>
    set((state) => ({
      bridgeGeometry: { ...state.bridgeGeometry, units },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setBearingDistance: (side, distance) =>
    set((state) => ({
      bridgeGeometry: {
        ...state.bridgeGeometry,
        bearings: {
          ...state.bridgeGeometry.bearings,
          [side]: {
            ...state.bridgeGeometry.bearings[side],
            distance
          }
        }
      },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setBearingPlates: (side, plates) =>
    set((state) => ({
      bridgeGeometry: {
        ...state.bridgeGeometry,
        bearings: {
          ...state.bridgeGeometry.bearings,
          [side]: {
            ...state.bridgeGeometry.bearings[side],
            plates
          }
        }
      },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setAbutmentHeight: (side, height) =>
    set((state) => ({
      bridgeGeometry: {
        ...state.bridgeGeometry,
        abutments: {
          ...state.bridgeGeometry.abutments,
          [side]: {
            ...state.bridgeGeometry.abutments[side],
            height
          }
        }
      },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setBackwallClearance: (side, clearance) =>
    set((state) => {
      const geometry = state.bridgeGeometry;
      
      // Recalculate seat width for this side
      const seatWidth = computeSeatWidth(
        geometry.length,
        clearance,
        geometry.constraints.breastwallDistance
      );
      
      return {
        bridgeGeometry: {
          ...geometry,
          abutments: {
            ...geometry.abutments,
            [side]: {
              ...geometry.abutments[side],
              backwallClearance: clearance,
              seatWidth
            }
          }
        },
        project: { ...state.project, modifiedAt: new Date().toISOString() }
      };
    }),
  
  setAbutmentChamfer: (side, chamfer) =>
    set((state) => ({
      bridgeGeometry: {
        ...state.bridgeGeometry,
        abutments: {
          ...state.bridgeGeometry.abutments,
          [side]: {
            ...state.bridgeGeometry.abutments[side],
            chamfer
          }
        }
      },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setBreastwallDistance: (distance) =>
    set((state) => {
      const geometry = state.bridgeGeometry;
      
      // Recalculate both seat widths
      const leftSeatWidth = computeSeatWidth(
        geometry.length,
        geometry.abutments.left.backwallClearance,
        distance
      );
      const rightSeatWidth = computeSeatWidth(
        geometry.length,
        geometry.abutments.right.backwallClearance,
        distance
      );
      
      return {
        bridgeGeometry: {
          ...geometry,
          constraints: { ...geometry.constraints, breastwallDistance: distance },
          abutments: {
            left: { ...geometry.abutments.left, seatWidth: leftSeatWidth },
            right: { ...geometry.abutments.right, seatWidth: rightSeatWidth }
          }
        },
        project: { ...state.project, modifiedAt: new Date().toISOString() }
      };
    }),
  
  setMinimumClearance: (clearance) =>
    set((state) => ({
      bridgeGeometry: {
        ...state.bridgeGeometry,
        constraints: { ...state.bridgeGeometry.constraints, minimumClearance: clearance }
      },
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    })),
  
  setBridgeGeometry: (geometry) =>
    set((state) => {
      const newGeometry = { ...state.bridgeGeometry, ...geometry };
      
      // Ensure seat widths are recalculated if relevant parameters changed
      if (geometry.length || geometry.constraints?.breastwallDistance || 
          geometry.abutments?.left?.backwallClearance || geometry.abutments?.right?.backwallClearance) {
        
        const leftSeatWidth = computeSeatWidth(
          newGeometry.length,
          newGeometry.abutments.left.backwallClearance,
          newGeometry.constraints.breastwallDistance
        );
        const rightSeatWidth = computeSeatWidth(
          newGeometry.length,
          newGeometry.abutments.right.backwallClearance,
          newGeometry.constraints.breastwallDistance
        );
        
        newGeometry.abutments.left.seatWidth = leftSeatWidth;
        newGeometry.abutments.right.seatWidth = rightSeatWidth;
      }
      
      return {
        bridgeGeometry: newGeometry,
        project: { ...state.project, modifiedAt: new Date().toISOString() }
      };
    }),
  
  resetBridgeGeometry: () =>
    set((state) => ({
      bridgeGeometry: createDefaultBridgeGeometry(),
      project: { ...state.project, modifiedAt: new Date().toISOString() }
    }))
});