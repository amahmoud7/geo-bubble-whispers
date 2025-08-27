import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  Upload, X, Image as ImageIcon, Video, Camera, FolderOpen, 
  Edit3, Crop, Palette, Sparkles, FileCheck, AlertCircle 
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ModernMediaUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  allowedTypes?: string[];
}

const ModernMediaUpload: React.FC<ModernMediaUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  allowedTypes = ['image/*', 'video/*']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Size validation (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select files under 50MB",
        variant: "destructive"
      });
      return false;
    }

    // Type validation
    const isValidType = allowedTypes.some(type => 
      file.type.match(type.replace('*', '.*'))
    );
    
    if (!isValidType) {
      toast({
        title: "Invalid file type",
        description: "Please select images or videos only",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const createPreview = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles = fileArray.filter(validateFile);
    
    if (files.length + validFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      });
      return;
    }

    // Create previews
    const newPreviews: Record<string, string> = {};
    for (const file of validFiles) {
      const preview = await createPreview(file);
      newPreviews[file.name] = preview;
    }
    
    setPreviewUrls(prev => ({ ...prev, ...newPreviews }));
    onFilesChange([...files, ...validFiles]);
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    const newFiles = files.filter((_, i) => i !== index);
    
    // Clean up preview URL
    if (previewUrls[fileToRemove.name]) {
      URL.revokeObjectURL(previewUrls[fileToRemove.name]);
      const newPreviews = { ...previewUrls };
      delete newPreviews[fileToRemove.name];
      setPreviewUrls(newPreviews);
    }
    
    onFilesChange(newFiles);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [files, maxFiles]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('video/')) {
      return <Video className="h-4 w-4" />;
    }
    return <ImageIcon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
          isDragOver 
            ? 'border-primary bg-primary/5' 
            : 'border-gray-300 hover:border-primary/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="hidden"
        />
        
        <div className="flex flex-col items-center space-y-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isDragOver ? 'Drop files here' : 'Upload Media'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select photos and videos
            </p>
            <p className="text-xs text-muted-foreground">
              Up to {maxFiles} files, 50MB each
            </p>
          </div>
          
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <FolderOpen className="h-4 w-4" />
              Gallery
            </Button>
          </div>
        </div>
      </div>

      {/* File Preview Grid */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Selected Media ({files.length}/{maxFiles})
            </h4>
            {files.length > 1 && (
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Carousel
              </Badge>
            )}
          </div>
          
          {files.length === 1 ? (
            // Single file preview
            <Card className="overflow-hidden">
              <div className="relative">
                {previewUrls[files[0].name] && (
                  <div className="aspect-video bg-black flex items-center justify-center">
                    {files[0].type.startsWith('video/') ? (
                      <video 
                        src={previewUrls[files[0].name]} 
                        className="max-h-full max-w-full"
                        controls 
                      />
                    ) : (
                      <img 
                        src={previewUrls[files[0].name]} 
                        alt="Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </div>
                )}
                
                <div className="absolute top-2 right-2 flex space-x-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-8 w-8 p-0"
                    onClick={() => {/* TODO: Add edit functionality */}}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 w-8 p-0"
                    onClick={() => removeFile(0)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <CardContent className="p-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    {getFileIcon(files[0])}
                    <span className="truncate">{files[0].name}</span>
                  </div>
                  <span className="text-muted-foreground">
                    {formatFileSize(files[0].size)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ) : (
            // Multiple files carousel preview
            <Carousel className="w-full">
              <CarouselContent className="-ml-2">
                {files.map((file, index) => (
                  <CarouselItem key={file.name} className="pl-2 basis-1/2 sm:basis-1/3">
                    <Card className="overflow-hidden">
                      <div className="relative aspect-square bg-black flex items-center justify-center">
                        {previewUrls[file.name] && (
                          <>
                            {file.type.startsWith('video/') ? (
                              <video 
                                src={previewUrls[file.name]} 
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img 
                                src={previewUrls[file.name]} 
                                alt="Preview"
                                className="w-full h-full object-cover"
                              />
                            )}
                          </>
                        )}
                        
                        <div className="absolute top-1 right-1">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-6 w-6 p-0"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-2 w-2" />
                          </Button>
                        </div>
                        
                        <div className="absolute bottom-1 left-1">
                          {getFileIcon(file)}
                        </div>
                      </div>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          )}
          
          {/* File Tools */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Crop className="h-4 w-4" />
              Crop
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Palette className="h-4 w-4" />
              Filter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernMediaUpload;