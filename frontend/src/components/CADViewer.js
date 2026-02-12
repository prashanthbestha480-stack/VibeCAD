import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, Settings, Layers } from 'lucide-react';

const GearIcon = () => (
  <svg width="192" height="192" viewBox="0 0 100 100" className="text-purple-400" fill="currentColor">
    <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="2"/>
    {[...Array(12)].map((_, i) => {
      const angle = (i * 30 * Math.PI) / 180;
      const x1 = 50 + Math.cos(angle) * 30;
      const y1 = 50 + Math.sin(angle) * 30;
      const x2 = 50 + Math.cos(angle) * 38;
      const y2 = 50 + Math.sin(angle) * 38;
      return (
        <g key={i}>
          <rect
            x={x2 - 3}
            y={y2 - 4}
            width="6"
            height="8"
            transform={`rotate(${i * 30} ${x2} ${y2})`}
            fill="currentColor"
          />
        </g>
      );
    })}
    <circle cx="50" cy="50" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const CADViewer = ({ design }) => {
  const geometry = design.parameters?.primary_geometry || {};
  const type = geometry.type || 'box';
  const material = design.parameters?.material || 'aluminum_6061_t6';
  const process = design.parameters?.manufacturing_process || 'cnc_milling';
  
  // Calculate dimensions based on type
  let length, width, height, radius, displayDimensions;
  
  if (type === 'cylinder') {
    radius = geometry.radius || 25;
    height = geometry.height || 50;
    displayDimensions = `Ø${radius * 2}mm × ${height}mm`;
  } else if (type === 'gear') {
    const module = geometry.module || 1.0;
    const numTeeth = geometry.num_teeth || 20;
    const thickness = geometry.thickness || 10;
    const pitchDiameter = module * numTeeth;
    displayDimensions = `PD: ${pitchDiameter}mm, Teeth: ${numTeeth}, Thick: ${thickness}mm`;
  } else {
    length = geometry.base_length || geometry.length || 100;
    width = geometry.base_width || geometry.width || 80;
    height = geometry.height || 50;
    displayDimensions = `${Math.round(length)} × ${Math.round(width)} × ${Math.round(height)} mm`;
  }
  
  // Generate visual representation based on type
  const renderVisualization = () => {
    const baseStyle = "transition-transform duration-500 ease-in-out hover:scale-105";
    
    if (type === 'cylinder') {
      return (
        <div className={`relative ${baseStyle}`} style={{ transform: 'perspective(800px) rotateX(15deg) rotateY(-15deg)' }}>
          <div className="relative">
            {/* Cylinder body */}
            <div className="relative w-48 h-56 mx-auto">
              {/* Top ellipse */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-48 h-16 bg-purple-500/30 rounded-full border-2 border-purple-400"></div>
              
              {/* Cylinder side */}
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-48 h-40 bg-gradient-to-r from-purple-600/40 via-purple-500/50 to-purple-600/40 border-l-2 border-r-2 border-purple-400"></div>
              
              {/* Bottom ellipse */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-16 bg-purple-600/40 rounded-full border-2 border-purple-400"></div>
              
              {/* Center dimension */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-white text-sm font-semibold bg-slate-900/80 px-3 py-1 rounded">
                  Ø{radius * 2}mm
                </div>
                <div className="text-gray-400 text-xs mt-1 bg-slate-900/80 px-2 py-0.5 rounded">
                  H: {height}mm
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === 'gear') {
      const module = geometry.module || 1.0;
      const numTeeth = geometry.num_teeth || 20;
      return (
        <div className={`relative ${baseStyle}`} style={{ transform: 'perspective(800px) rotateX(20deg)' }}>
          <div className="relative">
            <GearIcon />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center bg-slate-900/90 px-4 py-2 rounded-lg">
                <div className="text-white text-sm font-semibold">
                  {numTeeth} Teeth
                </div>
                <div className="text-gray-400 text-xs">
                  Module {module}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === 'bracket') {
      return (
        <div className={`relative ${baseStyle}`} style={{ transform: 'perspective(800px) rotateX(20deg) rotateY(-20deg)' }}>
          <div className="relative">
            {/* Base plate */}
            <div className="relative w-56 h-48 mx-auto">
              {/* Base */}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-48 h-12 bg-gradient-to-b from-purple-500/40 to-purple-600/50 border-2 border-purple-400 rounded-sm"></div>
              
              {/* Vertical back wall */}
              <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 w-48 h-32 bg-gradient-to-r from-purple-600/40 via-purple-500/50 to-purple-600/40 border-2 border-purple-400 rounded-sm"></div>
              
              {/* Side walls */}
              <div className="absolute bottom-12 left-1/4 w-3 h-32 bg-purple-700/60 border border-purple-400"></div>
              <div className="absolute bottom-12 right-1/4 w-3 h-32 bg-purple-700/60 border border-purple-400"></div>
              
              {/* Mounting holes representation */}
              {design.parameters?.mounting_pattern?.positions && (
                <>
                  {design.parameters.mounting_pattern.positions.slice(0, 4).map((_, index) => (
                    <div
                      key={index}
                      className="absolute w-3 h-3 bg-slate-900 rounded-full border border-purple-300"
                      style={{
                        left: index % 2 === 0 ? '25%' : '75%',
                        top: index < 2 ? '20%' : '35%',
                        transform: 'translate(-50%, -50%)'
                      }}
                    />
                  ))}
                </>
              )}
              
              {/* Dimension label */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 text-center">
                <div className="text-white text-sm font-semibold bg-slate-900/80 px-3 py-1 rounded">
                  {displayDimensions}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      // Default box representation
      return (
        <div className={`relative ${baseStyle}`} style={{ transform: 'perspective(800px) rotateX(20deg) rotateY(-20deg)' }}>
          <div className="relative">
            {/* 3D Box */}
            <div className="relative w-48 h-48 mx-auto">
              {/* Front face */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/50 to-purple-600/60 border-2 border-purple-400 rounded-lg transform translate-x-4 translate-y-4"></div>
              
              {/* Top face */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-400/60 to-purple-500/70 border-2 border-purple-300 rounded-lg transform -translate-y-4 skew-y-12"></div>
              
              {/* Side face */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-600/50 to-purple-700/60 border-2 border-purple-500 rounded-lg transform translate-x-8 skew-x-12"></div>
              
              {/* Dimension label */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="text-center bg-slate-900/90 px-4 py-2 rounded-lg">
                  <div className="text-white text-sm font-semibold">
                    {displayDimensions}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };
  
  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="cad-viewer">
      <CardHeader>
        <CardTitle className="text-white flex items-center justify-between">
          <span className="flex items-center">
            <Layers className="w-5 h-5 mr-2" />
            3D Preview
          </span>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 capitalize">
            {type}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Visual representation */}
        <div className="h-[500px] bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-lg overflow-hidden flex items-center justify-center relative">
          {/* Animated grid background */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'linear-gradient(#4b5563 1px, transparent 1px), linear-gradient(90deg, #4b5563 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
          
          {/* Main 3D visualization */}
          {renderVisualization()}
          
          {/* Axis labels */}
          <div className="absolute bottom-6 left-6 flex items-center space-x-4 text-xs">
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-red-500 mr-2"></div>
              <span className="text-red-400 font-semibold">X</span>
            </span>
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-green-500 mr-2"></div>
              <span className="text-green-400 font-semibold">Y</span>
            </span>
            <span className="flex items-center">
              <div className="w-8 h-0.5 bg-blue-500 mr-2"></div>
              <span className="text-blue-400 font-semibold">Z</span>
            </span>
          </div>
          
          {/* Type badge */}
          <div className="absolute top-6 right-6">
            <Badge className="bg-purple-900/80 text-purple-200 border-purple-400">
              {type === 'gear' ? 'Spur Gear' : type === 'cylinder' ? 'Cylinder' : type === 'bracket' ? 'Bracket' : 'Box'}
            </Badge>
          </div>
        </div>
        
        {/* Design specifications grid */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="flex items-center text-sm text-gray-400 mb-1">
              <Package className="w-4 h-4 mr-2" />
              Dimensions
            </div>
            <div className="text-white font-semibold">
              {displayDimensions}
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="flex items-center text-sm text-gray-400 mb-1">
              <Package className="w-4 h-4 mr-2" />
              Volume
            </div>
            <div className="text-white font-semibold">
              {design.bounding_box ? Math.round(design.bounding_box.volume / 1000) : 'N/A'} cm³
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="flex items-center text-sm text-gray-400 mb-1">
              <Layers className="w-4 h-4 mr-2" />
              Material
            </div>
            <div className="text-white font-semibold capitalize">
              {material.replace(/_/g, ' ')}
            </div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors">
            <div className="flex items-center text-sm text-gray-400 mb-1">
              <Settings className="w-4 h-4 mr-2" />
              Process
            </div>
            <div className="text-white font-semibold capitalize">
              {process.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        
        {/* Features section for complex parts */}
        {(design.parameters?.mounting_pattern || design.parameters?.features) && (
          <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-purple-300 mb-3 font-semibold flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              Features:
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {design.parameters?.mounting_pattern && (
                <>
                  <div>
                    <span className="text-gray-400">Mounting holes:</span>{' '}
                    <span className="text-white font-semibold">{design.parameters.mounting_pattern.positions?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bolt size:</span>{' '}
                    <span className="text-white font-semibold">{design.parameters.mounting_pattern.bolt_size || 'N/A'}</span>
                  </div>
                  {design.parameters.mounting_pattern.hole_diameter && (
                    <div>
                      <span className="text-gray-400">Hole diameter:</span>{' '}
                      <span className="text-white font-semibold">{design.parameters.mounting_pattern.hole_diameter}mm</span>
                    </div>
                  )}
                </>
              )}
              {design.parameters?.features && design.parameters.features.length > 0 && (
                <div className="col-span-2">
                  <span className="text-gray-400">Additional features:</span>{' '}
                  <span className="text-white font-semibold">
                    {design.parameters.features.map(f => f.type).join(', ')}
                  </span>
                </div>
              )}
              {type === 'gear' && (
                <>
                  <div>
                    <span className="text-gray-400">Module:</span>{' '}
                    <span className="text-white font-semibold">{geometry.module || 1.0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Teeth:</span>{' '}
                    <span className="text-white font-semibold">{geometry.num_teeth || 20}</span>
                  </div>
                  {geometry.bore_diameter && (
                    <div>
                      <span className="text-gray-400">Bore:</span>{' '}
                      <span className="text-white font-semibold">Ø{geometry.bore_diameter}mm</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-4 text-sm text-center">
          <span className="text-gray-400">
            Parametric 3D model • 
          </span>
          <span className="text-purple-400 ml-1">
            Optimized for {process.replace(/_/g, ' ')}
          </span>
        </div>
        
        {/* Add CSS animation */}
        <style jsx>{`
          @keyframes gridMove {
            0% {
              background-position: 0 0;
            }
            100% {
              background-position: 50px 50px;
            }
          }
        `}</style>
      </CardContent>
    </Card>
  );
};

export default CADViewer;
