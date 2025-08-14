import React from 'react';
import { useStore } from '../../store';
import './Header.css';

interface HeaderProps {
  onModeChange: (mode: 'edit' | 'annotate' | 'view') => void;
  currentMode: 'edit' | 'annotate' | 'view';
}

export const Header: React.FC<HeaderProps> = ({ onModeChange, currentMode }) => {
  const { project, beam } = useStore();
  
  return (
    <header className="main-header">
      <div className="header-content">
        <div className="project-info">
          <h1 id="project-name">{project.name || 'Untitled Project'}</h1>
          <div className="beam-info">
            <span id="beam-id">{project.beamId || 'Beam 1'}</span>
            <span className="separator">•</span>
            <span id="view-orientation">SOUTH ELEVATION</span>
          </div>
        </div>
        <button className="menu-btn" id="menu-toggle">
          <svg width="24" height="24" viewBox="0 0 24 24">
            <rect x="3" y="5" width="18" height="2" fill="currentColor"/>
            <rect x="3" y="11" width="18" height="2" fill="currentColor"/>
            <rect x="3" y="17" width="18" height="2" fill="currentColor"/>
          </svg>
        </button>
      </div>
      
      {/* Mode Tabs */}
      <div className="mode-tabs">
        <button 
          className={`mode-tab ${currentMode === 'edit' ? 'active' : ''}`}
          data-mode="edit"
          onClick={() => onModeChange('edit')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 10 L10 2 L14 6 L6 14 L2 14 Z" stroke="currentColor" fill="none"/>
          </svg>
          Edit
        </button>
        <button 
          className={`mode-tab ${currentMode === 'annotate' ? 'active' : ''}`}
          data-mode="annotate"
          onClick={() => onModeChange('annotate')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="4" cy="12" r="2" fill="currentColor"/>
            <line x1="6" y1="11" x2="14" y2="3" stroke="currentColor"/>
          </svg>
          Annotate
        </button>
        <button 
          className={`mode-tab ${currentMode === 'view' ? 'active' : ''}`}
          data-mode="view"
          onClick={() => onModeChange('view')}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <circle cx="8" cy="8" r="3" stroke="currentColor" fill="none"/>
            <path d="M2 8 Q8 2, 14 8 Q8 14, 2 8" stroke="currentColor" fill="none"/>
          </svg>
          View
        </button>
      </div>
    </header>
  );
};