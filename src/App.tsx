import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { MainSceneRefactored } from './scenes/MainSceneRefactored';
import { SetupMenu } from './ui/SetupMenu';
import { useStore } from './store';
import './App.css';

export const App: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    // Initialize Phaser game
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#0a0a0a',
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: containerRef.current,
        width: '100%',
        height: '100%'
      },
      scene: [MainSceneRefactored],
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { y: 0 },
          debug: false
        }
      }
    };
    
    gameRef.current = new Phaser.Game(config);
    
    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);
  
  const { tool, setTool, setSelectedDefect, setSelectedSeverity, clearAllCells } = useStore();
  
  return (
    <div className="app">
      <div className="main-container">
        {/* Left Toolbar */}
        <div className="left-toolbar">
          <div className="toolbar-group">
            <button 
              className={`tool-btn ${tool.currentTool === 'select' ? 'active' : ''}`}
              onClick={() => setTool('select')}
              title="Select Tool"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M3 3 L12 8 L7 9 L5 15 Z" fill="currentColor"/>
              </svg>
            </button>
            <button 
              className={`tool-btn ${tool.currentTool === 'mark' ? 'active' : ''}`}
              onClick={() => setTool('mark')}
              title="Mark Defects"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <rect x="4" y="4" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"/>
                <rect x="7" y="7" width="6" height="6" fill="currentColor"/>
              </svg>
            </button>
            <button 
              className={`tool-btn ${tool.currentTool === 'annotate' ? 'active' : ''}`}
              onClick={() => setTool('annotate')}
              title="Add Annotation"
            >
              <svg width="20" height="20" viewBox="0 0 20 20">
                <path d="M3 3 L17 3 L17 13 L10 13 L5 17 L5 13 L3 13 Z" 
                      fill="none" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>
          </div>
          
          <div className="toolbar-group">
            <label className="toolbar-label">Defect Type</label>
            <select 
              className="toolbar-select"
              value={tool.selectedDefect}
              onChange={(e) => setSelectedDefect(e.target.value as any)}
            >
              <option value="none">None</option>
              <option value="corrosion">Corrosion</option>
              <option value="crack">Crack</option>
              <option value="deformation">Deformation</option>
              <option value="missing">Missing</option>
            </select>
          </div>
          
          <div className="toolbar-group">
            <label className="toolbar-label">Severity</label>
            <select 
              className="toolbar-select"
              value={tool.selectedSeverity}
              onChange={(e) => setSelectedSeverity(parseInt(e.target.value))}
            >
              <option value="1">1 - Minor</option>
              <option value="2">2 - Moderate</option>
              <option value="3">3 - Severe</option>
              <option value="4">4 - Critical</option>
            </select>
          </div>
          
          <div className="toolbar-group">
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
        
        {/* Game Container */}
        <div className="game-container" ref={containerRef} />
        
        {/* Right Panel */}
        <div className="right-panel">
          <div className="panel-header">
            <h3>Properties</h3>
          </div>
          <div className="panel-content">
            <div className="property-group">
              <label>Grid Size:</label>
              <span>{useStore.getState().grid.size}"</span>
            </div>
            <div className="property-group">
              <label>Beam:</label>
              <span>{useStore.getState().beam.profile?.id}</span>
            </div>
            <div className="property-group">
              <label>Length:</label>
              <span>{useStore.getState().beam.length}"</span>
            </div>
            <div className="property-group">
              <label>Marked Cells:</label>
              <span>{useStore.getState().grid.cells.size}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Setup Menu */}
      <SetupMenu />
      
      {/* Status Bar */}
      <div className="status-bar">
        <span className="status-text">Ready</span>
      </div>
    </div>
  );
};