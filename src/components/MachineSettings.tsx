import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Cpu, 
  Terminal, 
  Trash2, 
  Save, 
  Wrench,
  Code,
  Layers,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { blink } from '@/lib/blink';
import { toast } from 'sonner';

interface Macro {
  id: string;
  name: string;
  code: string;
  machineType: string;
}

interface Profile {
  id: string;
  name: string;
  type: string;
  connectionType: string;
}

export const MachineSettings: React.FC = () => {
  const [macros, setMacros] = useState<Macro[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [newMacro, setNewMacro] = useState({ name: '', code: '' });

  const fetchData = async () => {
    try {
      const [m, p] = await Promise.all([
        blink.db.macros.list(),
        blink.db.machineProfiles.list()
      ]);
      setMacros(m as Macro[]);
      setProfiles(p as Profile[]);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addMacro = async () => {
    if (!newMacro.name || !newMacro.code) return;
    try {
      await blink.db.macros.create({
        ...newMacro,
        machineType: 'all'
      });
      setNewMacro({ name: '', code: '' });
      fetchData();
      toast.success('Macro saved');
    } catch (err) {
      toast.error('Failed to save macro');
    }
  };

  const deleteMacro = async (id: string) => {
    try {
      await blink.db.macros.delete(id);
      fetchData();
      toast.success('Macro deleted');
    } catch (err) {
      toast.error('Failed to delete macro');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Configuration</h2>
        <p className="text-muted-foreground italic">Manage machine profiles, custom macros, and system overrides.</p>
      </div>

      <Tabs defaultValue="profiles" className="w-full">
        <TabsList className="bg-secondary/20 p-1 rounded-xl h-12 w-full max-w-md border border-border/50">
          <TabsTrigger value="profiles" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full rounded-lg uppercase tracking-widest text-[10px] font-bold transition-all">
            <Cpu className="h-4 w-4 mr-2" /> Machine Profiles
          </TabsTrigger>
          <TabsTrigger value="macros" className="flex-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground h-full rounded-lg uppercase tracking-widest text-[10px] font-bold transition-all">
            <Code className="h-4 w-4 mr-2" /> Custom Macros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profiles" className="pt-6 space-y-6">
          <Card className="border-border/50 bg-secondary/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold tracking-widest uppercase">Default Machine</CardTitle>
              <CardDescription>Configure connection parameters for your active CNC controller.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Profile Name</label>
                    <Input defaultValue="WorkBee GRBL" className="bg-background/50" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase text-muted-foreground">Controller Type</label>
                    <Input defaultValue="GRBL v1.1" disabled className="bg-background/50" />
                 </div>
              </div>
              <Button className="font-bold">
                 <Save className="h-4 w-4 mr-2" /> UPDATE PROFILE
              </Button>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Card className="border-border/50 bg-secondary/5 border-dashed">
                <CardContent className="p-6 flex flex-col items-center justify-center min-h-[160px] text-center space-y-4">
                   <Plus className="h-10 w-10 text-muted-foreground opacity-20" />
                   <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Add Machine Profile</p>
                </CardContent>
             </Card>
          </div>
        </TabsContent>

        <TabsContent value="macros" className="pt-6 space-y-6">
          <Card className="border-border/50 bg-secondary/10">
            <CardHeader>
              <CardTitle className="text-sm font-bold tracking-widest uppercase">New Macro</CardTitle>
              <CardDescription>Write G-code snippets for quick execution (e.g., tool changes, probing sequences).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-4">
                 <Input 
                   placeholder="Macro name (e.g. Z-Probe Tool)" 
                   className="bg-background/50" 
                   value={newMacro.name}
                   onChange={e => setNewMacro(prev => ({ ...prev, name: e.target.value }))}
                 />
                 <Textarea 
                   placeholder="G-code instructions..." 
                   className="font-mono bg-background/50 min-h-[100px]" 
                   value={newMacro.code}
                   onChange={e => setNewMacro(prev => ({ ...prev, code: e.target.value }))}
                 />
                 <Button className="font-bold" onClick={addMacro}>
                    <Plus className="h-4 w-4 mr-2" /> ADD MACRO
                 </Button>
               </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Saved Macros</h3>
            <div className="grid grid-cols-1 gap-3">
              {macros.map(macro => (
                <Card key={macro.id} className="border-border/50 bg-secondary/5 group overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center text-muted-foreground">
                          <Terminal className="h-4 w-4" />
                       </div>
                       <div>
                          <p className="font-bold text-sm">{macro.name}</p>
                          <code className="text-[10px] text-primary/70 font-mono truncate max-w-xs block">{macro.code}</code>
                       </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteMacro(macro.id)}>
                       <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
              {macros.length === 0 && (
                <div className="py-12 border-2 border-dashed border-border/50 rounded-2xl flex flex-col items-center justify-center opacity-20 grayscale">
                   <Layers className="h-10 w-10 mb-2" />
                   <p className="text-xs font-bold uppercase tracking-widest">No macros defined</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex gap-4">
         <Info className="h-6 w-6 text-primary shrink-0" />
         <div className="space-y-1">
            <h4 className="font-bold text-sm uppercase tracking-tight">System Info</h4>
            <p className="text-xs text-muted-foreground leading-relaxed">Ensure machine settings like Baud Rate (Default 115200) and Homing Sequence match your physical controller configuration. Soft-limits and Hard-limits must be enabled in the controller firmware for safety.</p>
         </div>
      </div>
    </div>
  );
};
