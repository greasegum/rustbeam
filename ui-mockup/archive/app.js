// VisualBeam UI Mockup - Interactive Demo
// This demonstrates the UI behavior before Rust/WASM integration

class VisualBeamApp {
    constructor() {
        this.currentTool = 'select';
        this.currentDefectType = 'corrosion';
        this.currentSeverity = 'medium';
        this.gridSize = 12; // inches
        this.isDrawing = false;
        this.defectCount = 14;
        this.affectedArea = 28.5;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.bindEvents();
        this.drawBeamVisualization();
    }

    setupCanvas() {
        const canvas = document.getElementById('inspection-canvas');
        if (!canvas) return;
        
        this.ctx = canvas.getContext('2d');
        
        // Set canvas size
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;
        
        // Set drawing defaults
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 1;
    }

    drawBeamVisualization() {
        if (!this.ctx) return;
        
        const canvas = this.ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const beamWidth = canvas.width * 0.7;
        const beamHeight = 300;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw grid
        this.drawGrid();
        
        // Draw beam outline
        this.ctx.strokeStyle = '#333333';
        this.ctx.lineWidth = 2;
        
        // Top flange
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(centerX - beamWidth/2, centerY - beamHeight/2, beamWidth, 40);
        this.ctx.strokeRect(centerX - beamWidth/2, centerY - beamHeight/2, beamWidth, 40);
        
        // Web
        const webWidth = beamWidth * 0.15;
        const webX = centerX - webWidth/2;
        this.ctx.fillRect(webX, centerY - beamHeight/2 + 40, webWidth, beamHeight - 80);
        this.ctx.strokeRect(webX, centerY - beamHeight/2 + 40, webWidth, beamHeight - 80);
        
        // Bottom flange
        this.ctx.fillRect(centerX - beamWidth/2, centerY + beamHeight/2 - 40, beamWidth, 40);
        this.ctx.strokeRect(centerX - beamWidth/2, centerY + beamHeight/2 - 40, beamWidth, 40);
        
        // Draw sample defects
        this.drawSampleDefects(centerX, centerY, beamWidth, beamHeight);
        
        // Draw dimensions
        this.drawDimensions(centerX, centerY, beamWidth, beamHeight);
    }

    drawGrid() {
        const canvas = this.ctx.canvas;
        const gridSpacing = 30; // pixels
        
        this.ctx.strokeStyle = '#999999';
        this.ctx.lineWidth = 0.5;
        this.ctx.setLineDash([2, 2]);
        
        // Vertical lines
        for (let x = 0; x < canvas.width; x += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, canvas.height);
            this.ctx.stroke();
        }
        
        // Horizontal lines
        for (let y = 0; y < canvas.height; y += gridSpacing) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(canvas.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.setLineDash([]);
    }

    drawSampleDefects(centerX, centerY, beamWidth, beamHeight) {
        // Sample corrosion area
        this.ctx.fillStyle = 'rgba(255, 107, 157, 0.6)';
        this.ctx.fillRect(centerX - beamWidth/4, centerY - 50, 80, 60);
        
        // Sample crack
        this.ctx.strokeStyle = '#C44569';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX + beamWidth/4, centerY - 30);
        this.ctx.lineTo(centerX + beamWidth/4 + 40, centerY + 20);
        this.ctx.stroke();
        
