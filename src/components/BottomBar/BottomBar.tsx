import React, { useEffect, useState } from 'react';
import { useStore } from '../../store';
import './BottomBar.css';

export const BottomBar: React.FC = () => {
  const { project, bridgeGeometry, grid, tool, view } = useStore();
  const [coverage, setCoverage] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Calculate coverage statistics
  useEffect(() => {
    const calculateStats = () => {
      if (!(grid.cells instanceof Map)) return;

      const totalCells = grid.rows * grid.cols;
      const cellsWithDefects = Array.from(grid.cells.values()).filter(cell => cell.defectType);
      const coveragePercent = totalCells > 0 ? (cellsWithDefects.length / totalCells) * 100 : 0;

      setCoverage(coveragePercent);
    };

    calculateStats();
  }, [grid.cells, grid.rows, grid.cols]);

  // Track mouse position
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left - rect.width / 2) / 10;
        const y = (e.clientY - rect.top - rect.height / 2) / 10;
        setMousePosition({ x: Math.round(x), y: Math.round(y) });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="bottom-bar">
      <div className="bottom-bar-left">
        <div className="project-info">
          <span className="project-name">{project.name || 'Untitled Project'}</span>
          <span className="beam-id">{project.beamId || 'Beam 1'}</span>
        </div>
        
        <div className="beam-info">
          {bridgeGeometry.profile && (
            <span className="beam-profile">{bridgeGeometry.profile.id}</span>
          )}
          <span className="beam-length">{bridgeGeometry.length}"</span>
        </div>
      </div>

      <div className="bottom-bar-center">
        <div className="coverage-stats">
          <span className="coverage-percent">Coverage: {coverage.toFixed(1)}%</span>
        </div>
      </div>

      <div className="bottom-bar-right">
        <div className="mouse-position">
          <span>X: {mousePosition.x}"</span>
          <span>Y: {mousePosition.y}"</span>
        </div>
        
        <div className="view-info">
          <span className="zoom-level">{Math.round(view.zoom * 100)}%</span>
        </div>
      </div>
    </div>
  );
};