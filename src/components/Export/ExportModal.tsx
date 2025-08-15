import React, { useState } from 'react';
import './ExportModal.css';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const [exportFormat, setExportFormat] = useState<string>('pdf');
  const [includeGrid, setIncludeGrid] = useState(false);
  const [includeAnnotations, setIncludeAnnotations] = useState(true);
  const [includeDimensions, setIncludeDimensions] = useState(true);
  const [includeLegend, setIncludeLegend] = useState(true);
  const [includeTitleBlock, setIncludeTitleBlock] = useState(true);
  
  const handleExport = () => {
    // Implement export logic based on format
    console.log('Exporting as:', exportFormat, {
      includeGrid,
      includeAnnotations,
      includeDimensions,
      includeLegend,
      includeTitleBlock
    });
    
    // TODO: Implement actual export functionality
    onClose();
  };
  
  return (
    <div className="export-modal-overlay" onClick={onClose}>
      <div className="export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="export-header">
          <h2>Export Inspection</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="export-content">
          {/* Format Selection */}
          <div className="export-section">
            <h3>Export Format</h3>
            <div className="format-grid">
              <button 
                className={`format-btn ${exportFormat === 'pdf' ? 'active' : ''}`}
                onClick={() => setExportFormat('pdf')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="10" fill="currentColor">PDF</text>
                </svg>
                <span>PDF</span>
                <small>Professional Report</small>
              </button>
              
              <button 
                className={`format-btn ${exportFormat === 'svg' ? 'active' : ''}`}
                onClick={() => setExportFormat('svg')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="10" fill="currentColor">SVG</text>
                </svg>
                <span>SVG</span>
                <small>Vector Graphics</small>
              </button>
              
              <button 
                className={`format-btn ${exportFormat === 'dxf' ? 'active' : ''}`}
                onClick={() => setExportFormat('dxf')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="10" fill="currentColor">DXF</text>
                </svg>
                <span>DXF</span>
                <small>CAD Format</small>
              </button>
              
              <button 
                className={`format-btn ${exportFormat === 'png' ? 'active' : ''}`}
                onClick={() => setExportFormat('png')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="10" fill="currentColor">PNG</text>
                </svg>
                <span>PNG</span>
                <small>High Resolution</small>
              </button>
              
              <button 
                className={`format-btn ${exportFormat === 'xml' ? 'active' : ''}`}
                onClick={() => setExportFormat('xml')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="10" fill="currentColor">XML</text>
                </svg>
                <span>XML</span>
                <small>Data Exchange</small>
              </button>
              
              <button 
                className={`format-btn ${exportFormat === 'json' ? 'active' : ''}`}
                onClick={() => setExportFormat('json')}
              >
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <rect x="6" y="4" width="20" height="24" stroke="currentColor" fill="none" strokeWidth="2"/>
                  <text x="16" y="20" textAnchor="middle" fontSize="8" fill="currentColor">JSON</text>
                </svg>
                <span>JSON</span>
                <small>Raw Data</small>
              </button>
            </div>
          </div>
          
          {/* Export Options */}
          <div className="export-section">
            <h3>Include in Export</h3>
            <div className="export-options">
              <label className="export-checkbox">
                <input 
                  type="checkbox" 
                  checked={includeGrid}
                  onChange={(e) => setIncludeGrid(e.target.checked)}
                />
                <span>Grid Lines</span>
              </label>
              
              <label className="export-checkbox">
                <input 
                  type="checkbox" 
                  checked={includeAnnotations}
                  onChange={(e) => setIncludeAnnotations(e.target.checked)}
                />
                <span>Annotations</span>
              </label>
              
              <label className="export-checkbox">
                <input 
                  type="checkbox" 
                  checked={includeDimensions}
                  onChange={(e) => setIncludeDimensions(e.target.checked)}
                />
                <span>Dimensions</span>
              </label>
              
              <label className="export-checkbox">
                <input 
                  type="checkbox" 
                  checked={includeLegend}
                  onChange={(e) => setIncludeLegend(e.target.checked)}
                />
                <span>Legend</span>
              </label>
              
              <label className="export-checkbox">
                <input 
                  type="checkbox" 
                  checked={includeTitleBlock}
                  onChange={(e) => setIncludeTitleBlock(e.target.checked)}
                />
                <span>Title Block</span>
              </label>
            </div>
          </div>
          
          {/* Format-specific Options */}
          {exportFormat === 'pdf' && (
            <div className="export-section">
              <h3>PDF Options</h3>
              <div className="export-options">
                <div className="option-row">
                  <label>Page Size:</label>
                  <select className="option-select">
                    <option>Letter (8.5" x 11")</option>
                    <option>Legal (8.5" x 14")</option>
                    <option>Tabloid (11" x 17")</option>
                    <option>ANSI D (22" x 34")</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>Orientation:</label>
                  <select className="option-select">
                    <option>Landscape</option>
                    <option>Portrait</option>
                  </select>
                </div>
              </div>
            </div>
          )}
          
          {exportFormat === 'png' && (
            <div className="export-section">
              <h3>PNG Options</h3>
              <div className="export-options">
                <div className="option-row">
                  <label>Resolution:</label>
                  <select className="option-select">
                    <option>150 DPI</option>
                    <option>300 DPI</option>
                    <option>600 DPI</option>
                  </select>
                </div>
                <div className="option-row">
                  <label>Background:</label>
                  <select className="option-select">
                    <option>White</option>
                    <option>Transparent</option>
                  </select>
                </div>
              </div>
            </div>
          )}
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