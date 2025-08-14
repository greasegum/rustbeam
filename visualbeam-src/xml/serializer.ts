import { AppStore } from '../store/types';

export class XMLSerializer {
  private indentLevel = 0;
  private indentChar = '  ';

  serialize(store: Partial<AppStore>): string {
    const lines: string[] = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<visualbeam-project version="1.0">'
    ];

    this.indentLevel++;

    // Project metadata
    if (store.project) {
      lines.push(...this.serializeProject(store.project));
    }

    // Beam configuration
    if (store.beam) {
      lines.push(...this.serializeBeam(store.beam));
    }

    // Grid and cells
    if (store.grid) {
      lines.push(...this.serializeGrid(store.grid));
    }

    // Annotations
    if (store.annotations) {
      lines.push(...this.serializeAnnotations(store.annotations));
    }

    // Tool settings
    if (store.tool) {
      lines.push(...this.serializeToolSettings(store.tool));
    }

    // View state
    if (store.view) {
      lines.push(...this.serializeView(store.view));
    }

    this.indentLevel--;
    lines.push('</visualbeam-project>');

    return lines.join('\n');
  }

  private indent(): string {
    return this.indentChar.repeat(this.indentLevel);
  }

  private escapeXML(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private serializeProject(project: any): string[] {
    const lines: string[] = [
      `${this.indent()}<project>`,
    ];
    this.indentLevel++;

    lines.push(`${this.indent()}<id>${project.id}</id>`);
    lines.push(`${this.indent()}<name>${this.escapeXML(project.name)}</name>`);
    if (project.description) {
      lines.push(`${this.indent()}<description>${this.escapeXML(project.description)}</description>`);
    }
    lines.push(`${this.indent()}<created>${project.createdAt}</created>`);
    lines.push(`${this.indent()}<modified>${project.modifiedAt}</modified>`);
    lines.push(`${this.indent()}<version>${project.version}</version>`);

    this.indentLevel--;
    lines.push(`${this.indent()}</project>`);
    return lines;
  }

  private serializeBeam(beam: any): string[] {
    const lines: string[] = [
      `${this.indent()}<beam>`,
    ];
    this.indentLevel++;

    if (beam.profile) {
      lines.push(`${this.indent()}<profile>`);
      this.indentLevel++;
      lines.push(`${this.indent()}<id>${beam.profile.id}</id>`);
      lines.push(`${this.indent()}<depth>${beam.profile.depth}</depth>`);
      lines.push(`${this.indent()}<weight>${beam.profile.weight}</weight>`);
      lines.push(`${this.indent()}<web-thickness>${beam.profile.webThickness}</web-thickness>`);
      lines.push(`${this.indent()}<flange-width>${beam.profile.flangeWidth}</flange-width>`);
      lines.push(`${this.indent()}<flange-thickness>${beam.profile.flangeThickness}</flange-thickness>`);
      this.indentLevel--;
      lines.push(`${this.indent()}</profile>`);
    }

    lines.push(`${this.indent()}<length units="${beam.units}">${beam.length}</length>`);
    lines.push(`${this.indent()}<left-bearing>${beam.leftBearing}</left-bearing>`);
    lines.push(`${this.indent()}<right-bearing>${beam.rightBearing}</right-bearing>`);
    lines.push(`${this.indent()}<left-abutment-height>${beam.leftAbutmentHeight}</left-abutment-height>`);
    lines.push(`${this.indent()}<right-abutment-height>${beam.rightAbutmentHeight}</right-abutment-height>`);

    this.indentLevel--;
    lines.push(`${this.indent()}</beam>`);
    return lines;
  }

  private serializeGrid(grid: any): string[] {
    const lines: string[] = [
      `${this.indent()}<grid>`,
    ];
    this.indentLevel++;

    lines.push(`${this.indent()}<size>${grid.size}</size>`);
    lines.push(`${this.indent()}<rows>${grid.rows}</rows>`);
    lines.push(`${this.indent()}<cols>${grid.cols}</cols>`);

    if (grid.cells && grid.cells.size > 0) {
      lines.push(`${this.indent()}<cells>`);
      this.indentLevel++;

      grid.cells.forEach((cell: any) => {
        lines.push(
          `${this.indent()}<cell row="${cell.row}" col="${cell.col}"` +
          (cell.defectType ? ` defect="${cell.defectType}"` : '') +
          (cell.severity ? ` severity="${cell.severity}"` : '') +
          (cell.notes ? `>${this.escapeXML(cell.notes)}</cell>` : '/>')
        );
      });

      this.indentLevel--;
      lines.push(`${this.indent()}</cells>`);
    }

    this.indentLevel--;
    lines.push(`${this.indent()}</grid>`);
    return lines;
  }

  private serializeAnnotations(annotations: any): string[] {
    if (!annotations.annotations || annotations.annotations.size === 0) {
      return [];
    }

    const lines: string[] = [
      `${this.indent()}<annotations>`,
    ];
    this.indentLevel++;

    annotations.annotations.forEach((ann: any) => {
      lines.push(
        `${this.indent()}<annotation id="${ann.id}" x="${ann.x}" y="${ann.y}" type="${ann.type}">` +
        `${this.escapeXML(ann.text)}</annotation>`
      );
    });

    this.indentLevel--;
    lines.push(`${this.indent()}</annotations>`);
    return lines;
  }

  private serializeToolSettings(tool: any): string[] {
    const lines: string[] = [
      `${this.indent()}<settings>`,
    ];
    this.indentLevel++;

    lines.push(`${this.indent()}<current-tool>${tool.currentTool}</current-tool>`);
    lines.push(`${this.indent()}<selected-defect>${tool.selectedDefect}</selected-defect>`);
    lines.push(`${this.indent()}<selected-severity>${tool.selectedSeverity}</selected-severity>`);
    lines.push(`${this.indent()}<show-grid>${tool.showGrid}</show-grid>`);
    lines.push(`${this.indent()}<show-dimensions>${tool.showDimensions}</show-dimensions>`);
    lines.push(`${this.indent()}<snap-to-grid>${tool.snapToGrid}</snap-to-grid>`);

    this.indentLevel--;
    lines.push(`${this.indent()}</settings>`);
    return lines;
  }

  private serializeView(view: any): string[] {
    const lines: string[] = [
      `${this.indent()}<view>`,
    ];
    this.indentLevel++;

    lines.push(`${this.indent()}<zoom>${view.zoom}</zoom>`);
    lines.push(`${this.indent()}<pan-x>${view.panX}</pan-x>`);
    lines.push(`${this.indent()}<pan-y>${view.panY}</pan-y>`);
    lines.push(`${this.indent()}<rotation>${view.rotation}</rotation>`);

    this.indentLevel--;
    lines.push(`${this.indent()}</view>`);
    return lines;
  }
}