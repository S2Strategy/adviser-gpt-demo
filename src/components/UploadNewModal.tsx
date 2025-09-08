import { useState, useEffect } from "react";
import { X, Upload, Loader2, FileText, Image, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface UploadNewModalProps {
  open: boolean;
  onClose: () => void;
}

export function UploadNewModal({ open, onClose }: UploadNewModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  // Body scroll lock when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setIsLoading(false);
      setDragActive(false);
    }
  }, [open]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setIsLoading(true);
    
    try {
      // Simulate file upload
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Files uploaded successfully",
        description: `${files.length} file(s) have been uploaded and are being processed.`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-2xl bg-background border shadow-2xl rounded-lg transition-all duration-300 transform ${
          open ? 'translate-x-[-50%] translate-y-[-50%] opacity-100 scale-100' : 'translate-x-[-50%] translate-y-[-50%] opacity-0 scale-95'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Upload New</h2>
                <p className="text-sm text-muted-foreground mt-1">Upload documents to your vault</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Drag and drop your files here, or click to browse. Supported formats: PDF, DOC, DOCX, TXT, and images.
              </p>
              
              {/* Upload Area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.gif"
                  onChange={handleFileInput}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  disabled={isLoading}
                />
                
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-gray-100 rounded-full">
                      <Upload className="h-8 w-8 text-gray-600" />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-lg font-medium text-gray-900">
                      {isLoading ? 'Uploading...' : 'Drop files here or click to browse'}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT, JPG, PNG, GIF up to 10MB each
                    </p>
                  </div>
                  
                  <div className="flex justify-center gap-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Documents
                    </div>
                    <div className="flex items-center gap-1">
                      <Image className="h-4 w-4" />
                      Images
                    </div>
                    <div className="flex items-center gap-1">
                      <File className="h-4 w-4" />
                      Text
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50/50">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                const input = document.querySelector('input[type="file"]') as HTMLInputElement;
                input?.click();
              }}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Browse Files
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
