import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { SetupModal } from '../SetupModal';

// Mock the store
vi.mock('../../../store', () => ({
  useStore: vi.fn(() => ({
    bridgeGeometry: {
      profile: { id: 'W12X26', depth: 12.22, flangeWidth: 6.49 },
      length: 240,
      bearings: {
        left: { distance: 12 },
        right: { distance: 12 }
      },
      abutments: {
        left: { backwallClearance: 2 },
        right: { backwallClearance: 2 }
      },
      constraints: {
        breastwallDistance: 200
      }
    },
    project: {
      name: 'Test Project',
      beamId: 'Beam 1',
      inspector: 'Test Inspector'
    },
    setBeamProfile: vi.fn(),
    setBeamLength: vi.fn(),
    setBearingDistance: vi.fn(),
    setBackwallClearance: vi.fn(),
    setBreastwallDistance: vi.fn(),
    setProjectMetadata: vi.fn()
  }))
}));

// Mock the beam catalog
vi.mock('../../../data/beamCatalog', () => ({
  BEAM_CATALOG: [
    { id: 'W12X26', depth: 12.22, flangeWidth: 6.49, flangeThickness: 0.38, webThickness: 0.23 },
    { id: 'W14X30', depth: 13.84, flangeWidth: 6.73, flangeThickness: 0.38, webThickness: 0.27 }
  ]
}));

describe('SetupModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render the modal with correct title', () => {
    render(<SetupModal onClose={mockOnClose} />);
    expect(screen.getByText('Beam Configuration')).toBeInTheDocument();
  });

  it('should render project information fields', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Project Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Beam ID')).toBeInTheDocument();
    expect(screen.getByLabelText('Inspector')).toBeInTheDocument();
  });

  it('should render beam profile selector', () => {
    render(<SetupModal onClose={mockOnClose} />);
    expect(screen.getByLabelText('Beam Profile')).toBeInTheDocument();
  });

  it('should render beam length inputs', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Length (ft)')).toBeInTheDocument();
    expect(screen.getByLabelText('Length (in)')).toBeInTheDocument();
  });

  it('should render bearing distance inputs', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Bearing Distance (ft)')).toBeInTheDocument();
    expect(screen.getByLabelText('Bearing Distance (in)')).toBeInTheDocument();
  });

  it('should render abutment configuration inputs', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    expect(screen.getByLabelText('Backwall Clearance')).toBeInTheDocument();
    expect(screen.getByLabelText('Breastwall Distance (ft)')).toBeInTheDocument();
    expect(screen.getByLabelText('Breastwall Distance (in)')).toBeInTheDocument();
  });

  it('should display computed seat width', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    // The computed seat width should be displayed (22 inches for default values)
    expect(screen.getByDisplayValue('22 in')).toBeInTheDocument();
  });

  it('should have Apply Configuration button', () => {
    render(<SetupModal onClose={mockOnClose} />);
    expect(screen.getByText('Apply Configuration')).toBeInTheDocument();
  });

  it('should have Cancel button', () => {
    render(<SetupModal onClose={mockOnClose} />);
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should close modal when Cancel is clicked', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when close button is clicked', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('×'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should close modal when clicking outside', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    // Click on the overlay
    const overlay = screen.getByText('Beam Configuration').closest('.setup-modal-overlay');
    fireEvent.click(overlay!);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should not close modal when clicking inside', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    // Click on the modal content
    const modalContent = screen.getByText('Beam Configuration').closest('.setup-modal-container');
    fireEvent.click(modalContent!);
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should render preview canvases', () => {
    render(<SetupModal onClose={mockOnClose} />);
    
    expect(screen.getByText('Section View')).toBeInTheDocument();
    expect(screen.getByText('Elevation View')).toBeInTheDocument();
  });
}); 