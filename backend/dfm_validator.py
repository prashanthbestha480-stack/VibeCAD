"""Design for Manufacturing (DFM) validation engine"""
from typing import Dict, Any, List
import math

class DFMValidator:
    """Validate designs against manufacturing rules"""
    
    def __init__(self):
        self.rules = self._load_rules()
    
    def _load_rules(self) -> Dict[str, Any]:
        """Load DFM rules for different materials and processes"""
        return {
            'aluminum_6061_t6': {
                'cnc_milling': {
                    'min_wall_thickness': 1.5,
                    'recommended_wall_thickness': [2.0, 3.0],
                    'max_wall_thickness': 8.0,
                    'min_radius': 0.5,
                    'recommended_radius': [1.5, 2.0],
                    'min_hole_diameter': 3.0,
                    'min_hole_spacing': 5.0,
                    'min_edge_distance': 3.0,  # 3x hole diameter
                    'max_hole_depth_ratio': 5.0  # depth/diameter
                }
            },
            'steel_mild': {
                'cnc_milling': {
                    'min_wall_thickness': 1.0,
                    'recommended_wall_thickness': [1.5, 2.5],
                    'max_wall_thickness': 10.0,
                    'min_radius': 0.5,
                    'recommended_radius': [1.0, 2.0],
                    'min_hole_diameter': 2.5,
                    'min_hole_spacing': 5.0,
                    'min_edge_distance': 3.0
                }
            },
            'plastic_abs': {
                '3d_printing': {
                    'min_wall_thickness': 0.8,
                    'recommended_wall_thickness': [1.2, 2.0],
                    'max_overhang_angle': 45,
                    'min_radius': 0.3,
                    'recommended_infill': [15, 20],
                    'layer_height': 0.2
                }
            },
            'stainless_304': {
                'cnc_milling': {
                    'min_wall_thickness': 1.0,
                    'recommended_wall_thickness': [1.5, 3.0],
                    'min_radius': 0.8,
                    'recommended_radius': [1.5, 2.5],
                    'min_hole_diameter': 3.0,
                    'hardness_note': 'Harder to machine, recommend slower feeds'
                }
            }
        }
    
    def validate(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """Validate design parameters against DFM rules"""
        material = params.get('material', 'aluminum_6061_t6')
        process = params.get('manufacturing_process', 'cnc_milling')
        
        issues = []
        warnings = []
        suggestions = []
        
        # Get applicable rules
        material_rules = self.rules.get(material, {})
        process_rules = material_rules.get(process, {})
        
        if not process_rules:
            warnings.append(f"No DFM rules found for {material} + {process}")
            return {
                'valid': True,
                'issues': issues,
                'warnings': warnings,
                'suggestions': suggestions,
                'confidence': 0.5
            }
        
        # Check wall thickness
        geometry = params.get('primary_geometry', {})
        wall_thickness = geometry.get('wall_thickness', 2.0)
        
        min_wall = process_rules.get('min_wall_thickness', 1.0)
        max_wall = process_rules.get('max_wall_thickness', 10.0)
        recommended_wall = process_rules.get('recommended_wall_thickness', [2.0, 3.0])
        
        if wall_thickness < min_wall:
            issues.append({
                'type': 'wall_thickness',
                'severity': 'critical',
                'message': f"Wall thickness {wall_thickness}mm is below minimum {min_wall}mm for {material}",
                'recommendation': f"Increase to at least {min_wall}mm"
            })
        elif wall_thickness > max_wall:
            warnings.append({
                'type': 'wall_thickness',
                'severity': 'warning',
                'message': f"Wall thickness {wall_thickness}mm exceeds {max_wall}mm. May cause sink marks or warping.",
                'recommendation': f"Consider adding ribs instead of thick walls"
            })
        elif wall_thickness < recommended_wall[0] or wall_thickness > recommended_wall[1]:
            suggestions.append({
                'type': 'wall_thickness',
                'message': f"Recommended wall thickness is {recommended_wall[0]}-{recommended_wall[1]}mm",
                'current_value': wall_thickness
            })
        
        # Check mounting holes
        if 'mounting_pattern' in params:
            hole_params = params['mounting_pattern']
            hole_diameter = hole_params.get('hole_diameter', 4.5)
            positions = hole_params.get('positions', [])
            
            min_hole = process_rules.get('min_hole_diameter', 3.0)
            if hole_diameter < min_hole:
                issues.append({
                    'type': 'hole_diameter',
                    'severity': 'critical',
                    'message': f"Hole diameter {hole_diameter}mm is below minimum {min_hole}mm",
                    'recommendation': f"Increase hole diameter to at least {min_hole}mm"
                })
            
            # Check hole spacing
            min_spacing = process_rules.get('min_hole_spacing', 5.0)
            for i, pos1 in enumerate(positions):
                for pos2 in positions[i+1:]:
                    distance = math.sqrt((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)
                    if distance < min_spacing:
                        warnings.append({
                            'type': 'hole_spacing',
                            'severity': 'warning',
                            'message': f"Holes at {pos1} and {pos2} are only {distance:.1f}mm apart (min {min_spacing}mm)",
                            'recommendation': f"Increase spacing to at least {min_spacing}mm"
                        })
            
            # Check edge distance
            min_edge = process_rules.get('min_edge_distance', 3.0) * hole_diameter
            base_length = geometry.get('base_length', 100)
            base_width = geometry.get('base_width', 80)
            
            for pos in positions:
                x, y = pos
                if x < min_edge or x > base_length - min_edge:
                    warnings.append({
                        'type': 'edge_distance',
                        'severity': 'warning',
                        'message': f"Hole at {pos} is too close to edge (min {min_edge:.1f}mm)"
                    })
                if y < min_edge or y > base_width - min_edge:
                    warnings.append({
                        'type': 'edge_distance',
                        'severity': 'warning',
                        'message': f"Hole at {pos} is too close to edge (min {min_edge:.1f}mm)"
                    })
        
        # Calculate confidence score
        confidence = 1.0
        if issues:
            confidence -= len(issues) * 0.2
        if warnings:
            confidence -= len(warnings) * 0.1
        confidence = max(0.0, min(1.0, confidence))
        
        return {
            'valid': len(issues) == 0,
            'issues': issues,
            'warnings': warnings,
            'suggestions': suggestions,
            'confidence': confidence,
            'dfm_score': int(confidence * 100)
        }
