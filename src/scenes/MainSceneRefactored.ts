import Phaser from 'phaser';
import { useStore } from '../store';
import { DefectType } from '../types';

export class MainSceneRefactored extends Phaser.Scene {
  private gridContainer!: Phaser.GameObjects.Container;
  private beamContainer!: Phaser.GameObjects.Container;
  private gridRects: Map<string, Phaser.GameObjects.Rectangle> = new Map();
  private gridCols = 0;
  private gridRows = 0;
  private gridStartX = 0;
  private gridStartY = 0;
  private currentGridSize = 0;
  private isDragging = false;
  private unsubscribe?: () => void;
  
  constructor() {
    super({ key: 'MainSceneRefactored' });
  }

  create() {
    this.cameras.main.setBackgroundColor('#f8f8f8');
    
    // Create containers
    this.gridContainer = this.add.container(0, 0);
    this.beamContainer = this.add.container(0, 0);
    
    // Subscribe to store changes
    this.subscribeToStore();
    
    // Initial render
    this.syncWithStore();
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Center camera on beam
    this.centerCamera();
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
    const { beam, grid } = useStore.getState();
    if (!beam.profile) return;
    
    const { length } = beam;
    const beamDepth = beam.profile.depth;
    const gridSize = grid.size;
    
    // Calculate grid dimensions
    const cols = Math.ceil(length / gridSize);
    const rows = Math.ceil(beamDepth / gridSize);

    // Center grid position
    const startX = -length / 2;
    const startY = -beamDepth / 2;

    // Store for interaction calculations
    this.gridCols = cols;
    this.gridRows = rows;
    this.gridStartX = startX;
    this.gridStartY = startY;
    this.currentGridSize = gridSize;
    
    // Clear existing grid
    this.gridContainer.removeAll(true);
    this.gridRects.clear();
    
    // Create grid cells
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gridSize;
        const y = startY + row * gridSize;
        const key = `${row},${col}`;
        
        // Draw grid cell
        const rect = this.add.rectangle(
          x + gridSize / 2,
          y + gridSize / 2,
          gridSize,
          gridSize
        );
        rect.setStrokeStyle(0.5, 0xcccccc);
        
        this.gridRects.set(key, rect);
        this.gridContainer.add(rect);
      }
    }
    
    // Set visibility based on tool state
    const { tool } = useStore.getState();
    this.gridContainer.setVisible(tool.showGrid);
  }

  private drawBeam() {
    const { beam, tool } = useStore.getState();
    if (!beam.profile) return;
    
    const { profile, length, leftBearing, rightBearing } = beam;
    
    this.beamContainer.removeAll(true);
    
    // Scale factor for visualization (pixels per inch)
    const scale = 10;
    
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
    
    // Draw abutments
    this.drawAbutments(scale);

    // Draw bearings on top of abutments
    this.drawBearings(scale);

    // Draw dimensions if enabled
    if (tool.showDimensions) {
      this.drawDimensions(scale);
    }
  }

  private drawBearings(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length, leftBearing, rightBearing } = beam;
    if (!profile) return;

    const bearingColor = 0xFFA07A;
    const bearingStroke = 0x8B5A3C;
    const bearingWidth = 6 * scale;
    const bearingHeight = 2 * scale;
    const seatY = (profile.depth / 2) * scale;

    // Left bearing
    const leftX = -(length / 2 - leftBearing) * scale;
    const leftRect = this.add.rectangle(
      leftX,
      seatY + bearingHeight / 2,
      bearingWidth,
      bearingHeight,
      bearingColor
    );
    leftRect.setStrokeStyle(2, bearingStroke);
    this.beamContainer.add(leftRect);

    // Right bearing
    const rightX = (length / 2 - rightBearing) * scale;
    const rightRect = this.add.rectangle(
      rightX,
      seatY + bearingHeight / 2,
      bearingWidth,
      bearingHeight,
      bearingColor
    );
    rightRect.setStrokeStyle(2, bearingStroke);
    this.beamContainer.add(rightRect);
  }

  private drawAbutments(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length, backwallClearance, breastwallDistance, leftAbutmentHeight, rightAbutmentHeight } = beam;
    if (!profile || breastwallDistance <= 0) return;

    const baseY = (profile.depth / 2) * scale;
    const abutmentColor = 0x666666;
    const abutmentStroke = 0x444444;

    // Proportions based on design sketch
    const frontOffsetRatio = 2 / 14;
    const seatHeightRatio = 7 / 16;

    const seatWidth = (breastwallDistance / 2) * scale;
    const footingProjection = seatWidth * frontOffsetRatio;

    const leftTotal = leftAbutmentHeight * scale;
    const rightTotal = rightAbutmentHeight * scale;
    const leftSeat = leftTotal * seatHeightRatio;
    const rightSeat = rightTotal * seatHeightRatio;

    const drawAbutment = (
      backwallX: number,
      seatHeight: number,
      totalHeight: number,
      direction: 1 | -1
    ) => {
      const g = this.add.graphics();
      g.fillStyle(abutmentColor, 1);
      g.lineStyle(2, abutmentStroke, 1);
      g.beginPath();
      g.moveTo(backwallX, baseY);
      g.lineTo(backwallX, baseY + seatHeight);
      g.lineTo(backwallX + direction * seatWidth, baseY + seatHeight);
      g.lineTo(backwallX + direction * seatWidth, baseY + totalHeight);
      g.lineTo(backwallX + direction * (seatWidth + footingProjection), baseY + totalHeight);
      g.lineTo(backwallX + direction * (seatWidth + footingProjection), baseY);
      g.closePath();
      g.fillPath();
      g.strokePath();
      this.beamContainer.add(g);
    };

    // Left and right abutments
    const leftBackwallX = -(length / 2 + backwallClearance) * scale;
    drawAbutment(leftBackwallX, leftSeat, leftTotal, -1);

    const rightBackwallX = (length / 2 + backwallClearance) * scale;
    drawAbutment(rightBackwallX, rightSeat, rightTotal, 1);
  }

  private drawDimensions(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length } = beam;
    if (!profile) return;
    
    // Length dimension
    const lengthText = this.add.text(
      0,
      (profile.depth / 2 + 60) * scale,
      `${length}"`,
      {
        fontSize: '14px',
        color: '#ffffff',
        align: 'center'
      }
    );
    lengthText.setOrigin(0.5);
    this.beamContainer.add(lengthText);
    
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
    const cells =
      grid.cells instanceof Map
        ? grid.cells
        : new Map(Object.entries(grid.cells || {}));

    // Update all grid cells
    this.gridRects.forEach((rect, key) => {
      const cell = cells.get(key);

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
    
    if (tool.currentTool === 'mark') {
      this.isDragging = true;
      this.markAtPointer(pointer);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isDragging) {
      this.markAtPointer(pointer);
    }
  }

  private handlePointerUp() {
    this.isDragging = false;
  }

  private markAtPointer(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);

    const col = Math.floor((worldPoint.x - this.gridStartX) / this.currentGridSize);
    const row = Math.floor((worldPoint.y - this.gridStartY) / this.currentGridSize);

    if (
      row < 0 ||
      col < 0 ||
      row >= this.gridRows ||
      col >= this.gridCols
    ) {
      return;
    }

    const { tool, markCell } = useStore.getState();

    if (tool.selectedDefect === 'none') {
      markCell(row, col);
    } else {
      markCell(row, col, tool.selectedDefect as DefectType, tool.selectedSeverity);
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

  destroy() {
    // Clean up store subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    super.destroy();
  }
}