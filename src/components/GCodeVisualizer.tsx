import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';

interface GCodeVisualizerProps {
  gcode: string;
  progress: number;
}

export const GCodeVisualizer: React.FC<GCodeVisualizerProps> = ({ gcode, progress }) => {
  const toolpath = useMemo(() => {
    if (!gcode) return null;
    
    const lines = gcode.split('\n');
    const points: THREE.Vector3[] = [];
    let curX = 0, curY = 0, curZ = 0;
    
    lines.forEach(line => {
      const parts = line.split(';');
      const cmd = parts[0].trim();
      if (!cmd) return;

      const matchG = cmd.match(/G([0-3])/i);
      if (matchG) {
        const xMatch = cmd.match(/X([-+]?[0-9]*\.?[0-9]+)/i);
        const yMatch = cmd.match(/Y([-+]?[0-9]*\.?[0-9]+)/i);
        const zMatch = cmd.match(/Z([-+]?[0-9]*\.?[0-9]+)/i);
        
        if (xMatch) curX = parseFloat(xMatch[1]);
        if (yMatch) curY = parseFloat(yMatch[1]);
        if (zMatch) curZ = parseFloat(zMatch[1]);
        
        points.push(new THREE.Vector3(curX, curY, curZ));
      }
    });

    if (points.length < 2) return null;

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [gcode]);

  return (
    <div className="h-full w-full bg-slate-950">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[100, 100, 100]} />
        <OrbitControls makeDefault />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[100, 100, 100]} />
        
        <Grid 
          infiniteGrid 
          fadeDistance={200} 
          sectionSize={10} 
          sectionColor="#334155" 
          cellColor="#1e293b" 
        />
        
        <axesHelper args={[50]} />

        {toolpath && (
          <line geometry={toolpath}>
            <lineBasicMaterial color="#38bdf8" linewidth={1} />
          </line>
        )}

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ef4444', '#10b981', '#38bdf8']} labelColor="black" />
        </GizmoHelper>
      </Canvas>
      
      {!gcode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-md px-6 py-3 rounded-full border border-border flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">No G-code loaded</span>
          </div>
        </div>
      )}
    </div>
  );
};
