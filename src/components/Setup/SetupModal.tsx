import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { BEAM_CATALOG } from '../../data/beamCatalog';
import './SetupModal.css';

interface SetupModalProps {
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onClose }) => {
  const { beam, project, setBeamProfile, setBeamLength, setBearings, setBeamDimensions, setProjectInfo } = useStore();
  
  // Canvas refs for previews
  const sectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const elevationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Form state
  const [projectName, setProjectName] = useState(project.name);
  const [beamId, setBeamId] = useState(project.beamId || 'Beam 1');
  const [inspector, setInspector] = useState(project.inspector || '');
  const [selectedProfile, setSelectedProfile] = useState(beam.profile?.id || 'W12X26');
  
  // Beam dimensions
  const [lengthFt, setLengthFt] = useState(Math.floor(beam.length / 12));
  const [lengthIn, setLengthIn] = useState(beam.length % 12);
  
  // Substructure dimensions
  const [bearingCLFt, setBearingCLFt] = useState(Math.floor((beam.length - 2 * beam.leftBearing) / 12));
  const [bearingCLIn, setBearingCLIn] = useState((beam.length - 2 * beam.leftBearing) % 12);
  const [bearingDistanceFt, setBearingDistanceFt] = useState(Math.floor(beam.leftBearing / 12));
  const [bearingDistanceIn, setBearingDistanceIn] = useState(beam.leftBearing % 12);
  const [backwallClearanceIn, setBackwallClearanceIn] = useState(beam.backwallClearance);
  const [breastwallDistanceFt, setBreastwallDistanceFt] = useState(Math.floor(beam.breastwallDistance / 12));
  const [breastwallDistanceIn, setBreastwallDistanceIn] = useState(beam.breastwallDistance % 12);
  
  // Draw section preview
  const drawSectionPreview = () => {
    const canvas = sectionCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const profile = BEAM_CATALOG.find(b => b.id === selectedProfile);
    if (!profile) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up scaling
    const scale = Math.min(
      (canvas.width - 40) / profile.flangeWidth,
      (canvas.height - 40) / profile.depth
    ) * 0.8;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    // Draw I-beam cross section
    ctx.strokeStyle = '#4CAF50';
    ctx.fillStyle = '#4CAF5020';
    ctx.lineWidth = 2;
    
    // Top flange
    const topFlangeY = centerY - (profile.depth * scale) / 2;
    ctx.fillRect(
      centerX - (profile.flangeWidth * scale) / 2,
      topFlangeY,
      profile.flangeWidth * scale,
      profile.flangeThickness * scale
    );
    ctx.strokeRect(
      centerX - (profile.flangeWidth * scale) / 2,
      topFlangeY,
      profile.flangeWidth * scale,
      profile.flangeThickness * scale
    );
    
    // Web
    ctx.fillRect(
      centerX - (profile.webThickness * scale) / 2,
      topFlangeY + profile.flangeThickness * scale,
      profile.webThickness * scale,
      (profile.depth - 2 * profile.flangeThickness) * scale
    );
    ctx.strokeRect(
      centerX - (profile.webThickness * scale) / 2,
      topFlangeY + profile.flangeThickness * scale,
      profile.webThickness * scale,
      (profile.depth - 2 * profile.flangeThickness) * scale
    );
    
    // Bottom flange
    const bottomFlangeY = centerY + (profile.depth * scale) / 2 - profile.flangeThickness * scale;
    ctx.fillRect(
      centerX - (profile.flangeWidth * scale) / 2,
      bottomFlangeY,
      profile.flangeWidth * scale,
      profile.flangeThickness * scale
    );
    ctx.strokeRect(
      centerX - (profile.flangeWidth * scale) / 2,
      bottomFlangeY,
      profile.flangeWidth * scale,
      profile.flangeThickness * scale
    );
    
    // Dimensions
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    
    // Depth dimension
    const depthX = centerX + (profile.flangeWidth * scale) / 2 + 20;
    ctx.beginPath();
    ctx.moveTo(depthX, topFlangeY);
    ctx.lineTo(depthX, bottomFlangeY + profile.flangeThickness * scale);
    ctx.stroke();
    ctx.fillText(`${profile.depth}"`, depthX + 5, centerY);
    
    // Width dimension
    const widthY = bottomFlangeY + profile.flangeThickness * scale + 20;
    ctx.beginPath();
    ctx.moveTo(centerX - (profile.flangeWidth * scale) / 2, widthY);
    ctx.lineTo(centerX + (profile.flangeWidth * scale) / 2, widthY);
    ctx.stroke();
    ctx.fillText(`${profile.flangeWidth}"`, centerX - 20, widthY + 15);
  };
  
  // Draw elevation preview
  const drawElevationPreview = () => {
    const canvas = elevationCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const profile = BEAM_CATALOG.find(b => b.id === selectedProfile);
    if (!profile) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Calculate total length in inches
    const totalLength = lengthFt * 12 + lengthIn;
    const bearingCL = bearingCLFt * 12 + bearingCLIn;
    const bearingDistance = bearingDistanceFt * 12 + bearingDistanceIn;
    const backwallClear = backwallClearanceIn;
    const breastwallDist = breastwallDistanceFt * 12 + breastwallDistanceIn;
    
    // Set up scaling
    const scale = (canvas.width - 60) / totalLength;
    const centerY = canvas.height / 2;
    const startX = 30;
    
    // Draw beam (side view)
    ctx.fillStyle = '#4CAF5020';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    
    const beamHeight = profile.depth * scale;
    ctx.fillRect(startX, centerY - beamHeight / 2, totalLength * scale, beamHeight);
    ctx.strokeRect(startX, centerY - beamHeight / 2, totalLength * scale, beamHeight);
    
    // Draw L-shaped abutments
    ctx.fillStyle = '#66666620';
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    
    const abutmentHeight = beamHeight * 1.5;
    const abutmentWidth = 20;
    const abutmentBase = breastwallDist * scale;
    
    // Left abutment (L-shape)
    const leftBackwallX = startX - backwallClear * scale;
    ctx.beginPath();
    ctx.moveTo(leftBackwallX - abutmentWidth, centerY - abutmentHeight / 2);
    ctx.lineTo(leftBackwallX, centerY - abutmentHeight / 2);
    ctx.lineTo(leftBackwallX, centerY + beamHeight / 2);
    ctx.lineTo(leftBackwallX - abutmentBase, centerY + beamHeight / 2);
    ctx.lineTo(leftBackwallX - abutmentBase, centerY + abutmentHeight / 2);
    ctx.lineTo(leftBackwallX - abutmentWidth, centerY + abutmentHeight / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Right abutment (L-shape mirrored)
    const rightBackwallX = startX + totalLength * scale + backwallClear * scale;
    ctx.beginPath();
    ctx.moveTo(rightBackwallX + abutmentWidth, centerY - abutmentHeight / 2);
    ctx.lineTo(rightBackwallX, centerY - abutmentHeight / 2);
    ctx.lineTo(rightBackwallX, centerY + beamHeight / 2);
    ctx.lineTo(rightBackwallX + abutmentBase, centerY + beamHeight / 2);
    ctx.lineTo(rightBackwallX + abutmentBase, centerY + abutmentHeight / 2);
    ctx.lineTo(rightBackwallX + abutmentWidth, centerY + abutmentHeight / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Draw bearing plates (2 stacked plates)
    ctx.fillStyle = '#FF6B3580';
    ctx.strokeStyle = '#FF6B35';
    const plateHeight = 4;
    const bearingY = centerY + beamHeight / 2;
    
    // Left bearing
    const leftBearingX = startX + bearingDistance * scale;
    ctx.fillRect(leftBearingX - 10, bearingY, 20, plateHeight);
    ctx.fillRect(leftBearingX - 10, bearingY + plateHeight, 20, plateHeight);
    ctx.strokeRect(leftBearingX - 10, bearingY, 20, plateHeight);
    ctx.strokeRect(leftBearingX - 10, bearingY + plateHeight, 20, plateHeight);
    
    // Right bearing
    const rightBearingX = startX + (totalLength - bearingDistance) * scale;
    ctx.fillRect(rightBearingX - 10, bearingY, 20, plateHeight);
    ctx.fillRect(rightBearingX - 10, bearingY + plateHeight, 20, plateHeight);
    ctx.strokeRect(rightBearingX - 10, bearingY, 20, plateHeight);
    ctx.strokeRect(rightBearingX - 10, bearingY + plateHeight, 20, plateHeight);
    
    // Draw dimensions
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    
    // Bearing C/L dimension
    const dimY = bearingY + 30;
    ctx.beginPath();
    ctx.moveTo(leftBearingX, dimY);
    ctx.lineTo(rightBearingX, dimY);
    ctx.stroke();
    
    // Arrows
    ctx.beginPath();
    ctx.moveTo(leftBearingX, dimY - 3);
    ctx.lineTo(leftBearingX, dimY + 3);
    ctx.moveTo(rightBearingX, dimY - 3);
    ctx.lineTo(rightBearingX, dimY + 3);
    ctx.stroke();
    
    ctx.fillText(`Bearing C/L: ${bearingCL}"`, centerX - 30, dimY + 15);
    
    // Total length dimension
    const totalDimY = centerY - beamHeight / 2 - 20;
    ctx.beginPath();
    ctx.moveTo(startX, totalDimY);
    ctx.lineTo(startX + totalLength * scale, totalDimY);
    ctx.stroke();
    ctx.fillText(`Total: ${totalLength}"`, centerX - 20, totalDimY - 5);
  };
  
  useEffect(() => {
    drawSectionPreview();
    drawElevationPreview();
  }, [selectedProfile, lengthFt, lengthIn, bearingCLFt, bearingCLIn, bearingDistanceFt, bearingDistanceIn, backwallClearanceIn, breastwallDistanceFt, breastwallDistanceIn]);
  
  const handleApply = () => {
    // Update project info
    setProjectInfo({
      name: projectName,
      beamId: beamId,
      inspector: inspector
    });
    
    // Update beam profile
    const profile = BEAM_CATALOG.find(b => b.id === selectedProfile);
    if (profile) {
      setBeamProfile(profile);
    }
    
    // Update beam length
    const totalLength = lengthFt * 12 + lengthIn;
    setBeamLength(totalLength);
    
    // Update bearings
    const bearingDistance = bearingDistanceFt * 12 + bearingDistanceIn;
    setBearings(bearingDistance, bearingDistance);

    // Update abutments
    const breastwallDistance = breastwallDistanceFt * 12 + breastwallDistanceIn;
    setBeamDimensions({
      backwallClearance: backwallClearanceIn,
      breastwallDistance
    });

    onClose();
  };
  
  return (
    <div className="setup-modal-overlay" onClick={onClose}>
      <div className="setup-modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="setup-modal-header">
          <h2>Beam Configuration</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="setup-modal-content">
          <div className="setup-form">
            {/* Project Information */}
            <div className="form-section">
              <h3>Project Information</h3>
              <div className="form-row">
                <div className="form-field">
                  <label>Project Name</label>
                  <input 
                    type="text" 
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Beam ID</label>
                  <input 
                    type="text" 
                    value={beamId}
                    onChange={(e) => setBeamId(e.target.value)}
                  />
                </div>
                <div className="form-field">
                  <label>Inspector</label>
                  <input 
                    type="text" 
                    value={inspector}
                    onChange={(e) => setInspector(e.target.value)}
                  />
                </div>
              </div>
            </div>
            
            {/* Beam Profile */}
            <div className="form-section">
              <h3>Beam Profile</h3>
              <div className="form-field">
                <label>Select Profile</label>
                <select 
                  value={selectedProfile}
                  onChange={(e) => setSelectedProfile(e.target.value)}
                >
                  {BEAM_CATALOG.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} - {b.weight} lb/ft
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label>Beam Length</label>
                  <div className="dimension-input">
                    <input 
                      type="number" 
                      value={lengthFt}
                      onChange={(e) => setLengthFt(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <span>ft</span>
                    <input 
                      type="number" 
                      value={lengthIn}
                      onChange={(e) => setLengthIn(parseInt(e.target.value) || 0)}
                      min="0"
                      max="11"
                    />
                    <span>in</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Substructure Geometry */}
            <div className="form-section">
              <h3>Substructure Geometry</h3>
              <div className="form-row">
                <div className="form-field">
                  <label>Bearing C/L Spacing</label>
                  <div className="dimension-input">
                    <input 
                      type="number" 
                      value={bearingCLFt}
                      onChange={(e) => setBearingCLFt(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <span>ft</span>
                    <input 
                      type="number" 
                      value={bearingCLIn}
                      onChange={(e) => setBearingCLIn(parseInt(e.target.value) || 0)}
                      min="0"
                      max="11"
                    />
                    <span>in</span>
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Bearing Distance from End</label>
                  <div className="dimension-input">
                    <input 
                      type="number" 
                      value={bearingDistanceFt}
                      onChange={(e) => setBearingDistanceFt(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <span>ft</span>
                    <input 
                      type="number" 
                      value={bearingDistanceIn}
                      onChange={(e) => setBearingDistanceIn(parseInt(e.target.value) || 0)}
                      min="0"
                      max="11"
                    />
                    <span>in</span>
                  </div>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-field">
                  <label>Backwall Clearance</label>
                  <div className="dimension-input">
                    <input 
                      type="number" 
                      value={backwallClearanceIn}
                      onChange={(e) => setBackwallClearanceIn(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <span>in</span>
                  </div>
                </div>
                
                <div className="form-field">
                  <label>Breastwall Distance</label>
                  <div className="dimension-input">
                    <input 
                      type="number" 
                      value={breastwallDistanceFt}
                      onChange={(e) => setBreastwallDistanceFt(parseInt(e.target.value) || 0)}
                      min="0"
                    />
                    <span>ft</span>
                    <input 
                      type="number" 
                      value={breastwallDistanceIn}
                      onChange={(e) => setBreastwallDistanceIn(parseInt(e.target.value) || 0)}
                      min="0"
                      max="11"
                    />
                    <span>in</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Canvases */}
          <div className="setup-previews">
            <div className="preview-panel">
              <h3>Section View</h3>
              <canvas 
                ref={sectionCanvasRef}
                width={300}
                height={250}
                className="preview-canvas"
              />
            </div>
            
            <div className="preview-panel">
              <h3>Elevation View</h3>
              <canvas 
                ref={elevationCanvasRef}
                width={300}
                height={250}
                className="preview-canvas"
              />
            </div>
          </div>
        </div>
        
        <div className="setup-modal-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-apply" onClick={handleApply}>Apply Configuration</button>
        </div>
      </div>
    </div>
  );
};