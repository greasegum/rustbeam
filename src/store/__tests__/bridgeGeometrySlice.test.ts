import { describe, it, expect } from 'vitest';
import { BEAM_CATALOG } from '../../data/beamCatalog';

// Test the beam catalog data
describe('Beam Catalog', () => {
  it('should have W12X26 as default profile', () => {
    const w12x26 = BEAM_CATALOG.find(b => b.id === 'W12X26');
    expect(w12x26).toBeDefined();
    expect(w12x26?.depth).toBe(12.22);
    expect(w12x26?.flangeWidth).toBe(6.49);
  });

  it('should have multiple beam profiles', () => {
    expect(BEAM_CATALOG.length).toBeGreaterThan(5);
  });

  it('should have valid dimensions for all profiles', () => {
    BEAM_CATALOG.forEach(profile => {
      expect(profile.depth).toBeGreaterThan(0);
      expect(profile.flangeWidth).toBeGreaterThan(0);
      expect(profile.flangeThickness).toBeGreaterThan(0);
      expect(profile.webThickness).toBeGreaterThan(0);
    });
  });
});

// Test seat width calculation logic
describe('Seat Width Calculation', () => {
  const calculateSeatWidth = (length: number, backwallClearance: number, breastwallDistance: number): number => {
    return Math.max((length + 2 * backwallClearance - breastwallDistance) / 2, 6);
  };

  it('should calculate correct seat width for default values', () => {
    const length = 240; // 20 feet
    const backwallClearance = 2;
    const breastwallDistance = 200;
    
    const seatWidth = calculateSeatWidth(length, backwallClearance, breastwallDistance);
    expect(seatWidth).toBe(22); // (240 + 2*2 - 200) / 2 = 22
  });

  it('should enforce minimum seat width', () => {
    const length = 240;
    const backwallClearance = 2;
    const breastwallDistance = 235; // Very close to beam length
    
    const seatWidth = calculateSeatWidth(length, backwallClearance, breastwallDistance);
    expect(seatWidth).toBe(6); // Should be minimum 6 inches
  });

  it('should handle different beam lengths', () => {
    const length = 300; // 25 feet
    const backwallClearance = 3;
    const breastwallDistance = 250;
    
    const seatWidth = calculateSeatWidth(length, backwallClearance, breastwallDistance);
    expect(seatWidth).toBe(28); // (300 + 2*3 - 250) / 2 = 28
  });
});

// Test bearing plate size calculation
describe('Bearing Plate Size Calculation', () => {
  const calculateBearingPlateSize = (profile: any) => {
    if (!profile) return { width: 8, length: 8, thickness: 1 };
    
    const minWidth = Math.max(profile.flangeWidth + 2, 8);
    const minLength = Math.max(profile.flangeWidth + 2, 8);
    
    return {
      width: minWidth,
      length: minLength,
      thickness: 1
    };
  };

  it('should calculate bearing plate size for W12X26', () => {
    const w12x26 = BEAM_CATALOG.find(b => b.id === 'W12X26')!;
    const plateSize = calculateBearingPlateSize(w12x26);
    
    expect(plateSize.width).toBeGreaterThanOrEqual(w12x26.flangeWidth + 2);
    expect(plateSize.length).toBeGreaterThanOrEqual(w12x26.flangeWidth + 2);
    expect(plateSize.thickness).toBe(1);
  });

  it('should handle null profile gracefully', () => {
    const plateSize = calculateBearingPlateSize(null);
    expect(plateSize).toEqual({ width: 8, length: 8, thickness: 1 });
  });
}); 