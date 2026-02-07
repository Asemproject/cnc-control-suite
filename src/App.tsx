import React, { useState, useEffect } from 'react';
import { useBlinkAuth } from '@blinkdotnew/react';
import { blink } from './lib/blink';
import { 
  Activity, 
  Settings, 
  FileText, 
  Terminal as TerminalIcon, 
  Play, 
  Square, 
  RotateCcw,
  Cpu,
  LogOut,
  ChevronRight,
  Monitor,
  Move,
  Image as ImageIcon,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ControlPanel } from './components/ControlPanel';
import { GCodeVisualizer } from './components/GCodeVisualizer';
import { GCodeViewer } from './components/GCodeViewer';
import { Terminal } from './components/Terminal';
import { FileExplorer } from './components/FileExplorer';
import { MachineSettings } from './components/MachineSettings';
import { ImageTool } from './components/ImageTool';
import { JogProbe } from './components/JogProbe';
import { ConnectionDialog } from './components/ConnectionDialog';
import { useSerial, ConnectionType } from './hooks/useSerial';

const App: React.FC = () => {
  const { isAuthenticated, isLoading, user } = useBlinkAuth();
  const [activeTab, setActiveTab] = useState('control');
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const serial = useSerial();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-2">
            <div className="mx-auto h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
              <Cpu className="h-10 w-10 text-primary" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">CNC Control Suite</h1>
            <p className="text-muted-foreground">Industrial-grade machine control for GRBL, FluidNC, and more.</p>
          </div>
          <Button 
            size="lg" 
            className="w-full h-12 text-lg font-semibold"
            onClick={() => blink.auth.login(window.location.href)}
          >
            Sign In to Dashboard
          </Button>
          <div className="grid grid-cols-3 gap-4 pt-8">
            <div className="space-y-1">
              <Monitor className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Live Telemetry</p>
            </div>
            <div className="space-y-1">
              <Move className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">3D Visualizer</p>
            </div>
            <div className="space-y-1">
              <FileText className="h-5 w-5 mx-auto text-muted-foreground" />
              <p className="text-xs text-muted-foreground">G-code Analytics</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col lg:flex-row bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-full lg:w-64 bg-secondary/30 border-r border-border flex flex-col">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20">
            <Cpu className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold tracking-tight text-lg">CNC Control</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <SidebarItem 
            icon={<Activity className="h-4 w-4" />} 
            label="Control" 
            active={activeTab === 'control'} 
            onClick={() => setActiveTab('control')} 
          />
          <SidebarItem 
            icon={<Target className="h-4 w-4" />} 
            label="Jog & Probe" 
            active={activeTab === 'probe'} 
            onClick={() => setActiveTab('probe')} 
          />
          <SidebarItem 
            icon={<FileText className="h-4 w-4" />} 
            label="G-code Files" 
            active={activeTab === 'files'} 
            onClick={() => setActiveTab('files')} 
          />
          <SidebarItem 
            icon={<ImageIcon className="h-4 w-4" />} 
            label="Image Tool" 
            active={activeTab === 'image'} 
            onClick={() => setActiveTab('image')} 
          />
          <SidebarItem 
            icon={<TerminalIcon className="h-4 w-4" />} 
            label="Terminal" 
            active={activeTab === 'terminal'} 
            onClick={() => setActiveTab('terminal')} 
          />
          <SidebarItem 
            icon={<Settings className="h-4 w-4" />} 
            label="Settings" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-border space-y-4">
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest text-[10px]">Machine</span>
              <Badge variant={serial.isConnected ? "default" : "secondary"} className="h-5 uppercase tracking-widest text-[8px]">
                {serial.isConnected ? (serial.connectionType || 'CONNECTED') : "OFFLINE"}
              </Badge>
            </div>
            {!serial.isConnected ? (
              <Button size="sm" className="w-full h-8 font-bold text-[10px] tracking-widest uppercase shadow-lg shadow-primary/10" onClick={() => setIsConnectDialogOpen(true)}>
                Connect Machine
              </Button>
            ) : (
              <Button size="sm" variant="destructive" className="w-full h-8 font-bold text-[10px] tracking-widest uppercase" onClick={serial.disconnect}>
                Disconnect
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center overflow-hidden">
              {user?.avatar ? <img src={user.avatar} className="h-full w-full object-cover" /> : <ChevronRight className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user?.displayName || 'User'}</p>
              <p className="text-[10px] text-muted-foreground truncate uppercase tracking-wider">{user?.role || 'Operator'}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => blink.auth.signOut()}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-background/50 relative">
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-sm z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-lg capitalize">{activeTab}</h2>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex items-center gap-2">
               <div className={`h-2 w-2 rounded-full ${serial.isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted'}`} />
               <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
                 {serial.machineStatus || 'Idle'}
               </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" disabled={!serial.isConnected || serial.isStreaming}>
              <Play className="h-4 w-4 mr-2" /> Start
            </Button>
            <Button variant="outline" size="sm" className="h-9" disabled={!serial.isConnected || !serial.isStreaming}>
              <Square className="h-4 w-4 mr-2" /> Stop
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={serial.reset}>
              <RotateCcw className="h-4 w-4 mr-2" /> Reset
            </Button>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-6">
          <Tabs value={activeTab} className="h-full border-none">
            <TabsContent value="control" className="h-full mt-0 data-[state=inactive]:hidden">
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full">
                <div className="xl:col-span-8 space-y-6 flex flex-col h-full min-h-0">
                  <div className="flex-1 min-h-0 flex flex-col gap-6">
                    <Card className="flex-[2] min-h-[300px] overflow-hidden border-border/50 bg-secondary/10 relative">
                      <GCodeVisualizer gcode={serial.currentGCode} progress={serial.progress} />
                    </Card>
                    <div className="flex-1 min-h-[200px]">
                      <GCodeViewer gcode={serial.currentGCode} currentLine={serial.progress} />
                    </div>
                  </div>
                </div>
                <div className="xl:col-span-4 space-y-6 overflow-y-auto pb-6">
                  <ControlPanel serial={serial} />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="probe" className="mt-0 data-[state=inactive]:hidden">
              <JogProbe serial={serial} />
            </TabsContent>
            <TabsContent value="files" className="mt-0 data-[state=inactive]:hidden">
              <FileExplorer onSelectFile={serial.loadGCode} />
            </TabsContent>
            <TabsContent value="image" className="mt-0 h-full data-[state=inactive]:hidden">
              <ImageTool onGenerated={(gcode) => {
                serial.loadGCode(gcode);
                setActiveTab('control');
              }} />
            </TabsContent>
            <TabsContent value="terminal" className="mt-0 h-full data-[state=inactive]:hidden">
              <Terminal logs={serial.logs} onSendCommand={serial.sendCommand} />
            </TabsContent>
            <TabsContent value="settings" className="mt-0 data-[state=inactive]:hidden">
              <MachineSettings />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <ConnectionDialog 
        open={isConnectDialogOpen} 
        onOpenChange={setIsConnectDialogOpen} 
        onConnect={(type, options) => serial.connect(type, options)} 
      />
    </div>
  );
};

const SidebarItem: React.FC<{ icon: React.ReactNode; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
      active 
        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20 font-medium' 
        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    }`}
  >
    {icon}
    <span className="text-sm tracking-tight">{label}</span>
  </button>
);

export default App;
