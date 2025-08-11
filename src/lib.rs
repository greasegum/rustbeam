// VisualBeam - Rust-based Structural Beam Inspection System
// A high-performance implementation inspired by phaserBeam

pub mod data;

// Re-export commonly used types
pub use data::beam_catalog::{BeamDimensions, get_beam_catalog, get_beam_by_id};