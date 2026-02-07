import React, { useState } from 'react';
import { 
  ArrowUp, 
  ArrowDown, 
  ArrowLeft, 
  ArrowRight, 
  ChevronUp, 
  ChevronDown,
  Target,
  Home,
  Zap,
  Crosshair,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { SerialHook } from '@/hooks/useSerial';

interface ControlPanelProps {
  serial: SerialHook;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ serial }) => {
  const [stepSize, setStepSize] = useState('1');
  const [feedOverride, setFeedOverride] = useState(100);

  const jog = (axis: string, dir: number) => {
    serial.sendCommand(`$J=G91 G21 ${axis}${dir * Number(stepSize)} F1000`);
  };

  const zeroAxis = (axis: string) => {
    serial.sendCommand(`G10 L20 P1 ${axis}0`);
  };

  const homing = () => {
    serial.sendCommand('$H');
  };

  const unlock = () => {
    serial.sendCommand('$X');
  };

  return (
    <div className="space-y-6">
      {/* DRO - Digital Read Out */}
      <Card className="border-border/50 bg-secondary/10 backdrop-blur-xl shadow-2xl">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-6">
            <CoordinateRow label="X" value={serial.wpos.x} onZero={() => zeroAxis('X')} />
            <CoordinateRow label="Y" value={serial.wpos.y} onZero={() => zeroAxis('Y')} />
            <CoordinateRow label="Z" value={serial.wpos.z} onZero={() => zeroAxis('Z')} />
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm" className="flex-1 h-12 font-bold text-[10px] tracking-widest uppercase hover:bg-primary/10 hover:text-primary transition-all" onClick={() => serial.sendCommand('G10 L20 P1 X0 Y0 Z0')}>
              ZERO ALL
            </Button>
            
            <div className="flex flex-1 gap-[1px]">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-12 font-bold text-[10px] tracking-widest uppercase hover:bg-primary/10 hover:text-primary transition-all rounded-r-none border-r-0" 
                onClick={() => serial.sendCommand('$H')}
              >
                <Home className="h-4 w-4 mr-2" /> HOME
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-12 px-2 hover:bg-primary/10 hover:text-primary transition-all rounded-l-none">
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-secondary/95 backdrop-blur-xl border-border/50">
                  <DropdownMenuItem className="text-[10px] font-bold tracking-widest uppercase py-3 cursor-pointer" onClick={() => serial.sendCommand('$H')}>
                    <Home className="h-3 w-3 mr-2" /> Home All ($H)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem className="text-[10px] font-bold tracking-widest uppercase py-3 cursor-pointer" onClick={() => serial.sendCommand('$HX')}>
                    Home X ($HX)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[10px] font-bold tracking-widest uppercase py-3 cursor-pointer" onClick={() => serial.sendCommand('$HY')}>
                    Home Y ($HY)
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-[10px] font-bold tracking-widest uppercase py-3 cursor-pointer" onClick={() => serial.sendCommand('$HZ')}>
                    Home Z ($HZ)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="outline" size="sm" className="h-12 px-4 hover:bg-destructive/10 hover:text-destructive transition-all" onClick={unlock}>
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jog Control */}
      <Card className="border-border/50 bg-secondary/10 overflow-hidden backdrop-blur-md">
        <CardHeader className="bg-secondary/20 py-4 border-b border-border/50">
          <CardTitle className="text-[10px] font-bold tracking-[0.2em] flex items-center gap-2 uppercase text-muted-foreground">
            <Move className="h-4 w-4 text-primary" /> Jog Control
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <div className="flex justify-between items-center bg-background/50 p-1.5 rounded-xl border border-border/50">
            <span className="text-[9px] font-bold text-muted-foreground/60 ml-3 tracking-widest uppercase">Step (mm)</span>
            <div className="flex gap-1">
              {['0.1', '1', '10', '50'].map(size => (
                <Button 
                  key={size} 
                  variant={stepSize === size ? "default" : "ghost"} 
                  size="sm" 
                  className={`h-8 w-12 text-[10px] font-bold transition-all rounded-lg ${stepSize === size ? 'shadow-lg shadow-primary/20' : ''}`}
                  onClick={() => setStepSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 place-items-center relative">
             <div />
             <Button variant="secondary" className="jog-button" onClick={() => jog('Y', 1)}><ArrowUp className="h-7 w-7" /></Button>
             <Button variant="secondary" className="jog-button" onClick={() => jog('Z', 1)}><ChevronUp className="h-7 w-7 text-sky-400" /></Button>

             <Button variant="secondary" className="jog-button" onClick={() => jog('X', -1)}><ArrowLeft className="h-7 w-7" /></Button>
             <div className="h-16 w-16 rounded-full border-2 border-primary/20 flex flex-col items-center justify-center text-primary/60 font-black text-[10px] bg-primary/5 tracking-widest shadow-inner group transition-all hover:border-primary/40">
                <div className="h-2 w-2 rounded-full bg-primary mb-1 animate-pulse shadow-[0_0_8px_rgba(56,189,248,0.5)]" />
                AXIS
             </div>
             <Button variant="secondary" className="jog-button" onClick={() => jog('X', 1)}><ArrowRight className="h-7 w-7" /></Button>

             <div />
             <Button variant="secondary" className="jog-button" onClick={() => jog('Y', -1)}><ArrowDown className="h-7 w-7" /></Button>
             <Button variant="secondary" className="jog-button" onClick={() => jog('Z', -1)}><ChevronDown className="h-7 w-7 text-sky-400" /></Button>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
             <Button variant="outline" className="h-12 font-bold text-[10px] tracking-widest uppercase border-dashed border-primary/30 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all">
               <Target className="h-4 w-4 mr-2" /> Probe Z
             </Button>
             <Button variant="outline" className="h-12 font-bold text-[10px] tracking-widest uppercase border-dashed border-sky-500/30 hover:border-sky-500 bg-sky-500/5 hover:bg-sky-500/10 transition-all">
               <Crosshair className="h-4 w-4 mr-2" /> Center
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spindle & Feed */}
      <Card className="border-border/50 bg-secondary/10 backdrop-blur-md">
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Feedrate</span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-mono font-black text-emerald-400 tracking-tighter">{serial.feedrate}</p>
                <span className="text-[10px] font-bold text-muted-foreground/30">MM/M</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-[0.2em]">Spindle</span>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-mono font-black text-sky-400 tracking-tighter">{serial.spindle}</p>
                <span className="text-[10px] font-bold text-muted-foreground/30">RPM</span>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-2 border-t border-border/20">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 h-10 text-[10px] font-bold tracking-widest uppercase hover:bg-sky-500/10 hover:text-sky-500 transition-all"
                onClick={() => serial.sendCommand('M3 S1000')}
              >
                CW (M3)
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 h-10 text-[10px] font-bold tracking-widest uppercase hover:bg-sky-500/10 hover:text-sky-500 transition-all"
                onClick={() => serial.sendCommand('M4 S1000')}
              >
                CCW (M4)
              </Button>
              <Button 
                variant="destructive" 
                className="flex-1 h-10 text-[10px] font-bold tracking-widest uppercase"
                onClick={() => serial.sendCommand('M5')}
              >
                STOP (M5)
              </Button>
            </div>
            
            <div className="flex items-center gap-4 bg-background/50 p-2 rounded-lg border border-border/50">
              <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap">Speed S</span>
              <Input 
                type="number" 
                placeholder="1000"
                className="h-8 bg-transparent border-none text-right font-mono text-sm focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    serial.sendCommand(`S${(e.target as HTMLInputElement).value}`);
                  }
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CoordinateRow: React.FC<{ label: string; value: number; onZero: () => void }> = ({ label, value, onZero }) => (
  <div className="flex items-center justify-between group py-1">
    <div className="flex items-center gap-6">
      <div className="h-8 w-8 rounded-lg bg-secondary/50 border border-border/50 flex items-center justify-center font-black text-xs text-muted-foreground/50 group-hover:text-primary transition-colors">
        {label}
      </div>
      <span className="dro-value tabular-nums leading-none">
        {value.toFixed(3)}
      </span>
    </div>
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-9 px-4 text-[10px] font-black tracking-widest uppercase text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-all bg-secondary/50 hover:bg-primary/10 rounded-xl"
      onClick={onZero}
    >
      Zero {label}
    </Button>
  </div>
);

const Move: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="5 9 2 12 5 15" />
    <polyline points="9 5 12 2 15 5" />
    <polyline points="15 19 12 22 9 19" />
    <polyline points="19 9 22 12 19 15" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="12" y1="2" x2="12" y2="22" />
  </svg>
);