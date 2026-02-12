import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Cylinder } from '@react-three/drei';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const CADModel = ({ design }) => {
  const geometry = design.parameters?.primary_geometry || {};
  const type = geometry.type || 'box';
  
  if (type === 'cylinder') {
    const radius = (geometry.radius || 25) / 100;
    const height = (geometry.height || 50) / 100;
    return (
      <Cylinder args={[radius, radius, height, 32]}>
        <meshStandardMaterial color="#9333ea" metalness={0.6} roughness={0.4} />
      </Cylinder>
    );
  }
  
  // Default to box
  const length = (geometry.base_length || geometry.length || 100) / 100;
  const width = (geometry.base_width || geometry.width || 80) / 100;
  const height = (geometry.height || 50) / 100;
  
  return (
    <Box args={[length, height, width]}>
      <meshStandardMaterial color="#9333ea" metalness={0.6} roughness={0.4} />
    </Box>
  );
};

const CADViewer = ({ design }) => {
  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="cad-viewer">
      <CardHeader>
        <CardTitle className="text-white">3D Preview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[500px] bg-slate-900 rounded-lg overflow-hidden">
          <Canvas
            camera={{ position: [3, 3, 3], fov: 50 }}
            style={{ background: '#0f172a' }}
          >
            <ambientLight intensity={0.5} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <directionalLight position={[-10, -10, -5]} intensity={0.5} />
            
            <CADModel design={design} />
            
            <Grid
              args={[10, 10]}
              cellSize={0.5}
              cellThickness={0.5}
              cellColor="#374151"
              sectionSize={1}
              sectionThickness={1}
              sectionColor="#4b5563"
              fadeDistance={20}
              fadeStrength={1}
              followCamera={false}
              infiniteGrid
            />
            
            <OrbitControls
              enableDamping
              dampingFactor={0.05}
              rotateSpeed={0.5}
              minDistance={1}
              maxDistance={10}
            />
          </Canvas>
        </div>
        <div className="mt-4 text-sm text-gray-400 text-center">
          Use mouse to rotate, zoom, and pan the model
        </div>
      </CardContent>
    </Card>
  );
};

export default CADViewer;
