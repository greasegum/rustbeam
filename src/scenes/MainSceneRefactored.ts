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
    
    // Draw bearings and abutments
    this.drawBearings(scale);
    this.drawAbutments(scale);

    // Draw dimensions if enabled
    if (tool.showDimensions) {
      this.drawDimensions(scale);
    }
  }

  private drawBearings(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length, leftBearing, rightBearing } = beam;
    if (!profile) return;
    
    // Complementary color for bearings (coral/salmon)
    const bearingColor = 0xFFA07A;
    const bearingStroke = 0x8B5A3C;
    
    const padWidth = 6;
    const padHeight = 1;

    const drawBearing = (x: number) => {
      const topY = (profile.depth / 2) * scale + (padHeight * scale) / 2;
      const bottomY = topY + padHeight * scale;
      const upper = this.add.rectangle(x, topY, padWidth * scale, padHeight * scale, bearingColor);
      upper.setStrokeStyle(2, bearingStroke);
      const lower = this.add.rectangle(x, bottomY, padWidth * scale, padHeight * scale, bearingColor);
      lower.setStrokeStyle(2, bearingStroke);
      this.beamContainer.add(upper);
      this.beamContainer.add(lower);
    };

    drawBearing(-(length / 2 - leftBearing) * scale);
    drawBearing((length / 2 - rightBearing) * scale);
  }

  private drawAbutments(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length, backwallClearance, breastwallDistance, leftAbutmentHeight, rightAbutmentHeight } = beam;
    if (!profile || breastwallDistance <= 0) return;

    const abutmentColor = 0xcccccc;
    const abutmentStroke = 0x999999;
    const seatRatio = 0.25;
    const footingRatio = 0.3;
    const baseY = (profile.depth / 2) * scale;

    const drawAbutment = (isLeft: boolean, height: number) => {
      const dir = isLeft ? -1 : 1;
      const backwallX = dir * (length / 2 + backwallClearance) * scale;
      const seatWidth = breastwallDistance * scale * dir;
      const seatHeight = height * seatRatio * scale;
      const footing = height * footingRatio * scale * dir;
      const totalHeight = height * scale;

      const points = [
        backwallX + seatWidth, baseY,
        backwallX + seatWidth, baseY + seatHeight,
        backwallX, baseY + seatHeight,
        backwallX, baseY + totalHeight,
        backwallX - footing, baseY + totalHeight,
        backwallX - footing, baseY + totalHeight + seatHeight,
        backwallX + seatWidth, baseY + totalHeight + seatHeight,
        backwallX + seatWidth, baseY
      ];

      const poly = this.add.polygon(0, 0, points, abutmentColor);
      poly.setStrokeStyle(2, abutmentStroke);
      this.beamContainer.add(poly);
    };

    drawAbutment(true, leftAbutmentHeight);
    drawAbutment(false, rightAbutmentHeight);
  }

  private drawDimensions(scale: number) {
    const { beam } = useStore.getState();
    const { profile, length } = beam;
    if (!profile) return;
    
    const dimColor = 0x000000;

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

    // Span length between bearing centers
    const { leftBearing, rightBearing } = beam;
    const spanStart = -(length / 2 - leftBearing) * scale;
    const spanEnd = (length / 2 - rightBearing) * scale;
    const spanY = (profile.depth / 2 + 20) * scale;
    const spanLine = this.add.line(0, spanY, spanStart, spanY, spanEnd, spanY, dimColor);
    spanLine.setLineWidth(1);
    this.beamContainer.add(spanLine);
    drawArrow(spanStart, spanY, -1);
    drawArrow(spanEnd, spanY, 1);
    const spanText = this.add.text(
      0,
      spanY - 20,
      `${(length - leftBearing - rightBearing)}\"`,
      { fontSize: '14px', color: '#000000', align: 'center' }
    );
    spanText.setOrigin(0.5);
    this.beamContainer.add(spanText);

    // Backwall clearance (left)
    const backwallX = -(length / 2 + beam.backwallClearance) * scale;
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
      `${beam.backwallClearance}\"`,
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

  destroy() {
    // Clean up store subscription
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    super.destroy();
  }
}