"""CAD Generation module using CadQuery"""
import cadquery as cq
from typing import Dict, Any, List, Tuple
import json
import math

class CADGenerator:
    """Generate parametric CAD models from structured parameters"""
    
    def __init__(self):
        self.workplane = cq.Workplane("XY")
    
    def generate_bracket(self, params: Dict[str, Any]) -> cq.Workplane:
        """Generate a motor bracket"""
        length = params.get('base_length', 100)
        width = params.get('base_width', 80)
        height = params.get('height', 45)
        wall_thickness = params.get('wall_thickness', 2.5)
        
        # Create base plate
        result = (cq.Workplane("XY")
                 .box(length, width, wall_thickness)
                 .faces(">Z").workplane()
                 )
        
        # Add vertical walls if height > base thickness
        if height > wall_thickness:
            # Back wall
            result = (result
                     .workplane(offset=0)
                     .center(0, -width/2 + wall_thickness/2)
                     .box(length, wall_thickness, height - wall_thickness)
                     )
            
            # Side walls
            result = (result
                     .faces(">Z").workplane()
                     .center(-length/2 + wall_thickness/2, 0)
                     .box(wall_thickness, width - 2*wall_thickness, height - wall_thickness)
                     )
            
            result = (result
                     .faces(">Z").workplane()
                     .center(length/2 - wall_thickness/2, 0)
                     .box(wall_thickness, width - 2*wall_thickness, height - wall_thickness)
                     )
        
        # Add mounting holes if specified
        if 'mounting_pattern' in params:
            hole_params = params['mounting_pattern']
            positions = hole_params.get('positions', [])
            hole_diameter = hole_params.get('hole_diameter', 4.5)
            
            for pos in positions:
                x, y = pos
                # Convert to center-based coordinates
                x_offset = x - length/2
                y_offset = y - width/2
                result = result.faces(">Z").workplane().center(x_offset, y_offset).hole(hole_diameter)
        
        # Add reinforcement ribs if specified
        if 'features' in params:
            for feature in params['features']:
                if feature.get('type') == 'rib':
                    rib_dims = feature.get('dimensions', [80, 1.5, 30])
                    rib_length, rib_thickness, rib_height = rib_dims
                    # Add rib to back plate
                    result = (result
                             .faces(">Z").workplane()
                             .center(0, -width/2 + wall_thickness + rib_thickness/2)
                             .box(rib_length, rib_thickness, rib_height)
                             )
        
        return result
    
    def generate_box(self, params: Dict[str, Any]) -> cq.Workplane:
        """Generate a simple box/housing"""
        length = params.get('length', 100)
        width = params.get('width', 80)
        height = params.get('height', 50)
        wall_thickness = params.get('wall_thickness', 2.0)
        
        # Create hollow box
        outer_box = cq.Workplane("XY").box(length, width, height)
        inner_box = cq.Workplane("XY").workplane(offset=wall_thickness).box(
            length - 2*wall_thickness,
            width - 2*wall_thickness,
            height - wall_thickness
        )
        
        result = outer_box.cut(inner_box)
        
        # Add holes if specified
        if 'holes' in params:
            for hole in params['holes']:
                x, y = hole.get('position', [0, 0])
                diameter = hole.get('diameter', 5)
                result = result.faces(">Z").workplane().center(x, y).hole(diameter)
        
        return result
    
    def generate_cylinder(self, params: Dict[str, Any]) -> cq.Workplane:
        """Generate a cylinder"""
        radius = params.get('radius', 25)
        height = params.get('height', 50)
        
        result = cq.Workplane("XY").cylinder(height, radius)
        
        # Make hollow if specified
        if params.get('hollow', False):
            inner_radius = params.get('inner_radius', radius * 0.8)
            inner_cylinder = cq.Workplane("XY").cylinder(height, inner_radius)
            result = result.cut(inner_cylinder)
        
        return result
    
    def generate_gear(self, params: Dict[str, Any]) -> cq.Workplane:
        """Generate a simple spur gear"""
        module = params.get('module', 1.0)
        num_teeth = params.get('num_teeth', 20)
        thickness = params.get('thickness', 10)
        bore_diameter = params.get('bore_diameter', 8)
        
        # Simplified gear generation
        pitch_diameter = module * num_teeth
        outer_diameter = pitch_diameter + 2 * module
        
        # Create gear blank
        result = cq.Workplane("XY").cylinder(thickness, outer_diameter / 2)
        
        # Add center bore
        if bore_diameter > 0:
            result = result.faces(">Z").workplane().hole(bore_diameter)
        
        # Note: Full involute gear teeth would require more complex geometry
        # This is a simplified version for MVP
        
        return result
    
    def generate_custom(self, params: Dict[str, Any]) -> cq.Workplane:
        """Generate custom geometry based on type"""
        geometry_type = params.get('type', 'box').lower()
        
        if geometry_type == 'bracket':
            return self.generate_bracket(params)
        elif geometry_type == 'box' or geometry_type == 'housing':
            return self.generate_box(params)
        elif geometry_type == 'cylinder':
            return self.generate_cylinder(params)
        elif geometry_type == 'gear':
            return self.generate_gear(params)
        else:
            # Default to box
            return self.generate_box(params)
    
    def export_step(self, workplane: cq.Workplane, filepath: str) -> bool:
        """Export to STEP format"""
        try:
            cq.exporters.export(workplane, filepath)
            return True
        except Exception as e:
            print(f"Error exporting STEP: {e}")
            return False
    
    def export_stl(self, workplane: cq.Workplane, filepath: str) -> bool:
        """Export to STL format"""
        try:
            cq.exporters.export(workplane, filepath)
            return True
        except Exception as e:
            print(f"Error exporting STL: {e}")
            return False
    
    def get_bounding_box(self, workplane: cq.Workplane) -> Dict[str, float]:
        """Get bounding box dimensions"""
        try:
            bb = workplane.val().BoundingBox()
            return {
                'length': bb.xlen,
                'width': bb.ylen,
                'height': bb.zlen,
                'volume': bb.xlen * bb.ylen * bb.zlen
            }
        except:
            return {'length': 0, 'width': 0, 'height': 0, 'volume': 0}
