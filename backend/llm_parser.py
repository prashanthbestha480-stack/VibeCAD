"""LLM-based natural language parser for CAD generation"""
from emergentintegrations.llm.chat import LlmChat, UserMessage
import json
import os
from typing import Dict, Any
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

class NLPtoCADParser:
    """Parse natural language descriptions into CAD parameters"""
    
    def __init__(self):
        self.api_key = os.environ.get('EMERGENT_LLM_KEY')
        self.system_message = """You are a mechanical design expert AI that converts natural language descriptions into structured CAD parameters.

Your task is to parse mechanical part descriptions and output ONLY valid JSON with no additional text or explanation.

Supported part types: bracket, box, housing, cylinder, gear, plate

Output JSON structure:
{
  "primary_geometry": {
    "type": "bracket|box|housing|cylinder|gear|plate",
    "base_length": number (mm),
    "base_width": number (mm),
    "height": number (mm),
    "wall_thickness": number (mm, default 2.0-3.0),
    "unit": "mm"
  },
  "mounting_pattern": {
    "type": "bolt_holes|nema_stepper|custom",
    "pattern": "NEMA23_stepper|NEMA17_stepper|custom",
    "bolt_size": "M3|M4|M5|M6",
    "positions": [[x1, y1], [x2, y2], ...],
    "hole_diameter": number (mm),
    "countersink": boolean
  },
  "features": [
    {
      "type": "rib|fillet|chamfer|cutout",
      "position": "backplate_center|custom",
      "dimensions": [length, thickness, height]
    }
  ],
  "material": "aluminum_6061_t6|steel_mild|stainless_304|plastic_abs",
  "manufacturing_process": "cnc_milling|3d_printing|injection_molding|sheet_metal",
  "tolerances": {
    "dimensional": "±0.1mm|±0.2mm|±0.5mm",
    "hole_position": "±0.1mm"
  }
}

Important rules:
- Use metric units (mm) for all dimensions
- Default wall thickness: 2.0-3.0mm for aluminum, 1.5-2.5mm for steel
- Hole clearance: M3=3.2mm, M4=4.5mm, M5=5.5mm, M6=6.6mm
- NEMA17 hole spacing: 31mm × 31mm
- NEMA23 hole spacing: 47.14mm × 47.14mm
- Minimum radius: 1.0mm for CNC, 0.8mm for 3D printing
- Output ONLY the JSON, no explanation
"""
    
    async def parse(self, description: str) -> Dict[str, Any]:
        """Parse natural language into CAD parameters"""
        try:
            chat = LlmChat(
                api_key=self.api_key,
                session_id=f"cad_parse_{hash(description)}",
                system_message=self.system_message
            ).with_model("anthropic", "claude-sonnet-4-5-20250929")
            
            user_message = UserMessage(text=description)
            response = await chat.send_message(user_message)
            
            # Extract JSON from response
            response_text = response.strip()
            
            # Try to find JSON in response
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0].strip()
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0].strip()
            
            # Parse JSON
            params = json.loads(response_text)
            return params
            
        except json.JSONDecodeError as e:
            # Fallback to basic parameters
            print(f"JSON parse error: {e}")
            return self._get_default_params(description)
        except Exception as e:
            print(f"LLM parsing error: {e}")
            return self._get_default_params(description)
    
    def _get_default_params(self, description: str) -> Dict[str, Any]:
        """Generate default parameters when LLM fails"""
        # Simple keyword detection
        desc_lower = description.lower()
        
        part_type = 'box'
        if 'bracket' in desc_lower:
            part_type = 'bracket'
        elif 'cylinder' in desc_lower or 'tube' in desc_lower:
            part_type = 'cylinder'
        elif 'gear' in desc_lower:
            part_type = 'gear'
        
        return {
            "primary_geometry": {
                "type": part_type,
                "base_length": 100,
                "base_width": 80,
                "height": 50,
                "wall_thickness": 2.5,
                "unit": "mm"
            },
            "material": "aluminum_6061_t6",
            "manufacturing_process": "cnc_milling",
            "tolerances": {
                "dimensional": "±0.1mm",
                "hole_position": "±0.1mm"
            }
        }
