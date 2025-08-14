import React, { useEffect, useRef, useState } from 'react';
import Phaser from 'phaser';
import { MainSceneRefactored } from './scenes/MainSceneRefactored';
import { Header } from './components/Header/Header';
import { EditToolbar } from './components/Toolbar/EditToolbar';
import { AnnotateToolbar } from './components/Toolbar/AnnotateToolbar';
import { ViewToolbar } from './components/Toolbar/ViewToolbar';
import { BottomBar } from './components/BottomBar/BottomBar';
import { SetupModal } from './components/Setup/SetupModal';
import { ExportModal } from './components/Export/ExportModal';
import { useStore } from './store';
import './AppPro.css';

export const AppPro: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentMode, setCurrentMode] = useState<'edit' | 'annotate' | 'view'>('edit');
  const [showSetup, setShowSetup] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;
    
    // Initialize Phaser game with full canvas area
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      backgroundColor: '#f8f8f8',
      scale: {
        mode: Phaser.Scale.RESIZE,
        parent: containerRef.current,
        width: '100%',
        height: '100%'
      },
      scene: [MainSceneRefactored],
      render: {
        antialias: true,
        pixelArt: false
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
  
  const handleExport = () => {
    setShowExport(true);
  };
  
  const handleSave = () => {
    // Implement save functionality
    const data = useStore.getState();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beam-inspection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="app-pro">
      {/* Top Header with Project Info and Mode Tabs */}
      <Header 
        onModeChange={setCurrentMode} 
        currentMode={currentMode}
      />
      
      {/* Mode-specific Toolbar */}
      <div className="toolbar-container">
        {currentMode === 'edit' && <EditToolbar />}
        {currentMode === 'annotate' && <AnnotateToolbar />}
        {currentMode === 'view' && <ViewToolbar />}
      </div>
      
      {/* Main Canvas Area - Maximum Horizontal Space */}
      <div className="main-canvas" ref={containerRef}>
        {/* Phaser renders here */}
      </div>
      
      {/* Bottom Bar with Stats and Actions */}
      <BottomBar 
        onExport={handleExport}
        onSave={handleSave}
      />
      
      {/* Setup Button - Floating */}
      <button 
        className="setup-float-btn"
        onClick={() => setShowSetup(true)}
        title="Beam Setup"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" 
            fill="currentColor"/>
        </svg>
      </button>
      
      {/* Modals */}
      {showSetup && <SetupModal onClose={() => setShowSetup(false)} />}
      {showExport && <ExportModal onClose={() => setShowExport(false)} />}
    </div>
  );
};