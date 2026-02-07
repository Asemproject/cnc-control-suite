import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export type ConnectionType = 'usb' | 'bluetooth' | 'websocket';

export interface SerialHook {
  isConnected: boolean;
  connectionType: ConnectionType | null;
  machineStatus: string;
  wpos: { x: number; y: number; z: number };
  mpos: { x: number; y: number; z: number };
  feedrate: number;
  spindle: number;
  logs: string[];
  currentGCode: string;
  progress: number;
  isStreaming: boolean;
  connect: (type: ConnectionType, options?: any) => Promise<void>;
  disconnect: () => Promise<void>;
  sendCommand: (cmd: string) => Promise<void>;
  loadGCode: (code: string) => void;
  reset: () => Promise<void>;
}

export const useSerial = (): SerialHook => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
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
  const socketRef = useRef<WebSocket | null>(null);
  const bluetoothRef = useRef<any>(null);
  const intervalRef = useRef<any>(null);

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

  const handleData = (data: string) => {
    const lines = data.split(/\r?\n/);
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
  };

  const connect = async (type: ConnectionType, options: any = {}) => {
    setConnectionType(type);
    
    if (type === 'usb') {
      if (!('serial' in navigator)) {
        toast.error('Web Serial API not supported');
        return;
      }

      try {
        const port = await (navigator as any).serial.requestPort();
        await port.open({ baudRate: options.baudRate || 115200 });
        portRef.current = port;
        
        const readLoop = async () => {
          const reader = port.readable.getReader();
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
              lines.forEach(l => handleData(l));
            }
          } catch (err) { console.error(err); }
          finally { reader.releaseLock(); }
        };

        readLoop();
        writerRef.current = port.writable.getWriter();
        setIsConnected(true);
        toast.success('USB Machine connected');
      } catch (err) {
        toast.error('USB connection failed');
        console.error(err);
      }
    } else if (type === 'websocket') {
      try {
        const socket = new WebSocket(options.url || 'ws://192.168.1.1/ws');
        socketRef.current = socket;
        
        socket.onopen = () => {
          setIsConnected(true);
          toast.success('WebSocket connected');
        };
        
        socket.onmessage = (event) => {
          handleData(event.data);
        };
        
        socket.onclose = () => {
          setIsConnected(false);
          toast.info('WebSocket disconnected');
        };

        socket.onerror = (err) => {
          toast.error('WebSocket error');
          console.error(err);
        };
      } catch (err) {
        toast.error('WebSocket connection failed');
      }
    } else if (type === 'bluetooth') {
      if (!('bluetooth' in navigator)) {
        toast.error('Web Bluetooth not supported');
        return;
      }

      try {
        // This is a generic Bluetooth LE Serial implementation (Nordic UART Service is common)
        const device = await (navigator as any).bluetooth.requestDevice({
          filters: [{ services: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e'] }],
          optionalServices: ['6e400001-b5a3-f393-e0a9-e50e24dcca9e']
        });

        const server = await device.gatt.connect();
        const service = await server.getPrimaryService('6e400001-b5a3-f393-e0a9-e50e24dcca9e');
        const rxChar = await service.getCharacteristic('6e400003-b5a3-f393-e0a9-e50e24dcca9e');
        const txChar = await service.getCharacteristic('6e400002-b5a3-f393-e0a9-e50e24dcca9e');

        bluetoothRef.current = { device, rxChar, txChar };
        
        await rxChar.startNotifications();
        rxChar.addEventListener('characteristicvaluechanged', (event: any) => {
          const decoder = new TextDecoder();
          handleData(decoder.decode(event.target.value));
        });

        setIsConnected(true);
        toast.success('Bluetooth connected');
      } catch (err) {
        toast.error('Bluetooth connection failed');
        console.error(err);
      }
    }

    // Start status query interval
    intervalRef.current = setInterval(() => {
      sendCommand('?');
    }, 250);
  };

  const disconnect = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    if (connectionType === 'usb') {
      if (readerRef.current) await readerRef.current.cancel();
      if (writerRef.current) {
        writerRef.current.releaseLock();
        writerRef.current = null;
      }
      if (portRef.current) {
        await portRef.current.close();
        portRef.current = null;
      }
    } else if (connectionType === 'websocket') {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    } else if (connectionType === 'bluetooth') {
      if (bluetoothRef.current?.device) {
        await bluetoothRef.current.device.gatt.disconnect();
        bluetoothRef.current = null;
      }
    }

    setIsConnected(false);
    setConnectionType(null);
  };

  const sendCommand = async (cmd: string) => {
    if (!isConnected) return;
    
    try {
      if (connectionType === 'usb' && writerRef.current) {
        const encoder = new TextEncoder();
        await writerRef.current.write(encoder.encode(cmd + '\n'));
      } else if (connectionType === 'websocket' && socketRef.current) {
        socketRef.current.send(cmd + '\n');
      } else if (connectionType === 'bluetooth' && bluetoothRef.current) {
        const encoder = new TextEncoder();
        await bluetoothRef.current.txChar.writeValue(encoder.encode(cmd + '\n'));
      }
      
      if (cmd !== '?') addLog(cmd, 'in');
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
    connectionType,
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
