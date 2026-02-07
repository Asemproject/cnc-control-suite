import React, { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Terminal as TerminalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TerminalProps {
  logs: string[];
  onSendCommand: (cmd: string) => void;
}

export const Terminal: React.FC<TerminalProps> = ({ logs, onSendCommand }) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Correct way to scroll ScrollArea
    const viewport = scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [logs]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendCommand(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex-1 min-h-0 bg-secondary/10 backdrop-blur-md rounded-2xl border border-border/50 overflow-hidden flex flex-col shadow-2xl">
        <div className="bg-secondary/20 px-6 py-3 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center">
              <TerminalIcon className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-[10px] font-black tracking-widest uppercase text-muted-foreground/70">Console Output</span>
          </div>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
          <div className="space-y-1.5 font-mono selection:bg-primary/30">
            {logs.map((log, i) => {
              const type = log.startsWith('←') ? 'out' : log.startsWith('!!') ? 'err' : 'in';
              return (
                <div key={i} className={`text-xs leading-relaxed flex gap-4 group transition-colors hover:bg-white/5 px-2 py-0.5 rounded ${
                  type === 'out' ? 'text-emerald-400/90' : 
                  type === 'err' ? 'text-red-400/90' : 
                  'text-sky-400/90'
                }`}>
                  <span className="opacity-20 select-none tabular-nums shrink-0">
                    {new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="break-all whitespace-pre-wrap">{log}</span>
                </div>
              );
            })}
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center opacity-20 py-20 grayscale">
                <TerminalIcon className="h-12 w-12 mb-4" />
                <p className="text-sm font-medium italic">No telemetry data</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="relative flex-1 group">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Awaiting command..."
            className="bg-secondary/10 border-border/50 h-14 pl-6 font-mono focus:border-primary/50 transition-all rounded-2xl text-sm placeholder:text-muted-foreground/30 shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted-foreground/20 tracking-tighter uppercase group-focus-within:text-primary/40 transition-colors">
            ENTER TO SEND
          </div>
        </div>
        <Button type="submit" size="icon" className="h-14 w-14 rounded-2xl shadow-xl shadow-primary/20 hover:shadow-primary/40 transition-all group active:scale-95">
          <Send className="h-5 w-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
        </Button>
      </form>
    </div>
  );
};
