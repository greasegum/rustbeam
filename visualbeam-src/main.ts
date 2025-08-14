import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

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
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

const game = new Phaser.Game(config);

// Get scene reference
let mainScene: MainScene;

game.events.on('ready', () => {
  mainScene = game.scene.getScene('MainScene') as MainScene;
});

// Toolbar event handlers
document.getElementById('tool-select')?.addEventListener('click', () => {
  mainScene?.setTool('select');
  updateToolButtons('tool-select');
});

document.getElementById('tool-mark')?.addEventListener('click', () => {
  mainScene?.setTool('mark');
  updateToolButtons('tool-mark');
});

document.getElementById('tool-annotate')?.addEventListener('click', () => {
  mainScene?.setTool('annotate');
  updateToolButtons('tool-annotate');
});

document.getElementById('defect-type')?.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  mainScene?.setDefectType(target.value as any);
});

document.getElementById('severity')?.addEventListener('change', (e) => {
  const target = e.target as HTMLSelectElement;
  mainScene?.setSeverity(parseInt(target.value));
});

document.getElementById('clear-all')?.addEventListener('click', () => {
  if (confirm('Clear all markings?')) {
    // Will implement clear method
    window.location.reload();
  }
});

document.getElementById('export')?.addEventListener('click', () => {
  const data = mainScene?.exportData();
  if (data) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beam-inspection-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    updateStatus('Exported successfully');
  }
});

// Listen for tool change events from scene
window.addEventListener('toolChanged', (e: any) => {
  updateToolButtons(`tool-${e.detail}`);
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
updateStatus('Initializing...');

// Export for debugging
(window as any).game = game;