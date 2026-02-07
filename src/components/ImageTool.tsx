import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Wand2, Download, Layers, Move, Settings2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface ImageToolProps {
  onGenerated: (gcode: string) => void;
}

export const ImageTool: React.FC<ImageToolProps> = ({ onGenerated }) => {
  const [image, setImage] = useState<string | null>(null);
  const [width, setWidth] = useState(100);
  const [depth, setDepth] = useState(2);
  const [feedrate, setFeedrate] = useState(1000);
  const [resolution, setResolution] = useState(0.5);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateGCode = async () => {
    if (!image || !canvasRef.current) return;
    
    setIsGenerating(true);
    toast.loading('Processing image and generating toolpath...');

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = image;
    await new Promise((resolve) => img.onload = resolve);

    // Resize canvas to target resolution
    const aspectRatio = img.height / img.width;
    const targetWidth = Math.floor(width / resolution);
    const targetHeight = Math.floor((width * aspectRatio) / resolution);
    
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
    const data = imageData.data;

    let gcode = `(Image to G-code Heightmap)\n`;
    gcode += `(Width: ${width}mm, Height: ${(width * aspectRatio).toFixed(2)}mm)\n`;
    gcode += `G21 (Metric units)\n`;
    gcode += `G90 (Absolute positioning)\n`;
    gcode += `G0 Z5 (Safe height)\n`;
    gcode += `M3 S1000 (Spindle on)\n`;

    for (let y = 0; y < targetHeight; y++) {
      for (let x = 0; x < targetWidth; x++) {
        // Snake pattern for efficiency
        const scanX = (y % 2 === 0) ? x : (targetWidth - 1 - x);
        const idx = (y * targetWidth + scanX) * 4;
        
        // Greyscale value (0-255)
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const avg = (r + g + b) / 3;
        
        // Map to depth (White = 0, Black = -depth)
        const z = -((255 - avg) / 255) * depth;
        
        const mmX = (scanX * resolution).toFixed(3);
        const mmY = ((targetHeight - y) * resolution).toFixed(3);
        const mmZ = z.toFixed(3);

        if (x === 0) {
          gcode += `G0 X${mmX} Y${mmY} Z5\n`;
          gcode += `G1 Z${mmZ} F${feedrate / 2}\n`;
        } else {
          gcode += `G1 X${mmX} Y${mmY} Z${mmZ} F${feedrate}\n`;
        }
      }
    }

    gcode += `G0 Z5\n`;
    gcode += `M5\n`;
    gcode += `G0 X0 Y0\n`;
    gcode += `M30\n`;

    setIsGenerating(false);
    onGenerated(gcode);
    toast.dismiss();
    toast.success('G-code generated successfully');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      <div className="lg:col-span-5 space-y-6">
        <Card className="border-border/50 bg-secondary/10">
          <CardHeader>
            <CardTitle className="text-sm font-bold tracking-widest uppercase">Image Source</CardTitle>
            <CardDescription>Upload a high-contrast image or photograph to convert.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className={`aspect-square rounded-2xl border-2 border-dashed border-border/50 flex flex-col items-center justify-center relative overflow-hidden transition-all ${!image ? 'hover:border-primary/50' : ''}`}>
               {image ? (
                 <img src={image} className="w-full h-full object-contain" />
               ) : (
                 <>
                   <ImageIcon className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
                   <Button variant="ghost" size="sm" asChild>
                      <label htmlFor="img-upload" className="cursor-pointer font-bold text-[10px] tracking-widest uppercase">Select Image</label>
                   </Button>
                   <Input type="file" id="img-upload" className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </>
               )}
            </div>
            {image && (
              <Button variant="outline" className="w-full h-8 text-[10px] font-bold" onClick={() => setImage(null)}>
                 CHANGE IMAGE
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-secondary/10">
           <CardHeader>
             <CardTitle className="text-sm font-bold tracking-widest uppercase">Generator Settings</CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <Label className="text-[10px] font-bold uppercase text-muted-foreground">Output Width (mm)</Label>
                       <span className="text-xs font-mono font-bold text-primary">{width}</span>
                    </div>
                    <Slider value={[width]} onValueChange={([v]) => setWidth(v)} min={10} max={300} step={1} />
                 </div>
                 
                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <Label className="text-[10px] font-bold uppercase text-muted-foreground">Max Depth (mm)</Label>
                       <span className="text-xs font-mono font-bold text-primary">{depth}</span>
                    </div>
                    <Slider value={[depth]} onValueChange={([v]) => setDepth(v)} min={0.1} max={10} step={0.1} />
                 </div>

                 <div className="space-y-2">
                    <div className="flex justify-between items-center">
                       <Label className="text-[10px] font-bold uppercase text-muted-foreground">Detail Resolution (mm)</Label>
                       <span className="text-xs font-mono font-bold text-primary">{resolution}</span>
                    </div>
                    <Slider value={[resolution]} onValueChange={([v]) => setResolution(v)} min={0.1} max={2} step={0.1} />
                 </div>
              </div>

              <Button 
                className="w-full h-12 font-bold shadow-lg shadow-primary/20 mt-4" 
                disabled={!image || isGenerating}
                onClick={generateGCode}
              >
                <Wand2 className="h-4 w-4 mr-2" /> GENERATE HEIGHTMAP
              </Button>
           </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-7 flex flex-col">
         <Card className="flex-1 bg-secondary/5 border-border/50 flex flex-col overflow-hidden">
            <CardHeader className="bg-secondary/20 py-3 border-b border-border/50">
               <CardTitle className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground">Processing Canvas</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat opacity-50">
               <canvas ref={canvasRef} className="max-w-full max-h-full border border-border shadow-2xl rounded" />
               {!image && (
                 <div className="flex flex-col items-center justify-center opacity-20 grayscale scale-150">
                    <Layers className="h-12 w-12" />
                 </div>
               )}
            </CardContent>
         </Card>
      </div>
    </div>
  );
};
