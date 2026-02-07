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
      <Card className="border-border/50 bg-secondary/5 shadow-xl">
        <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <CoordinateRow label="X" value={serial.wpos.x} onZero={() => zeroAxis('X')} />
            <CoordinateRow label="Y" value={serial.wpos.y} onZero={() => zeroAxis('Y')} />
            <CoordinateRow label="Z" value={serial.wpos.z} onZero={() => zeroAxis('Z')} />
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1 h-10 font-bold" onClick={() => serial.sendCommand('G10 L20 P1 X0 Y0 Z0')}>
              ZERO ALL
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-10 font-bold" onClick={homing}>
              <Home className="h-4 w-4 mr-2" /> HOME
            </Button>
            <Button variant="outline" size="sm" className="h-10 px-3" onClick={unlock}>
              <Zap className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Jog Control */}
      <Card className="border-border/50 bg-secondary/5 overflow-hidden">
        <CardHeader className="bg-secondary/20 py-3 border-b border-border/50">
          <CardTitle className="text-sm font-bold tracking-widest flex items-center gap-2">
            <Move className="h-4 w-4" /> JOG CONTROL
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg border border-border/50">
            <span className="text-[10px] font-bold text-muted-foreground ml-2">STEP (MM)</span>
            <div className="flex gap-1">
              {['0.1', '1', '10', '50'].map(size => (
                <Button 
                  key={size} 
                  variant={stepSize === size ? "default" : "ghost"} 
                  size="sm" 
                  className="h-7 w-10 text-[10px] p-0"
                  onClick={() => setStepSize(size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 place-items-center">
             <div />
             <Button variant="secondary" className="jog-button" onClick={() => jog('Y', 1)}><ArrowUp className="h-6 w-6" /></Button>
             <Button variant="secondary" className="jog-button" onClick={() => jog('Z', 1)}><ChevronUp className="h-6 w-6" /></Button>

             <Button variant="secondary" className="jog-button" onClick={() => jog('X', -1)}><ArrowLeft className="h-6 w-6" /></Button>
             <div className="h-14 w-14 rounded-full border-2 border-primary/20 flex items-center justify-center text-primary/40 font-bold text-xs bg-primary/5">JOG</div>
             <Button variant="secondary" className="jog-button" onClick={() => jog('X', 1)}><ArrowRight className="h-6 w-6" /></Button>

             <div />
             <Button variant="secondary" className="jog-button" onClick={() => jog('Y', -1)}><ArrowDown className="h-6 w-6" /></Button>
             <Button variant="secondary" className="jog-button" onClick={() => jog('Z', -1)}><ChevronDown className="h-6 w-6" /></Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <Button variant="outline" className="h-10 font-bold border-dashed hover:border-primary hover:bg-primary/5" onClick={() => serial.sendCommand('G38.2 Z-20 F100')}>
               <Target className="h-4 w-4 mr-2" /> PROBE Z
             </Button>
             <Button variant="outline" className="h-10 font-bold border-dashed hover:border-primary hover:bg-primary/5">
               <Crosshair className="h-4 w-4 mr-2" /> CENTER
             </Button>
          </div>
        </CardContent>
      </Card>

      {/* Spindle & Feed */}
      <Card className="border-border/50 bg-secondary/5">
        <CardContent className="p-4 grid grid-cols-2 gap-4">
           <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Feedrate</span>
              <p className="text-xl font-mono font-bold text-emerald-400">{serial.feedrate} <span className="text-[10px] text-muted-foreground">MM/M</span></p>
           </div>
           <div className="space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Spindle</span>
              <p className="text-xl font-mono font-bold text-sky-400">{serial.spindle} <span className="text-[10px] text-muted-foreground">RPM</span></p>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

const CoordinateRow: React.FC<{ label: string; value: number; onZero: () => void }> = ({ label, value, onZero }) => (
  <div className="flex items-center justify-between group">
    <div className="flex items-baseline gap-4">
      <span className="text-muted-foreground font-bold w-4">{label}</span>
      <span className="dro-value min-w-[120px] tabular-nums">
        {value.toFixed(3)}
      </span>
    </div>
    <Button 
      variant="ghost" 
      size="sm" 
      className="h-8 px-3 text-[10px] font-bold text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={onZero}
    >
      ZERO {label}
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
