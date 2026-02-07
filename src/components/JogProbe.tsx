import React, { useState } from 'react';
import { 
  Target, 
  ArrowDown, 
  ArrowUp, 
  ArrowLeft, 
  ArrowRight, 
  CornerUpLeft,
  Settings2,
  Zap,
  Crosshair,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SerialHook } from '@/hooks/useSerial';
import { toast } from 'sonner';

interface JogProbeProps {
  serial: SerialHook;
}

export const JogProbe: React.FC<JogProbeProps> = ({ serial }) => {
  const [probeSettings, setProbeSettings] = useState({
    plateThickness: 20.0,
    searchDistance: 10.0,
    feedRate: 100,
    retractDistance: 2.0
  });

  const runProbeZ = () => {
    const { plateThickness, searchDistance, feedRate, retractDistance } = probeSettings;
    const commands = [
      `G91 G21`,
      `G38.2 Z-${searchDistance} F${feedRate}`,
      `G10 L20 P1 Z${plateThickness}`,
      `G0 Z${retractDistance}`,
      `G90`
    ];
    runSequence(commands, 'Z-Probe started');
  };

  const runProbeX = (dir: number) => {
    const { searchDistance, feedRate, retractDistance } = probeSettings;
    const commands = [
      `G91 G21`,
      `G38.2 X${dir * searchDistance} F${feedRate}`,
      `G10 L20 P1 X0`,
      `G0 X${-dir * retractDistance}`,
      `G90`
    ];
    runSequence(commands, 'X-Probe started');
  };

  const runProbeY = (dir: number) => {
    const { searchDistance, feedRate, retractDistance } = probeSettings;
    const commands = [
      `G91 G21`,
      `G38.2 Y${dir * searchDistance} F${feedRate}`,
      `G10 L20 P1 Y0`,
      `G0 Y${-dir * retractDistance}`,
      `G90`
    ];
    runSequence(commands, 'Y-Probe started');
  };

  const runSequence = async (cmds: string[], msg: string) => {
    if (!serial.isConnected) {
      toast.error('Connect machine first');
      return;
    }
    toast.info(msg);
    for (const cmd of cmds) {
      await serial.sendCommand(cmd);
      // Small delay between commands to ensure grbl processes them
      await new Promise(r => setTimeout(r, 100));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card className="border-border/50 bg-secondary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-400" /> Probing Routines
            </CardTitle>
            <CardDescription>Select a probing sequence to align your machine coordinates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4 place-items-center bg-background/30 p-8 rounded-2xl border border-border/50">
               <div />
               <ProbeButton icon={<ArrowUp className="h-6 w-6" />} label="Y+" onClick={() => runProbeY(1)} />
               <div />
               
               <ProbeButton icon={<ArrowLeft className="h-6 w-6" />} label="X-" onClick={() => runProbeX(-1)} />
               <ProbeButton icon={<Target className="h-10 w-10" />} label="PROBE Z" variant="primary" onClick={runProbeZ} />
               <ProbeButton icon={<ArrowRight className="h-6 w-6" />} label="X+" onClick={() => runProbeX(1)} />
               
               <div />
               <ProbeButton icon={<ArrowDown className="h-6 w-6" />} label="Y-" onClick={() => runProbeY(-1)} />
               <div />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="h-12 font-bold border-dashed border-primary/30 hover:border-primary bg-primary/5">
                <CornerUpLeft className="h-4 w-4 mr-2" /> CORNER PROBE
              </Button>
              <Button variant="outline" className="h-12 font-bold border-dashed border-sky-500/30 hover:border-sky-500 bg-sky-500/5" onClick={() => serial.sendCommand('G10 L20 P1 X0 Y0 Z0')}>
                <Crosshair className="h-4 w-4 mr-2" /> SET ORIGIN
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="border-border/50 bg-secondary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-widest uppercase flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" /> Probe Parameters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ParamInput 
                label="Plate Thickness (mm)" 
                value={probeSettings.plateThickness} 
                onChange={v => setProbeSettings(s => ({ ...s, plateThickness: v }))} 
              />
              <ParamInput 
                label="Search Distance (mm)" 
                value={probeSettings.searchDistance} 
                onChange={v => setProbeSettings(s => ({ ...s, searchDistance: v }))} 
              />
              <ParamInput 
                label="Probe Feed (mm/min)" 
                value={probeSettings.feedRate} 
                onChange={v => setProbeSettings(s => ({ ...s, feedRate: v }))} 
              />
              <ParamInput 
                label="Retract (mm)" 
                value={probeSettings.retractDistance} 
                onChange={v => setProbeSettings(s => ({ ...s, retractDistance: v }))} 
              />
            </div>
            
            <div className="pt-4 bg-primary/5 rounded-xl p-4 flex gap-3 border border-primary/20 mt-4">
               <Info className="h-5 w-5 text-primary shrink-0" />
               <p className="text-[10px] text-muted-foreground leading-relaxed">
                 <span className="font-bold text-primary uppercase block mb-1">Safety First</span>
                 Ensure your probe clips are connected and functional before starting. The machine will move towards the surface until contact is made. If no contact is made within the search distance, an alarm will trigger.
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const ProbeButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; variant?: 'primary' | 'secondary' }> = ({ icon, label, onClick, variant = 'secondary' }) => (
  <button 
    onClick={onClick}
    className={`group flex flex-col items-center justify-center gap-2 transition-all active:scale-95 ${
      variant === 'primary' 
        ? 'h-24 w-24 rounded-full bg-primary text-primary-foreground shadow-[0_0_30px_rgba(56,189,248,0.4)] hover:shadow-[0_0_50px_rgba(56,189,248,0.6)]' 
        : 'h-16 w-16 rounded-2xl bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground border border-border/50'
    }`}
  >
    {icon}
    <span className="text-[8px] font-bold uppercase tracking-[0.2em]">{label}</span>
  </button>
);

const ParamInput: React.FC<{ label: string; value: number; onChange: (v: number) => void }> = ({ label, value, onChange }) => (
  <div className="space-y-1.5">
    <Label className="text-[10px] font-bold uppercase text-muted-foreground">{label}</Label>
    <Input 
      type="number" 
      value={value} 
      onChange={e => onChange(Number(e.target.value))}
      className="bg-background/50 font-mono text-sm h-10 border-border/50"
    />
  </div>
);
