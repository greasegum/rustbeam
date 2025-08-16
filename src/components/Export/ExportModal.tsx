import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../store';
import './ExportModal.css';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { project, bridgeGeometry, grid, tool } = useStore();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'svg' | 'png' | 'json' | 'xml'>('pdf');
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeStatistics, setIncludeStatistics] = useState(true);
  const [includeGrid, setIncludeGrid] = useState(true);
  const [fileName, setFileName] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate default filename
  useEffect(() => {
    const defaultName = `${project.name || 'beam-inspection'}-${project.beamId || 'beam1'}-${new Date().toISOString().split('T')[0]}`;
    setFileName(defaultName);
  }, [project.name, project.beamId]);

  // Calculate inspection statistics
  const calculateStats = () => {
    if (!(grid.cells instanceof Map)) return { coverage: 0, defects: {} };

    const totalCells = grid.rows * grid.cols;
    const cellsWithDefects = Array.from(grid.cells.values()).filter(cell => cell.defectType);
    const coverage = totalCells > 0 ? (cellsWithDefects.length / totalCells) * 100 : 0;

    const defects: Record<string, number> = {};
    cellsWithDefects.forEach(cell => {
      if (cell.defectType) {
        defects[cell.defectType] = (defects[cell.defectType] || 0) + 1;
      }
    });

    return { coverage, defects, totalDefects: cellsWithDefects.length };
  };

  const handleExport = async () => {
    const stats = calculateStats();
    
    switch (exportFormat) {
      case 'json':
        exportJSON(stats);
        break;
      case 'xml':
        exportXML(stats);
        break;
      case 'png':
        await exportPNG();
        break;
      case 'svg':
        exportSVG(stats);
        break;
      case 'pdf':
        await exportPDF(stats);
        break;
    }
    
    onClose();
  };

  const exportJSON = (stats: any) => {
    const data = {
      project,
      bridgeGeometry,
      grid: {
        ...grid,
        cells: Array.from(grid.cells.entries())
      },
      statistics: stats,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    downloadFile(blob, `${fileName}.json`);
  };

  const exportXML = (stats: any) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<beam-inspection-report>
  <project>
    <name>${project.name || 'Untitled'}</name>
    <beam-id>${project.beamId || 'Beam 1'}</beam-id>
    <inspector>${project.inspector || 'Unknown'}</inspector>
    <date>${new Date().toISOString()}</date>
  </project>
  <beam-geometry>
    <profile>${bridgeGeometry.profile?.id || 'Unknown'}</profile>
    <length>${bridgeGeometry.length}</length>
    <units>${bridgeGeometry.units}</units>
  </beam-geometry>
  <inspection-results>
    <coverage>${stats.coverage.toFixed(2)}</coverage>
    <total-defects>${stats.totalDefects}</total-defects>
    <defect-breakdown>
      ${Object.entries(stats.defects).map(([type, count]) => 
        `<defect type="${type}" count="${count}"/>`
      ).join('\n      ')}
    </defect-breakdown>
  </inspection-results>
</beam-inspection-report>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    downloadFile(blob, `${fileName}.xml`);
  };

  const exportPNG = async () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('Canvas not found. Please ensure the beam view is visible.');
      return;
    }

    // Create a new canvas with higher resolution
    const exportCanvas = document.createElement('canvas');
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    const scale = 2; // Higher resolution
    exportCanvas.width = canvas.width * scale;
    exportCanvas.height = canvas.height * scale;

    // Draw the original canvas content
    ctx.scale(scale, scale);
    ctx.drawImage(canvas, 0, 0);

    // Add title and statistics if requested
    if (includeStatistics) {
      const stats = calculateStats();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      ctx.fillRect(10, 10, 300, 80);
      
      ctx.fillStyle = 'white';
      ctx.font = '14px Arial';
      ctx.fillText(`${project.name || 'Beam Inspection'}`, 20, 30);
      ctx.fillText(`Coverage: ${stats.coverage.toFixed(1)}%`, 20, 50);
      ctx.fillText(`Defects: ${stats.totalDefects}`, 20, 70);
    }

    exportCanvas.toBlob((blob) => {
      if (blob) {
        downloadFile(blob, `${fileName}.png`);
      }
    }, 'image/png');
  };

  const exportSVG = (stats: any) => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      alert('Canvas not found. Please ensure the beam view is visible.');
      return;
    }

    // Create SVG content (simplified version)
    const svgContent = `<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <style>
      .title { font-family: Arial; font-size: 16px; fill: #333; }
      .stats { font-family: Arial; font-size: 12px; fill: #666; }
    </style>
  </defs>
  <rect width="100%" height="100%" fill="#f8f8f8"/>
  <text x="20" y="30" class="title">${project.name || 'Beam Inspection'}</text>
  <text x="20" y="50" class="stats">Coverage: ${stats.coverage.toFixed(1)}%</text>
  <text x="20" y="70" class="stats">Defects: ${stats.totalDefects}</text>
  <!-- Canvas content would be embedded here -->
</svg>`;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    downloadFile(blob, `${fileName}.svg`);
  };

  const exportPDF = async (stats: any) => {
    // This would require a PDF library like jsPDF
    // For now, we'll create a simple text-based report
    const reportContent = `
BEAM INSPECTION REPORT
======================

Project: ${project.name || 'Untitled'}
Beam ID: ${project.beamId || 'Beam 1'}
Inspector: ${project.inspector || 'Unknown'}
Date: ${new Date().toLocaleDateString()}

BEAM SPECIFICATIONS
------------------
Profile: ${bridgeGeometry.profile?.id || 'Unknown'}
Length: ${bridgeGeometry.length} inches
Units: ${bridgeGeometry.units}

INSPECTION RESULTS
-----------------
Coverage: ${stats.coverage.toFixed(2)}%
Total Defects: ${stats.totalDefects}

Defect Breakdown:
${Object.entries(stats.defects).map(([type, count]) => 
  `  ${type.charAt(0).toUpperCase() + type.slice(1)}: ${count}`
).join('\n')}

NOTES
-----
This report was generated by VisualBeam Inspector v1.0
`;

    const blob = new Blob([reportContent], { type: 'text/plain' });
    downloadFile(blob, `${fileName}.txt`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const stats = calculateStats();

  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h2>Export Inspection Report</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="export-content">
          <div className="export-section">
            <h3>Export Format</h3>
            <div className="format-options">
              {[
                { value: 'pdf', label: 'PDF Report', icon: '📄' },
                { value: 'svg', label: 'SVG Vector', icon: '🎨' },
                { value: 'png', label: 'PNG Image', icon: '🖼️' },
                { value: 'json', label: 'JSON Data', icon: '📊' },
                { value: 'xml', label: 'XML Report', icon: '📋' }
              ].map(format => (
                <button
                  key={format.value}
                  className={`format-btn ${exportFormat === format.value ? 'active' : ''}`}
                  onClick={() => setExportFormat(format.value as any)}
                >
                  <span className="format-icon">{format.icon}</span>
                  <span className="format-label">{format.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="export-section">
            <h3>Export Options</h3>
            <div className="export-options">
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeStatistics}
                  onChange={(e) => setIncludeStatistics(e.target.checked)}
                />
                Include Statistics
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                />
                Include Annotations
              </label>
              <label className="option-checkbox">
                <input
                  type="checkbox"
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                />
                Include Grid
              </label>
            </div>
          </div>

          <div className="export-section">
            <h3>File Name</h3>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="filename-input"
              placeholder="Enter filename"
            />
          </div>

          <div className="export-section">
            <h3>Preview</h3>
            <div className="stats-preview">
              <div className="stat-item">
                <span className="stat-label">Coverage:</span>
                <span className="stat-value">{stats.coverage.toFixed(1)}%</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Total Defects:</span>
                <span className="stat-value">{stats.totalDefects}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Beam Profile:</span>
                <span className="stat-value">{bridgeGeometry.profile?.id || 'Unknown'}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="export-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-export" onClick={handleExport}>
            Export {exportFormat.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  );
};