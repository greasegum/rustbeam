import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store';
import { BEAM_CATALOG } from '../../data/beamCatalog';
import './SetupModal.css';

interface SetupModalProps {
  onClose: () => void;
}

export const SetupModal: React.FC<SetupModalProps> = ({ onClose }) => {
  const { 
    bridgeGeometry, 
    project, 
    setBeamProfile, 
    setBeamLength, 
    setBearingDistance, 
    setBackwallClearance, 
    setBreastwallDistance,
    setProjectMetadata 
  } = useStore();
  
  // Canvas refs for previews
  const sectionCanvasRef = useRef<HTMLCanvasElement>(null);
  const elevationCanvasRef = useRef<HTMLCanvasElement>(null);
  
  // Form state
  const [projectName, setProjectName] = useState(project.name);
  const [beamId, setBeamId] = useState(project.beamId || 'Beam 1');
  const [inspector, setInspector] = useState(project.inspector || '');
  const [selectedProfile, setSelectedProfile] = useState(bridgeGeometry.profile?.id || 'W12X26');
  
  // Beam dimensions
  const [lengthFt, setLengthFt] = useState(Math.floor(bridgeGeometry.length / 12));
  const [lengthIn, setLengthIn] = useState(bridgeGeometry.length % 12);
  
  // Substructure dimensions
  const leftBearing = bridgeGeometry.bearings.left.distance;
  const rightBearing = bridgeGeometry.bearings.right.distance;
  const [bearingCLFt, setBearingCLFt] = useState(Math.floor((bridgeGeometry.length - leftBearing - rightBearing) / 12));
  const [bearingCLIn, setBearingCLIn] = useState((bridgeGeometry.length - leftBearing - rightBearing) % 12);
  const [bearingDistanceFt, setBearingDistanceFt] = useState(Math.floor(leftBearing / 12));
  const [bearingDistanceIn, setBearingDistanceIn] = useState(leftBearing % 12);
  const [backwallClearanceIn, setBackwallClearanceIn] = useState(bridgeGeometry.abutments.left.backwallClearance);
  const [breastwallDistanceFt, setBreastwallDistanceFt] = useState(Math.floor(bridgeGeometry.constraints.breastwallDistance / 12));
  const [breastwallDistanceIn, setBreastwallDistanceIn] = useState(bridgeGeometry.constraints.breastwallDistance % 12);
  
  // Compute seat width based on current parameters
  const computedSeatWidth = () => {
    const totalLength = lengthFt * 12 + lengthIn;
    const breastwallDist = breastwallDistanceFt * 12 + breastwallDistanceIn;
    return Math.round((totalLength + 2 * backwallClearanceIn - breastwallDist) / 2);
  };
  
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
    const centerX = canvas.width / 2;
    const startX = 30;
    
    // Draw beam (side view)
    ctx.fillStyle = '#4CAF5020';
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    
    const beamHeight = profile.depth * scale;
    ctx.fillRect(startX, centerY - beamHeight / 2, totalLength * scale, beamHeight);
    ctx.strokeRect(startX, centerY - beamHeight / 2, totalLength * scale, beamHeight);
    
    // Draw stepped abutments (matching main scene geometry)
    ctx.fillStyle = '#FFE66D80'; // Light yellow matching main scene
    ctx.strokeStyle = '#999999';
    ctx.lineWidth = 1.5;
    
    // Calculate proper abutment dimensions
    const seatWidth = computedSeatWidth();
    const abutmentHeight = beamHeight * 2; // Taller for better visibility
    const backwallWidth = Math.max(seatWidth * 0.3, 15); // At least 15px wide
    const beamTop = centerY - beamHeight / 2;
    const beamBottom = centerY + beamHeight / 2;
    const seatY = beamBottom + 8; // 8px below beam for bearing space
    
    // Left abutment (stepped shape)
    const leftBeamEnd = startX;
    const leftBackwallOuter = leftBeamEnd - backwallClear * scale;
    const leftBackwallInner = leftBackwallOuter + backwallWidth;
    const leftBreastwall = startX + (totalLength - breastwallDist) * scale / 2;
    
    ctx.beginPath();
    // Start at backwall top-outer
    ctx.moveTo(leftBackwallOuter, beamTop);
    // Top edge to backwall inner
    ctx.lineTo(leftBackwallInner, beamTop);
    // Down to seat level 
    ctx.lineTo(leftBackwallInner, seatY);
    // Across seat to breastwall
    ctx.lineTo(leftBreastwall, seatY);
    // Down breastwall
    ctx.lineTo(leftBreastwall, seatY + seatWidth * scale);
    // Bottom edge back to backwall
    ctx.lineTo(leftBackwallOuter, seatY + seatWidth * scale);
    // Up backwall outer edge
    ctx.lineTo(leftBackwallOuter, beamTop);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Right abutment (stepped shape mirrored)
    const rightBeamEnd = startX + totalLength * scale;
    const rightBackwallOuter = rightBeamEnd + backwallClear * scale;
    const rightBackwallInner = rightBackwallOuter - backwallWidth;
    const rightBreastwall = startX + totalLength * scale - (totalLength - breastwallDist) * scale / 2;
    
    ctx.beginPath();
    // Start at backwall top-outer
    ctx.moveTo(rightBackwallOuter, beamTop);
    // Top edge to backwall inner
    ctx.lineTo(rightBackwallInner, beamTop);
    // Down to seat level
    ctx.lineTo(rightBackwallInner, seatY);
    // Across seat to breastwall
    ctx.lineTo(rightBreastwall, seatY);
    // Down breastwall
    ctx.lineTo(rightBreastwall, seatY + seatWidth * scale);
    // Bottom edge back to backwall
    ctx.lineTo(rightBackwallOuter, seatY + seatWidth * scale);
    // Up backwall outer edge
    ctx.lineTo(rightBackwallOuter, beamTop);
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
    console.log('🔧 Apply button clicked - updating bridge geometry');
    
    // Update project info
    setProjectMetadata({
      name: projectName,
      beamId: beamId,
      inspector: inspector
    });
    
    // Update beam profile
    const profile = BEAM_CATALOG.find(b => b.id === selectedProfile);
    if (profile) {
      console.log('📏 Setting beam profile:', profile.id);
      setBeamProfile(profile);
    }
    
    // Update beam length
    const totalLength = lengthFt * 12 + lengthIn;
    console.log('📐 Setting beam length:', totalLength);
    setBeamLength(totalLength);
    
    // Update bearings for both sides
    const bearingDistance = bearingDistanceFt * 12 + bearingDistanceIn;
    console.log('🔗 Setting bearing distance:', bearingDistance);
    setBearingDistance('left', bearingDistance);
    setBearingDistance('right', bearingDistance);

    // Update abutments (both sides use same backwall clearance for now)
    console.log('🏗️ Setting backwall clearance:', backwallClearanceIn);
    setBackwallClearance('left', backwallClearanceIn);
    setBackwallClearance('right', backwallClearanceIn);
    
    // Update breastwall distance (global constraint)
    const breastwallDistance = breastwallDistanceFt * 12 + breastwallDistanceIn;
    console.log('📏 Setting breastwall distance:', breastwallDistance);
    setBreastwallDistance(breastwallDistance);

    console.log('✅ Bridge geometry updated successfully');
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
                
                <div className="form-field">
                  <label>Seat Width (Computed)</label>
                  <div className="dimension-input">
                    <input 
                      type="text" 
                      value={`${computedSeatWidth()} in`}
                      readOnly
                      style={{ backgroundColor: '#f0f0f0', cursor: 'not-allowed' }}
                      title={`Computed: (${lengthFt * 12 + lengthIn} + 2×${backwallClearanceIn} - ${breastwallDistanceFt * 12 + breastwallDistanceIn}) ÷ 2`}
                    />
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