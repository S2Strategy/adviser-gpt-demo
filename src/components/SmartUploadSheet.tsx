import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { X, Upload, FileText, FileSpreadsheet, File, Check, AlertCircle, Settings, Eye, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { STRATEGIES } from "@/types/vault";

interface UploadedFile {
  id: string;
  file: File;
  type: 'document' | 'data' | 'text' | 'unknown';
  category: 'completed_questionnaire' | 'single_qa' | 'data_updates' | 'policy_docs' | 'unknown';
  strategy?: string;
  confidence: number;
  preview?: string;
  question?: string;
  answer?: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

interface SmartUploadSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SmartUploadSheet({ open, onClose }: SmartUploadSheetProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<'upload' | 'preview' | 'processing'>('upload');

  // File type detection
  const getFileType = (file: File): UploadedFile['type'] => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return 'document';
      case 'csv':
      case 'xlsx':
      case 'xls':
        return 'data';
      case 'txt':
        return 'text';
      default:
        return 'unknown';
    }
  };

  // Content analysis for categorization
  const analyzeFileContent = async (file: File): Promise<{ category: UploadedFile['category'], confidence: number }> => {
    const fileName = file.name.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();
    
    // High confidence matches based on filename
    if (fileName.includes('questionnaire') || fileName.includes('survey') || fileName.includes('assessment')) {
      return { category: 'completed_questionnaire', confidence: 0.9 };
    }
    
    if (fileName.includes('policy') || fileName.includes('procedure') || fileName.includes('guideline')) {
      return { category: 'policy_docs', confidence: 0.9 };
    }
    
    if (fileName.includes('data') || fileName.includes('export') || fileName.includes('report')) {
      return { category: 'data_updates', confidence: 0.8 };
    }
    
    // Medium confidence based on file type
    if (extension === 'csv' || extension === 'xlsx' || extension === 'xls') {
      return { category: 'data_updates', confidence: 0.7 };
    }
    
    if (extension === 'txt') {
      return { category: 'single_qa', confidence: 0.6 };
    }
    
    if (extension === 'pdf' || extension === 'doc' || extension === 'docx') {
      return { category: 'policy_docs', confidence: 0.5 };
    }
    
    return { category: 'unknown', confidence: 0.3 };
  };

  // Generate file preview
  const generatePreview = async (file: File): Promise<string> => {
    if (file.type.startsWith('text/')) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target?.result as string;
          resolve(content.substring(0, 200) + (content.length > 200 ? '...' : ''));
        };
        reader.readAsText(file);
      });
    }
    return `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  };

  // Process uploaded files
  const processFiles = async (files: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (const file of Array.from(files)) {
      const fileType = getFileType(file);
      const { category, confidence } = await analyzeFileContent(file);
      const preview = await generatePreview(file);
      
      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${Math.random()}`,
        file,
        type: fileType,
        category,
        confidence,
        preview,
        status: 'pending',
        // Default to Firm-Wide strategy for categories that require it
        strategy: (category === 'single_qa' || category === 'policy_docs') ? 'Firm-Wide (Not Strategy-Specific)' : undefined
      };
      
      newFiles.push(uploadedFile);
    }
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setCurrentStep('preview');
  };

  // Drag and drop handlers
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
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFiles(e.target.files);
    }
  };

  // Update file configuration
  const updateFileConfig = (fileId: string, updates: Partial<UploadedFile>) => {
    setUploadedFiles(prev => 
      prev.map(file => 
        file.id === fileId ? { ...file, ...updates } : file
      )
    );
  };

  // Remove file
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Get category display info
  const getCategoryInfo = (category: UploadedFile['category']) => {
    switch (category) {
      case 'completed_questionnaire':
        return { label: 'Completed Questionnaire', color: 'bg-blue-100 text-blue-700', icon: FileText };
      case 'single_qa':
        return { label: 'Single Q&A', color: 'bg-green-100 text-green-700', icon: FileText };
      case 'data_updates':
        return { label: 'Data Updates', color: 'bg-orange-100 text-orange-700', icon: FileSpreadsheet };
      case 'policy_docs':
        return { label: 'Policy Docs', color: 'bg-purple-100 text-purple-700', icon: File };
      default:
        return { label: 'Unknown', color: 'bg-gray-100 text-gray-700', icon: File };
    }
  };

  // Handle upload
  const handleUpload = async () => {
    setCurrentStep('processing');
    setIsProcessing(true);
    
    try {
      // Simulate processing with progress
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        updateFileConfig(file.id, { status: 'processing' });
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateFileConfig(file.id, { status: 'completed' });
      }
      
      toast({
        title: "Upload completed",
        description: `${uploadedFiles.length} file(s) have been successfully uploaded and processed.`,
      });
      
      // Close after a brief delay to show completion
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "There was an error uploading your files. Please try again.",
        variant: "destructive",
      });
      setCurrentStep('preview');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle completed questionnaire redirect
  const handleCompletedQuestionnaire = () => {
    onClose();
    // Navigate to onboarding hub with Document Storage tab active
    navigate('/onboarding-hub?tab=document-storage');
  };

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setUploadedFiles([]);
      setCurrentStep('upload');
      setDragActive(false);
      setIsProcessing(false);
    }
  }, [open]);

  // Body scroll lock when sheet is open
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

  if (!open) return null;

  return (
    <>
      {/* Enhanced Overlay with stacking effect */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 transition-all duration-300"
        style={{
          backdropFilter: 'blur(1px)',
          WebkitBackdropFilter: 'blur(1px)'
        }}
      />
      
      {/* Main Sheet with enhanced stacking */}
      <div 
        className={`fixed top-4 right-4 bottom-4 z-50 w-full max-w-3xl bg-background border shadow-2xl rounded-xl transition-all duration-500 transform ${
          open ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-full opacity-0 scale-95'
        }`}
        style={{
          height: 'calc(100vh - 32px)',
          boxShadow: '0 32px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1)',
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header with enhanced styling */}
          <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-t-xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-gray-600 to-gray-800 rounded-lg shadow-lg">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Add Content
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {currentStep === 'upload' && 'Upload questionnaires, policies, and data with automatic categorization'}
                  {currentStep === 'preview' && 'Review and configure your files'}
                  {currentStep === 'processing' && 'Processing your files...'}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-gray-100/80 transition-colors"
              disabled={isProcessing}
            >
              <X className="h-4 w-4" /> Close
            </Button>
          </div>

          {/* Content with step-based rendering */}
          <div className="flex-1 overflow-y-auto">
            {currentStep === 'upload' && (
              <div className="p-6">
                <div
                  className={`relative border-2 border-dashed rounded-xl p-16 text-center transition-all duration-300 ${
                    dragActive 
                      ? 'border-green-400 bg-green-50/50 scale-[1.02]' 
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".doc,.docx,.xlsx,.xls"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="p-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl shadow-lg">
                        <Upload className="h-12 w-12 text-gray-600" />
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-2xl font-semibold text-gray-900 mb-2">
                        Drag & drop files here
                      </p>
                      <p className="text-lg text-gray-600 mb-4">
                        or click to select files
                      </p>
                      <p className="text-sm text-gray-500">
                        Supports: DOC, DOCX, XLSX, XLS
                      </p>
                    </div>
                    
                    <div className="flex justify-center gap-8 text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        Documents
                      </div>
                      <div className="flex items-center gap-2">
                        Data Files
                      </div>
                      <div className="flex items-center gap-2">
                        All Types
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 'preview' && (
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentStep('upload')}
                      className="hover:bg-gray-100"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <h3 className="text-lg font-semibold">Upload Preview</h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentStep('upload')}
                  >
                    Add More Files
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {uploadedFiles.map((file) => {
                    const categoryInfo = getCategoryInfo(file.category);
                    const CategoryIcon = categoryInfo.icon;
                    
                    return (
                      <div key={file.id} className="border rounded-xl p-6 space-y-4 bg-white/50 backdrop-blur-sm shadow-sm">
                        {/* File Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <CategoryIcon className="h-6 w-6 text-gray-500" />
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{file.file.name}</p>
                              <p className="text-xs text-gray-500">
                                {(file.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className={`${categoryInfo.color} border-0 shadow-sm whitespace-nowrap`}>
                              {categoryInfo.label}
                            </Badge>
                            {file.confidence < 0.7 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200">
                                Review
                              </Badge>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFile(file.id)}
                              className="text-gray-400 hover:text-red-500 hover:bg-red-50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {/* File Preview */}
                        {file.preview && (
                          <div className="bg-gray-50/80 rounded-lg p-4 border">
                            <p className="text-sm text-gray-600 font-mono leading-relaxed">
                              {file.preview}
                            </p>
                          </div>
                        )}
                        
                        {/* Configuration Options */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Category Selection */}
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={file.category}
                              onValueChange={(value) => updateFileConfig(file.id, { category: value as UploadedFile['category'] })}
                            >
                              <SelectTrigger className="bg-white/80">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="completed_questionnaire">Completed Questionnaire</SelectItem>
                                <SelectItem value="single_qa">Single Q&A</SelectItem>
                                <SelectItem value="data_updates">Data Updates</SelectItem>
                                <SelectItem value="policy_docs">Policy Docs</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {/* Strategy Selection */}
                          {(file.category === 'single_qa' || file.category === 'policy_docs') && (
                            <div className="space-y-2">
                              <Label>Strategy</Label>
                              <Select
                                value={file.strategy || ''}
                                onValueChange={(value) => updateFileConfig(file.id, { strategy: value })}
                              >
                                <SelectTrigger className="bg-white/80">
                                  <SelectValue placeholder="Select strategy" />
                                </SelectTrigger>
                                <SelectContent>
                                  {STRATEGIES.map((strategy) => (
                                    <SelectItem key={strategy} value={strategy}>
                                      {strategy}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                        </div>
                        
                        {/* Single Q&A specific fields */}
                        {file.category === 'single_qa' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Question</Label>
                              <Input
                                value={file.question || ''}
                                onChange={(e) => updateFileConfig(file.id, { question: e.target.value })}
                                placeholder="Enter the question..."
                                className="bg-white/80"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Answer</Label>
                              <Textarea
                                value={file.answer || ''}
                                onChange={(e) => updateFileConfig(file.id, { answer: e.target.value })}
                                placeholder="Enter the answer..."
                                className="min-h-20 bg-white/80"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {currentStep === 'processing' && (
              <div className="p-6 space-y-6">
                <div className="text-center space-y-4">
                  <div className="flex justify-center">
                    <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Processing Files</h3>
                    <p className="text-gray-600 mt-2">Please wait while we process your uploads...</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {uploadedFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-4 bg-white/50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          file.status === 'completed' ? 'bg-green-100' : 
                          file.status === 'processing' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {file.status === 'completed' ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : file.status === 'processing' ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          ) : (
                            <File className="h-4 w-4 text-gray-600" />
                          )}
                        </div>
                        <span className="font-medium">{file.file.name}</span>
                      </div>
                      <Badge variant={file.status === 'completed' ? 'default' : 'secondary'}>
                        {file.status === 'completed' ? 'Completed' : 'Processing...'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer with enhanced styling */}
          <div className="flex items-center justify-between p-6 border-t bg-gradient-to-r from-white/80 to-gray-50/80 backdrop-blur-sm rounded-b-xl">
            <div className="text-sm text-gray-500">
              {uploadedFiles.length > 0 && currentStep !== 'processing' && (
                <span>{uploadedFiles.length} file(s) ready to upload</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              {currentStep === 'preview' && (
                <>
                  {/* UNCOMMENT IF WE WANT TO ENABLE THIS IN THE FUTURE
                   {uploadedFiles.some(f => f.category === 'completed_questionnaire') && (
                    <Button
                      onClick={handleCompletedQuestionnaire}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                      Go to Document Storage
                    </Button>
                  )} */}
                  <Button
                    onClick={handleUpload}
                    disabled={uploadedFiles.some(f => 
                      (f.category === 'single_qa' && (!f.question || !f.answer)) ||
                      (f.category === 'policy_docs' && !f.strategy)
                    )}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Files
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