        // Add labels
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '12px sans-serif';
        this.ctx.fillText('Corrosion', centerX - beamWidth/4 + 10, centerY - 30);
        this.ctx.fillText('Crack', centerX + beamWidth/4 + 45, centerY);
    }

    drawDimensions(centerX, centerY, beamWidth, beamHeight) {
        this.ctx.strokeStyle = '#000000';
        this.ctx.lineWidth = 0.75;
        this.ctx.fillStyle = '#000000';
        this.ctx.font = '11px monospace';
        
        // Top dimension line
        const dimY = centerY - beamHeight/2 - 50;
        this.ctx.beginPath();
        this.ctx.moveTo(centerX - beamWidth/2, dimY);
        this.ctx.lineTo(centerX + beamWidth/2, dimY);
        this.ctx.stroke();
        
        // Dimension arrows
        this.drawArrow(centerX - beamWidth/2, dimY, 'left');
        this.drawArrow(centerX + beamWidth/2, dimY, 'right');
        
        // Dimension text
        this.ctx.fillText('40\'-0"', centerX - 20, dimY - 5);
        
        // Section marker
        this.ctx.font = '14px sans-serif';
        this.ctx.fillText('36" WF 300#', centerX - beamWidth/2, centerY - beamHeight/2 - 70);
    }

    drawArrow(x, y, direction) {
        this.ctx.beginPath();
        if (direction === 'left') {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x + 5, y - 3);
            this.ctx.lineTo(x + 5, y + 3);
        } else {
            this.ctx.moveTo(x, y);
            this.ctx.lineTo(x - 5, y - 3);
            this.ctx.lineTo(x - 5, y + 3);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    bindEvents() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                if (btn.dataset.defect) {
                    this.currentDefectType = btn.dataset.defect;
                }
            });
        });
        
        // Severity selection
        document.querySelectorAll('.severity-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.severity-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentSeverity = btn.className.split(' ')[1];
            });
        });
        
        // Toolbar buttons
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const group = btn.parentElement;
                if (group.classList.contains('toolbar-group')) {
                    group.querySelectorAll('.toolbar-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            });
        });
        
        // Canvas mouse events
        const canvas = document.getElementById('inspection-canvas');
        if (canvas) {
            canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        }
        
        // View controls
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // In real app, this would switch between different views
                this.drawBeamVisualization();
            });
        });
        
        // Export button
        const exportBtn = document.querySelector('.btn-primary');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const modal = document.getElementById('export-modal');
                if (modal) modal.style.display = 'flex';
            });
        }
        
        // Modal close
        const modal = document.getElementById('export-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.textContent === 'Cancel') {
                    modal.style.display = 'none';
                }
            });
        }
        
        // Window resize
        window.addEventListener('resize', () => {
            this.setupCanvas();
            this.drawBeamVisualization();
        });
    }

    handleMouseDown(e) {
        this.isDrawing = true;
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Update cursor position in status bar
        this.updateCursorPosition(x, y);
    }

    handleMouseMove(e) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.updateCursorPosition(x, y);
        
        if (this.isDrawing) {
            // In real app, this would mark defects
            this.ctx.fillStyle = 'rgba(255, 107, 157, 0.3)';
            this.ctx.fillRect(x - 15, y - 15, 30, 30);
        }
    }

    handleMouseUp(e) {
        this.isDrawing = false;
        
        // Update statistics
        this.defectCount++;
        this.affectedArea += 0.5;
        this.updateStatistics();
    }

    updateCursorPosition(x, y) {
        // Convert pixel to inches (assuming scale)
        const inchesX = (x / 30 * this.gridSize).toFixed(1);
        const inchesY = (y / 30 * this.gridSize).toFixed(1);
        
        const statusItems = document.querySelectorAll('.status-item');
        if (statusItems[1]) {
            statusItems[1].textContent = `Cursor: X: ${inchesX}" Y: ${inchesY}"`;
        }
    }

    updateStatistics() {
        const statusItems = document.querySelectorAll('.status-item');
        if (statusItems[2]) {
            statusItems[2].textContent = `Defects: ${this.defectCount} marked`;
        }
        if (statusItems[3]) {
            statusItems[3].textContent = `Area: ${this.affectedArea.toFixed(1)} sq ft affected`;
        }
        
        // Update stat cards
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = this.defectCount;
        if (statValues[1]) statValues[1].textContent = this.affectedArea.toFixed(1);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new VisualBeamApp();
});