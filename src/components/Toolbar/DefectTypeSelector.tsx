import React from 'react';
import { useStore } from '../../store';
import './Toolbar.css';

export const DefectTypeSelector: React.FC = () => {
  const { tool, setDefectType } = useStore();
  
  const defectTypes = [
    { id: 'corrosion', label: 'Corrosion', color: '#ff9900', icon: '🟠' },
    { id: 'crack', label: 'Crack', color: '#9999ff', icon: '🔵' },
    { id: 'deformation', label: 'Deformation', color: '#ffff66', icon: '🟡' },
    { id: 'missing', label: 'Missing', color: '#999999', icon: '⚫' },
    { id: 'none', label: 'None', color: '#ffffff', icon: '⚪' }
  ] as const;
  
  return (
    <div className="tool-group defect-type-group">
      <label>Type:</label>
      {defectTypes.map((defect) => (
        <button
          key={defect.id}
          className={`defect-btn ${tool.selectedDefect === defect.id ? 'active' : ''}`}
          onClick={() => setDefectType(defect.id)}
          title={defect.label}
          style={{
            backgroundColor: tool.selectedDefect === defect.id ? defect.color : 'transparent',
            borderColor: defect.color,
            color: tool.selectedDefect === defect.id ? '#000' : defect.color
          }}
        >
          <span className="defect-icon">{defect.icon}</span>
        </button>
      ))}
    </div>
  );
}; 