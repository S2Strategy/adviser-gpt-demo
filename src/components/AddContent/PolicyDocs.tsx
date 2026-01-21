import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useTagTypes } from "@/hooks/useTagTypes";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useVaultEdits } from "@/hooks/useVaultState";
import { Tag, QuestionItem } from "@/types/vault";
import { ImportSession, ImportSummary } from "@/types/import";
import { createImportSession } from "@/utils/importStorage";
import { MultiSelectFilter } from "@/components/MultiSelectFilter";
import { Upload, X, File } from "lucide-react";
import { ImportResultScreen } from "@/components/Import/ImportResultScreen";

interface UploadedFile {
  file: File;
  id: string;
}

export function PolicyDocs() {
  const { toast } = useToast();
  const { profile } = useUserProfile();
  const { getAllTagTypes } = useTagTypes();
  const { saveManyEdits } = useVaultEdits();
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [autoCreateQA, setAutoCreateQA] = useState<boolean>(false);
  const [selectedTagsByType, setSelectedTagsByType] = useState<Record<string, string[]>>({});
  const [isUploading, setIsUploading] = useState(false);
  const [showResultScreen, setShowResultScreen] = useState(false);
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tagTypes = getAllTagTypes();

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

  // Placeholder function for QA extraction
  const extractQAPairsFromDocument = async (file: File): Promise<Array<{question: string, answer: string}>> => {
    // TODO: Implement document QA extraction
    // For now, return mock data
    return Promise.resolve([
      { question: "Sample question 1", answer: "Sample answer 1" },
      { question: "Sample question 2", answer: "Sample answer 2" },
      { question: "Sample question 3", answer: "Sample answer 3" }
    ]);
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

        if (!autoCreateQA) {
          // Upload without QA extraction
          await uploadDocumentToStorage(file);
          
          toast({
            title: "Document uploaded successfully",
            description: `${file.name} has been uploaded.`,
          });
        } else {
          // Upload with QA extraction
          const documentId = await uploadDocumentToStorage(file);
          const qaPairs = await extractQAPairsFromDocument(file);

          // Convert selectedTagsByType to Tag[] format
          const tags: Tag[] = [];
          Object.entries(selectedTagsByType).forEach(([tagType, values]) => {
            values.forEach(value => {
              tags.push({ type: tagType, value });
            });
          });

          // Create import session
          const session: ImportSession = createImportSession(
            undefined, // No strategy for Policy Docs
            file,
            profile.fullName || "Current User"
          );

          // Create QA pairs with tags
          const importedItemIds: string[] = [];
          const entries: Array<[string, QuestionItem]> = [];

          qaPairs.forEach((qa, index) => {
            const itemId = `qa-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            const newItem: QuestionItem = {
              id: itemId,
              type: "Policies",
              tags: tags,
              question: qa.question,
              answer: qa.answer,
              updatedAt: new Date().toISOString(),
              updatedBy: profile.fullName || "Current User",
              documentTitle: file.name,
              documentId: session.id,
            };
            entries.push([itemId, newItem]);
            importedItemIds.push(itemId);
          });

          // Save all QA pairs
          saveManyEdits(entries);

          // Create import summary
          const summary: ImportSummary = {
            rowsImported: qaPairs.length,
            tagsByType: {},
            importedItemIds: importedItemIds,
            createdTagValues: [],
          };

          // Calculate tag statistics
          Object.entries(selectedTagsByType).forEach(([tagType, values]) => {
            summary.tagsByType[tagType] = {
              existingUsed: values.length,
              newCreated: 0,
            };
          });

          setImportSession(session);
          setImportSummary(summary);
          setShowResultScreen(true);
        }
      }

      // Clear form if not showing result screen
      if (!autoCreateQA) {
        setUploadedFiles([]);
        setSelectedTagsByType({});
      }
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

  const handleUndoImport = () => {
    setShowResultScreen(false);
    setImportSession(null);
    setImportSummary(null);
    setUploadedFiles([]);
    setSelectedTagsByType({});
    setAutoCreateQA(false);
  };

  // Show result screen if import was successful
  if (showResultScreen && importSession && importSummary) {
    return (
      <ImportResultScreen
        session={importSession}
        summary={importSummary}
        onUndo={handleUndoImport}
      />
    );
  }

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

        {/* Auto-create QA checkbox */}
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="autoCreateQA" 
            checked={autoCreateQA}
            onCheckedChange={(checked) => setAutoCreateQA(checked as boolean)}
          />
          <Label htmlFor="autoCreateQA" className="cursor-pointer">
            Automatically create Q&A Pairs from this document
          </Label>
        </div>

        {/* Conditionally show tag dropdowns */}
        {autoCreateQA && (
          <div className="space-y-4">
            {tagTypes.map((tagType) => (
              <div key={tagType.id} className="space-y-2">
                <Label>{tagType.name}</Label>
                <MultiSelectFilter
                  title={tagType.name}
                  options={tagType.values}
                  selectedValues={selectedTagsByType[tagType.name] || []}
                  onSelectionChange={(values) => {
                    setSelectedTagsByType(prev => ({
                      ...prev,
                      [tagType.name]: values
                    }));
                  }}
                  placeholder={`Select ${tagType.name.toLowerCase()}...`}
                  width="w-full"
                />
              </div>
            ))}
          </div>
        )}

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

