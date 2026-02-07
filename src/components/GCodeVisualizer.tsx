import React, { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, PerspectiveCamera, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { Move3d } from 'lucide-react';

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
    <div className="h-full w-full bg-[#020617] relative">
      <Canvas shadows gl={{ antialias: true }}>
        <PerspectiveCamera makeDefault position={[150, 150, 150]} />
        <OrbitControls makeDefault minDistance={10} maxDistance={1000} />
        
        <ambientLight intensity={0.7} />
        <spotLight position={[200, 200, 200]} angle={0.15} penumbra={1} intensity={1} castShadow />
        
        <Grid 
          infiniteGrid 
          fadeDistance={500} 
          sectionSize={50} 
          cellSize={10}
          sectionColor="#1e293b" 
          cellColor="#0f172a" 
        />
        
        <group rotation={[-Math.PI / 2, 0, 0]}>
          <axesHelper args={[50]} />
          {toolpath && (
            <line geometry={toolpath}>
              <lineBasicMaterial color="#38bdf8" linewidth={2} transparent opacity={0.8} />
            </line>
          )}
        </group>

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewport axisColors={['#ef4444', '#10b981', '#38bdf8']} labelColor="white" />
        </GizmoHelper>
      </Canvas>
      
      {!gcode && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="bg-slate-900/50 backdrop-blur-xl px-8 py-4 rounded-2xl border border-white/5 flex flex-col items-center gap-4 shadow-2xl">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Move3d className="h-6 w-6 text-primary/50" />
            </div>
            <div className="text-center space-y-1">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/40">Visualizer Ready</p>
              <p className="text-xs text-muted-foreground/60 font-medium italic">Awaiting G-code source...</p>
            </div>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 pointer-events-none">
         <div className="flex flex-col gap-2">
            <div className="bg-black/40 backdrop-blur-md border border-white/5 px-3 py-1.5 rounded-lg flex items-center gap-3">
               <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80">Render Engine Active</span>
            </div>
         </div>
      </div>
    </div>
  );
};