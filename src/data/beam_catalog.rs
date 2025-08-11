// Comprehensive Wide Flange Beam Catalog
// Adapted from phaserBeam reference implementation
// All dimensions in inches, weight in pounds per foot

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BeamDimensions {
    /// Unique identifier for the beam profile
    pub id: String,
    /// Human-readable designation (e.g., "36\" WF 300#")
    pub designation: String,
    /// Total depth in inches
    pub depth: f64,
    /// Web thickness in inches
    pub web_thickness: f64,
    /// Flange width in inches
    pub flange_width: f64,
    /// Flange thickness in inches
    pub flange_thickness: f64,
    /// Weight per foot in pounds
    pub weight: f64,
    /// Interior fillet radius in inches
    pub fillet_radius: f64,
}

impl BeamDimensions {
    pub fn new(
        id: impl Into<String>,
        designation: impl Into<String>,
        depth: f64,
        web_thickness: f64,
        flange_width: f64,
        flange_thickness: f64,
        weight: f64,
        fillet_radius: f64,
    ) -> Self {
        Self {
            id: id.into(),
            designation: designation.into(),
            depth,
            web_thickness,
            flange_width,
            flange_thickness,
            weight,
            fillet_radius,
        }
    }

    /// Calculate the cross-sectional area in square inches
    pub fn area(&self) -> f64 {
        // Approximate area calculation based on weight
        // Steel density is approximately 490 lbs/ft³
        self.weight / 3.4 // Simplified conversion factor
    }

    /// Calculate the moment of inertia about the strong axis (Ix)
    /// This is a simplified approximation
    pub fn moment_of_inertia_x(&self) -> f64 {
        let web_height = self.depth - 2.0 * self.flange_thickness;
        let web_ix = (self.web_thickness * web_height.powi(3)) / 12.0;
        let flange_ix = 2.0 * (
            (self.flange_width * self.flange_thickness.powi(3)) / 12.0 +
            self.flange_width * self.flange_thickness * 
            ((self.depth - self.flange_thickness) / 2.0).powi(2)
        );
        web_ix + flange_ix
    }
}

