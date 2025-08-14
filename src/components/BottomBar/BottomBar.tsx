import React from 'react';
import { useStore } from '../../store';
import './BottomBar.css';

interface BottomBarProps {
  onExport: () => void;
  onSave: () => void;
}

export const BottomBar: React.FC<BottomBarProps> = ({ onExport, onSave }) => {
  const { grid, beam } = useStore();
  const markedCells = grid.cells.size;
  const totalCells = grid.rows * grid.cols;
  const percentage = totalCells > 0 ? ((markedCells / totalCells) * 100).toFixed(1) : '0.0';
  
  return (
    <div className="bottom-bar">
      <div className="bottom-content">
        <div className="quick-actions">
          <button className="quick-btn" onClick={onSave} title="Save Project">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M3 3 L3 17 L17 17 L17 5 L15 3 Z M6 3 L6 8 L14 8 L14 3" stroke="currentColor" fill="none"/>
              <rect x="8" y="11" width="4" height="4" fill="currentColor"/>
            </svg>
          </button>
          <button className="quick-btn" onClick={onExport} title="Export">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <path d="M10 3 L10 12 M7 9 L10 12 L13 9" stroke="currentColor" strokeWidth="2"/>
              <path d="M4 15 L4 17 L16 17 L16 15" stroke="currentColor"/>
            </svg>
          </button>
          <button className="quick-btn" title="Print">
            <svg width="20" height="20" viewBox="0 0 20 20">
              <rect x="5" y="3" width="10" height="4" stroke="currentColor" fill="none"/>
              <rect x="3" y="7" width="14" height="8" stroke="currentColor" fill="none"/>
              <rect x="5" y="11" width="10" height="6" stroke="currentColor" fill="none"/>
            </svg>
          </button>
        </div>
        
        <div className="statistics">
          <div className="stat-item">
            <span className="stat-label">Marked:</span>
            <span className="stat-value">{markedCells} cells</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-label">Coverage:</span>
            <span className="stat-value">{percentage}%</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-label">Grid:</span>
            <span className="stat-value">{grid.size}"</span>
          </div>
          <div className="stat-divider">|</div>
          <div className="stat-item">
            <span className="stat-label">Beam:</span>
            <span className="stat-value">{beam.profile?.id || 'None'}</span>
          </div>
        </div>
        
        <div className="view-controls">
          <button className="view-btn" title="Zoom In">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5" stroke="currentColor" fill="none"/>
              <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor"/>
              <line x1="5" y1="7" x2="9" y2="7" stroke="currentColor"/>
              <line x1="7" y1="5" x2="7" y2="9" stroke="currentColor"/>
            </svg>
          </button>
          <button className="view-btn" title="Zoom Out">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <circle cx="7" cy="7" r="5" stroke="currentColor" fill="none"/>
              <line x1="11" y1="11" x2="14" y2="14" stroke="currentColor"/>
              <line x1="5" y1="7" x2="9" y2="7" stroke="currentColor"/>
            </svg>
          </button>
          <button className="view-btn" title="Fit to Screen">
            <svg width="16" height="16" viewBox="0 0 16 16">
              <rect x="3" y="3" width="10" height="10" stroke="currentColor" fill="none"/>
              <path d="M1 1 L5 1 L5 2 M1 1 L1 5 L2 5" stroke="currentColor"/>
              <path d="M15 1 L11 1 L11 2 M15 1 L15 5 L14 5" stroke="currentColor"/>
              <path d="M1 15 L5 15 L5 14 M1 15 L1 11 L2 11" stroke="currentColor"/>
              <path d="M15 15 L11 15 L11 14 M15 15 L15 11 L14 11" stroke="currentColor"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div className="status-bar">
        <span className="status-text">Ready</span>
        <span className="coordinates">X: 0" Y: 0"</span>
      </div>
    </div>
  );
};