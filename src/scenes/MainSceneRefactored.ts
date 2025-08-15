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
  
  constructor() {
    super({ key: 'MainSceneRefactored' });
  }

  create() {
    console.log('🎬 MainScene create() called');
    this.cameras.main.setBackgroundColor('#f8f8f8');
    
    // Create containers
    this.gridContainer = this.add.container(0, 0);
    this.beamContainer = this.add.container(0, 0);
    
    console.log('📦 Containers created:', {
      gridContainer: this.gridContainer,
      beamContainer: this.beamContainer,
      camera: this.cameras.main
    });
    
    // Subscribe to store changes
    this.subscribeToStore();
    
    // Initial render
    this.syncWithStore();
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Center camera on beam
    this.centerCamera();
    
    // Add debug visualization
    this.addDebugVisualization();
  }

  private subscribeToStore() {
    const store = useStore.getState();
    
    // Subscribe to store changes
    this.unsubscribe = useStore.subscribe((state, prevState) => {
      // Check what changed and update accordingly
      if (state.beam !== prevState.beam || 
          state.grid.size !== prevState.grid.size) {
        this.createGrid();
        this.drawBeam();
      } else if (state.grid.cells !== prevState.grid.cells) {
        this.updateGridVisuals();
      }
      
      if (state.tool.showGrid !== prevState.tool.showGrid) {
        this.gridContainer.setVisible(state.tool.showGrid);
      }
      
      if (state.tool.showDimensions !== prevState.tool.showDimensions) {
        this.drawBeam();
      }
      
      if (state.view !== prevState.view) {
        this.updateCamera();
      }
    });
  }

  private syncWithStore() {
    this.createGrid();
    this.drawBeam();
    this.updateGridVisuals();
    this.updateCamera();
  }

  private createGrid() {
    const { bridgeGeometry, grid } = useStore.getState();
    if (!bridgeGeometry.profile) return;
    
    const { length, profile } = bridgeGeometry;
    const beamDepth = profile.depth;
    const gridSize = grid.size;
    
    // Use consistent scale factor
    const scale = this.SCALE;
    
    // Calculate grid dimensions
    const cols = Math.ceil(length / gridSize);
    const rows = Math.ceil(beamDepth / gridSize);
    
    // Center grid position (scaled)
    const startX = (-length / 2) * scale;
    const startY = (-beamDepth / 2) * scale;
    
    // Clear existing grid
    this.gridContainer.removeAll(true);
    this.gridRects.clear();
    
    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gridSize * scale;
        const y = startY + row * gridSize * scale;
        const key = `${row},${col}`;
        
        // Draw grid cell (scaled)
        const rect = this.add.rectangle(
          x + (gridSize * scale) / 2,
          y + (gridSize * scale) / 2,
          gridSize * scale,
          gridSize * scale
        );
        rect.setStrokeStyle(0.5, 0xcccccc);
        rect.setInteractive();
        rect.setData('row', row);
        rect.setData('col', col);
        
        this.gridRects.set(key, rect);
        this.gridContainer.add(rect);
      }
    }
    
    // Ensure grid draws above beam for visibility
    this.gridContainer.setDepth(10);

    // Set visibility based on tool state
    const { tool } = useStore.getState();
    this.gridContainer.setVisible(tool.showGrid);
  }

  private drawBeam() {
    const { bridgeGeometry, tool } = useStore.getState();
    if (!bridgeGeometry.profile) return;
    
    const { profile, length } = bridgeGeometry;
    
    this.beamContainer.removeAll(true);
    
    // Use consistent scale factor
    const scale = this.SCALE;
    
    // Professional colors for light background
    const beamColor = 0x4CAF50;
    const strokeColor = 0x2E7D32;
    const flangeLineColor = 0x388E3C;
    
    // SIDE ELEVATION VIEW - Looking at the beam from the side
    // Shows full length horizontally and depth vertically
    
    // Draw main beam body (side elevation)
    const beamBody = this.add.rectangle(
      0, 0,
      length * scale,
      profile.depth * scale,
      beamColor
    );
    beamBody.setStrokeStyle(2, strokeColor);
    this.beamContainer.add(beamBody);
    
    // Draw horizontal lines to show the three zones
    // Top flange zone line
    const topFlangeZoneLine = this.add.line(
      0, 0,
      -length * scale / 2, -(profile.depth / 2 - profile.flangeThickness) * scale,
      length * scale / 2, -(profile.depth / 2 - profile.flangeThickness) * scale,
      flangeLineColor, 0.8
    );
    topFlangeZoneLine.setLineWidth(1);
    this.beamContainer.add(topFlangeZoneLine);
    
    // Bottom flange zone line  
    const bottomFlangeZoneLine = this.add.line(
      0, 0,
      -length * scale / 2, (profile.depth / 2 - profile.flangeThickness) * scale,
      length * scale / 2, (profile.depth / 2 - profile.flangeThickness) * scale,
      flangeLineColor, 0.8
    );
    bottomFlangeZoneLine.setLineWidth(1);
    this.beamContainer.add(bottomFlangeZoneLine);
    
    // Add subtle shading for flanges to show zones
    // Top flange zone
    const topFlangeZone = this.add.rectangle(
      0,
      -(profile.depth / 2 - profile.flangeThickness / 2) * scale,
      length * scale,
      profile.flangeThickness * scale,
      beamColor, 0.3
    );
    this.beamContainer.add(topFlangeZone);
    
    // Bottom flange zone
    const bottomFlangeZone = this.add.rectangle(
      0,
      (profile.depth / 2 - profile.flangeThickness / 2) * scale,
      length * scale,
      profile.flangeThickness * scale,
      beamColor, 0.3
    );
    this.beamContainer.add(bottomFlangeZone);
    
    // Draw bearings and abutments
    this.drawBearings(scale);
    this.drawAbutments(scale);

    // Draw dimensions if enabled
    if (tool.showDimensions) {
      this.drawDimensions(scale);
    }
  }

  private drawBearings(scale: number) {
    const { bridgeGeometry } = useStore.getState();
    const { profile, length, bearings, abutments, constraints } = bridgeGeometry;
    if (!profile) return;
    
    // Two-tone bearing colors matching the sketch
    const upperBearingColor = 0xA8E6CF; // Light green
    const lowerBearingColor = 0xFFD3B6; // Light orange
    const bearingStroke = 0x666666;
    
    const drawBearing = (side: 'left' | 'right') => {
      const bearing = bearings[side];
      const abutment = abutments[side];
      
      // Use bearing plate dimensions from the new structure
      const lowerPlate = bearing.plates.lower;
      const upperPlate = bearing.plates.upper;
      
      // Position calculation
      const bearingDistanceFromEnd = bearing.distance;
      const x = side === 'left' 
        ? (-length / 2 + bearingDistanceFromEnd) * scale
        : (length / 2 - bearingDistanceFromEnd) * scale;
      
      // Use actual beam depth from profile
      const beamBottom = (profile.depth / 2) * scale;
      
      // Check if bearing would overhang breastwall
      const breastwallX = ((length / 2) - (length - constraints.breastwallDistance) / 2);
      const bearingEdge = (length / 2 - bearingDistanceFromEnd) + lowerPlate.width / 2;
      
      // Adjust bearing width if it would overhang  
      const actualBearingWidth = (bearingEdge > breastwallX) 
        ? Math.max(6, lowerPlate.width - (bearingEdge - breastwallX))
        : lowerPlate.width;
      
      // Upper bearing plate (green) - positioned directly below beam bottom
      const upperY = beamBottom + (upperPlate.thickness / 2) * scale;
      const upper = this.add.rectangle(
        x, upperY, 
        Math.min(actualBearingWidth, upperPlate.width) * scale, 
        upperPlate.thickness * scale, 
        upperBearingColor
      );
      upper.setStrokeStyle(1, bearingStroke);
      
      // Lower bearing plate (orange) - positioned below upper plate
      const lowerY = beamBottom + (upperPlate.thickness + lowerPlate.thickness / 2) * scale;
      const lower = this.add.rectangle(
        x, lowerY, 
        actualBearingWidth * scale, 
        lowerPlate.thickness * scale, 
        lowerBearingColor
      );
      lower.setStrokeStyle(1, bearingStroke);
      
      this.beamContainer.add(upper);
      this.beamContainer.add(lower);
      
      // Add centerline indicator for bearing (for span dimension)
      const totalBearingHeight = (upperPlate.thickness + lowerPlate.thickness) * scale;
      const clLine = this.add.line(
        x, beamBottom - 10 * scale,
        x, beamBottom,
        x, beamBottom + totalBearingHeight,
        0xFF8B94, 0.5
      );
      clLine.setLineWidth(1);
      this.beamContainer.add(clLine);
    };

    // Draw left and right bearings using the new structure
    drawBearing('left');
    drawBearing('right');
  }

  private drawAbutments(scale: number) {
    const { bridgeGeometry } = useStore.getState();
    const { profile, length, abutments, constraints } = bridgeGeometry;
    if (!profile) return;
    
    const abutmentColor = 0xFFE66D; // Yellow matching the sketch
    const abutmentStroke = 0x999999;
    
    // Use actual beam profile dimensions from catalog
    const beamDepth = profile.depth; // Actual depth from beam catalog (e.g., 12.22" for W12X26)
    const beamTop = -(beamDepth / 2) * scale;  // Top of beam (negative Y)
    const beamBottom = (beamDepth / 2) * scale; // Bottom of beam
    
    const drawAbutment = (side: 'left' | 'right') => {
      const abutmentData = abutments[side];
      const dir = side === 'left' ? 1 : -1; // Direction multiplier
      
      // Use new bridge geometry structure
      const seatWidth = abutmentData.seatWidth;
      const backwallClearance = abutmentData.backwallClearance;
      const chamfer = abutmentData.chamfer;
      
      // Key geometry parameters - align with bearing positioning  
      const bearing = bridgeGeometry.bearings[side];
      const bearingHeight = (bearing.plates.lower.thickness + bearing.plates.upper.thickness) * scale;
      const seatY = beamBottom + bearingHeight; // Seat surface aligns with top of bearings
      const backwallWidth = seatWidth / 3; // Backwall width is 1/3 of seat width
      const breastwallBottom = seatY + seatWidth * scale; // Breastwall extends 1x seat width below seat
      
      // Calculate horizontal positions
      const beamEnd = (length / 2) * scale * dir;
      const backwallOuterX = beamEnd + (backwallClearance * scale * dir);
      const backwallInnerX = backwallOuterX - (backwallWidth * scale * dir);
      const breastwallX = ((length / 2) - (length - constraints.breastwallDistance) / 2) * scale * dir;
      
      // Stepped abutment shape matching the user's JSON sketch design:
      // Backwall is truncated at beam top, breastwall extends below seat
      const abutmentPoints = [
        // Start at backwall outer edge, beam top
        backwallOuterX, beamTop,
        // Continue to backwall outer edge, seat level
        backwallOuterX, seatY,
        // Step in to backwall inner edge (backwall width)
        backwallInnerX, seatY,
        // Continue to breastwall face
        breastwallX, seatY,
        // Breastwall extends down 1x seat width below seat
        breastwallX, breastwallBottom,
        // Close back to starting point via a line across bottom (could add more complexity here)
        backwallOuterX, breastwallBottom,
        // Back to top
        backwallOuterX, beamTop
      ];
      
      const abutment = this.add.polygon(0, 0, abutmentPoints, abutmentColor, 0.8);
      abutment.setStrokeStyle(1.5, abutmentStroke);
      this.beamContainer.add(abutment);
      
      // Add seat surface highlight
      const seatLine = this.add.line(
        0, 0,
        backwallInnerX, seatY,
        breastwallX, seatY,
        0x666666
      );
      seatLine.setLineWidth(2);
      this.beamContainer.add(seatLine);
      
      // Add vertical structure lines for clarity
      const backwallLine = this.add.line(
        0, 0,
        backwallOuterX, beamTop,
        backwallOuterX, seatY,
        0x888888
      );
      backwallLine.setLineWidth(1);
      this.beamContainer.add(backwallLine);
      
      const breastwallLine = this.add.line(
        0, 0,
        breastwallX, seatY,
        breastwallX, breastwallBottom,
        0x888888
      );
      breastwallLine.setLineWidth(1);
      this.beamContainer.add(breastwallLine);
      
      // Add backwall inner face line
      const backwallInnerLine = this.add.line(
        0, 0,
        backwallInnerX, seatY,
        backwallInnerX, breastwallBottom,
        0x888888
      );
      backwallInnerLine.setLineWidth(1);
      this.beamContainer.add(backwallInnerLine);
    };

    drawAbutment('left');  // Left abutment
    drawAbutment('right'); // Right abutment
  }

  private drawDimensions(scale: number) {
    const { bridgeGeometry } = useStore.getState();
    const { profile, length, bearings, abutments, constraints } = bridgeGeometry;
    if (!profile) return;
    
    const dimColor = 0x4ECDC4;  // Cyan color for dimension lines
    const dimTextColor = '#000000';

    // Length dimension line with arrows
    const lengthY = (profile.depth / 2 + 40) * scale;
    const lengthLine = this.add.line(
      0,
      lengthY,
      -length * scale / 2,
      lengthY,
      length * scale / 2,
      lengthY,
      dimColor
    );
    lengthLine.setLineWidth(1);
    this.beamContainer.add(lengthLine);

    const arrowSize = 4 * scale;
    const drawArrow = (x: number, y: number, direction: number) => {
      const arrow = this.add.triangle(
        x,
        y,
        x + direction * arrowSize,
        y - arrowSize / 2,
        x + direction * arrowSize,
        y + arrowSize / 2,
        dimColor
      );
      this.beamContainer.add(arrow);
    };
    drawArrow(-length * scale / 2, lengthY, -1);
    drawArrow(length * scale / 2, lengthY, 1);

    const lengthText = this.add.text(
      0,
      lengthY - 20,
      `${length}\"`,
      { fontSize: '14px', color: '#000000', align: 'center' }
    );
    lengthText.setOrigin(0.5);
    this.beamContainer.add(lengthText);

    // Span: CL bearing to CL bearing (technical definition)
    const leftBackwallClearance = abutments.left.backwallClearance;
    const rightBackwallClearance = abutments.right.backwallClearance;
    const spanStart = -(length / 2 - leftBackwallClearance) * scale;
    const spanEnd = (length / 2 - rightBackwallClearance) * scale;
    const spanY = (profile.depth / 2 + 20) * scale;
    const spanLine = this.add.line(0, spanY, spanStart, spanY, spanEnd, spanY, dimColor);
    spanLine.setLineWidth(1);
    this.beamContainer.add(spanLine);
    drawArrow(spanStart, spanY, -1);
    drawArrow(spanEnd, spanY, 1);
    const spanText = this.add.text(
      0,
      spanY - 20,
      `Span (CL-CL): ${(length - leftBackwallClearance - rightBackwallClearance)}"`,
      { fontSize: '12px', color: '#000000', align: 'center', fontStyle: 'bold' }
    );
    spanText.setOrigin(0.5);
    this.beamContainer.add(spanText);

    // Backwall clearance (left)
    const backwallX = -(length / 2 + leftBackwallClearance) * scale;
    const bwStart = backwallX;
    const bwEnd = -(length / 2) * scale;
    const bwY = (profile.depth / 2 + 20) * scale;
    const bwLine = this.add.line(0, bwY, bwStart, bwY, bwEnd, bwY, dimColor);
    bwLine.setLineWidth(1);
    this.beamContainer.add(bwLine);
    drawArrow(bwStart, bwY, -1);
    drawArrow(bwEnd, bwY, 1);
    const bwText = this.add.text(
      (bwStart + bwEnd) / 2,
      bwY - 20,
      `${leftBackwallClearance}\"`,
      { fontSize: '12px', color: '#000000', align: 'center' }
    );
    bwText.setOrigin(0.5);
    this.beamContainer.add(bwText);
    
    // Depth dimension
    const depthText = this.add.text(
      -(length / 2 + 30) * scale,
      0,
      `${profile.depth.toFixed(2)}"`,
      {
        fontSize: '14px',
        color: '#ffffff',
        align: 'center'
      }
    );
    depthText.setOrigin(0.5);
    depthText.setRotation(-Math.PI / 2);
    this.beamContainer.add(depthText);
    
    // Breastwall Distance (clear span between facing brestwalls)
    const breastwallLeft = -((length / 2) - (length - constraints.breastwallDistance) / 2) * scale;
    const breastwallRight = ((length / 2) - (length - constraints.breastwallDistance) / 2) * scale;
    const breastwallY = (profile.depth / 2 + 50) * scale;
    
    const breastwallLine = this.add.line(
      0, breastwallY,
      breastwallLeft, breastwallY,
      breastwallRight, breastwallY,
      0xFFAAA5  // Pink color for breastwall distance
    );
    breastwallLine.setLineWidth(2);
    this.beamContainer.add(breastwallLine);
    
    drawArrow(breastwallLeft, breastwallY, 1);
    drawArrow(breastwallRight, breastwallY, -1);
    
    const breastwallText = this.add.text(
      0,
      breastwallY + 20,
      `Breastwall Distance: ${constraints.breastwallDistance}"`,
      { fontSize: '12px', color: '#FF6B6B', align: 'center', fontStyle: 'bold' }
    );
    breastwallText.setOrigin(0.5);
    this.beamContainer.add(breastwallText);
    
    // Seat Width dimension (horizontal distance from breastwall to backwall)
    const seatStartX = -(length / 2 + leftBackwallClearance) * scale;
    const seatEndX = breastwallLeft;
    const seatY = (profile.depth / 2 + 10) * scale;
    
    const seatLine = this.add.line(
      0, seatY,
      seatStartX, seatY,
      seatEndX, seatY,
      0xFFD3B6  // Orange color for seat width
    );
    seatLine.setLineWidth(1);
    this.beamContainer.add(seatLine);
    
    drawArrow(seatStartX, seatY, -1);
    drawArrow(seatEndX, seatY, 1);
    
    const seatText = this.add.text(
      (seatStartX + seatEndX) / 2,
      seatY - 20,
      `Seat: ${seatWidth}"`,
      { fontSize: '11px', color: '#FF8B00', align: 'center' }
    );
    seatText.setOrigin(0.5);
    this.beamContainer.add(seatText);
    
    // Profile label
    const profileText = this.add.text(
      0,
      -(profile.depth / 2 + 30) * scale,
      profile.id,
      {
        fontSize: '16px',
        color: '#ffff00',
        fontStyle: 'bold',
        align: 'center'
      }
    );
    profileText.setOrigin(0.5);
    this.beamContainer.add(profileText);
  }

  private updateGridVisuals() {
    const { grid } = useStore.getState();
    
    // Ensure cells is a Map
    if (!(grid.cells instanceof Map)) {
      console.warn('Grid cells is not a Map, initializing as empty Map');
      return;
    }
    
    // Update all grid cells
    this.gridRects.forEach((rect, key) => {
      const cell = grid.cells.get(key);
      
      if (cell?.defectType) {
        const color = this.getDefectColor(cell.defectType, cell.severity!);
        rect.setFillStyle(color, 0.5);
      } else {
        rect.setFillStyle();
      }
    });
  }

  private setupInputHandlers() {
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-S', () => {
      useStore.getState().setCurrentTool('select');
    });
    this.input.keyboard?.on('keydown-M', () => {
      useStore.getState().setCurrentTool('mark');
    });
    this.input.keyboard?.on('keydown-A', () => {
      useStore.getState().setCurrentTool('annotate');
    });
    this.input.keyboard?.on('keydown-G', () => {
      useStore.getState().toggleGrid();
    });
    this.input.keyboard?.on('keydown-D', () => {
      useStore.getState().toggleDimensions();
    });
    this.input.keyboard?.on('keydown-DELETE', () => {
      useStore.getState().clearAllCells();
    });
    
    // Pan controls
    this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
      const { view, setPan } = useStore.getState();
      const speed = 10;
      
      switch(event.key) {
        case 'ArrowLeft':
          setPan(view.panX - speed, view.panY);
          break;
        case 'ArrowRight':
          setPan(view.panX + speed, view.panY);
          break;
        case 'ArrowUp':
          setPan(view.panX, view.panY - speed);
          break;
        case 'ArrowDown':
          setPan(view.panX, view.panY + speed);
          break;
      }
    });
    
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const { view, setZoom } = useStore.getState();
      if (deltaY > 0) {
        setZoom(view.zoom - 0.1);
      } else {
        setZoom(view.zoom + 0.1);
      }
    });
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    const { tool } = useStore.getState();
    
    const hit = this.input.hitTestPointer(pointer)[0];
    if (tool.currentTool === 'mark' && hit && hit.getData('row') !== undefined) {
      this.isDragging = true;
      this.markAtPointer(pointer);
    } else {
      this.isPanning = true;
      this.lastPointer = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isDragging) {
      this.markAtPointer(pointer);
    } else if (this.isPanning && this.lastPointer) {
      const newPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const { view, setPan } = useStore.getState();
      const dx = this.lastPointer.x - newPoint.x;
      const dy = this.lastPointer.y - newPoint.y;
      setPan(view.panX + dx, view.panY + dy);
      this.lastPointer = newPoint;
    }
  }

  private handlePointerUp() {
    this.isDragging = false;
    this.isPanning = false;
  }

  private markAtPointer(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const gameObject = this.input.hitTestPointer(pointer)[0];
    
    if (gameObject && gameObject.getData) {
      const row = gameObject.getData('row');
      const col = gameObject.getData('col');
      
      if (row !== undefined && col !== undefined) {
        const { tool, markCell } = useStore.getState();
        
        if (tool.selectedDefect === 'none') {
          markCell(row, col);
        } else {
          markCell(row, col, tool.selectedDefect as DefectType, tool.selectedSeverity);
        }
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
    this.cameras.main.centerOn(0, 0);
  }

  private updateCamera() {
    const { view } = useStore.getState();
    const cam = this.cameras.main;
    
    cam.zoom = view.zoom;
    cam.scrollX = view.panX;
    cam.scrollY = view.panY;
    cam.rotation = view.rotation * Math.PI / 180;
  }

  private addDebugVisualization() {
    // Add visual indicators to show what's being rendered
    const { beam } = useStore.getState();
    
    console.log('🔍 Debug visualization - Current beam state:', beam);
    
    // Add red dot at origin
    const originDot = this.add.circle(0, 0, 5, 0xff0000);
    originDot.setStrokeStyle(2, 0x000000);
    console.log('📍 Origin dot created at (0,0)');
    
    // Add coordinate system indicators
    const xAxis = this.add.line(0, 0, 0, 0, 100, 0, 0x00ff00);
    xAxis.setLineWidth(2);
    const yAxis = this.add.line(0, 0, 0, 0, 0, 100, 0x0000ff);
    yAxis.setLineWidth(2);
    
    console.log('📐 Coordinate axes created (green=X, blue=Y)');
    
    // Add text labels showing what should be visible
    const debugText = this.add.text(10, 10, '', {
      fontSize: '12px',
      color: '#000000',
      backgroundColor: '#ffffff',
      padding: { x: 5, y: 5 }
    });
    
    // Update debug text every frame
    const updateDebugText = () => {
      const state = useStore.getState();
      const cam = this.cameras.main;
      
      debugText.setText([
        `Camera: (${cam.scrollX.toFixed(1)}, ${cam.scrollY.toFixed(1)}) zoom: ${cam.zoom.toFixed(2)}`,
        `Beam: ${state.bridgeGeometry.profile?.id} L=${state.bridgeGeometry.length}"`,
        `Grid: ${state.grid.size.rows}x${state.grid.size.cols}`,
        `Containers: Grid=${this.gridContainer.list.length} Beam=${this.beamContainer.list.length}`,
        `Scene objects: ${this.children.list.length}`
      ].join('\n'));
    };
    
    this.time.addEvent({
      delay: 100,
      callback: updateDebugText,
      loop: true
    });
    
    console.log('📊 Debug text overlay created');
  }

  destroy() {
    // Clean up store subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    super.destroy();
  }
}