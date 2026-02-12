import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cube, Box, Cylinder as CylinderIcon } from 'lucide-react';

const CADViewer = ({ design }) => {
  const geometry = design.parameters?.primary_geometry || {};
  const type = geometry.type || 'box';
  const material = design.parameters?.material || 'aluminum_6061_t6';
  const process = design.parameters?.manufacturing_process || 'cnc_milling';
  
  // Calculate dimensions
  const length = geometry.base_length || geometry.length || 100;
  const width = geometry.base_width || geometry.width || 80;
  const height = geometry.height || 50;
  
  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="cad-viewer">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span>3D Preview</span>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50">
            {type.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual representation */}
        <div className="h-[500px] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)',
            backgroundSize: '50px 50px'
          }}></div>
          
          {/* 3D-ish representation */}
          <div className="relative" style={{ transform: 'perspective(800px) rotateX(20deg) rotateY(-20deg)' }}>
            {type === 'cylinder' ? (
              <div className="relative">
                <CylinderIcon className="w-48 h-48 text-purple-400" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-sm font-semibold">
                      Ø{geometry.radius ? geometry.radius * 2 : 50}mm
                    </div>
                    <div className="text-gray-400 text-xs">
                      H: {height}mm
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <Box className="w-48 h-48 text-purple-400" strokeWidth={1.5} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-white text-sm font-semibold">
                      {Math.round(length)} × {Math.round(width)} × {Math.round(height)}
                    </div>
                    <div className="text-gray-400 text-xs">
                      mm
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Axis labels */}
          <div className="absolute bottom-4 left-4 flex items-center space-x-4 text-xs text-gray-400">
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
              X
            </span>
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-green-500 mr-2"></div>
              Y
            </span>
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-blue-500 mr-2"></div>
              Z
            </span>
          </div>
        </div>
        
        {/* Design specifications */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Dimensions</div>
            <div className="text-white font-semibold">
              {type === 'cylinder' 
                ? `Ø${geometry.radius ? geometry.radius * 2 : 50}mm × ${height}mm`
                : `${Math.round(length)} × ${Math.round(width)} × ${Math.round(height)} mm`
              }
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Volume</div>
            <div className="text-white font-semibold">
              {design.bounding_box ? Math.round(design.bounding_box.volume / 1000) : 0} cm³
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Material</div>
            <div className="text-white font-semibold capitalize">
              {material.replace(/_/g, ' ')}
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Process</div>
            <div className="text-white font-semibold capitalize">
              {process.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        
        {/* Features */}
        {design.parameters?.mounting_pattern && (
          <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-purple-300 mb-2 font-semibold">Features:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-400">Mounting holes:</span>{' '}
                <span className="text-white">{design.parameters.mounting_pattern.positions?.length || 0}</span>
              </div>
              <div>
                <span className="text-gray-400">Bolt size:</span>{' '}
                <span className="text-white">{design.parameters.mounting_pattern.bolt_size || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-4 text-sm text-gray-400 text-center">
          Interactive 3D viewer coming soon • Current: Schematic view
        </div>
      </CardContent>
    </Card>
  );
};

export default CADViewer;
