import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getQuarterOptions, formatQuarter } from "@/types/vault";
import { Upload, X, File } from "lucide-react";

interface UploadedFile {
  file: File;
  id: string;
}

export function CommentaryDocs() {
  const { toast } = useToast();
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState<string>("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const validFiles: UploadedFile[] = [];
    Array.from(files).forEach((file) => {
      validFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      });
    });

    if (validFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...validFiles]);
      toast({
        title: "Files uploaded ✓",
        description: `${validFiles.length} file(s) added successfully.`,
      });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Placeholder function for document storage upload
  const uploadDocumentToStorage = async (file: File): Promise<string> => {
    // TODO: Implement S3 or storage upload
    // For now, return a mock URL/ID
    return Promise.resolve(`doc-${Date.now()}`);
  };

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select at least one file to upload.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Process each uploaded file
      for (const uploadedFile of uploadedFiles) {
        const file = uploadedFile.file;
        await uploadDocumentToStorage(file);
      }

      // Clear form
      setUploadedFiles([]);
      setSelectedQuarter("");

      toast({
        title: "Document uploaded successfully",
        description: `${uploadedFiles.length} file(s) uploaded successfully.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload document.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-sidebar-primary bg-sidebar-primary/10'
              : 'border-foreground/20 hover:border-foreground/40'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-foreground/50" />
          <p className="text-sm text-foreground/70 mb-2">
            Drag and drop your files here, or
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>

        {/* Quarter Selection */}
        <div className="space-y-2">
          <Label htmlFor="quarter">Quarter</Label>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger id="quarter" className="w-full">
              <SelectValue placeholder="Select quarter (optional)" />
            </SelectTrigger>
            <SelectContent>
              {getQuarterOptions().map((quarter) => (
                <SelectItem key={quarter} value={quarter}>
                  {formatQuarter(quarter)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {uploadedFiles.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Uploaded Files</h3>
            <div className="space-y-2">
              {uploadedFiles.map((uploadedFile) => (
                <div
                  key={uploadedFile.id}
                  className="flex items-center justify-between p-3 border border-foreground/10 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <File className="h-4 w-4 text-foreground/70" />
                    <span className="text-sm">{uploadedFile.file.name}</span>
                    <span className="text-xs text-foreground/50">
                      ({(uploadedFile.file.size / 1024).toFixed(2)} KB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(uploadedFile.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {uploadedFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-sidebar-primary hover:bg-sidebar-primary/80 w-full"
          >
            {isUploading ? "Uploading..." : "Upload Document"}
          </Button>
        )}
      </div>
    </div>
  );
}
