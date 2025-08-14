import { getBeamById } from '../data/beamCatalog';

export class XMLDeserializer {
  deserialize(xmlString: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    
    const result: any = {};
    
    // Parse project metadata
    const projectNode = doc.querySelector('project');
    if (projectNode) {
      result.project = this.parseProject(projectNode);
    }
    
    // Parse beam configuration
    const beamNode = doc.querySelector('beam');
    if (beamNode) {
      result.beam = this.parseBeam(beamNode);
    }
    
    // Parse grid
    const gridNode = doc.querySelector('grid');
    if (gridNode) {
      result.grid = this.parseGrid(gridNode);
    }
    
    // Parse annotations
    const annotationsNode = doc.querySelector('annotations');
    if (annotationsNode) {
      result.annotations = this.parseAnnotations(annotationsNode);
    }
    
    // Parse settings
    const settingsNode = doc.querySelector('settings');
    if (settingsNode) {
      result.tool = this.parseSettings(settingsNode);
    }
    
    // Parse view
    const viewNode = doc.querySelector('view');
    if (viewNode) {
      result.view = this.parseView(viewNode);
    }
    
    return result;
  }
  
  private parseProject(node: Element): any {
    return {
      id: this.getTextContent(node, 'id'),
      name: this.getTextContent(node, 'name') || 'Untitled',
      description: this.getTextContent(node, 'description'),
      createdAt: this.getTextContent(node, 'created') || new Date().toISOString(),
      modifiedAt: this.getTextContent(node, 'modified') || new Date().toISOString(),
      version: this.getTextContent(node, 'version') || '1.0.0'
    };
  }
  
  private parseBeam(node: Element): any {
    const profileNode = node.querySelector('profile');
    let profile = null;
    
    if (profileNode) {
      const profileId = this.getTextContent(profileNode, 'id');
      profile = getBeamById(profileId || '');
      
      // If not found in catalog, create from XML data
      if (!profile && profileId) {
        profile = {
          id: profileId,
          depth: this.getNumberContent(profileNode, 'depth'),
          weight: this.getNumberContent(profileNode, 'weight'),
          webThickness: this.getNumberContent(profileNode, 'web-thickness'),
          flangeWidth: this.getNumberContent(profileNode, 'flange-width'),
          flangeThickness: this.getNumberContent(profileNode, 'flange-thickness'),
          area: 0,
          momentOfInertia: 0
        };
      }
    }
    
    const lengthNode = node.querySelector('length');
    const units = lengthNode?.getAttribute('units') || 'imperial';
    
    return {
      profile,
      length: this.getNumberContent(node, 'length') || 240,
      leftBearing: this.getNumberContent(node, 'left-bearing') || 12,
      rightBearing: this.getNumberContent(node, 'right-bearing') || 12,
      leftAbutmentHeight: this.getNumberContent(node, 'left-abutment-height') || 24,
      rightAbutmentHeight: this.getNumberContent(node, 'right-abutment-height') || 24,
      backwallClearance: this.getNumberContent(node, 'backwall-clearance') || 0,
      breastwallDistance: this.getNumberContent(node, 'breastwall-distance') || 0,
      units
    };
  }
  
  private parseGrid(node: Element): any {
    const grid = {
      size: this.getNumberContent(node, 'size') || 3,
      rows: this.getNumberContent(node, 'rows') || 4,
      cols: this.getNumberContent(node, 'cols') || 80,
      cells: new Map()
    };
    
    const cellsNode = node.querySelector('cells');
    if (cellsNode) {
      const cellNodes = cellsNode.querySelectorAll('cell');
      cellNodes.forEach(cellNode => {
        const row = parseInt(cellNode.getAttribute('row') || '0');
        const col = parseInt(cellNode.getAttribute('col') || '0');
        const key = `${row},${col}`;
        
        grid.cells.set(key, {
          key,
          row,
          col,
          defectType: cellNode.getAttribute('defect') || undefined,
          severity: cellNode.getAttribute('severity') 
            ? parseInt(cellNode.getAttribute('severity')!) 
            : undefined,
          notes: cellNode.textContent || undefined
        });
      });
    }
    
    return grid;
  }
  
  private parseAnnotations(node: Element): any {
    const annotations = new Map();
    const annotationNodes = node.querySelectorAll('annotation');
    
    annotationNodes.forEach(annNode => {
      const id = annNode.getAttribute('id') || crypto.randomUUID();
      annotations.set(id, {
        id,
        x: parseFloat(annNode.getAttribute('x') || '0'),
        y: parseFloat(annNode.getAttribute('y') || '0'),
        type: annNode.getAttribute('type') || 'note',
        text: annNode.textContent || ''
      });
    });
    
    return {
      annotations,
      selectedAnnotation: null
    };
  }
  
  private parseSettings(node: Element): any {
    return {
      currentTool: this.getTextContent(node, 'current-tool') || 'select',
      selectedDefect: this.getTextContent(node, 'selected-defect') || 'none',
      selectedSeverity: this.getNumberContent(node, 'selected-severity') || 1,
      showGrid: this.getBooleanContent(node, 'show-grid', true),
      showDimensions: this.getBooleanContent(node, 'show-dimensions', true),
      snapToGrid: this.getBooleanContent(node, 'snap-to-grid', true)
    };
  }
  
  private parseView(node: Element): any {
    return {
      zoom: this.getNumberContent(node, 'zoom') || 1,
      panX: this.getNumberContent(node, 'pan-x') || 0,
      panY: this.getNumberContent(node, 'pan-y') || 0,
      rotation: this.getNumberContent(node, 'rotation') || 0
    };
  }
  
  private getTextContent(parent: Element, tagName: string): string | null {
    const node = parent.querySelector(tagName);
    return node?.textContent || null;
  }
  
  private getNumberContent(parent: Element, tagName: string): number {
    const text = this.getTextContent(parent, tagName);
    return text ? parseFloat(text) : 0;
  }
  
  private getBooleanContent(parent: Element, tagName: string, defaultValue: boolean): boolean {
    const text = this.getTextContent(parent, tagName);
    if (!text) return defaultValue;
    return text.toLowerCase() === 'true';
  }
}