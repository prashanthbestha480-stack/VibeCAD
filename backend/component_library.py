"""Standard component library for mechanical parts"""
from typing import Dict, Any, List

class ComponentLibrary:
    """Library of standard mechanical components"""
    
    def __init__(self):
        self.components = self._load_components()
    
    def _load_components(self) -> Dict[str, List[Dict[str, Any]]]:
        """Load standard component specifications"""
        return {
            'nema_motors': [
                {
                    'name': 'NEMA11',
                    'size': 11,
                    'face_width': 28,
                    'face_height': 28,
                    'hole_spacing': 23,
                    'bolt_size': 'M2.5',
                    'hole_diameter': 2.7,
                    'shaft_diameter': 5,
                    'typical_length': 30
                },
                {
                    'name': 'NEMA14',
                    'size': 14,
                    'face_width': 35.2,
                    'face_height': 35.2,
                    'hole_spacing': 26,
                    'bolt_size': 'M3',
                    'hole_diameter': 3.2,
                    'shaft_diameter': 5,
                    'typical_length': 36
                },
                {
                    'name': 'NEMA17',
                    'size': 17,
                    'face_width': 42.3,
                    'face_height': 42.3,
                    'hole_spacing': 31,
                    'bolt_size': 'M3',
                    'hole_diameter': 3.2,
                    'shaft_diameter': 5,
                    'typical_length': 47
                },
                {
                    'name': 'NEMA23',
                    'size': 23,
                    'face_width': 56.4,
                    'face_height': 56.4,
                    'hole_spacing': 47.14,
                    'bolt_size': 'M4',
                    'hole_diameter': 4.5,
                    'shaft_diameter': 6.35,
                    'typical_length': 76
                },
                {
                    'name': 'NEMA34',
                    'size': 34,
                    'face_width': 86,
                    'face_height': 86,
                    'hole_spacing': 69.6,
                    'bolt_size': 'M6',
                    'hole_diameter': 6.6,
                    'shaft_diameter': 14,
                    'typical_length': 98
                }
            ],
            'metric_bolts': [
                {'name': 'M3', 'diameter': 3.0, 'clearance_hole': 3.2, 'close_fit': 3.1, 'thread_pitch': 0.5},
                {'name': 'M4', 'diameter': 4.0, 'clearance_hole': 4.5, 'close_fit': 4.2, 'thread_pitch': 0.7},
                {'name': 'M5', 'diameter': 5.0, 'clearance_hole': 5.5, 'close_fit': 5.2, 'thread_pitch': 0.8},
                {'name': 'M6', 'diameter': 6.0, 'clearance_hole': 6.6, 'close_fit': 6.2, 'thread_pitch': 1.0},
                {'name': 'M8', 'diameter': 8.0, 'clearance_hole': 9.0, 'close_fit': 8.4, 'thread_pitch': 1.25},
                {'name': 'M10', 'diameter': 10.0, 'clearance_hole': 11.0, 'close_fit': 10.5, 'thread_pitch': 1.5},
                {'name': 'M12', 'diameter': 12.0, 'clearance_hole': 13.5, 'close_fit': 12.6, 'thread_pitch': 1.75},
            ],
            'bearings': [
                {'name': '608', 'type': 'deep_groove', 'inner_diameter': 8, 'outer_diameter': 22, 'width': 7, 'load_rating': 3600},
                {'name': '6000', 'type': 'deep_groove', 'inner_diameter': 10, 'outer_diameter': 26, 'width': 8, 'load_rating': 4500},
                {'name': '6001', 'type': 'deep_groove', 'inner_diameter': 12, 'outer_diameter': 28, 'width': 8, 'load_rating': 5000},
                {'name': '6002', 'type': 'deep_groove', 'inner_diameter': 15, 'outer_diameter': 32, 'width': 9, 'load_rating': 5600},
                {'name': '6003', 'type': 'deep_groove', 'inner_diameter': 17, 'outer_diameter': 35, 'width': 10, 'load_rating': 6200},
                {'name': '6004', 'type': 'deep_groove', 'inner_diameter': 20, 'outer_diameter': 42, 'width': 12, 'load_rating': 9500},
                {'name': '6005', 'type': 'deep_groove', 'inner_diameter': 25, 'outer_diameter': 47, 'width': 12, 'load_rating': 10200},
                {'name': '6006', 'type': 'deep_groove', 'inner_diameter': 30, 'outer_diameter': 55, 'width': 13, 'load_rating': 11800},
            ],
            'connectors': [
                {'name': 'USB-A', 'width': 12, 'height': 4.5, 'depth': 14, 'type': 'usb'},
                {'name': 'USB-C', 'width': 8.4, 'height': 2.6, 'depth': 7.3, 'type': 'usb'},
                {'name': 'USB-Micro', 'width': 6.85, 'height': 1.8, 'depth': 7.5, 'type': 'usb'},
                {'name': 'DB9', 'width': 30.8, 'height': 12.5, 'pins': 9, 'type': 'd_sub'},
                {'name': 'DB25', 'width': 47.8, 'height': 12.5, 'pins': 25, 'type': 'd_sub'},
            ]
        }
    
    def search(self, query: str, category: str = None) -> List[Dict[str, Any]]:
        """Search for components"""
        results = []
        query_lower = query.lower()
        
        categories_to_search = [category] if category else self.components.keys()
        
        for cat in categories_to_search:
            if cat in self.components:
                for component in self.components[cat]:
                    if query_lower in component['name'].lower():
                        results.append({
                            'category': cat,
                            **component
                        })
        
        return results
    
    def get_component(self, category: str, name: str) -> Dict[str, Any]:
        """Get specific component by category and name"""
        if category in self.components:
            for component in self.components[category]:
                if component['name'].upper() == name.upper():
                    return component
        return None
    
    def get_all_categories(self) -> List[str]:
        """Get all component categories"""
        return list(self.components.keys())
    
    def get_category(self, category: str) -> List[Dict[str, Any]]:
        """Get all components in a category"""
        return self.components.get(category, [])
