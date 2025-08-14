import Phaser from 'phaser';
import { BeamConfiguration, GridCell, DefectType } from '../types';
import { getBeamById } from '../data/beamCatalog';

export class MainScene extends Phaser.Scene {
  private config: BeamConfiguration;
  private grid: GridCell[][] = [];
  private gridContainer!: Phaser.GameObjects.Container;
  private beamContainer!: Phaser.GameObjects.Container;
  private currentTool: 'select' | 'mark' | 'annotate' = 'select';
  private selectedDefect: DefectType | 'none' = 'none';
  private selectedSeverity: number = 1;
  private isDragging = false;
  private dragStartCell: GridCell | null = null;
  
  constructor() {
    super({ key: 'MainScene' });
    
    // Default configuration
    this.config = {
      profile: getBeamById('W12X26')!,
      length: 240, // inches
      leftBearing: 12,
      rightBearing: 12,
      gridSize: 3, // 3 inch grid
      showDimensions: true,
      units: 'imperial'
    };
  }

  create() {
    this.cameras.main.setBackgroundColor('#0a0a0a');
    
    // Create containers
    this.gridContainer = this.add.container(0, 0);
    this.beamContainer = this.add.container(0, 0);
    
    // Initialize grid
    this.createGrid();
    this.drawBeam();
    
    // Set up input handlers
    this.setupInputHandlers();
    
    // Center camera on beam
    this.centerCamera();
  }

  private createGrid() {
    const { length, profile, gridSize } = this.config;
    const beamDepth = profile.depth;
    
    // Calculate grid dimensions
    const cols = Math.ceil(length / gridSize);
    const rows = Math.ceil(beamDepth / gridSize);
    
    // Center grid position
    const startX = -length / 2;
    const startY = -beamDepth / 2;
    
    // Clear existing grid
    this.grid = [];
    this.gridContainer.removeAll(true);
    
    // Create grid cells
    for (let row = 0; row < rows; row++) {
      this.grid[row] = [];
      for (let col = 0; col < cols; col++) {
        const x = startX + col * gridSize;
        const y = startY + row * gridSize;
        
        const cell: GridCell = {
          row,
          col,
          x,
          y,
          width: gridSize,
          height: gridSize
        };
        
        this.grid[row][col] = cell;
        
        // Draw grid cell
        const rect = this.add.rectangle(
          x + gridSize / 2,
          y + gridSize / 2,
          gridSize,
          gridSize
        );
        rect.setStrokeStyle(0.5, 0x333333);
        rect.setInteractive();
        rect.setData('cell', cell);
        
        this.gridContainer.add(rect);
      }
    }
  }

  private drawBeam() {
    const { profile, length, leftBearing, rightBearing } = this.config;
    
    this.beamContainer.removeAll(true);
    
    // Scale factor for visualization (pixels per inch)
    const scale = 10;
    
    // Pastel green color (soft mint green)
    const beamColor = 0x98D8A8;
    const strokeColor = 0x4A8060;
    
    // For side view, we show the beam as an I-shape
    // The web is the vertical part, flanges are horizontal parts at top and bottom
    
    // Draw web (vertical part in the middle - thin vertical rectangle)
    const web = this.add.rectangle(
      0, 0,
      profile.webThickness * scale,  // Web thickness (thin)
      profile.depth * scale,          // Full height
      beamColor
    );
    web.setStrokeStyle(1, strokeColor);
    this.beamContainer.add(web);
    
    // Draw top flange (horizontal part at top - wider than web)
    const topFlange = this.add.rectangle(
      0,
      -(profile.depth / 2 - profile.flangeThickness / 2) * scale,
      profile.flangeWidth * scale,    // Flange width (wider than web)
      profile.flangeThickness * scale,
      beamColor
    );
    topFlange.setStrokeStyle(1, strokeColor);
    this.beamContainer.add(topFlange);
    
    // Draw bottom flange (horizontal part at bottom - wider than web)
    const bottomFlange = this.add.rectangle(
      0,
      (profile.depth / 2 - profile.flangeThickness / 2) * scale,
      profile.flangeWidth * scale,    // Flange width (wider than web)
      profile.flangeThickness * scale,
      beamColor
    );
    bottomFlange.setStrokeStyle(1, strokeColor);
    this.beamContainer.add(bottomFlange);
    
    // Draw the length representation (side view showing the beam extending)
    // This shows the beam from the side, so we see it as a long rectangle
    const beamLength = this.add.rectangle(
      0, 0,
      length * scale,
      profile.depth * scale,
      beamColor,
      0.3  // Semi-transparent to show it's the side view
    );
    beamLength.setStrokeStyle(2, strokeColor);
    this.beamContainer.add(beamLength);
    
    // Draw bearings
    // Complementary color for bearings (coral/salmon)
    const bearingColor = 0xFFA07A;
    const bearingStroke = 0x8B5A3C;
    
    const leftBearingGraphic = this.add.triangle(
      -(length / 2 - leftBearing) * scale,
      (profile.depth / 2 + 20) * scale,
      0, 0,
      -15 * scale, 30 * scale,
      15 * scale, 30 * scale,
      bearingColor
    );
    leftBearingGraphic.setStrokeStyle(2, bearingStroke);
    this.beamContainer.add(leftBearingGraphic);
    
    const rightBearingGraphic = this.add.triangle(
      (length / 2 - rightBearing) * scale,
      (profile.depth / 2 + 20) * scale,
      0, 0,
      -15 * scale, 30 * scale,
      15 * scale, 30 * scale,
      bearingColor
    );
    rightBearingGraphic.setStrokeStyle(2, bearingStroke);
    this.beamContainer.add(rightBearingGraphic);
    
    // Draw dimensions if enabled
    if (this.config.showDimensions) {
      this.drawDimensions(scale);
    }
  }

