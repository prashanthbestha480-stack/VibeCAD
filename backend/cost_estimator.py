"""Manufacturing cost estimation engine"""
from typing import Dict, Any, List
import math

class CostEstimator:
    """Estimate manufacturing costs across different processes"""
    
    def __init__(self):
        self.material_prices = self._load_material_prices()
        self.process_rates = self._load_process_rates()
    
    def _load_material_prices(self) -> Dict[str, float]:
        """Material cost per kg"""
        return {
            'aluminum_6061_t6': 4.80,  # $/kg
            'steel_mild': 2.50,
            'stainless_304': 6.20,
            'plastic_abs': 3.00,
            'plastic_pla': 2.50,
            'titanium': 35.00
        }
    
    def _load_process_rates(self) -> Dict[str, Any]:
        """Process rates and parameters"""
        return {
            'cnc_milling': {
                'labor_rate': 16.0,  # $/hour
                'overhead_rate': 0.25,  # 25% of direct costs
                'tooling_base': 50.0,  # $ amortized
                'time_per_cm3': 0.5,  # minutes
                'setup_time': 15.0  # minutes
            },
            '3d_printing': {
                'machine_rate': 8.0,  # $/hour
                'overhead_rate': 0.15,
                'time_per_cm3': 2.0,  # minutes
                'support_factor': 1.4  # 40% extra time/material
            },
            'injection_molding': {
                'mold_cost': 5000.0,  # $ one-time
                'cycle_time': 30.0,  # seconds
                'labor_rate': 12.0,
                'overhead_rate': 0.20
            },
            'sheet_metal': {
                'labor_rate': 14.0,
                'overhead_rate': 0.22,
                'cutting_time': 0.3,  # min per linear cm
                'bending_time': 2.0  # min per bend
            }
        }
    
    def estimate_cost(self, params: Dict[str, Any], bounding_box: Dict[str, float], quantity: int = 100) -> Dict[str, Any]:
        """Estimate manufacturing cost"""
        material = params.get('material', 'aluminum_6061_t6')
        process = params.get('manufacturing_process', 'cnc_milling')
        
        # Calculate volume and mass
        volume_cm3 = bounding_box.get('volume', 1000) / 1000  # mm3 to cm3
        
        # Material density (g/cm3)
        densities = {
            'aluminum_6061_t6': 2.70,
            'steel_mild': 7.85,
            'stainless_304': 8.00,
            'plastic_abs': 1.05,
            'plastic_pla': 1.25,
            'titanium': 4.50
        }
        
        density = densities.get(material, 2.70)
        mass_kg = (volume_cm3 * density) / 1000  # kg
        
        # Get material and process costs
        material_price = self.material_prices.get(material, 5.0)
        process_params = self.process_rates.get(process, {})
        
        # Calculate costs based on process
        if process == 'cnc_milling':
            costs = self._estimate_cnc_cost(mass_kg, volume_cm3, material_price, process_params, quantity)
        elif process == '3d_printing':
            costs = self._estimate_3d_printing_cost(mass_kg, volume_cm3, material_price, process_params, quantity)
        elif process == 'injection_molding':
            costs = self._estimate_injection_molding_cost(mass_kg, volume_cm3, material_price, process_params, quantity)
        else:
            # Default to CNC
            costs = self._estimate_cnc_cost(mass_kg, volume_cm3, material_price, process_params, quantity)
        
        return costs
    
    def _estimate_cnc_cost(self, mass_kg: float, volume_cm3: float, material_price: float, params: Dict[str, Any], quantity: int) -> Dict[str, Any]:
        """Estimate CNC milling cost"""
        # Material cost
        material_cost = mass_kg * material_price
        
        # Machining time (based on volume)
        machining_time_min = params.get('time_per_cm3', 0.5) * volume_cm3 + params.get('setup_time', 15)
        machining_time_hr = machining_time_min / 60
        
        # Labor cost
        labor_rate = params.get('labor_rate', 16.0)
        labor_cost = machining_time_hr * labor_rate
        
        # Tooling cost (amortized)
        tooling_cost = params.get('tooling_base', 50.0) / quantity
        
        # Direct cost
        direct_cost = material_cost + labor_cost + tooling_cost
        
        # Overhead
        overhead_rate = params.get('overhead_rate', 0.25)
        overhead_cost = direct_cost * overhead_rate
        
        # Total unit cost
        unit_cost = direct_cost + overhead_cost
        
        # Volume discounts
        if quantity >= 1000:
            unit_cost *= 0.70  # 30% discount
        elif quantity >= 500:
            unit_cost *= 0.80  # 20% discount
        elif quantity >= 100:
            unit_cost *= 0.90  # 10% discount
        
        return {
            'process': 'cnc_milling',
            'unit_cost': round(unit_cost, 2),
            'total_cost': round(unit_cost * quantity, 2),
            'breakdown': {
                'material': round(material_cost, 2),
                'labor': round(labor_cost, 2),
                'tooling_amortized': round(tooling_cost, 2),
                'overhead': round(overhead_cost, 2)
            },
            'lead_time_days': '5-7',
            'best_for': 'Low to medium volume (1-1000 units)',
            'quantity': quantity,
            'mass_kg': round(mass_kg, 3)
        }
    
    def _estimate_3d_printing_cost(self, mass_kg: float, volume_cm3: float, material_price: float, params: Dict[str, Any], quantity: int) -> Dict[str, Any]:
        """Estimate 3D printing cost"""
        # Material cost (with support material factor)
        support_factor = params.get('support_factor', 1.4)
        material_cost = mass_kg * material_price * support_factor
        
        # Print time
        print_time_min = params.get('time_per_cm3', 2.0) * volume_cm3
        print_time_hr = print_time_min / 60
        
        # Machine cost
        machine_rate = params.get('machine_rate', 8.0)
        machine_cost = print_time_hr * machine_rate
        
        # Direct cost
        direct_cost = material_cost + machine_cost
        
        # Overhead
        overhead_rate = params.get('overhead_rate', 0.15)
        overhead_cost = direct_cost * overhead_rate
        
        unit_cost = direct_cost + overhead_cost
        
        return {
            'process': '3d_printing',
            'unit_cost': round(unit_cost, 2),
            'total_cost': round(unit_cost * quantity, 2),
            'breakdown': {
                'material': round(material_cost, 2),
                'machine_time': round(machine_cost, 2),
                'overhead': round(overhead_cost, 2)
            },
            'lead_time_days': '3-5',
            'best_for': 'Prototypes and low volume (<100 units)',
            'quantity': quantity,
            'mass_kg': round(mass_kg, 3),
            'print_time_hours': round(print_time_hr, 1)
        }
    
    def _estimate_injection_molding_cost(self, mass_kg: float, volume_cm3: float, material_price: float, params: Dict[str, Any], quantity: int) -> Dict[str, Any]:
        """Estimate injection molding cost"""
        # Material cost
        material_cost = mass_kg * material_price
        
        # Cycle time
        cycle_time_sec = params.get('cycle_time', 30)
        parts_per_hour = 3600 / cycle_time_sec
        
        # Labor cost per part
        labor_rate = params.get('labor_rate', 12.0)
        labor_cost = labor_rate / parts_per_hour
        
        # Mold cost amortized
        mold_cost = params.get('mold_cost', 5000.0)
        mold_cost_per_part = mold_cost / quantity
        
        # Direct cost
        direct_cost = material_cost + labor_cost + mold_cost_per_part
        
        # Overhead
        overhead_rate = params.get('overhead_rate', 0.20)
        overhead_cost = direct_cost * overhead_rate
        
        unit_cost = direct_cost + overhead_cost
        
        return {
            'process': 'injection_molding',
            'unit_cost': round(unit_cost, 2),
            'total_cost': round(unit_cost * quantity, 2),
            'breakdown': {
                'material': round(material_cost, 2),
                'labor': round(labor_cost, 2),
                'mold_amortized': round(mold_cost_per_part, 2),
                'overhead': round(overhead_cost, 2)
            },
            'lead_time_days': '14-21 (including tooling)',
            'best_for': 'High volume (>1000 units)',
            'quantity': quantity,
            'mass_kg': round(mass_kg, 3),
            'mold_cost_total': mold_cost
        }
    
    def compare_processes(self, params: Dict[str, Any], bounding_box: Dict[str, float], quantity: int = 100) -> List[Dict[str, Any]]:
        """Compare costs across different manufacturing processes"""
        processes = ['cnc_milling', '3d_printing', 'injection_molding']
        comparisons = []
        
        for process in processes:
            temp_params = params.copy()
            temp_params['manufacturing_process'] = process
            cost_estimate = self.estimate_cost(temp_params, bounding_box, quantity)
            comparisons.append(cost_estimate)
        
        # Sort by unit cost
        comparisons.sort(key=lambda x: x['unit_cost'])
        
        return comparisons
