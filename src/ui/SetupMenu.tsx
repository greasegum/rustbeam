import React, { useState } from 'react';
import { useStore } from '../store';
import { BEAM_CATALOG } from '../data/beamCatalog';
import './SetupMenu.css';

export const SetupMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'project' | 'beam' | 'geometry'>('beam');
  
  const { beam, project, setBeamProfile, setBeamLength, setBearings, setProjectInfo, setGridSize } = useStore();
  
  // Local state for form inputs
  const [lengthFt, setLengthFt] = useState(Math.floor(beam.length / 12));
  const [lengthIn, setLengthIn] = useState(beam.length % 12);
  const [bearingDistanceFt, setBearingDistanceFt] = useState(Math.floor(beam.leftBearing / 12));
  const [bearingDistanceIn, setBearingDistanceIn] = useState(beam.leftBearing % 12);
  const [gridSizeIn, setGridSizeIn] = useState(1); // Default 1" grid
  
  const handleProfileChange = (profileId: string) => {
    const profile = BEAM_CATALOG.find(b => b.id === profileId);
    if (profile) {
      setBeamProfile(profile);
    }
  };
  
  const handleLengthChange = () => {
    const totalInches = lengthFt * 12 + lengthIn;
    setBeamLength(totalInches);
  };
  
  const handleBearingChange = () => {
    const bearingDistance = bearingDistanceFt * 12 + bearingDistanceIn;
    setBearings(bearingDistance, bearingDistance);
  };
  
  const handleGridSizeChange = (size: number) => {
    setGridSizeIn(size);
    setGridSize(size);
  };
  
  const handleApply = () => {
    handleLengthChange();
    handleBearingChange();
    handleGridSizeChange(gridSizeIn);
    setIsOpen(false);
  };
  
  return (
    <>
      {/* Setup Button */}
      <button 
        className="setup-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        title="Beam Setup"
      >
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.08-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" 
            fill="currentColor"/>
        </svg>
      </button>
      
      {/* Setup Menu Modal */}
      {isOpen && (
        <div className="setup-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="setup-modal" onClick={(e) => e.stopPropagation()}>
            <div className="setup-header">
              <h2>Beam Configuration</h2>
              <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
            </div>
            
            {/* Tabs */}
            <div className="setup-tabs">
              <button 
                className={`tab-btn ${activeTab === 'project' ? 'active' : ''}`}
                onClick={() => setActiveTab('project')}
              >
                Project
              </button>
              <button 
                className={`tab-btn ${activeTab === 'beam' ? 'active' : ''}`}
                onClick={() => setActiveTab('beam')}
              >
                Beam
              </button>
              <button 
                className={`tab-btn ${activeTab === 'geometry' ? 'active' : ''}`}
                onClick={() => setActiveTab('geometry')}
              >
                Geometry
              </button>
            </div>
            
            {/* Tab Content */}
            <div className="setup-content">
              {/* Project Tab */}
              {activeTab === 'project' && (
                <div className="tab-panel">
                  <div className="form-group">
                    <label htmlFor="project-name">Project Name</label>
                    <input 
                      type="text" 
                      id="project-name"
                      defaultValue={project.name}
                      onChange={(e) => setProjectInfo({ ...project, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="beam-id">Beam ID</label>
                    <input 
                      type="text" 
                      id="beam-id"
                      defaultValue={project.beamId}
                      onChange={(e) => setProjectInfo({ ...project, beamId: e.target.value })}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="inspector">Inspector</label>
                    <input 
                      type="text" 
                      id="inspector"
                      defaultValue={project.inspector}
                      onChange={(e) => setProjectInfo({ ...project, inspector: e.target.value })}
                    />
                  </div>
                </div>
              )}
              
              {/* Beam Tab */}
              {activeTab === 'beam' && (
                <div className="tab-panel">
                  <div className="form-group">
                    <label htmlFor="beam-profile">Beam Profile</label>
                    <select 
                      id="beam-profile"
                      value={beam.profile?.id || ''}
                      onChange={(e) => handleProfileChange(e.target.value)}
                    >
                      <optgroup label="8 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 8 && b.depth < 10).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="10 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 10 && b.depth < 12).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="12 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 12 && b.depth < 14).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="14-18 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 14 && b.depth < 21).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="21-24 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 21 && b.depth < 27).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="27-36 inch">
                        {BEAM_CATALOG.filter(b => b.depth >= 27).map(b => (
                          <option key={b.id} value={b.id}>
                            {b.id} ({b.weight} lb/ft)
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                  
                  {beam.profile && (
                    <div className="profile-info">
                      <div className="info-row">
                        <span>Depth: <strong>{beam.profile.depth}"</strong></span>
                        <span>Weight: <strong>{beam.profile.weight} lb/ft</strong></span>
                      </div>
                      <div className="info-row">
                        <span>Flange: <strong>{beam.profile.flangeWidth}" × {beam.profile.flangeThickness}"</strong></span>
                        <span>Web: <strong>{beam.profile.webThickness}"</strong></span>
                      </div>
                    </div>
                  )}
                  
                  <div className="form-group">
                    <label>Beam Length</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        value={lengthFt}
                        onChange={(e) => setLengthFt(parseInt(e.target.value) || 0)}
                        min="0"
                        max="100"
                      />
                      <span className="unit">ft</span>
                      <input 
                        type="number" 
                        value={lengthIn}
                        onChange={(e) => setLengthIn(parseInt(e.target.value) || 0)}
                        min="0"
                        max="11"
                      />
                      <span className="unit">in</span>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label htmlFor="grid-size">Grid Size</label>
                    <select 
                      id="grid-size"
                      value={gridSizeIn}
                      onChange={(e) => setGridSizeIn(parseInt(e.target.value))}
                    >
                      <option value="1">1 inch (Detailed)</option>
                      <option value="3">3 inch (Fine)</option>
                      <option value="6">6 inch (Standard)</option>
                      <option value="12">12 inch (Coarse)</option>
                      <option value="24">24 inch (Rapid)</option>
                    </select>
                  </div>
                </div>
              )}
              
              {/* Geometry Tab */}
              {activeTab === 'geometry' && (
                <div className="tab-panel">
                  <div className="form-group">
                    <label>Bearing Distance from End</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        value={bearingDistanceFt}
                        onChange={(e) => setBearingDistanceFt(parseInt(e.target.value) || 0)}
                        min="0"
                        max="10"
                      />
                      <span className="unit">ft</span>
                      <input 
                        type="number" 
                        value={bearingDistanceIn}
                        onChange={(e) => setBearingDistanceIn(parseInt(e.target.value) || 0)}
                        min="0"
                        max="11"
                      />
                      <span className="unit">in</span>
                    </div>
                  </div>
                  
                  <div className="calculated-info">
                    <div className="info-row">
                      <span>Total Length: <strong>{beam.length}"</strong></span>
                    </div>
                    <div className="info-row">
                      <span>Bearing C/L: <strong>{beam.length - 2 * beam.leftBearing}"</strong></span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="setup-footer">
              <button className="btn-cancel" onClick={() => setIsOpen(false)}>
                Cancel
              </button>
              <button className="btn-apply" onClick={handleApply}>
                Apply Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};