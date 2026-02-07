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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
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
    <div className="flex flex-col h-full gap-4">
      <div className="flex-1 min-h-0 bg-secondary/20 rounded-xl border border-border/50 overflow-hidden flex flex-col">
        <div className="bg-secondary/30 px-4 py-2 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TerminalIcon className="h-4 w-4 text-primary" />
            <span className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Machine Console</span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          <div className="space-y-1">
            {logs.map((log, i) => {
              const type = log.startsWith('←') ? 'out' : log.startsWith('!!') ? 'err' : 'in';
              return (
                <div key={i} className={`terminal-line ${
                  type === 'out' ? 'terminal-out' : 
                  type === 'err' ? 'terminal-err' : 
                  'terminal-in'
                }`}>
                  <span className="opacity-50 select-none mr-2">[{new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}]</span>
                  {log}
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

      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Send command (e.g. G0 X10 Y10)..."
            className="bg-secondary/20 border-border/50 h-12 pl-4 font-mono focus:border-primary transition-colors"
          />
        </div>
        <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg shadow-primary/20">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};
