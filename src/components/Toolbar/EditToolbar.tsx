import React, { useState } from 'react';
import { useStore } from '../../store';
import './Toolbar.css';

interface EditToolbarProps {
  onConfigure: () => void;
}

export const EditToolbar: React.FC<EditToolbarProps> = ({ onConfigure }) => {
  const [activeTool, setActiveTool] = useState<string>('brush');
  const [activeCS, setActiveCS] = useState<number>(1);
  const [brushRadius, setBrushRadius] = useState<number>(1);
  const [holesPercentage, setHolesPercentage] = useState<number>(50);
  
  const { setTool, setSelectedSeverity, clearAllCells } = useStore();
  
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    // Map to store tool types
    const toolMap: { [key: string]: any } = {
      'brush': 'mark',
      'rectangle': 'select',
      'region': 'select',
      'erase': 'mark'
    };
    setTool(toolMap[tool] || 'select');
  };
  
  const handleCSChange = (cs: number) => {
    setActiveCS(cs);
    setSelectedSeverity(cs);
  };
  
  return (
    <div className="mode-toolbar active" id="edit-toolbar">
      <div className="tool-group">
        {/* Paintbrush tool */}
        <button 
          className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
          data-tool="brush" 
          title="Paint Brush"
          onClick={() => handleToolChange('brush')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M14 2 L16 4 L10 10 L8 8 Z M8 8 L4 14 L2 16 C2 16 4 14 4 14" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        
        {/* Rectangle selection */}
        <button 
          className={`tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
          data-tool="rectangle" 
          title="Rectangle Select"
          onClick={() => handleToolChange('rectangle')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="3" y="3" width="12" height="12" stroke="currentColor" fill="none" strokeDasharray="2"/>
          </svg>
        </button>
        
        {/* Contiguous region selection */}
        <button 
          className={`tool-btn ${activeTool === 'region' ? 'active' : ''}`}
          data-tool="region" 
          title="Select Contiguous Region"
          onClick={() => handleToolChange('region')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M9 3 L12 3 L12 6 L15 6 L15 9 L12 9 L12 12 L9 12 L9 15 L6 15 L6 12 L3 12 L3 9 L6 9 L6 6 L9 6 Z" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        
        {/* Eraser */}
        <button 
          className={`tool-btn ${activeTool === 'erase' ? 'active' : ''}`}
          data-tool="erase" 
          title="Erase"
          onClick={() => handleToolChange('erase')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M5 5 L13 13 M13 5 L5 13" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      
      <div className="tool-divider"></div>
      
      {/* Condition States */}
      <div className="tool-group cs-group">
        <label>CS:</label>
        <button 
          className={`cs-btn cs-1 ${activeCS === 1 ? 'active' : ''}`}
          data-cs="1"
          onClick={() => handleCSChange(1)}
        >
          1
        </button>
        <button 
          className={`cs-btn cs-2 ${activeCS === 2 ? 'active' : ''}`}
          data-cs="2"
          onClick={() => handleCSChange(2)}
        >
          2
        </button>
        <button 
          className={`cs-btn cs-3 ${activeCS === 3 ? 'active' : ''}`}
          data-cs="3"
          onClick={() => handleCSChange(3)}
        >
          3
        </button>
        <button 
          className={`cs-btn cs-4 ${activeCS === 4 ? 'active' : ''}`}
          data-cs="4"
          onClick={() => handleCSChange(4)}
        >
          4
        </button>
        
        {/* Holes with percentage option */}
        <div className="cs-holes-group">
          <button 
            className={`cs-btn cs-holes ${activeCS === 5 ? 'active' : ''}`}
            data-cs="holes"
            onClick={() => handleCSChange(5)}
          >
            H
          </button>
          <input 
            type="number" 
            id="holes-percentage" 
            className="holes-input" 
            placeholder="%" 
            min="1" 
            max="100" 
            value={holesPercentage}
            onChange={(e) => setHolesPercentage(parseInt(e.target.value) || 50)}
            title="Percentage of area to fill with holes"
          />
        </div>
      </div>
      
      <div className="tool-divider"></div>
      
      {/* Brush Radius */}
      <div className="tool-group">
        <label>Radius:</label>
        <select 
          id="brush-radius" 
          className="radius-select"
          value={brushRadius}
          onChange={(e) => setBrushRadius(parseInt(e.target.value))}
        >
          <option value="1">1"</option>
          <option value="2">2"</option>
          <option value="3">3"</option>
          <option value="6">6"</option>
          <option value="12">12"</option>
        </select>
      </div>
      
      <div className="tool-group ml-auto">
        {/* Configure button for advanced settings */}
        <button
          className="action-btn"
          id="configure-btn"
          title="Advanced Settings"
          onClick={onConfigure}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="3" stroke="currentColor" fill="none"/>
            <path d="M8 1 L8 3 M8 13 L8 15 M1 8 L3 8 M13 8 L15 8" stroke="currentColor"/>
          </svg>
          Configure
        </button>
        <button 
          className="action-btn" 
          id="clear-all"
          onClick={() => {
            if (confirm('Clear all markings?')) {
              clearAllCells();
            }
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};