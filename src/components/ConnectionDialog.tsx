import React, { useState } from 'react';
import { 
  Usb, 
  Bluetooth, 
  Wifi, 
  Link2, 
  Check, 
  ChevronRight,
  Globe,
  Settings
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ConnectionType } from '@/hooks/useSerial';

interface ConnectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (type: ConnectionType, options: any) => void;
}

export const ConnectionDialog: React.FC<ConnectionDialogProps> = ({ open, onOpenChange, onConnect }) => {
  const [type, setType] = useState<ConnectionType>('usb');
  const [options, setOptions] = useState({
    baudRate: '115200',
    url: 'ws://192.168.1.1/ws',
    ip: '192.168.1.1'
  });

  const handleConnect = () => {
    onConnect(type, options);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] border-border/50 bg-secondary/10 backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold tracking-tight">Machine Connection</DialogTitle>
          <DialogDescription>Select the transport protocol to communicate with your CNC controller.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 py-4">
          <TypeButton 
            active={type === 'usb'} 
            onClick={() => setType('usb')} 
            icon={<Usb className="h-5 w-5" />} 
            label="USB" 
          />
          <TypeButton 
            active={type === 'bluetooth'} 
            onClick={() => setType('bluetooth')} 
            icon={<Bluetooth className="h-5 w-5" />} 
            label="Bluetooth" 
          />
          <TypeButton 
            active={type === 'websocket'} 
            onClick={() => setType('websocket')} 
            icon={<Wifi className="h-5 w-5" />} 
            label="Network" 
          />
        </div>

        <div className="space-y-4 py-2">
          {type === 'usb' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">Baud Rate</Label>
              <Input 
                value={options.baudRate} 
                onChange={e => setOptions(prev => ({ ...prev, baudRate: e.target.value }))}
                className="bg-background/50"
              />
            </div>
          )}
          
          {type === 'websocket' && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase text-muted-foreground">WebSocket URL</Label>
              <Input 
                value={options.url} 
                onChange={e => setOptions(prev => ({ ...prev, url: e.target.value }))}
                placeholder="ws://192.168.1.1/ws"
                className="bg-background/50"
              />
            </div>
          )}

          {type === 'bluetooth' && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
              <p className="text-xs font-medium text-primary">Web Bluetooth Serial</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">Ensure your ESP32 or Bluetooth adapter is in pairing mode and supports the UART service profile.</p>
            </div>
          )}
        </div>

        <DialogFooter className="pt-4 border-t border-border/50">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="font-bold text-[10px] tracking-widest uppercase">Cancel</Button>
          <Button onClick={handleConnect} className="font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/20">
            Establish Connection <ChevronRight className="h-3 w-3 ml-2" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const TypeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 gap-2 ${
      active 
        ? 'border-primary bg-primary/10 text-primary shadow-inner' 
        : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30 hover:bg-secondary/50'
    }`}
  >
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    {active && <div className="absolute top-1 right-1 h-3 w-3 bg-primary rounded-full flex items-center justify-center"><Check className="h-2 w-2 text-primary-foreground" /></div>}
  </button>
);
