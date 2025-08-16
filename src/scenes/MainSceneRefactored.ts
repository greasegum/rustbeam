import Phaser from 'phaser';
import { useStore } from '../store';
import { DefectType } from '../types';

export class MainSceneRefactored extends Phaser.Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  private beamContainer!: Phaser.GameObjects.Container;
  private gridRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private isDragging = false;
  private isPanning = false;
  private lastPointer?: Phaser.Math.Vector2;
  private unsubscribe?: () => void;
  private readonly SCALE = 10; // pixels per inch - consistent scaling factor
  private isSceneReady = false; // Track if scene is fully initialized
  private isInitializing = true; // Track if we're in initial setup phase
  
  constructor() {
    super({ key: 'MainSceneRefactored' });
  }

  create() {
    console.log('🎬 MainScene create() called');
    this.cameras.main.setBackgroundColor('#f8f8f8');
    
    // Create containers with proper z-order
    this.beamContainer = this.add.container(0, 0);
    this.gridContainer = this.add.container(0, 0);
    
    console.log('📦 Containers created with proper z-order');
    
    // Set up input handlers first
    this.setupInputHandlers();
    
    // Center camera on beam
    this.centerCamera();
    
    // Mark scene as ready AFTER everything is set up
    this.isSceneReady = true;
    console.log('✅ Scene marked as ready');
    
    // Add delay before initial sync to ensure everything is properly initialized
    this.time.delayedCall(200, () => {
      console.log('🔄 Delayed sync starting...');
      
      this.syncWithStore();
      
      // Subscribe to store changes AFTER sync is complete
      this.subscribeToStore();
      
      // Mark initialization as complete after sync
      this.isInitializing = false;
      console.log('✅ Initialization complete, store updates enabled');
    });
  }

  private subscribeToStore() {
    // Subscribe to store changes
    this.unsubscribe = useStore.subscribe((state, prevState) => {
      // Comprehensive safety check: don't process updates until scene is fully ready and not initializing
      if (!this.isSceneReady || this.isInitializing || !this.add || !this.beamContainer || !this.gridContainer) {
        console.log('⚠️ Store update received but scene not ready or initializing, skipping...', {
          isSceneReady: this.isSceneReady,
          isInitializing: this.isInitializing,
          hasAdd: !!this.add,
          hasBeamContainer: !!this.beamContainer,
          hasGridContainer: !!this.gridContainer
        });
        return;
      }
      
      console.log('🔄 Store subscription triggered');
      
      // Check what changed and update accordingly
      if (state.bridgeGeometry !== prevState.bridgeGeometry || 
          state.grid.size !== prevState.grid.size) {
        console.log('🔄 Bridge geometry or grid size changed, redrawing');
        console.log('📊 Bridge geometry:', state.bridgeGeometry);
        console.log('📐 Grid:', state.grid);
        this.createGrid();
        this.drawBeam();
      } else if (state.grid.cells !== prevState.grid.cells) {
        console.log('🔄 Grid cells changed, updating visuals');
        this.updateGridVisuals();
      }
      
      if (state.tool.showGrid !== prevState.tool.showGrid) {
        console.log('🔄 Grid visibility changed');
        this.gridContainer.setVisible(state.tool.showGrid);
      }
      
      if (state.tool.showDimensions !== prevState.tool.showDimensions) {
        console.log('🔄 Dimensions visibility changed');
        this.drawBeam();
      }
      
      if (state.view !== prevState.view) {
        console.log('🔄 View changed - zoom:', state.view.zoom, 'pan:', state.view.panX, state.view.panY);
        console.log('🔄 Previous view - zoom:', prevState.view.zoom, 'pan:', prevState.view.panX, prevState.view.panY);
        this.updateCamera();
      }
    });
  }

  private syncWithStore() {
    // Safety check: ensure scene is ready
    if (!this.isSceneReady || !this.add || !this.beamContainer || !this.gridContainer) {
      console.log('⚠️ Scene not ready for sync, skipping...', {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasBeamContainer: !!this.beamContainer,
        hasGridContainer: !!this.gridContainer
      });
      return;
    }
    
    console.log('🔄 syncWithStore() called');
    const state = useStore.getState();
    
    // Temporarily disable store subscription during sync to prevent loops
    const wasInitializing = this.isInitializing;
    this.isInitializing = true;
    
    // Draw essential geometry only
    this.drawBeam();
    
    // Update camera
    this.updateCamera();
    
    // Restore initialization state
    this.isInitializing = wasInitializing;
    
    console.log('✅ syncWithStore() completed');
  }

  private createGrid() {
    const { bridgeGeometry, grid } = useStore.getState();
    
    // Comprehensive safety check: ensure scene is fully ready
    if (!this.isSceneReady || !this.add || !this.gridContainer || !this.scene || typeof this.scene !== 'object') {
      console.log('⚠️ Scene not ready for grid creation, skipping...', {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasGridContainer: !!this.gridContainer,
        hasScene: !!this.scene,
        sceneType: typeof this.scene
      });
      return;
    }
    
    // Additional check: ensure we can safely create game objects
    try {
      // Test if we can create a simple object to verify scene is ready
      const testRect = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
      testRect.destroy();
    } catch (error) {
      console.log('⚠️ Cannot create game objects, scene not ready:', error);
      return;
    }
    
    console.log('📐 Grid completely disabled - clean geometry only');
    
    // COMPREHENSIVE CLEANUP - Remove all grid artifacts
    this.gridContainer.removeAll(true);
    this.gridRects.clear();
    this.gridContainer.setVisible(false);
    
    // Ensure no grid elements are created
    console.log('📐 Grid artifacts removed - clean view');
  }

  private drawBeam() {
    const { bridgeGeometry, tool } = useStore.getState();
    
    // Comprehensive safety check: ensure scene is fully ready
    if (!this.isSceneReady || !this.add || !this.beamContainer || !this.scene || typeof this.scene !== 'object') {
      console.log('⚠️ Scene not ready for beam drawing, skipping...', {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasBeamContainer: !!this.beamContainer,
        hasScene: !!this.scene,
        sceneType: typeof this.scene
      });
      return;
    }
    
    // Additional check: ensure we can safely create game objects
    try {
      const testRect = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
      testRect.destroy();
    } catch (error) {
      console.log('⚠️ Cannot create game objects for beam, scene not ready:', error);
      return;
    }
    
    if (!bridgeGeometry.profile) {
      console.log('❌ No beam profile available for drawing');
      return;
    }
    
    const { profile, length } = bridgeGeometry;
    console.log('✅ Drawing essential beam geometry:', profile.id, 'Length:', length);
    
    // Clear containers
    this.beamContainer.removeAll(true);
    this.gridContainer.removeAll(true);
    this.gridContainer.setVisible(false);
    
    // Use consistent scale factor
    const scale = this.SCALE;
    
    // Essential colors only
    const beamColor = 0x4CAF50;
    const strokeColor = 0x2E7D32;
    const abutmentColor = 0x888888;
    const abutmentStroke = 0x666666;
    const upperBearingColor = 0xA8E6CF;
    const lowerBearingColor = 0xFFD3B6;
    const bearingStroke = 0x666666;
    
    // Calculate beam dimensions
    const beamWidth = length * scale;
    const beamHeight = profile.depth * scale;
    const beamLeft = -beamWidth / 2;
    const beamRight = beamWidth / 2;
    const beamTop = -beamHeight / 2;
    const beamBottom = beamHeight / 2;
    
    console.log('📐 Beam dimensions:', { beamWidth, beamHeight, beamLeft, beamRight, beamTop, beamBottom });
    
    // ESSENTIAL GEOMETRY ONLY - No extraneous elements
    
    // 1. Draw main beam body
    const beamBody = this.add.rectangle(0, 0, beamWidth, beamHeight, beamColor);
    beamBody.setStrokeStyle(2, strokeColor);
    this.beamContainer.add(beamBody);
    
    // 2. Draw flange edges
    const flangeThickness = profile.flangeThickness * scale;
    
    // Top flange edge
    const topFlangeEdge = this.add.rectangle(
      0, beamTop + flangeThickness / 2,
      beamWidth, flangeThickness,
      0x2E7D32, 1.0
    );
    topFlangeEdge.setStrokeStyle(2, 0x1B5E20);
    this.beamContainer.add(topFlangeEdge);
    
    // Bottom flange edge
    const bottomFlangeEdge = this.add.rectangle(
      0, beamBottom - flangeThickness / 2,
      beamWidth, flangeThickness,
      0x2E7D32, 1.0
    );
    bottomFlangeEdge.setStrokeStyle(2, 0x1B5E20);
    this.beamContainer.add(bottomFlangeEdge);
    
    // 3. Draw bearings
    const { bearings } = bridgeGeometry;
    const bearingHeight = 8 * scale;
    const bearingWidth = 12 * scale;
    
    const drawBearing = (side: 'left' | 'right') => {
      const bearing = bearings[side];
      const bearingDistanceFromEnd = bearing.distance * scale;
      const x = side === 'left' 
        ? beamLeft + bearingDistanceFromEnd
        : beamRight - bearingDistanceFromEnd;
      
      // Upper bearing plate
      const upperY = beamBottom + bearingHeight / 2;
      const upper = this.add.rectangle(x, upperY, bearingWidth, bearingHeight / 2, upperBearingColor);
      upper.setStrokeStyle(1, bearingStroke);
      this.beamContainer.add(upper);
      
      // Lower bearing plate
      const lowerY = beamBottom + bearingHeight;
      const lower = this.add.rectangle(x, lowerY, bearingWidth, bearingHeight / 2, lowerBearingColor);
      lower.setStrokeStyle(1, bearingStroke);
      this.beamContainer.add(lower);
    };
    
    drawBearing('left');
    drawBearing('right');
    
    // 4. Draw abutments
    const { abutments } = bridgeGeometry;
    const abutmentHeight = 20 * scale;
    const abutmentWidth = 15 * scale;
    const backwallClearance = abutments.left.backwallClearance * scale;
    
    const drawAbutment = (side: 'left' | 'right') => {
      const beamEnd = side === 'left' ? beamLeft : beamRight;
      const abutmentX = side === 'left' 
        ? beamEnd - backwallClearance - abutmentWidth / 2
        : beamEnd + backwallClearance + abutmentWidth / 2;
      
      const abutmentTop = beamTop;
      const stepWidth = abutmentWidth / 3;
      const seatY = beamBottom + bearingHeight * 1.5;
      
      // Calculate step positions
      const backwallX = side === 'left' ? abutmentX - stepWidth : abutmentX + stepWidth;
      const seatX = abutmentX;
      const breastwallX = side === 'left' ? abutmentX + stepWidth : abutmentX - stepWidth;
      
      // Create polyline points
      const polylinePoints = [
        backwallX, abutmentTop,
        seatX, abutmentTop,
        seatX, seatY,
        breastwallX, seatY,
        breastwallX, seatY + stepWidth,
        backwallX, seatY + stepWidth,
        backwallX, abutmentTop
      ];
      
      const abutment = this.add.polygon(0, 0, polylinePoints, abutmentColor, 0.8);
      abutment.setStrokeStyle(1.5, abutmentStroke);
      this.beamContainer.add(abutment);
    };
    
    drawAbutment('left');
    drawAbutment('right');
    
    console.log('✅ Essential beam geometry completed');
  }

  private drawDimensions(scale: number) {
    const { bridgeGeometry } = useStore.getState();
    const { profile, length, bearings, abutments, constraints } = bridgeGeometry;
    if (!profile) return;
    
    // Safety check: ensure scene is ready
    if (!this.isSceneReady || !this.add || !this.beamContainer || !this.scene || typeof this.scene !== 'object') {
      console.log('⚠️ Scene not ready for dimension drawing, skipping...', {
        isSceneReady: this.isSceneReady,
        hasAdd: !!this.add,
        hasBeamContainer: !!this.beamContainer,
        hasScene: !!this.scene,
        sceneType: typeof this.scene
      });
      return;
    }
    
    // Additional check: ensure we can safely create game objects
    try {
      const testRect = this.add.rectangle(0, 0, 1, 1, 0x000000, 0);
      testRect.destroy();
    } catch (error) {
      console.log('⚠️ Cannot create game objects for dimensions, scene not ready:', error);
      return;
    }
    
    const dimColor = 0x4ECDC4;
    const dimTextColor = '#000000';

    // Beam length dimension
    const lengthY = (profile.depth / 2 + 40) * scale;
    const lengthLine = this.add.line(
      0, lengthY,
      -length * scale / 2, lengthY,
      length * scale / 2, lengthY,
      dimColor
    );
    lengthLine.setLineWidth(1);
    this.beamContainer.add(lengthLine);

    // Add arrows
    const arrowSize = 4 * scale;
    const drawArrow = (x: number, y: number, direction: number) => {
      const arrow = this.add.triangle(
        x, y,
        x + direction * arrowSize, y - arrowSize / 2,
        x + direction * arrowSize, y + arrowSize / 2,
        dimColor
      );
      this.beamContainer.add(arrow);
    };
    drawArrow(-length * scale / 2, lengthY, -1);
    drawArrow(length * scale / 2, lengthY, 1);

    const lengthText = this.add.text(
      0, lengthY - 20,
      `${length}"`,
      { fontSize: '14px', color: dimTextColor, align: 'center' }
    );
    lengthText.setOrigin(0.5);
    this.beamContainer.add(lengthText);

    // Span dimension (CL bearing to CL bearing)
    const leftBearingX = (-length / 2 + bearings.left.distance) * scale;
    const rightBearingX = (length / 2 - bearings.right.distance) * scale;
    const spanY = (profile.depth / 2 + 20) * scale;
    const spanLine = this.add.line(0, spanY, leftBearingX, spanY, rightBearingX, spanY, dimColor);
    spanLine.setLineWidth(1);
    this.beamContainer.add(spanLine);
    drawArrow(leftBearingX, spanY, -1);
    drawArrow(rightBearingX, spanY, 1);
    
    const spanLength = length - bearings.left.distance - bearings.right.distance;
    const spanText = this.add.text(
      0, spanY - 20,
      `Span (CL-CL): ${spanLength}"`,
      { fontSize: '12px', color: dimTextColor, align: 'center', fontStyle: 'bold' }
    );
    spanText.setOrigin(0.5);
    this.beamContainer.add(spanText);

    // Abutment dimensions
    const leftBackwallX = -(length / 2 + abutments.left.backwallClearance) * scale;
    const leftBreastwallX = -((length / 2) - (length - constraints.breastwallDistance) / 2) * scale;
    const seatY = (profile.depth / 2 + (bearings.left.plates.lower.thickness + bearings.left.plates.upper.thickness)) * scale;
    
    // Seat width dimension
    const seatWidthY = seatY + 15 * scale;
    const seatLine = this.add.line(
      0, seatWidthY,
      leftBackwallX, seatWidthY,
      leftBreastwallX, seatWidthY,
      0xFFD3B6  // Orange for seat width
    );
    seatLine.setLineWidth(1);
    this.beamContainer.add(seatLine);
    drawArrow(leftBackwallX, seatWidthY, 1);
    drawArrow(leftBreastwallX, seatWidthY, -1);
    
    const seatText = this.add.text(
      (leftBackwallX + leftBreastwallX) / 2, seatWidthY - 15,
      `Seat: ${abutments.left.seatWidth}"`,
      { fontSize: '11px', color: '#FF8B00', align: 'center' }
    );
    seatText.setOrigin(0.5);
    this.beamContainer.add(seatText);
    
    // Backwall clearance dimension
    const backwallY = seatY - 15 * scale;
    const backwallLine = this.add.line(
      0, backwallY,
      leftBackwallX, backwallY,
      -(length / 2) * scale, backwallY,
      0xFFAAA5  // Pink for backwall clearance
    );
    backwallLine.setLineWidth(1);
    this.beamContainer.add(backwallLine);
    drawArrow(leftBackwallX, backwallY, -1);
    drawArrow(-(length / 2) * scale, backwallY, 1);
    
    const backwallText = this.add.text(
      (leftBackwallX - (length / 2) * scale) / 2, backwallY - 15,
      `Clearance: ${abutments.left.backwallClearance}"`,
      { fontSize: '11px', color: '#FF6B6B', align: 'center' }
    );
    backwallText.setOrigin(0.5);
    this.beamContainer.add(backwallText);
    
    // Profile label
    const profileText = this.add.text(
      0, -(profile.depth / 2 + 30) * scale,
      profile.id,
      { fontSize: '16px', color: '#ffff00', fontStyle: 'bold', align: 'center' }
    );
    profileText.setOrigin(0.5);
    this.beamContainer.add(profileText);
  }

  private updateGridVisuals() {
    // Grid visuals disabled - focusing on geometry
    console.log('📐 Grid visuals disabled - clean geometry view');
    return;
    
    // Safety check: ensure scene is ready
    if (!this.isSceneReady) {
      console.log('⚠️ Scene not ready for grid visuals update, skipping...');
      return;
    }
    
    const { grid } = useStore.getState();
    
    // FIXED: Proper Map handling
    if (!(grid.cells instanceof Map)) {
      console.warn('Grid cells is not a Map, skipping update');
      return;
    }
    
    // Update all grid cells
    this.gridRects.forEach((rect, key) => {
      const cell = grid.cells.get(key);
      
      if (cell?.defectType) {
        const color = this.getDefectColor(cell.defectType, cell.severity!);
        rect.setFillStyle(color, 0.5);
      } else {
        rect.setFillStyle(0xffffff, 0.1);
      }
    });
    
    // FIXED: Update coverage calculation
    this.updateCoverage();
  }

  private updateCoverage() {
    const { grid } = useStore.getState();
    
    if (!(grid.cells instanceof Map)) {
      return;
    }
    
    const totalCells = this.gridRects.size;
    const coveredCells = Array.from(grid.cells.values()).filter(cell => cell.defectType).length;
    const coveragePercent = totalCells > 0 ? (coveredCells / totalCells) * 100 : 0;
    
    // Update bottom bar coverage display
    const bottomBar = document.querySelector('.bottom-bar .coverage');
    if (bottomBar) {
      bottomBar.textContent = `Coverage: ${coveragePercent.toFixed(1)}%`;
    }
  }

  private onCellClick(cellRect: Phaser.GameObjects.Rectangle) {
    // Safety check: ensure scene is ready
    if (!this.isSceneReady || !this.scene) {
      console.log('⚠️ Scene not ready for cell click, skipping...');
      return;
    }

    const row = cellRect.getData('row') as number;
    const col = cellRect.getData('col') as number;
    const { tool, markCell, clearCell } = useStore.getState();
    
    console.log('🖱️ Cell clicked:', { row, col, currentTool: tool.currentTool });
    
    if (tool.currentTool === 'mark') {
        if (tool.selectedDefect === 'none') {
        // Clear the cell if no defect is selected
        clearCell(row, col);
        console.log('🧹 Cell cleared:', { row, col });
        } else {
        // Mark the cell with selected defect
        markCell(row, col, tool.selectedDefect, tool.selectedSeverity);
        console.log('🎯 Cell marked:', { row, col, defect: tool.selectedDefect, severity: tool.selectedSeverity });
      }
    }
  }

  private getDefectColor(type: DefectType, severity: number): number {
    const colors: Record<DefectType, number[]> = {
      corrosion: [0xff9900, 0xff6600, 0xff3300, 0xff0000],
      crack: [0x9999ff, 0x6666ff, 0x3333ff, 0x0000ff],
      deformation: [0xffff66, 0xffcc33, 0xff9900, 0xff6600],
      missing: [0x999999, 0x666666, 0x333333, 0x000000]
    };
    
    return colors[type][Math.min(severity - 1, 3)];
  }

  private centerCamera() {
    console.log('📷 Centering camera at (0,0)');
    if (this.cameras.main) {
    this.cameras.main.centerOn(0, 0);
      console.log('📷 Camera centered. Current position:', {
        zoom: this.cameras.main.zoom,
        centerX: this.cameras.main.centerX,
        centerY: this.cameras.main.centerY,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY
      });
    } else {
      console.log('⚠️ Camera not available for centering');
    }
  }

  private updateCamera() {
    // Safety check: ensure scene is ready
    if (!this.isSceneReady) {
      console.log('⚠️ Scene not ready for camera update, skipping...');
      return;
    }

    const { view } = useStore.getState();
    const cam = this.cameras.main;
    
    // Safety check: ensure camera exists
    if (!cam) {
      console.log('⚠️ Camera not available for update, retrying in 50ms...');
      // Retry after a short delay
      this.time.delayedCall(50, () => {
        this.updateCamera();
      });
      return;
    }
    
    console.log('📷 Updating camera - zoom:', view.zoom, 'pan:', view.panX, view.panY);
    console.log('📷 Camera before update - zoom:', cam.zoom, 'scrollX:', cam.scrollX, 'scrollY:', cam.scrollY);
    
    try {
      cam.setZoom(view.zoom);
      
      // Try using centerOn for panning instead of scrollX/scrollY
      const centerX = -view.panX / view.zoom;
      const centerY = -view.panY / view.zoom;
      cam.centerOn(centerX, centerY);
      
      console.log('📷 Camera after update - zoom:', cam.zoom, 'centerX:', centerX, 'centerY:', centerY);
    } catch (error) {
      console.log('⚠️ Error updating camera:', error);
    }
  }

  private setupInputHandlers() {
    console.log('🎮 Setting up input handlers');
    
    // Add global pointer event debugging
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('🖱️ Global pointer down:', pointer.x, pointer.y, 'Right button:', pointer.rightButtonDown(), 'Left button:', pointer.leftButtonDown());
    });
    
    // Pan and zoom handlers - changed to left-click drag on background
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      console.log('🖱️ Pointer down:', pointer.x, pointer.y, 'Right button:', pointer.rightButtonDown(), 'Left button:', pointer.leftButtonDown());
      
      // Simple left-click drag for panning (we'll let the game objects handle their own clicks)
      if (pointer.leftButtonDown() && this.cameras.main) {
        this.isPanning = true;
        this.lastPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        console.log('🔄 Starting pan from world point:', this.lastPointer);
        console.log('🔄 Camera state before pan:', {
          zoom: this.cameras.main.zoom,
          scrollX: this.cameras.main.scrollX,
          scrollY: this.cameras.main.scrollY
        });
      }
    });

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isPanning && this.lastPointer && this.cameras.main) {
        const currentWorldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
        // Fix direction: when mouse moves right, view should move right (positive deltaX)
        const deltaX = currentWorldPoint.x - this.lastPointer.x;
        const deltaY = currentWorldPoint.y - this.lastPointer.y;
        
        // Add speed multiplier to slow down panning
        const panSpeed = 0.5;
        const adjustedDeltaX = deltaX * panSpeed;
        const adjustedDeltaY = deltaY * panSpeed;
        
        console.log('🔄 Panning - delta:', deltaX, deltaY, 'adjusted:', adjustedDeltaX, adjustedDeltaY, 'current world point:', currentWorldPoint);
        
        const { view, setPan } = useStore.getState();
        const newPanX = view.panX - adjustedDeltaX; // Fix direction: subtract to move view in same direction as mouse
        const newPanY = view.panY - adjustedDeltaY;
        
        console.log('🔄 Setting pan from', view.panX, view.panY, 'to', newPanX, newPanY);
        setPan(newPanX, newPanY);
        
        this.lastPointer = currentWorldPoint;
      }
    });

    this.input.on('pointerup', () => {
      if (this.isPanning) {
        console.log('🔄 Stopping pan');
        this.isPanning = false;
        this.lastPointer = undefined;
      }
    });

    // Zoom with mouse wheel
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, deltaX: number, deltaY: number, deltaZ: number) => {
      console.log('🖱️ Wheel event - deltaY:', deltaY, 'deltaX:', deltaX, 'deltaZ:', deltaZ);
      
      const { view, setZoom } = useStore.getState();
      const zoomDelta = deltaY > 0 ? 0.9 : 1.1;
      const newZoom = Math.max(0.1, Math.min(5, view.zoom * zoomDelta));
      
      console.log('🔍 Zooming from', view.zoom, 'to', newZoom);
      setZoom(newZoom);
    });
    
    // Keyboard shortcuts for zoom
    this.input.keyboard?.on('keydown-PLUS', () => {
      const { view, setZoom } = useStore.getState();
      const newZoom = Math.min(5, view.zoom * 1.2);
      setZoom(newZoom);
    });
    
    this.input.keyboard?.on('keydown-MINUS', () => {
      const { view, setZoom } = useStore.getState();
      const newZoom = Math.max(0.1, view.zoom * 0.8);
      setZoom(newZoom);
    });
    
    // Reset view
    this.input.keyboard?.on('keydown-HOME', () => {
      const { setPan, setZoom } = useStore.getState();
      setPan(0, 0);
      setZoom(1);
    });
    
    console.log('✅ Input handlers set up');
  }

  destroy() {
    // Clean up store subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}