  private drawDimensions(scale: number) {
    const { profile, length } = this.config;
    
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

  private setupInputHandlers() {
    this.input.on('pointerdown', this.handlePointerDown, this);
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);
    
    // Keyboard shortcuts
    this.input.keyboard?.on('keydown-S', () => this.setTool('select'));
    this.input.keyboard?.on('keydown-M', () => this.setTool('mark'));
    this.input.keyboard?.on('keydown-A', () => this.setTool('annotate'));
    this.input.keyboard?.on('keydown-DELETE', () => this.clearSelection());
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    const cell = this.getCellAtPoint(worldPoint.x, worldPoint.y);
    
    if (cell && this.currentTool === 'mark') {
      this.isDragging = true;
      this.dragStartCell = cell;
      this.markCell(cell);
    }
  }

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    if (this.isDragging && this.currentTool === 'mark') {
      const worldPoint = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
      const cell = this.getCellAtPoint(worldPoint.x, worldPoint.y);
      
      if (cell) {
        this.markCell(cell);
      }
    }
  }

  private handlePointerUp() {
    this.isDragging = false;
    this.dragStartCell = null;
  }

  private getCellAtPoint(x: number, y: number): GridCell | null {
    for (const row of this.grid) {
      for (const cell of row) {
        if (x >= cell.x && x < cell.x + cell.width &&
            y >= cell.y && y < cell.y + cell.height) {
          return cell;
        }
      }
    }
    return null;
  }

  private markCell(cell: GridCell) {
    if (this.selectedDefect === 'none') {
      // Clear defect
      cell.defectType = undefined;
      cell.severity = undefined;
    } else {
      // Mark defect
      cell.defectType = this.selectedDefect as DefectType;
      cell.severity = this.selectedSeverity;
    }
    
    // Update visual
    this.updateCellVisual(cell);
  }

  private updateCellVisual(cell: GridCell) {
    // Find the rectangle for this cell
    const rect = this.gridContainer.list.find(obj => 
      obj.getData('cell') === cell
    ) as Phaser.GameObjects.Rectangle;
    
    if (rect) {
      if (cell.defectType) {
        // Color based on defect type and severity
        const color = this.getDefectColor(cell.defectType, cell.severity!);
        rect.setFillStyle(color, 0.5);
      } else {
        // Clear fill
        rect.setFillStyle();
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

  private clearSelection() {
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.defectType) {
          cell.defectType = undefined;
          cell.severity = undefined;
          this.updateCellVisual(cell);
        }
      }
    }
  }

  private centerCamera() {
    const { width, height } = this.scale;
    this.cameras.main.centerOn(0, 0);
    
    // Enable pan and zoom
    const cursors = this.input.keyboard?.createCursorKeys();
    if (cursors) {
      this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
        const cam = this.cameras.main;
        const speed = 10;
        
        switch(event.key) {
          case 'ArrowLeft':
            cam.scrollX -= speed;
            break;
          case 'ArrowRight':
            cam.scrollX += speed;
            break;
          case 'ArrowUp':
            cam.scrollY -= speed;
            break;
          case 'ArrowDown':
            cam.scrollY += speed;
            break;
        }
      });
    }
    
    // Mouse wheel zoom
    this.input.on('wheel', (pointer: Phaser.Input.Pointer, gameObjects: any[], deltaX: number, deltaY: number) => {
      const cam = this.cameras.main;
      if (deltaY > 0) {
        cam.zoom = Math.max(0.25, cam.zoom - 0.1);
      } else {
        cam.zoom = Math.min(4, cam.zoom + 0.1);
      }
    });
  }

  public setTool(tool: 'select' | 'mark' | 'annotate') {
    this.currentTool = tool;
    this.updateToolbarState();
  }

  public setDefectType(type: DefectType | 'none') {
    this.selectedDefect = type;
  }

  public setSeverity(severity: number) {
    this.selectedSeverity = severity;
  }

  private updateToolbarState() {
    // Update UI toolbar (called from main.ts)
    const event = new CustomEvent('toolChanged', { detail: this.currentTool });
    window.dispatchEvent(event);
  }

  public exportData() {
    const defects: any[] = [];
    
    for (const row of this.grid) {
      for (const cell of row) {
        if (cell.defectType) {
          defects.push({
            row: cell.row,
            col: cell.col,
            type: cell.defectType,
            severity: cell.severity,
            x: cell.x,
            y: cell.y
          });
        }
      }
    }
    
    return {
      config: this.config,
      defects,
      timestamp: new Date().toISOString()
    };
  }
}