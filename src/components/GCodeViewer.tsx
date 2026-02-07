import React, { useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface GCodeViewerProps {
  gcode: string;
  currentLine: number;
}

export const GCodeViewer: React.FC<GCodeViewerProps> = ({ gcode, currentLine }) => {
  const lines = gcode.split('\n');
  const scrollRef = useRef<HTMLDivElement>(null);

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
        <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Source Viewer</span>
        <Badge variant="outline" className="text-[10px] h-5 bg-background/50">{lines.length} Lines</Badge>
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
