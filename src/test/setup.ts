import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Phaser for tests
vi.mock('phaser', () => ({
  default: {
    Game: vi.fn(),
    Scene: class MockScene {
      add = {
        container: vi.fn(() => ({ add: vi.fn(), removeAll: vi.fn() })),
        rectangle: vi.fn(() => ({ 
          setStrokeStyle: vi.fn(), 
          setData: vi.fn(), 
          setInteractive: vi.fn(),
          on: vi.fn()
        })),
        line: vi.fn(() => ({ setLineWidth: vi.fn() })),
        polygon: vi.fn(() => ({ setStrokeStyle: vi.fn() })),
        text: vi.fn(() => ({ setOrigin: vi.fn() })),
        triangle: vi.fn(() => ({ setStrokeStyle: vi.fn() }))
      };
      cameras = {
        main: {
          setBackgroundColor: vi.fn(),
          setZoom: vi.fn(),
          scrollX: 0,
          scrollY: 0,
          zoom: 1
        }
      };
      input = {
        on: vi.fn(),
        keyboard: {
          on: vi.fn()
        }
      };
    },
    Scale: {
      FIT: 'FIT'
    },
    AUTO: 'AUTO',
    CANVAS: 'CANVAS'
  }
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})); 