/// Lazily initialized beam catalog
pub fn get_beam_catalog() -> Vec<BeamDimensions> {
    vec![
        // 36" WF Series
        BeamDimensions::new("36wf300", "36\" WF 300#", 36.75, 0.9375, 16.625, 1.6875, 300.0, 1.02),
        BeamDimensions::new("36wf280", "36\" WF 280#", 36.5, 0.875, 16.625, 1.5625, 280.0, 1.02),
        BeamDimensions::new("36wf260", "36\" WF 260#", 36.25, 0.8125, 16.5, 1.4375, 260.0, 1.02),
        BeamDimensions::new("36wf245", "36\" WF 245#", 36.125, 0.75, 16.5, 1.375, 245.0, 1.02),
        BeamDimensions::new("36wf230", "36\" WF 230#", 35.875, 0.75, 16.5, 1.25, 230.0, 1.02),
        BeamDimensions::new("36wf194", "36\" WF 194#", 36.5, 0.75, 12.125, 1.25, 194.0, 0.80),
        BeamDimensions::new("36wf182", "36\" WF 182#", 36.375, 0.6875, 12.125, 1.1875, 182.0, 0.80),
        BeamDimensions::new("36wf170", "36\" WF 170#", 36.25, 0.625, 12.0, 1.125, 170.0, 0.80),
        BeamDimensions::new("36wf160", "36\" WF 160#", 36.0, 0.625, 12.0, 1.0, 160.0, 0.80),
        BeamDimensions::new("36wf150", "36\" WF 150#", 35.875, 0.5625, 12.0, 0.9375, 150.0, 0.80),
        
        // 33" WF Series
        BeamDimensions::new("33wf240", "33\" WF 240#", 33.5, 0.8125, 15.875, 1.375, 240.0, 0.96),
        BeamDimensions::new("33wf220", "33\" WF 220#", 33.25, 0.75, 15.875, 1.25, 220.0, 0.96),
        BeamDimensions::new("33wf200", "33\" WF 200#", 33.0, 0.6875, 15.75, 1.125, 200.0, 0.96),
        BeamDimensions::new("33wf152", "33\" WF 152#", 33.5, 0.625, 11.625, 1.0625, 152.0, 0.75),
        BeamDimensions::new("33wf141", "33\" WF 141#", 33.375, 0.5625, 11.5, 1.0, 141.0, 0.75),
        BeamDimensions::new("33wf130", "33\" WF 130#", 33.25, 0.5, 11.5, 0.875, 130.0, 0.75),
        
        // 30" WF Series
        BeamDimensions::new("30wf210", "30\" WF 210#", 30.375, 0.75, 15.125, 1.3125, 210.0, 0.91),
        BeamDimensions::new("30wf190", "30\" WF 190#", 30.125, 0.6875, 15.0, 1.1875, 190.0, 0.91),
        BeamDimensions::new("30wf172", "30\" WF 172#", 29.875, 0.625, 15.0, 1.0625, 172.0, 0.91),
        BeamDimensions::new("30wf132", "30\" WF 132#", 30.25, 0.5625, 10.5625, 1.0, 132.0, 0.70),
        BeamDimensions::new("30wf124", "30\" WF 124#", 30.125, 0.5, 10.5, 0.9375, 124.0, 0.70),
        BeamDimensions::new("30wf116", "30\" WF 116#", 30.0, 0.5, 10.5, 0.875, 116.0, 0.70),
        BeamDimensions::new("30wf108", "30\" WF 108#", 29.875, 0.4375, 10.5, 0.75, 108.0, 0.70),
        
        // 27" WF Series
        BeamDimensions::new("27wf177", "27\" WF 177#", 27.375, 0.6875, 14.125, 1.1875, 177.0, 0.86),
        BeamDimensions::new("27wf160", "27\" WF 160#", 27.125, 0.625, 14.0, 1.0625, 160.0, 0.86),
        BeamDimensions::new("27wf145", "27\" WF 145#", 26.875, 0.5625, 14.0, 0.9375, 145.0, 0.86),
        BeamDimensions::new("27wf114", "27\" WF 114#", 27.25, 0.5, 10.125, 0.9375, 114.0, 0.64),
        BeamDimensions::new("27wf102", "27\" WF 102#", 27.0, 0.5, 10.0, 0.8125, 102.0, 0.64),
        BeamDimensions::new("27wf94", "27\" WF 94#", 26.875, 0.4375, 10.0, 0.75, 94.0, 0.64),
        
        // 24" WF Series
        BeamDimensions::new("24wf160", "24\" WF 160#", 24.625, 0.625, 14.125, 1.0625, 160.0, 0.70),
        BeamDimensions::new("24wf145", "24\" WF 145#", 24.375, 0.5625, 14.0, 0.9375, 145.0, 0.70),
        BeamDimensions::new("24wf130", "24\" WF 130#", 24.25, 0.5, 14.0, 0.875, 130.0, 0.70),
        BeamDimensions::new("24wf120", "24\" WF 120#", 24.25, 0.5625, 12.125, 0.9375, 120.0, 0.70),
        BeamDimensions::new("24wf110", "24\" WF 110#", 24.125, 0.5, 12.0, 0.875, 110.0, 0.70),
        BeamDimensions::new("24wf100", "24\" WF 100#", 24.0, 0.4375, 12.0, 0.75, 100.0, 0.70),
        BeamDimensions::new("24wf94", "24\" WF 94#", 24.25, 0.5, 9.0, 0.875, 94.0, 0.54),
        BeamDimensions::new("24wf84", "24\" WF 84#", 24.125, 0.4375, 9.0, 0.75, 84.0, 0.54),
        BeamDimensions::new("24wf76", "24\" WF 76#", 23.875, 0.4375, 9.0, 0.6875, 76.0, 0.54),
        
        // 21" WF Series
        BeamDimensions::new("21wf142", "21\" WF 142#", 21.5, 0.625, 13.125, 1.0625, 142.0, 0.65),
        BeamDimensions::new("21wf127", "21\" WF 127#", 21.25, 0.5625, 13.0, 1.0, 127.0, 0.65),
        BeamDimensions::new("21wf112", "21\" WF 112#", 21.125, 0.5, 13.0, 0.875, 112.0, 0.65),
        BeamDimensions::new("21wf96", "21\" WF 96#", 21.125, 0.5625, 9.0, 0.9375, 96.0, 0.65),
        BeamDimensions::new("21wf82", "21\" WF 82#", 20.875, 0.5, 9.0, 0.8125, 82.0, 0.65),
        BeamDimensions::new("21wf73", "21\" WF 73#", 21.25, 0.4375, 8.25, 0.75, 73.0, 0.58),
        BeamDimensions::new("21wf68", "21\" WF 68#", 21.125, 0.4375, 8.25, 0.6875, 68.0, 0.58),
        BeamDimensions::new("21wf62", "21\" WF 62#", 21.0, 0.375, 8.25, 0.625, 62.0, 0.58),
        
        // 18" WF Series
        BeamDimensions::new("18wf114", "18\" WF 114#", 18.5, 0.5625, 11.875, 1.0, 114.0, 0.60),
        BeamDimensions::new("18wf105", "18\" WF 105#", 18.375, 0.5, 11.875, 0.9375, 105.0, 0.60),
        BeamDimensions::new("18wf96", "18\" WF 96#", 18.25, 0.5, 11.875, 0.875, 96.0, 0.60),
        BeamDimensions::new("18wf85", "18\" WF 85#", 18.375, 0.5, 8.875, 0.9375, 85.0, 0.45),
        BeamDimensions::new("18wf77", "18\" WF 77#", 18.25, 0.4375, 8.875, 0.875, 77.0, 0.45),
        BeamDimensions::new("18wf70", "18\" WF 70#", 18.0, 0.4375, 8.75, 0.75, 70.0, 0.45),
        BeamDimensions::new("18wf64", "18\" WF 64#", 17.875, 0.375, 8.75, 0.6875, 64.0, 0.45),
        BeamDimensions::new("18wf60", "18\" WF 60#", 18.125, 0.4375, 7.5, 0.6875, 60.0, 0.43),
        BeamDimensions::new("18wf55", "18\" WF 55#", 18.0, 0.375, 7.5, 0.625, 55.0, 0.43),
        BeamDimensions::new("18wf50", "18\" WF 50#", 18.0, 0.375, 7.5, 0.5625, 50.0, 0.43),
        
        // Additional series would continue here...
        // This is a partial implementation focusing on the most common sizes
        // The full catalog contains approximately 150 beam profiles
    ]
}

/// Get a beam profile by its ID
pub fn get_beam_by_id(id: &str) -> Option<BeamDimensions> {
    get_beam_catalog()
        .into_iter()
        .find(|beam| beam.id == id)
}

/// Get all beams of a specific depth range
pub fn get_beams_by_depth_range(min_depth: f64, max_depth: f64) -> Vec<BeamDimensions> {
    get_beam_catalog()
        .into_iter()
        .filter(|beam| beam.depth >= min_depth && beam.depth <= max_depth)
        .collect()
}

/// Get all beams within a weight range
pub fn get_beams_by_weight_range(min_weight: f64, max_weight: f64) -> Vec<BeamDimensions> {
    get_beam_catalog()
        .into_iter()
        .filter(|beam| beam.weight >= min_weight && beam.weight <= max_weight)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_beam_catalog_loading() {
        let catalog = get_beam_catalog();
        assert!(!catalog.is_empty());
        assert!(catalog.len() > 50);
    }

    #[test]
    fn test_get_beam_by_id() {
        let beam = get_beam_by_id("36wf300").unwrap();
        assert_eq!(beam.designation, "36\" WF 300#");
        assert_eq!(beam.weight, 300.0);
    }

    #[test]
    fn test_beam_calculations() {
        let beam = get_beam_by_id("24wf100").unwrap();
        let area = beam.area();
        assert!(area > 0.0);
        
        let ix = beam.moment_of_inertia_x();
        assert!(ix > 0.0);
    }

    #[test]
    fn test_depth_range_query() {
        let beams = get_beams_by_depth_range(24.0, 30.0);
        assert!(!beams.is_empty());
        for beam in beams {
            assert!(beam.depth >= 24.0 && beam.depth <= 30.0);
        }
    }
}