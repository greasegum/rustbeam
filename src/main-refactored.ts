import Phaser from 'phaser';
import { MainSceneRefactored } from './scenes/MainSceneRefactored';
import { useStore } from './store';
import { FileIO } from './utils/fileIO';
import { DefectType } from './types';

// Initialize Phaser game
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game-container',
  backgroundColor: '#0a0a0a',
  scale: {
    mode: Phaser.Scale.RESIZE,
    parent: 'game-container',
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

const game = new Phaser.Game(config);

// Toolbar event handlers
document.getElementById('tool-select')?.addEventListener('click', () => {
  useStore.getState().setCurrentTool('select');
  updateToolButtons('tool-select');
});

document.getElementById('tool-mark')?.addEventListener('click', () => {
  useStore.getState().setCurrentTool('mark');
  updateToolButtons('tool-mark');
});

document.getElementById('tool-annotate')?.addEventListener('click', () => {
  useStore.getState().setCurrentTool('annotate');
  updateToolButtons('tool-annotate');
});

document.getElementById('defect-type')?.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  useStore.getState().setDefectType(target.value as DefectType | 'none');
});

document.getElementById('severity')?.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  useStore.getState().setSeverity(parseInt(target.value));
});

document.getElementById('clear-all')?.addEventListener('click', () => {
  if (confirm('Clear all markings?')) {
    useStore.getState().clearAllCells();
    updateStatus('Cleared all markings');
  }
});

document.getElementById('export')?.addEventListener('click', async () => {
  const state = useStore.getState();
  const xml = state.exportToXML();
  const filename = FileIO.generateFilename(state.project.name);
  
  await FileIO.saveFile(xml, filename);
  updateStatus('Exported to XML');
});

// Add new buttons for save/load
const toolbar = document.getElementById('toolbar');
if (toolbar) {
  const fileGroup = document.createElement('div');
  fileGroup.className = 'tool-group';
  fileGroup.innerHTML = `
    <button id="save-project">Save</button>
    <button id="load-project">Load</button>
    <button id="new-project">New</button>
  `;
  toolbar.insertBefore(fileGroup, toolbar.firstChild);
  
  document.getElementById('save-project')?.addEventListener('click', async () => {
    const state = useStore.getState();
    const xml = state.exportToXML();
    const filename = FileIO.generateFilename(state.project.name);
    
    await FileIO.saveFile(xml, filename);
    updateStatus('Project saved');
  });
  
  document.getElementById('load-project')?.addEventListener('click', async () => {
    try {
      const xml = await FileIO.loadFile();
      useStore.getState().importFromXML(xml);
      updateStatus('Project loaded');
    } catch (error) {
      updateStatus('Failed to load project');
    }
  });
  
  document.getElementById('new-project')?.addEventListener('click', () => {
    if (confirm('Create new project? Current work will be lost if not saved.')) {
      useStore.getState().reset();
      updateStatus('New project created');
    }
  });
}

// Subscribe to tool changes
useStore.subscribe((state) => {
  updateToolButtons(`tool-${state.tool.currentTool}`);
  
  // Update dropdowns
  const defectSelect = document.getElementById('defect-type') as HTMLSelectElement;
  if (defectSelect) {
    defectSelect.value = state.tool.selectedDefect;
  }
  
  const severitySelect = document.getElementById('severity') as HTMLSelectElement;
  if (severitySelect) {
    severitySelect.value = state.tool.selectedSeverity.toString();
  }
});

function updateToolButtons(activeId: string) {
  document.querySelectorAll('#toolbar button').forEach(btn => {
    if (btn.id.startsWith('tool-')) {
      btn.classList.toggle('active', btn.id === activeId);
    }
  });
}

function updateStatus(message: string) {
  const status = document.getElementById('status');
  if (status) {
    status.textContent = message;
    setTimeout(() => {
      status.textContent = 'Ready';
    }, 3000);
  }
}

// Initial status
updateStatus('VisualBeam Inspector Ready');

// Export for debugging
(window as any).game = game;
(window as any).store = useStore;