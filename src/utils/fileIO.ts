export class FileIO {
  static async saveFile(content: string, filename: string, mimeType: string = 'text/xml') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  static async loadFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.xml,.vbxml';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          reject(new Error('No file selected'));
          return;
        }
        
        try {
          const text = await file.text();
          resolve(text);
        } catch (error) {
          reject(error);
        }
      };
      
      input.click();
    });
  }

  static generateFilename(projectName: string): string {
    const sanitized = projectName
      .replace(/[^a-z0-9]/gi, '_')
      .toLowerCase();
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .slice(0, -5);
    return `${sanitized}_${timestamp}.vbxml`;
  }

  static async exportJSON(data: any, filename: string) {
    const json = JSON.stringify(data, null, 2);
    await this.saveFile(json, filename, 'application/json');
  }

  static async exportSVG(svgContent: string, filename: string) {
    await this.saveFile(svgContent, filename, 'image/svg+xml');
  }

  static async exportPNG(canvas: HTMLCanvasElement, filename: string) {
    return new Promise<void>((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        resolve();
      }, 'image/png');
    });
  }
}