import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export interface SerialHook {
  isConnected: boolean;
  machineStatus: string;
  wpos: { x: number; y: number; z: number };
  mpos: { x: number; y: number; z: number };
  feedrate: number;
  spindle: number;
  logs: string[];
  currentGCode: string;
  progress: number;
  isStreaming: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
  loadGCode: (code: string) => void;
  reset: () => Promise<void>;
}

export const useSerial = (): SerialHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [machineStatus, setMachineStatus] = useState('Idle');
  const [wpos, setWpos] = useState({ x: 0, y: 0, z: 0 });
  const [mpos, setMpos] = useState({ x: 0, y: 0, z: 0 });
  const [feedrate, setFeedrate] = useState(0);
  const [spindle, setSpindle] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [currentGCode, setCurrentGCode] = useState('');
  const [progress, setProgress] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);

  const portRef = useRef<any>(null);
  const readerRef = useRef<any>(null);
  const writerRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addLog = useCallback((msg: string, type: 'in' | 'out' | 'err' = 'in') => {
    setLogs(prev => [...prev.slice(-499), `${type === 'in' ? '→' : type === 'out' ? '←' : '!!'} ${msg}`]);
  }, []);

  const parseStatus = (line: string) => {
    // GRBL Status format: <Idle|WPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|WCO:0.000,0.000,0.000>
    if (!line.startsWith('<') || !line.endsWith('>')) return;
    
    const content = line.slice(1, -1);
    const parts = content.split('|');
    
    setMachineStatus(parts[0]);

    parts.forEach(part => {
      if (part.startsWith('WPos:')) {
        const [x, y, z] = part.slice(5).split(',').map(Number);
        setWpos({ x, y, z });
      } else if (part.startsWith('MPos:')) {
        const [x, y, z] = part.slice(5).split(',').map(Number);
        setMpos({ x, y, z });
      } else if (part.startsWith('FS:')) {
        const [f, s] = part.slice(3).split(',').map(Number);
        setFeedrate(f);
        setSpindle(s);
      }
    });
  };

  const readLoop = async () => {
    const reader = portRef.current.readable.getReader();
    readerRef.current = reader;
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() || '';

        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed) {
            if (trimmed.startsWith('<')) {
              parseStatus(trimmed);
            } else {
              addLog(trimmed, 'out');
            }
          }
        });
      }
    } catch (err) {
      console.error('Read error:', err);
    } finally {
      reader.releaseLock();
    }
  };

  const connect = async () => {
    if (!('serial' in navigator)) {
      toast.error('Web Serial API not supported in this browser.');
      return;
    }

    try {
      const port = await (navigator as any).serial.requestPort();
      await port.open({ baudRate: 115200 });
      portRef.current = port;
      setIsConnected(true);
      toast.success('Machine connected');
      
      const encoder = new TextEncoder();
      writerRef.current = port.writable.getWriter();
      
      readLoop();

      // Initial query
      await sendCommand('?');
      
      // Auto-query every 200ms
      const interval = setInterval(() => {
        if (portRef.current) sendCommand('?');
      }, 250);

      return () => clearInterval(interval);
    } catch (err) {
      console.error('Connection failed:', err);
      toast.error('Failed to connect to serial port');
    }
  };

  const disconnect = async () => {
    if (readerRef.current) await readerRef.current.cancel();
    if (writerRef.current) {
      writerRef.current.releaseLock();
      writerRef.current = null;
    }
    if (portRef.current) {
      await portRef.current.close();
      portRef.current = null;
    }
    setIsConnected(false);
    toast.info('Machine disconnected');
  };

  const sendCommand = async (cmd: string) => {
    if (!isConnected || !writerRef.current) return;
    
    try {
      const encoder = new TextEncoder();
      await writerRef.current.write(encoder.encode(cmd + '\n'));
      if (cmd !== '?') {
        addLog(cmd, 'in');
      }
    } catch (err) {
      console.error('Send error:', err);
      addLog(`Failed to send: ${cmd}`, 'err');
    }
  };

  const loadGCode = (code: string) => {
    setCurrentGCode(code);
    toast.success('G-code loaded');
  };

  const reset = async () => {
    // GRBL Soft Reset is ^X (0x18)
    if (!isConnected || !writerRef.current) return;
    const encoder = new TextEncoder();
    await writerRef.current.write(new Uint8Array([0x18]));
    addLog('Soft Reset Sent', 'err');
    toast.warning('Machine reset sent');
  };

  return {
    isConnected,
    machineStatus,
    wpos,
    mpos,
    feedrate,
    spindle,
    logs,
    currentGCode,
    progress,
    isStreaming,
    connect,
    disconnect,
    sendCommand,
    loadGCode,
    reset
  };
};
