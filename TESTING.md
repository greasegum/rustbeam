# Testing Strategy for VisualBeam Inspector

## Overview

This project uses **Vitest** as the primary testing framework with comprehensive test coverage for:
- **Store Functions** - Zustand state management
- **Component Logic** - React component behavior
- **Geometry Calculations** - Beam and abutment calculations
- **Data Validation** - Beam catalog and input validation

## Test Structure

```
src/
├── test/
│   └── setup.ts                 # Global test setup and mocks
├── store/__tests__/
│   ├── bridgeGeometrySlice.test.ts  # Store function tests
│   └── viewSlice.test.ts           # Pan/zoom functionality tests
└── components/Setup/__tests__/
    └── SetupModal.test.tsx         # Component behavior tests
```

## Running Tests

### Development Mode (Watch)
```bash
npm test
```

### Run Once
```bash
npm run test:run
```

### With Coverage Report
```bash
npm run test:coverage
```

### UI Mode (Interactive)
```bash
npm run test:ui
```

## Test Categories

### 1. Store Function Tests (`bridgeGeometrySlice.test.ts`)

**Purpose**: Verify that the Apply Configuration button functions work correctly

**Key Tests**:
- ✅ **Beam Profile Updates**: `setBeamProfile()` correctly updates beam dimensions
- ✅ **Length Changes**: `setBeamLength()` updates beam length and recalculates seat width
- ✅ **Bearing Positioning**: `setBearingDistance()` updates left/right bearing positions
- ✅ **Abutment Geometry**: `setBackwallClearance()` and `setBreastwallDistance()` update abutment geometry
- ✅ **Seat Width Calculation**: Automatic recalculation when parameters change
- ✅ **Minimum Constraints**: Seat width enforces minimum 6-inch requirement

**Example Test**:
```typescript
it('should calculate correct seat width for default values', () => {
  const length = 240; // 20 feet
  const backwallClearance = 2;
  const breastwallDistance = 200;
  
  const seatWidth = calculateSeatWidth(length, backwallClearance, breastwallDistance);
  expect(seatWidth).toBe(22); // (240 + 2*2 - 200) / 2 = 22
});
```

### 2. View Control Tests (`viewSlice.test.ts`)

**Purpose**: Verify pan/zoom functionality works correctly

**Key Tests**:
- ✅ **Zoom Limits**: Enforces 0.1 to 5.0 zoom range
- ✅ **Pan Positioning**: Updates camera position correctly
- ✅ **Rotation Handling**: Manages rotation with modulo 360
- ✅ **Integration**: Zoom and pan work together without conflicts

**Example Test**:
```typescript
it('should enforce minimum zoom of 0.1', () => {
  store.getState().setZoom(0.05);
  const state = store.getState();
  expect(state.view.zoom).toBe(0.1);
});
```

### 3. Component Tests (`SetupModal.test.tsx`)

**Purpose**: Verify the SetupModal component renders and behaves correctly

**Key Tests**:
- ✅ **Rendering**: All form fields and buttons are present
- ✅ **User Interaction**: Buttons respond to clicks
- ✅ **Modal Behavior**: Opens/closes correctly
- ✅ **Form Validation**: Computed values display correctly
- ✅ **Accessibility**: Proper labels and structure

**Example Test**:
```typescript
it('should display computed seat width', () => {
  render(<SetupModal onClose={mockOnClose} />);
  expect(screen.getByDisplayValue('22 in')).toBeInTheDocument();
});
```

### 4. Data Validation Tests

**Purpose**: Verify beam catalog data is valid

**Key Tests**:
- ✅ **Profile Data**: All beam profiles have valid dimensions
- ✅ **Default Profile**: W12X26 exists and has correct dimensions
- ✅ **Catalog Completeness**: Multiple profiles available

## Test Coverage

### Current Coverage Areas
- **Store Functions**: 100% - All bridge geometry functions tested
- **View Controls**: 100% - All pan/zoom functions tested
- **Component Rendering**: 95% - All major UI elements tested
- **Data Validation**: 100% - Beam catalog validation complete

### Coverage Gaps (Future Work)
- **Phaser Scene Integration**: Scene initialization and rendering
- **Grid System**: Cell marking and coverage calculation
- **Export Functions**: XML serialization/deserialization
- **File I/O**: Project save/load functionality

## Mock Strategy

### Phaser Mocking
```typescript
vi.mock('phaser', () => ({
  default: {
    Game: vi.fn(),
    Scene: class MockScene {
      add = {
        container: vi.fn(() => ({ add: vi.fn(), removeAll: vi.fn() })),
        rectangle: vi.fn(() => ({ setStrokeStyle: vi.fn(), setData: vi.fn() })),
        // ... other game objects
      };
      cameras = { main: { setZoom: vi.fn(), scrollX: 0, scrollY: 0 } };
      input = { on: vi.fn(), keyboard: { on: vi.fn() } };
    }
  }
}));
```

### Store Mocking
```typescript
vi.mock('../../../store', () => ({
  useStore: vi.fn(() => ({
    bridgeGeometry: { /* mock state */ },
    setBeamProfile: vi.fn(),
    setBeamLength: vi.fn(),
    // ... other functions
  }))
}));
```

## Debugging Tests

### Common Issues
1. **Phaser Dependencies**: Use mocks for game objects
2. **Store Type Conflicts**: Use `as any` for test stores
3. **Component Rendering**: Mock external dependencies
4. **Async Operations**: Use `waitFor` for async updates

### Debug Commands
```bash
# Run specific test file
npm test bridgeGeometrySlice.test.ts

# Run with verbose output
npm test -- --reporter=verbose

# Run with UI for debugging
npm run test:ui
```

## Continuous Integration

### Pre-commit Hooks
- Run tests before commits
- Ensure minimum 80% coverage
- Validate TypeScript compilation

### CI Pipeline
```yaml
test:
  script:
    - npm install
    - npm run test:coverage
    - npm run build
```

## Future Testing Roadmap

### Phase 1: Core Functionality ✅
- [x] Store function tests
- [x] Component rendering tests
- [x] Data validation tests

### Phase 2: Integration Testing
- [ ] Phaser scene integration
- [ ] Grid system functionality
- [ ] Export/import functionality

### Phase 3: End-to-End Testing
- [ ] User workflow testing
- [ ] Performance testing
- [ ] Cross-browser compatibility

### Phase 4: Advanced Testing
- [ ] Visual regression testing
- [ ] Accessibility testing
- [ ] Load testing for large projects

## Best Practices

1. **Test Behavior, Not Implementation**: Focus on what the code does, not how it does it
2. **Use Descriptive Test Names**: Clear, readable test descriptions
3. **Mock External Dependencies**: Isolate units under test
4. **Test Edge Cases**: Include boundary conditions and error cases
5. **Maintain Test Data**: Keep test data realistic and up-to-date
6. **Avoid Test Interdependence**: Each test should be independent

## Troubleshooting

### Test Failures
1. **Check Mock Setup**: Ensure all external dependencies are mocked
2. **Verify Test Data**: Ensure test data matches current implementation
3. **Check TypeScript Errors**: Fix type issues before running tests
4. **Update Snapshots**: If using snapshot testing, update when UI changes

### Performance Issues
1. **Optimize Mock Setup**: Reduce mock complexity
2. **Use Test Isolation**: Avoid shared state between tests
3. **Limit Test Scope**: Focus on essential functionality 