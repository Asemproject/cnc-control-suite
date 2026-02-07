import React, { useState, useEffect } from 'react';
import { Upload, FileCode, Trash2, Clock, Search, MoreVertical, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { blink } from '@/lib/blink';
import { toast } from 'sonner';

interface GCodeFile {
  id: string;
  filename: string;
  fileUrl: string;
  lineCount: number;
  createdAt: string;
}

interface FileExplorerProps {
  onSelectFile: (code: string) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({ onSelectFile }) => {
  const [files, setFiles] = useState<GCodeFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchFiles = async () => {
    setIsLoading(true);
    try {
      const data = await blink.db.gcodeHistory.list({
        orderBy: { createdAt: 'desc' }
      });
      setFiles(data as GCodeFile[]);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.promise(async () => {
      const { publicUrl } = await blink.storage.upload(
        file,
        `gcode/${Date.now()}-${file.name}`
      );

      const content = await file.text();
      const lineCount = content.split('\n').length;

      await blink.db.gcodeHistory.create({
        filename: file.name,
        fileUrl: publicUrl,
        lineCount
      });

      fetchFiles();
    }, {
      loading: 'Uploading G-code...',
      success: 'File uploaded successfully',
      error: 'Failed to upload G-code'
    });
  };

  const loadFile = async (file: GCodeFile) => {
    try {
      const response = await fetch(file.fileUrl);
      const code = await response.text();
      onSelectFile(code);
    } catch (err) {
      console.error('Load error:', err);
      toast.error('Failed to load file content');
    }
  };

  const deleteFile = async (fileId: string) => {
    try {
      await blink.db.gcodeHistory.delete(fileId);
      setFiles(prev => prev.filter(f => f.id !== fileId));
      toast.success('File removed from history');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error('Failed to delete file');
    }
  };

  const filteredFiles = files.filter(f => 
    f.filename.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search files..." 
            className="pl-10 h-10 bg-secondary/20" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Input 
            type="file" 
            className="hidden" 
            id="gcode-upload" 
            accept=".gcode,.nc,.txt" 
            onChange={handleUpload}
          />
          <Button asChild className="flex-1 sm:flex-initial h-10 font-bold">
            <label htmlFor="gcode-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" /> UPLOAD FILE
            </label>
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-secondary/10 rounded-2xl border border-border/50 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file) => (
                <Card key={file.id} className="group border-border/50 bg-secondary/20 hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <FileCode className="h-5 w-5" />
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => loadFile(file)}>
                          <PlayCircle className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => deleteFile(file.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <h3 className="font-bold truncate text-sm" title={file.filename}>{file.filename}</h3>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="bg-secondary/50 text-[10px] h-5">
                          {file.lineCount.toLocaleString()} LINES
                        </Badge>
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 uppercase tracking-wider">
                          <Clock className="h-3 w-3" />
                          {new Date(file.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredFiles.length === 0 && !isLoading && (
                <div className="col-span-full py-20 flex flex-col items-center justify-center text-muted-foreground opacity-20 grayscale">
                   <FileCode className="h-16 w-16 mb-4" />
                   <p className="text-xl font-bold italic tracking-widest uppercase">No G-code library</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
