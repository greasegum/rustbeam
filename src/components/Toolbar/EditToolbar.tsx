import React, { useState } from 'react';
import { useStore } from '../../store';
import './Toolbar.css';

interface EditToolbarProps {
  onConfigure: () => void;
}

export const EditToolbar: React.FC<EditToolbarProps> = ({ onConfigure }) => {
  const [activeTool, setActiveTool] = useState<string>('brush');
  const [activeCS, setActiveCS] = useState<number>(1);
  
  const { setCurrentTool, setSeverity, setDefectType, clearAllCells, view, setZoom, setPan } = useStore();
  
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);
    const toolMap: { [key: string]: any } = {
      'brush': 'mark',
      'holes': 'mark',
      'rectangle': 'select',
      'region': 'select',
      'erase': 'mark'
    };
    setCurrentTool(toolMap[tool] || 'select');
    
    if (tool === 'erase') {
      setDefectType('none');
    } else if (tool === 'brush') {
      setDefectType('corrosion');
    } else if (tool === 'holes') {
      setDefectType('missing');
    }
  };
  
  const handleCSChange = (cs: number) => {
    setActiveCS(cs);
    setSeverity(cs);
  };
  
  const handleZoomIn = () => {
    const newZoom = Math.min(5, view.zoom * 1.2);
    setZoom(newZoom);
  };
  
  const handleZoomOut = () => {
    const newZoom = Math.max(0.1, view.zoom * 0.8);
    setZoom(newZoom);
  };
  
  const handleResetView = () => {
    setPan(0, 0);
    setZoom(1);
  };
  
  return (
    <div className="mode-toolbar active" id="edit-toolbar">
      <div className="tool-group">
        <button 
          className={`tool-btn ${activeTool === 'brush' ? 'active' : ''}`}
          title="Paint Brush"
          onClick={() => handleToolChange('brush')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M14 2 L16 4 L10 10 L8 8 Z M8 8 L4 14 L2 16 C2 16 4 14 4 14" stroke="currentColor" fill="none"/>
          </svg>
        </button>
        
        <button 
          className={`tool-btn ${activeTool === 'holes' ? 'active' : ''}`}
          title="Holes"
          onClick={() => handleToolChange('holes')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="6" stroke="currentColor" fill="none"/>
            <circle cx="9" cy="9" r="2" stroke="currentColor" fill="currentColor"/>
          </svg>
        </button>
        
        <button 
          className={`tool-btn ${activeTool === 'rectangle' ? 'active' : ''}`}
          title="Rectangle Select"
          onClick={() => handleToolChange('rectangle')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="3" y="3" width="12" height="12" stroke="currentColor" fill="none" strokeDasharray="2"/>
          </svg>
        </button>
        
        <button 
          className={`tool-btn ${activeTool === 'erase' ? 'active' : ''}`}
          title="Erase"
          onClick={() => handleToolChange('erase')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M5 5 L13 13 M13 5 L5 13" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
      </div>
      
      <div className="tool-divider"></div>
      
      <div className="tool-group cs-group">
        <label>CS:</label>
        {[1, 2, 3, 4].map(cs => (
          <button 
            key={cs}
            className={`cs-btn cs-${cs} ${activeCS === cs ? 'active' : ''}`}
            onClick={() => handleCSChange(cs)}
          >
            {cs}
          </button>
        ))}
      </div>
      
      <div className="tool-divider"></div>
      
      {/* Zoom Controls */}
      <div className="tool-group">
        <label>Zoom:</label>
        <button className="action-btn" onClick={handleZoomOut} title="Zoom Out (-)">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 L14 8" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <span className="zoom-level">{Math.round(view.zoom * 100)}%</span>
        <button className="action-btn" onClick={handleZoomIn} title="Zoom In (+)">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 L14 8 M8 2 L8 14" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </button>
        <button className="action-btn" onClick={handleResetView} title="Reset View (Home)">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 2 L8 8 L14 8 M2 8 L8 8 L8 14" stroke="currentColor" fill="none"/>
          </svg>
        </button>
      </div>
      
      <div className="tool-group ml-auto">
        <button
          className="action-btn"
          title="Contour Generation Settings"
          onClick={onConfigure}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 Q8 2, 14 8 Q8 14, 2 8" stroke="currentColor" fill="none"/>
            <circle cx="4" cy="8" r="1" fill="currentColor"/>
            <circle cx="8" cy="5" r="1" fill="currentColor"/>
            <circle cx="12" cy="8" r="1" fill="currentColor"/>
          </svg>
          Contours
        </button>
        <button 
          className="action-btn" 
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