import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Clock, Hash, Maximize2, Move3d } from 'lucide-react';

interface GCodeViewerProps {
  gcode: string;
  currentLine: number;
}

export const GCodeViewer: React.FC<GCodeViewerProps> = ({ gcode, currentLine }) => {
  const lines = gcode.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simple G-code analysis
  const stats = React.useMemo(() => {
    if (!gcode) return null;
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    let commands = 0;

    lines.forEach(line => {
      if (line.trim().startsWith('G') || line.trim().startsWith('M')) {
        commands++;
        const xMatch = line.match(/X([-+]?[0-9]*\.?[0-9]+)/i);
        const yMatch = line.match(/Y([-+]?[0-9]*\.?[0-9]+)/i);
        const zMatch = line.match(/Z([-+]?[0-9]*\.?[0-9]+)/i);

        if (xMatch) {
          const val = parseFloat(xMatch[1]);
          minX = Math.min(minX, val);
          maxX = Math.max(maxX, val);
        }
        if (yMatch) {
          const val = parseFloat(yMatch[1]);
          minY = Math.min(minY, val);
          maxY = Math.max(maxY, val);
        }
        if (zMatch) {
          const val = parseFloat(zMatch[1]);
          minZ = Math.min(minZ, val);
          maxZ = Math.max(maxZ, val);
        }
      }
    });

    return {
      commands,
      bounds: {
        x: isFinite(maxX - minX) ? maxX - minX : 0,
        y: isFinite(maxY - minY) ? maxY - minY : 0,
        z: isFinite(maxZ - minZ) ? maxZ - minZ : 0,
      }
    };
  }, [gcode]);

  useEffect(() => {
    if (scrollRef.current) {
      const activeLine = scrollRef.current.querySelector('[data-active="true"]');
      if (activeLine) {
        activeLine.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentLine]);

  return (
    <div className="h-full flex flex-col bg-secondary/10 rounded-xl border border-border/50 overflow-hidden">
      <div className="bg-secondary/30 px-4 py-2 border-b border-border/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Source Viewer</span>
          {stats && (
            <div className="hidden md:flex items-center gap-3">
              <Stat icon={<Hash className="h-3 w-3" />} label="Commands" value={stats.commands} />
              <Stat icon={<Maximize2 className="h-3 w-3" />} label="X" value={stats.bounds.x.toFixed(1)} unit="mm" />
              <Stat icon={<Maximize2 className="h-3 w-3" />} label="Y" value={stats.bounds.y.toFixed(1)} unit="mm" />
              <Stat icon={<Move3d className="h-3 w-3" />} label="Z" value={stats.bounds.z.toFixed(1)} unit="mm" />
            </div>
          )}
        </div>
        <Badge variant="outline" className="text-[10px] h-5 bg-background/50 font-mono tracking-tighter">
          {currentLine + 1} / {lines.length}
        </Badge>
      </div>
      
      <ScrollArea className="flex-1 p-0" ref={scrollRef}>
        <div className="font-mono text-xs leading-none">
          {lines.map((line, i) => (
            <div 
              key={i} 
              data-active={i === currentLine}
              className={`px-4 py-1 flex gap-4 transition-colors ${
                i === currentLine 
                  ? 'bg-primary/20 text-primary-foreground border-l-2 border-primary' 
                  : 'hover:bg-primary/5 text-muted-foreground'
              }`}
            >
              <span className="w-10 text-right opacity-30 select-none border-r border-border/50 pr-2">{i + 1}</span>
              <span className="truncate">{line || ' '}</span>
            </div>
          ))}
          {lines.length === 0 && (
            <div className="py-20 text-center opacity-20 italic">No program loaded</div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

const Stat: React.FC<{ icon: React.ReactNode; label: string; value: string | number; unit?: string }> = ({ icon, label, value, unit }) => (
  <div className="flex items-center gap-1.5 px-2 border-r border-border/50 last:border-none">
    <div className="text-muted-foreground">{icon}</div>
    <div className="flex flex-col leading-none">
      <span className="text-[7px] font-bold uppercase text-muted-foreground/50 tracking-tighter">{label}</span>
      <span className="text-[9px] font-mono font-bold text-primary/80">
        {value} {unit && <span className="text-[7px] opacity-50 ml-0.5">{unit}</span>}
      </span>
    </div>
  </div>
);