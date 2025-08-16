import React, { useState } from 'react';
import { useStore } from '../../store';
import './Toolbar.css';

export const ViewToolbar: React.FC = () => {
  const [showGrid, setShowGrid] = useState(true);
  const [showAnnotations, setShowAnnotations] = useState(true);
  const [showDimensions, setShowDimensions] = useState(true);
  const [showDefects, setShowDefects] = useState(true);
  const [showContours, setShowContours] = useState(false);
  
  const { view, setZoom, setPan } = useStore();
  
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
    <div className="mode-toolbar active" id="view-toolbar">
      <div className="tool-group">
        <label>Show:</label>
        
        <button 
          className={`toggle-btn ${showGrid ? 'active' : ''}`}
          onClick={() => setShowGrid(!showGrid)}
          title="Toggle Grid"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 2 L14 2 M2 6 L14 6 M2 10 L14 10 M2 14 L14 14 M2 2 L2 14 M6 2 L6 14 M10 2 L10 14 M14 2 L14 14" 
                  stroke="currentColor" strokeWidth="0.5"/>
          </svg>
          Grid
        </button>
        
        <button 
          className={`toggle-btn ${showDefects ? 'active' : ''}`}
          onClick={() => setShowDefects(!showDefects)}
          title="Toggle Defects"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <rect x="4" y="4" width="8" height="8" fill="currentColor" opacity="0.5"/>
          </svg>
          Defects
        </button>
        
        <button 
          className={`toggle-btn ${showContours ? 'active' : ''}`}
          onClick={() => setShowContours(!showContours)}
          title="Toggle Contours"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 Q8 2, 14 8 Q8 14, 2 8" stroke="currentColor" fill="none"/>
          </svg>
          Contours
        </button>
        
        <button 
          className={`toggle-btn ${showAnnotations ? 'active' : ''}`}
          onClick={() => setShowAnnotations(!showAnnotations)}
          title="Toggle Annotations"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="4" cy="12" r="1" fill="currentColor"/>
            <line x1="5" y1="11" x2="12" y2="4" stroke="currentColor"/>
          </svg>
          Annotations
        </button>
        
        <button 
          className={`toggle-btn ${showDimensions ? 'active' : ''}`}
          onClick={() => setShowDimensions(!showDimensions)}
          title="Toggle Dimensions"
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 8 L14 8 M2 6 L2 10 M14 6 L14 10" stroke="currentColor"/>
          </svg>
          Dimensions
        </button>
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
      
      <div className="tool-divider"></div>
      
      {/* View Options */}
      <div className="tool-group">
        <label>Display:</label>
        <select className="display-select">
          <option value="color">Color</option>
          <option value="grayscale">Grayscale</option>
          <option value="print">Print Preview</option>
        </select>
      </div>
      
      <div className="tool-group ml-auto">
        <button className="action-btn" title="Fullscreen">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 2 L6 2 L6 3 L3 3 L3 6 L2 6 Z" fill="currentColor"/>
            <path d="M14 2 L10 2 L10 3 L13 3 L13 6 L14 6 Z" fill="currentColor"/>
            <path d="M2 14 L6 14 L6 13 L3 13 L3 10 L2 10 Z" fill="currentColor"/>
            <path d="M14 14 L10 14 L10 13 L13 13 L13 10 L14 10 Z" fill="currentColor"/>
          </svg>
          Fullscreen
        </button>
        <button className="action-btn primary-btn">
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M8 3 L8 10 M5 7 L8 10 L11 7" stroke="currentColor" strokeWidth="2"/>
            <path d="M3 12 L3 14 L13 14 L13 12" stroke="currentColor"/>
          </svg>
          Export View
        </button>
      </div>
    </div>
  );
};