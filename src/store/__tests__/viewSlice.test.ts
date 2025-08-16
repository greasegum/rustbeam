import { describe, it, expect, beforeEach } from 'vitest';
import { create } from 'zustand';
import { createViewSlice } from '../slices/viewSlice';

// Create a test store with just the view slice
const createTestStore = () => {
  return create((set, get) => ({
    ...createViewSlice(set, get, {} as any)
  })) as any;
};

describe('ViewSlice', () => {
  let store: ReturnType<typeof createTestStore>;

  beforeEach(() => {
    store = createTestStore();
  });

  describe('Initial State', () => {
    it('should have default view state', () => {
      const state = store.getState();
      expect(state.view.zoom).toBe(1);
      expect(state.view.panX).toBe(0);
      expect(state.view.panY).toBe(0);
      expect(state.view.rotation).toBe(0);
    });
  });

  describe('setZoom', () => {
    it('should update zoom level', () => {
      store.getState().setZoom(2);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(2);
    });

    it('should enforce minimum zoom of 0.1', () => {
      store.getState().setZoom(0.05);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(0.1);
    });

    it('should enforce maximum zoom of 5', () => {
      store.getState().setZoom(10);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(5);
    });

    it('should allow zoom within valid range', () => {
      store.getState().setZoom(3.5);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(3.5);
    });
  });

  describe('setPan', () => {
    it('should update pan position', () => {
      store.getState().setPan(100, 200);
      
      const state = store.getState();
      expect(state.view.panX).toBe(100);
      expect(state.view.panY).toBe(200);
    });

    it('should allow negative pan values', () => {
      store.getState().setPan(-50, -75);
      
      const state = store.getState();
      expect(state.view.panX).toBe(-50);
      expect(state.view.panY).toBe(-75);
    });

    it('should allow zero pan values', () => {
      store.getState().setPan(0, 0);
      
      const state = store.getState();
      expect(state.view.panX).toBe(0);
      expect(state.view.panY).toBe(0);
    });
  });

  describe('setRotation', () => {
    it('should update rotation', () => {
      store.getState().setRotation(45);
      
      const state = store.getState();
      expect(state.view.rotation).toBe(45);
    });

    it('should handle rotation modulo 360', () => {
      store.getState().setRotation(370);
      
      const state = store.getState();
      expect(state.view.rotation).toBe(10); // 370 % 360 = 10
    });

    it('should handle negative rotation', () => {
      store.getState().setRotation(-45);
      
      const state = store.getState();
      expect(state.view.rotation).toBe(-45);
    });

    it('should handle large negative rotation', () => {
      store.getState().setRotation(-370);
      
      const state = store.getState();
      expect(state.view.rotation).toBe(-10); // -370 % 360 = -10
    });
  });

  describe('Zoom and Pan Integration', () => {
    it('should maintain separate zoom and pan states', () => {
      store.getState().setZoom(2.5);
      store.getState().setPan(150, 300);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(2.5);
      expect(state.view.panX).toBe(150);
      expect(state.view.panY).toBe(300);
    });

    it('should allow multiple updates', () => {
      store.getState().setZoom(1.5);
      store.getState().setPan(50, 100);
      store.getState().setRotation(90);
      store.getState().setZoom(3.0);
      
      const state = store.getState();
      expect(state.view.zoom).toBe(3.0);
      expect(state.view.panX).toBe(50);
      expect(state.view.panY).toBe(100);
      expect(state.view.rotation).toBe(90);
    });
  });
}); 