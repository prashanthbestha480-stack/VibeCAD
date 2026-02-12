import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RotateCw, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const CADViewer3D = ({ design }) => {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const meshRef = useRef(null);
  const controlsRef = useRef({ isDragging: false, previousMousePosition: { x: 0, y: 0 } });
  const [isRotating, setIsRotating] = useState(true);

  const geometry = design.parameters?.primary_geometry || {};
  const type = geometry.type || 'box';
  const material = design.parameters?.material || 'aluminum_6061_t6';
  const process = design.parameters?.manufacturing_process || 'cnc_milling';

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0f172a);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.set(2, 2, 4);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 5, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 3, -5);
    scene.add(directionalLight2);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x4b5563, 0x374151);
    gridHelper.position.y = -2;
    scene.add(gridHelper);

    // Create 3D geometry based on type
    let mesh;
    const purpleMaterial = new THREE.MeshStandardMaterial({
      color: 0x9333ea,
      metalness: 0.6,
      roughness: 0.4,
    });

    if (type === 'cylinder') {
      const radius = (geometry.radius || 25) / 100;
      const height = (geometry.height || 50) / 100;
      const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 32);
      mesh = new THREE.Mesh(cylinderGeometry, purpleMaterial);
    } else if (type === 'gear') {
      // Create gear shape
      const module = geometry.module || 1.0;
      const numTeeth = geometry.num_teeth || 20;
      const thickness = (geometry.thickness || 10) / 100;
      const pitchDiameter = (module * numTeeth) / 100;
      const outerRadius = pitchDiameter / 2 + (module / 100);
      
      // Create gear teeth using extrusion
      const gearShape = new THREE.Shape();
      const innerRadius = pitchDiameter / 2;
      const toothDepth = module / 100;
      const angleStep = (Math.PI * 2) / numTeeth;
      
      for (let i = 0; i < numTeeth; i++) {
        const angle1 = i * angleStep;
        const angle2 = angle1 + angleStep * 0.4;
        const angle3 = angle1 + angleStep * 0.6;
        const angle4 = (i + 1) * angleStep;
        
        if (i === 0) {
          gearShape.moveTo(
            Math.cos(angle1) * innerRadius,
            Math.sin(angle1) * innerRadius
          );
        }
        
        gearShape.lineTo(
          Math.cos(angle1) * innerRadius,
          Math.sin(angle1) * innerRadius
        );
        gearShape.lineTo(
          Math.cos(angle2) * outerRadius,
          Math.sin(angle2) * outerRadius
        );
        gearShape.lineTo(
          Math.cos(angle3) * outerRadius,
          Math.sin(angle3) * outerRadius
        );
        gearShape.lineTo(
          Math.cos(angle4) * innerRadius,
          Math.sin(angle4) * innerRadius
        );
      }
      
      const extrudeSettings = {
        depth: thickness,
        bevelEnabled: true,
        bevelThickness: 0.01,
        bevelSize: 0.01,
        bevelSegments: 2
      };
      
      const gearGeometry = new THREE.ExtrudeGeometry(gearShape, extrudeSettings);
      mesh = new THREE.Mesh(gearGeometry, purpleMaterial);
      mesh.rotation.x = Math.PI / 2;
      
      // Add center bore if specified
      if (geometry.bore_diameter) {
        const boreRadius = (geometry.bore_diameter / 2) / 100;
        const boreCylinder = new THREE.CylinderGeometry(boreRadius, boreRadius, thickness * 1.1, 32);
        const boreMesh = new THREE.Mesh(boreCylinder, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
        boreMesh.rotation.z = Math.PI / 2;
        mesh.add(boreMesh);
      }
    } else if (type === 'bracket') {
      // Create L-shaped bracket
      const length = (geometry.base_length || 100) / 100;
      const width = (geometry.base_width || 80) / 100;
      const height = (geometry.height || 50) / 100;
      const wallThickness = (geometry.wall_thickness || 2.5) / 100;
      
      const group = new THREE.Group();
      
      // Base plate
      const baseGeometry = new THREE.BoxGeometry(length, wallThickness, width);
      const baseMesh = new THREE.Mesh(baseGeometry, purpleMaterial);
      baseMesh.position.y = wallThickness / 2;
      group.add(baseMesh);
      
      // Back wall
      const backWallGeometry = new THREE.BoxGeometry(length, height - wallThickness, wallThickness);
      const backWallMesh = new THREE.Mesh(backWallGeometry, purpleMaterial);
      backWallMesh.position.y = height / 2;
      backWallMesh.position.z = -width / 2 + wallThickness / 2;
      group.add(backWallMesh);
      
      // Add mounting holes
      if (design.parameters?.mounting_pattern?.positions) {
        const positions = design.parameters.mounting_pattern.positions;
        const holeDiameter = (design.parameters.mounting_pattern.hole_diameter || 4.5) / 100;
        const holeGeometry = new THREE.CylinderGeometry(holeDiameter / 2, holeDiameter / 2, wallThickness * 1.2, 16);
        
        positions.forEach(pos => {
          const x = (pos[0] - length * 50) / 100;
          const z = (pos[1] - width * 50) / 100;
          const holeMesh = new THREE.Mesh(holeGeometry, new THREE.MeshStandardMaterial({ color: 0x1e293b }));
          holeMesh.position.set(x, wallThickness / 2, z);
          holeMesh.rotation.x = Math.PI / 2;
          group.add(holeMesh);
        });
      }
      
      mesh = group;
    } else {
      // Default box
      const length = (geometry.base_length || geometry.length || 100) / 100;
      const width = (geometry.base_width || geometry.width || 80) / 100;
      const height = (geometry.height || 50) / 100;
      const boxGeometry = new THREE.BoxGeometry(length, height, width);
      mesh = new THREE.Mesh(boxGeometry, purpleMaterial);
    }

    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
    meshRef.current = mesh;

    // Mouse controls - Fixed for proper rotation
    const mouseState = {
      isDown: false,
      lastX: 0,
      lastY: 0
    };

    const onMouseDown = (event) => {
      mouseState.isDown = true;
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
      setIsRotating(false);
      renderer.domElement.style.cursor = 'grabbing';
    };

    const onMouseMove = (event) => {
      if (!mouseState.isDown) return;
      
      const deltaX = event.clientX - mouseState.lastX;
      const deltaY = event.clientY - mouseState.lastY;
      
      if (meshRef.current) {
        // Rotate around Y axis (left-right drag)
        meshRef.current.rotation.y += deltaX * 0.01;
        // Rotate around X axis (up-down drag)
        meshRef.current.rotation.x += deltaY * 0.01;
        
        // Limit X rotation to avoid flipping
        meshRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, meshRef.current.rotation.x));
      }
      
      mouseState.lastX = event.clientX;
      mouseState.lastY = event.clientY;
    };

    const onMouseUp = () => {
      mouseState.isDown = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const onMouseLeave = () => {
      mouseState.isDown = false;
      renderer.domElement.style.cursor = 'grab';
    };

    const onWheel = (event) => {
      event.preventDefault();
      const delta = event.deltaY * 0.005;
      camera.position.z += delta;
      camera.position.z = Math.max(2, Math.min(10, camera.position.z));
    };

    // Set initial cursor
    renderer.domElement.style.cursor = 'grab';

    renderer.domElement.addEventListener('mousedown', onMouseDown);
    renderer.domElement.addEventListener('mousemove', onMouseMove);
    renderer.domElement.addEventListener('mouseup', onMouseUp);
    renderer.domElement.addEventListener('mouseleave', onMouseLeave);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;

    const onTouchStart = (event) => {
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        setIsRotating(false);
      }
    };

    const onTouchMove = (event) => {
      if (event.touches.length === 1) {
        event.preventDefault();
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        
        if (meshRef.current) {
          meshRef.current.rotation.y += deltaX * 0.01;
          meshRef.current.rotation.x += deltaY * 0.01;
          meshRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, meshRef.current.rotation.x));
        }
        
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
      }
    };

    renderer.domElement.addEventListener('touchstart', onTouchStart);
    renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      
      if (isRotating && meshRef.current) {
        meshRef.current.rotation.y += 0.005;
      }
      
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current) return;
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('mousedown', onMouseDown);
      renderer.domElement.removeEventListener('mousemove', onMouseMove);
      renderer.domElement.removeEventListener('mouseup', onMouseUp);
      renderer.domElement.removeEventListener('mouseleave', onMouseLeave);
      renderer.domElement.removeEventListener('wheel', onWheel);
      renderer.domElement.removeEventListener('touchstart', onTouchStart);
      renderer.domElement.removeEventListener('touchmove', onTouchMove);
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [design, isRotating]);

  const handleZoomIn = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z -= 0.5;
    }
  };

  const handleZoomOut = () => {
    if (cameraRef.current) {
      cameraRef.current.position.z += 0.5;
    }
  };

  const handleReset = () => {
    if (cameraRef.current) {
      cameraRef.current.position.set(2, 2, 4);
      cameraRef.current.lookAt(0, 0, 0);
    }
    if (meshRef.current) {
      meshRef.current.rotation.set(0, 0, 0);
    }
  };

  const toggleRotation = () => {
    setIsRotating(!isRotating);
  };

  // Calculate display dimensions
  let displayDimensions;
  if (type === 'cylinder') {
    const radius = geometry.radius || 25;
    const height = geometry.height || 50;
    displayDimensions = `Ø${radius * 2}mm × ${height}mm`;
  } else if (type === 'gear') {
    const module = geometry.module || 1.0;
    const numTeeth = geometry.num_teeth || 20;
    const thickness = geometry.thickness || 10;
    displayDimensions = `PD: ${module * numTeeth}mm, ${numTeeth} teeth, ${thickness}mm thick`;
  } else {
    const length = geometry.base_length || geometry.length || 100;
    const width = geometry.base_width || geometry.width || 80;
    const height = geometry.height || 50;
    displayDimensions = `${Math.round(length)} × ${Math.round(width)} × ${Math.round(height)} mm`;
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700" data-testid="cad-viewer-3d">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Maximize2 className="w-5 h-5 mr-2" />
            Interactive 3D Viewer
          </CardTitle>
          <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/50 capitalize">
            {type === 'gear' ? 'Spur Gear' : type}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {/* 3D Canvas */}
        <div 
          ref={mountRef} 
          className="w-full h-[500px] rounded-lg overflow-hidden border-2 border-slate-700 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        />
        
        {/* Controls */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomIn}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleZoomOut}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleReset}
              className="bg-slate-900 border-slate-600 text-white hover:bg-slate-800"
            >
              <Maximize2 className="w-4 h-4 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={toggleRotation}
              className={`border-slate-600 hover:bg-slate-800 ${
                isRotating ? 'bg-purple-900 text-purple-300' : 'bg-slate-900 text-white'
              }`}
            >
              <RotateCw className={`w-4 h-4 mr-1 ${isRotating ? 'animate-spin' : ''}`} />
              Auto-Rotate
            </Button>
          </div>
          <div className="text-sm text-gray-400">
            Drag to rotate • Scroll to zoom
          </div>
        </div>

        {/* Specifications */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Dimensions</div>
            <div className="text-white font-semibold">{displayDimensions}</div>
          </div>
          
          <div className="p-4 bg-slate-900 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Volume</div>
            <div className="text-white font-semibold">
              {design.bounding_box ? Math.round(design.bounding_box.volume / 1000) : 'N/A'} cm³
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

        {/* Features info */}
        {(design.parameters?.mounting_pattern || type === 'gear') && (
          <div className="mt-4 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="text-sm text-purple-300 mb-2 font-semibold">Features:</div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {design.parameters?.mounting_pattern && (
                <>
                  <div>
                    <span className="text-gray-400">Mounting holes:</span>{' '}
                    <span className="text-white">{design.parameters.mounting_pattern.positions?.length || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bolt size:</span>{' '}
                    <span className="text-white">{design.parameters.mounting_pattern.bolt_size || 'N/A'}</span>
                  </div>
                </>
              )}
              {type === 'gear' && (
                <>
                  <div>
                    <span className="text-gray-400">Module:</span>{' '}
                    <span className="text-white">{geometry.module || 1.0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Teeth:</span>{' '}
                    <span className="text-white">{geometry.num_teeth || 20}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            <span className="text-purple-400 font-semibold">Real-time 3D Model</span> • Drag to rotate • Scroll to zoom • Interactive controls
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CADViewer3D;
