import React, { useState } from 'react';
import './Toolbar.css';

export const AnnotateToolbar: React.FC = () => {
  const [activeTool, setActiveTool] = useState<string>('dimension');
  const [showDimensionMenu, setShowDimensionMenu] = useState(false);
  
  return (
    <div className="mode-toolbar active" id="annotate-toolbar">
      <div className="tool-group">
        {/* Dimension tools with dropdown */}
        <div className="tool-dropdown">
          <button 
            className={`tool-btn ${activeTool === 'dimension' ? 'active' : ''}`}
            data-tool="dimension" 
            title="Dimensions"
            onClick={() => setActiveTool('dimension')}
            onMouseEnter={() => setShowDimensionMenu(true)}
            onMouseLeave={() => setShowDimensionMenu(false)}
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path d="M3 9 L15 9 M3 7 L3 11 M15 7 L15 11" stroke="currentColor"/>
            </svg>
            <span className="dropdown-arrow">▼</span>
          </button>
          {showDimensionMenu && (
            <div className="dropdown-menu">
              <button data-dim-type="point">Point to Point</button>
              <button data-dim-type="abutment">From Abutment</button>
              <button data-dim-type="ordinate">Ordinate</button>
              <button data-dim-type="area">Area</button>
            </div>
          )}
        </div>
        
        {/* Callout tool */}
        <button 
          className={`tool-btn ${activeTool === 'callout' ? 'active' : ''}`}
          data-tool="callout" 
          title="Callout"
          onClick={() => setActiveTool('callout')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="6" cy="6" r="5" stroke="currentColor" fill="none"/>
            <line x1="10" y1="10" x2="15" y2="15" stroke="currentColor"/>
          </svg>
        </button>
        
        {/* Text tool */}
        <button 
          className={`tool-btn ${activeTool === 'text' ? 'active' : ''}`}
          data-tool="text" 
          title="Text"
          onClick={() => setActiveTool('text')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <text x="9" y="13" textAnchor="middle" fontSize="14" fill="currentColor">T</text>
          </svg>
        </button>
        
        {/* Photo marker */}
        <button 
          className={`tool-btn ${activeTool === 'photo' ? 'active' : ''}`}
          data-tool="photo" 
          title="Photo Marker"
          onClick={() => setActiveTool('photo')}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <rect x="3" y="5" width="12" height="10" stroke="currentColor" fill="none"/>
            <circle cx="7" cy="9" r="1.5" fill="currentColor"/>
            <path d="M10 12 L13 9 L15 11 L15 14 L3 14 L7 10 L10 12" fill="currentColor" opacity="0.5"/>
          </svg>
        </button>
      </div>
      
      <div className="tool-divider"></div>
      
      {/* Text Size */}
      <div className="tool-group">
        <label>Size:</label>
        <select className="text-size-select">
          <option value="10">10pt</option>
          <option value="12">12pt</option>
          <option value="14" selected>14pt</option>
          <option value="16">16pt</option>
          <option value="18">18pt</option>
        </select>
      </div>
      
      <div className="tool-divider"></div>
      
      {/* Annotation Color */}
      <div className="tool-group">
        <label>Color:</label>
        <div className="color-palette">
          <button className="color-btn" style={{ background: '#000000' }} title="Black"></button>
          <button className="color-btn" style={{ background: '#FF0000' }} title="Red"></button>
          <button className="color-btn" style={{ background: '#0000FF' }} title="Blue"></button>
          <button className="color-btn" style={{ background: '#00FF00' }} title="Green"></button>
          <button className="color-btn" style={{ background: '#FFA500' }} title="Orange"></button>
        </div>
      </div>
      
      <div className="tool-group ml-auto">
        <button className="action-btn" id="show-dimensions">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="3" stroke="currentColor" fill="none"/>
            <path d="M2 8 Q8 2, 14 8 Q8 14, 2 8" stroke="currentColor" fill="none"/>
          </svg>
          Show Dimensions
        </button>
        <button className="action-btn" id="clear-annotations">Clear Annotations</button>
      </div>
    </div>
  );
};