import React, { useState, useEffect, useRef } from 'react';
import Logo from '@/assets/AdviserGPT-logo.svg?react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { 
  PlusCircle, 
  BookOpenText,
  ShieldPlus,
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { useChatResults, ChatResult, Source } from '@/hooks/useChatResults';
import { AnswerLoadingState } from './AnswerLoadingState';
import { SourceManagementPanel } from './SourceManagementPanel';
import { VaultSidebar } from './VaultSidebar';
import { ChatInput } from './ChatInput';
import { FiltersPanel } from './FiltersPanel';
import { getExampleQuestions, getAvailableSources, getMockVaultData, getAnswerModeResponse, getChatModeResponse, getExampleResponse } from '@/utils/contentUtils';



interface ComplianceCheck {
  id: string;
  title: string;
  status: 'passed' | 'failed' | 'warning';
  description: string;
  suggestion?: string;
}

interface Answer {
  id: string;
  question: string;
  answer: string;
  sources: Source[];
  vaultRatio: number;
  aiRatio: number;
  lastSynced: Date;
  version: number;
  complianceChecks?: ComplianceCheck[];
  uploadedFiles?: UploadedFile[];
  filters?: {
    tags: string[];
    strategies: string[];
    types: string[];
    priorSamples: Array<{
      id: string;
      name: string;
      type: string;
    }>;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  file: File;
}

export function AdviserGPTHome() {
  const { toast } = useToast();
  const { addRecentSearch, getLastMode, setLastMode } = useRecentSearches();
  const { saveChatResult } = useChatResults();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  
  // State management
  const [inputValue, setInputValue] = useState('');
  const [selectedMode, setSelectedMode] = useState<'answer' | 'chat' | 'riaOutreach'>(() => getLastMode());
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<Answer | null>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStep, setLoadingStep] = useState('search');
  const [sourcesFound, setSourcesFound] = useState(0);
  const [showSourcePanel, setShowSourcePanel] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [followUpFiles, setFollowUpFiles] = useState<UploadedFile[]>([]);
  const [streamingAnswer, setStreamingAnswer] = useState<string>('');
  const processedStoredResult = useRef<string | null>(null);
  
  // Filter state management
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedPriorSamples, setSelectedPriorSamples] = useState<string[]>([]);
  const [fileHistory, setFileHistory] = useState<Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    uploadedAt: Date;
  }>>([]);
  const [availableSources] = useState<Source[]>(getAvailableSources());

  // Get current example questions based on mode
  const exampleQuestions = getExampleQuestions(selectedMode);

  // File handling functions

  const handleFileUpload = (files: FileList | null, isFollowUp: boolean = false) => {
    if (!files) return;
    
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      type: file.type,
      size: file.size,
      file: file
    }));

    if (isFollowUp) {
      setFollowUpFiles(prev => [...prev, ...newFiles]);
    } else {
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }

    toast({
      title: "Files uploaded ✓",
      description: `${newFiles.length} file(s) added successfully.`
    });
  };

  const removeFile = (fileId: string, isFollowUp: boolean = false) => {
    if (isFollowUp) {
      setFollowUpFiles(prev => prev.filter(file => file.id !== fileId));
    } else {
      setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
    }
  };

  // Filter helper functions
  const handleClearAllFilters = () => {
    setSelectedTags([]);
    setSelectedStrategies([]);
    setSelectedTypes([]);
    setSelectedPriorSamples([]);
  };

  const removeTag = (tag: string) => {
    setSelectedTags(prev => prev.filter(t => t !== tag));
  };

  const removeStrategy = (strategy: string) => {
    setSelectedStrategies(prev => prev.filter(s => s !== strategy));
  };

  const removeType = (type: string) => {
    setSelectedTypes(prev => prev.filter(t => t !== type));
  };

  const removePriorSample = (sampleId: string) => {
    setSelectedPriorSamples(prev => prev.filter(id => id !== sampleId));
  };

  const addToFileHistory = (files: UploadedFile[]) => {
    const newHistoryEntries = files.map(file => ({
      id: file.id,
      name: file.name,
      type: file.type,
      size: file.size,
      uploadedAt: new Date()
    }));
    setFileHistory(prev => [...prev, ...newHistoryEntries]);
  };

  // Function to simulate streaming answer text with dynamic progress
  const streamAnswerText = (fullAnswer: string, onComplete: () => void) => {
    setStreamingAnswer('');
    setLoadingProgress(0);
    let currentIndex = 0;
    // Remove line breaks and normalize whitespace for inline display
    const normalizedAnswer = fullAnswer.replace(/\n\s*\n/g, ' ').replace(/\s+/g, ' ').trim();
    const words = normalizedAnswer.split(' ');
    const totalWords = words.length;
    
    const streamInterval = setInterval(() => {
      if (currentIndex < words.length) {
        // Add 1-3 words at a time for realistic streaming
        const wordsToAdd = Math.min(1 + Math.floor(Math.random() * 3), words.length - currentIndex);
        const newText = words.slice(0, currentIndex + wordsToAdd).join(' ');
        setStreamingAnswer(newText);
        currentIndex += wordsToAdd;
        
        // Update progress based on text completion (0-95%)
        const textProgress = Math.min((currentIndex / totalWords) * 95, 95);
        setLoadingProgress(textProgress);
      } else {
        clearInterval(streamInterval);
        // Set progress to 100% when streaming completes
        setLoadingProgress(100);
        onComplete();
      }
    }, 50 + Math.random() * 100); // Random delay between 50-150ms for realistic typing
  };

  // Handle URL parameters
  useEffect(() => {
    const resetParam = searchParams.get('reset');
    const queryParam = searchParams.get('query');
    const modeParam = searchParams.get('mode');
    
    if (resetParam === 'true') {
      // Reset all state to pristine values, but preserve the last selected mode
      setInputValue('');
      setSelectedMode(getLastMode()); // Use last selected mode instead of defaulting to 'answer'
      setIsGenerating(false);
      setCurrentAnswer(null);
      setLoadingProgress(0);
      setLoadingStep('search');
      setSourcesFound(0);
      setShowSourcePanel(false);
      setUploadedFiles([]);
      setFollowUpFiles([]);
      setStreamingAnswer('');
      
      // Clear all filters on reset
      handleClearAllFilters();
      setFileHistory([]);
      
      // Remove the reset parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('reset');
      setSearchParams(newSearchParams, { replace: true });
    } else if (queryParam) {
      // Check if we have a stored result in navigation state - if so, don't handle URL params
      const state = location.state as { 
        storedChatResult?: ChatResult; 
        skipLoading?: boolean;
        filters?: {
          tags: string[];
          strategies: string[];
          types: string[];
          priorSamples: Array<{
            id: string;
            name: string;
            type: string;
          }>;
        };
        uploadedFiles?: Array<{
          id: string;
          name: string;
          type: string;
          size: number;
        }>;
      } | null;
      
      if (state?.storedChatResult && state?.skipLoading) {
        // We have a stored result, let the other useEffect handle it
        return;
      }
      
      // Handle query and mode parameters from recent search clicks
      setInputValue(queryParam);
      if (modeParam === 'answer' || modeParam === 'chat' || modeParam === 'riaOutreach') {
        setSelectedMode(modeParam);
      }
      
      // Restore filters and uploaded files from navigation state
      if (state?.filters) {
        setSelectedTags(state.filters.tags || []);
        setSelectedStrategies(state.filters.strategies || []);
        setSelectedTypes(state.filters.types || []);
        setSelectedPriorSamples(state.filters.priorSamples?.map(s => s.id) || []);
      }
      
      if (state?.uploadedFiles) {
        // Convert back to UploadedFile format for the component
        const restoredFiles: UploadedFile[] = state.uploadedFiles.map(file => {
          // Create a dummy File object for the restored file
          const dummyFile = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: Date.now()
          } as File;
          return {
            id: file.id,
            name: file.name,
            type: file.type,
            size: file.size,
            file: dummyFile
          };
        });
        setUploadedFiles(restoredFiles);
      }
      
      // Auto-run the query if no stored result is available
      setTimeout(() => {
        startChatWithQuestion(queryParam);
      }, 100); // Small delay to ensure state is set
      
      // Clean up URL parameters
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('query');
      newSearchParams.delete('mode');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, getLastMode]);

  // Handle stored chat results from navigation state
  useEffect(() => {
    const state = location.state as { storedChatResult?: ChatResult; skipLoading?: boolean } | null;
    
    if (state?.storedChatResult && state?.skipLoading) {
      const storedResult = state.storedChatResult;
      
      // Prevent processing the same result multiple times
      if (processedStoredResult.current === storedResult.id) {
        return;
      }
      
      processedStoredResult.current = storedResult.id;
      
      // Load the stored chat result directly in completed state
      setInputValue(storedResult.query);
      setSelectedMode(storedResult.mode);
      setCurrentAnswer({
        id: storedResult.id,
        question: storedResult.query,
        answer: storedResult.answer,
        sources: storedResult.sources.map(source => ({
          ...source,
          lastModified: new Date(source.lastModified)
        })),
        vaultRatio: storedResult.vaultRatio,
        aiRatio: storedResult.aiRatio,
        lastSynced: new Date(storedResult.lastSynced),
        version: storedResult.version,
        complianceChecks: storedResult.complianceChecks
      });
      setIsGenerating(false);
      setLoadingProgress(100); // Set to 100% to show completed state
      setLoadingStep('search');
      setSourcesFound(8);
      setShowSourcePanel(false);
      setStreamingAnswer(''); // Clear any streaming text
      
      // Clear the navigation state to prevent re-loading
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Save mode preference whenever it changes
  useEffect(() => {
    setLastMode(selectedMode);
  }, [selectedMode, setLastMode]);

  // Function to generate Answer Mode response (vault-focused)
  const generateAnswerModeResponse = (question: string) => {
    const template = getAnswerModeResponse();
    return {
      id: Date.now().toString(),
      question: question,
      answer: template.answer,
      sources: template.sources,
      vaultRatio: template.vaultRatio,
      aiRatio: template.aiRatio,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: template.complianceChecks
    };
  };

  // Function to generate Chat Mode response (web + vault)
  const generateChatModeResponse = (question: string) => {
    const template = getChatModeResponse(question);
    return {
      id: Date.now().toString(),
      question: question,
      answer: template.answer,
      sources: template.sources,
      vaultRatio: template.vaultRatio,
      aiRatio: template.aiRatio,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: []
    };
  };

  const handleSubmit = async () => {
    if (!inputValue.trim()) return;
    
    // Add to recent searches
    addRecentSearch(
      inputValue.trim(), 
      selectedMode,
      {
        tags: selectedTags,
        strategies: selectedStrategies,
        types: selectedTypes,
        priorSamples: selectedPriorSamples.map(id => {
          const sample = fileHistory.find(f => f.id === id);
          return sample ? {
            id: sample.id,
            name: sample.name,
            type: sample.type
          } : null;
        }).filter(Boolean)
      },
      uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size
      }))
    );
    
    // Add uploaded files to history for Prior Samples filter
    if (uploadedFiles.length > 0) {
      addToFileHistory(uploadedFiles);
    }
    
    setIsGenerating(true);
    setLoadingProgress(0);
    setLoadingStep('Searching Vault');
    setSourcesFound(8);
    
    // Generate answer based on mode
    const mockAnswer = selectedMode === 'answer' 
      ? generateAnswerModeResponse(inputValue)
      : generateChatModeResponse(inputValue);
    
    // Start streaming the answer text
    streamAnswerText(mockAnswer.answer, () => {
      // Set the answer immediately so the component can transition
      const answerWithFilesAndFilters = {
        ...mockAnswer,
        uploadedFiles: uploadedFiles,
        filters: {
          tags: selectedTags,
          strategies: selectedStrategies,
          types: selectedTypes,
          priorSamples: selectedPriorSamples.map(id => {
            const sample = fileHistory.find(f => f.id === id);
            return sample ? {
              id: sample.id,
              name: sample.name,
              type: sample.type
            } : null;
          }).filter(Boolean)
        }
      };
      setCurrentAnswer(answerWithFilesAndFilters);
      
      // Set the answer immediately - the progress bar collapse is now handled in AnswerLoadingState
      setIsGenerating(false);
      setStreamingAnswer('');
      
      // Save the chat result for future retrieval (async to prevent render issues)
      setTimeout(() => {
        saveChatResult({
          query: inputValue.trim(),
          answer: mockAnswer.answer,
          sources: mockAnswer.sources,
          vaultRatio: mockAnswer.vaultRatio,
          aiRatio: mockAnswer.aiRatio,
          lastSynced: mockAnswer.lastSynced,
          version: mockAnswer.version,
          complianceChecks: mockAnswer.complianceChecks,
          mode: selectedMode
        });
      }, 0);
    });
  };

  const handleExampleClick = (question: string) => {
    setInputValue(question);
    // Add to recent searches
    addRecentSearch(
      question, 
      selectedMode,
      {
        tags: selectedTags,
        strategies: selectedStrategies,
        types: selectedTypes,
        priorSamples: selectedPriorSamples.map(id => {
          const sample = fileHistory.find(f => f.id === id);
          return sample ? {
            id: sample.id,
            name: sample.name,
            type: sample.type
          } : null;
        }).filter(Boolean)
      },
      uploadedFiles.map(file => ({
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size
      }))
    );
    // Start the chat immediately with the selected question
    startChatWithQuestion(question);
  };

  const startChatWithQuestion = async (question: string) => {
    if (!question.trim()) return;
    
    setIsGenerating(true);
    setCurrentAnswer(null);
    setShowSourcePanel(false);
    setLoadingProgress(0);
    setLoadingStep('Searching Vault');
    setSourcesFound(8);
    
    // Generate realistic mock answer based on question type with minimal AI formatting
    const template = getExampleResponse(question);
    
    const mockAnswer: Answer = {
      id: `example-${Date.now()}`,
      question,
      answer: template.answer,
      sources: template.sources,
      vaultRatio: template.vaultRatio,
      aiRatio: template.aiRatio,
      lastSynced: new Date(),
      version: 1,
      complianceChecks: template.complianceChecks
    };
    
    // Start streaming the answer text
    streamAnswerText(mockAnswer.answer, () => {
      // Set the answer immediately so the component can transition
      const answerWithFiles = {
        ...mockAnswer,
        uploadedFiles: uploadedFiles
      };
      setCurrentAnswer(answerWithFiles);
      
      // Set the answer immediately - the progress bar collapse is now handled in AnswerLoadingState
      setIsGenerating(false);
      setStreamingAnswer('');
      
      // Save the chat result for future retrieval (async to prevent render issues)
      setTimeout(() => {
        saveChatResult({
          query: question.trim(),
          answer: mockAnswer.answer,
          sources: mockAnswer.sources,
          vaultRatio: mockAnswer.vaultRatio,
          aiRatio: mockAnswer.aiRatio,
          lastSynced: mockAnswer.lastSynced,
          version: mockAnswer.version,
          complianceChecks: mockAnswer.complianceChecks,
          mode: selectedMode
        });
      }, 0);
    });
  };

  const handleCopy = () => {
    if (currentAnswer) {
      navigator.clipboard.writeText(currentAnswer.answer);
      toast({
        title: "Copied to clipboard ✓",
        description: "Answer copied successfully."
      });
    }
  };

  // Mock Vault Data - in a real app, this would come from an API
  const [mockVaultData, setMockVaultData] = useState(getMockVaultData());

  const handleSave = (updatedAnswer?: Answer) => {
    if (updatedAnswer) {
      // Check if this answer matches an existing vault entry
      const existingEntry = mockVaultData.find(entry => 
        entry.question.toLowerCase() === updatedAnswer.question.toLowerCase()
      );
      
      if (existingEntry) {
        // Update existing entry
        setMockVaultData(prev => prev.map(entry => 
          entry.id === existingEntry.id 
            ? { ...entry, answer: updatedAnswer.answer, lastModified: new Date() }
            : entry
        ));
        toast({
          title: "Updated in Vault ✓",
          description: `Answer updated in ${existingEntry.category}`
        });
      } else {
        // Add new entry to vault
        const newEntry = {
          id: `vault-${Date.now()}`,
          question: updatedAnswer.question,
          answer: updatedAnswer.answer,
          category: 'Custom Answers',
          lastModified: new Date()
        };
        setMockVaultData(prev => [...prev, newEntry]);
        toast({
          title: "Saved to Vault ✓",
          description: "New answer saved to Custom Answers"
        });
      }
    } else {
      // Original save behavior (for existing save button)
      toast({
        title: "Saved to Vault ✓",
        description: "Answer saved to RIA Strategy / Investment Process"
      });
    }
  };

  const handleEmail = () => {
    toast({
      title: "Email opened",
      description: "Your default email client has opened with the formatted text."
    });
  };

  const handleSourceAdd = (sourceId: string) => {
    // In a real app, this would add the source to the current answer
    console.log('Add source:', sourceId);
    toast({
      title: "Source added",
      description: "The source has been added to your answer."
    });
  };

  const handleSourceRemove = (sourceId: string) => {
    // In a real app, this would remove the source from the current answer
    console.log('Remove source:', sourceId);
    toast({
      title: "Source removed",
      description: "The source has been removed from your answer."
    });
  };

  const handleRebuild = () => {
    // In a real app, this would rebuild the answer with current sources
    console.log('Rebuild answer');
    toast({
      title: "Answer rebuilt ✓",
      description: "Answer rebuilt using current sources."
    });
  };

  return (
    <div className="h-screen w-full bg-sidebar-background flex">
      {/* Vault Sidebar */}
      <VaultSidebar />

      
      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-background mt-4 rounded-tl-2xl vault-scroll">
        <div className={`flex-1 overflow-y-auto flex flex-col
          ${!currentAnswer && !isGenerating ? 'p-8' : 'p-0'}`}>
          
          {/* Header - Show when generating or when answer is loaded */}
          {(isGenerating || currentAnswer) && (
            <div className="border-b border-foreground/10">
              <div className="flex items-center justify-between text-sm mb-4 px-6 pt-4">
                <Logo aria-label="AdviserGPT" className="h-4 w-auto" />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSourcePanel(!showSourcePanel)}
                  className="flex items-center gap-2"
                >
                  <BookOpenText className="h-4 w-4" />
                  {showSourcePanel ? 'Close Sources' : 'Open Sources'}
                </Button>
              </div>
            </div>
          )}
          <div className={`max-w-4xl mx-auto
          ${!currentAnswer && !isGenerating ? 'h-full' : 'flex-1 flex flex-col w-full'}`}>
            {!currentAnswer && !isGenerating ? (
              /* Initial State */
              <div className="flex flex-col items-center justify-center space-y-12 h-full">
                <div className="text-center mb-8 space-y-6">
                  <h2 className="text-4xl font-bold mb-2"><Logo aria-label="AdviserGPT" className="h-8 w-auto mx-auto" /></h2>
                  <p className="text-lg text-foreground/90">
                    Every response is sourced from your Vault to match your firm's tone of voice.
                  </p>
                  
                </div>

                {/* Input Bar */}
                <div className="w-full max-w-3xl mb-8">
                  <div className="space-y-4">
                    {/* Mode Toggle */}
                    <div className="flex flex-col gap-2 md:flex-row md:gap-0 justify-between items-center">
                      <div className="flex flex-1 w-full md:w-auto md:flex-none items-center bg-foreground/10 rounded-lg p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedMode('answer')}
                              className={`flex flex-1 md:flex-none justify-center md:justify-start items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedMode === 'answer'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-foreground/60 hover:text-foreground'
                              }`}
                            >
                              <BookOpenText className="h-4 w-4" />
                              Vault Only
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>For client questions - uses firm-approved Vault content</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={() => setSelectedMode('chat')}
                              className={`flex flex-1 md:flex-none justify-center md:justify-start items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedMode === 'chat'
                                  ? 'bg-background text-foreground shadow-sm'
                                  : 'text-foreground/60 hover:text-foreground'
                              }`}
                            >
                              <ShieldPlus className="h-4 w-4" />
                              Vault + Web
                            </button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>For internal questions - searches web + Vault sources</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>

                      {/* Filters Button */}
                      <div className="flex flex-1 w-full md:w-auto md:flex-none justify-center text-xs">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowFiltersPanel(true)}
                          className="flex items-center gap-2 w-full md:w-auto"
                        >
                          <Filter className="h-4 w-4" />
                          Open Filters
                          {(selectedTags.length + selectedStrategies.length + 
                            selectedTypes.length + selectedPriorSamples.length) > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedTags.length + selectedStrategies.length + 
                               selectedTypes.length + selectedPriorSamples.length}
                            </Badge>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Filter Badges */}
                    {(selectedTags.length > 0 || selectedStrategies.length > 0 || 
                      selectedTypes.length > 0 || selectedPriorSamples.length > 0) && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {selectedTags.map(tag => (
                          <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                            {tag}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeTag(tag)}
                            />
                          </Badge>
                        ))}
                        {selectedStrategies.map(strategy => (
                          <Badge key={strategy} variant="secondary" className="flex items-center gap-1">
                            {strategy}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeStrategy(strategy)}
                            />
                          </Badge>
                        ))}
                        {selectedTypes.map(type => (
                          <Badge key={type} variant="secondary" className="flex items-center gap-1">
                            {type}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-foreground" 
                              onClick={() => removeType(type)}
                            />
                          </Badge>
                        ))}
                        {selectedPriorSamples.map(sampleId => {
                          const sample = fileHistory.find(f => f.id === sampleId);
                          return sample ? (
                            <Badge key={sampleId} variant="secondary" className="flex items-center gap-1">
                              {sample.name}
                              <X 
                                className="h-3 w-3 cursor-pointer hover:text-foreground" 
                                onClick={() => removePriorSample(sampleId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Main Input */}
                    <ChatInput
                      value={inputValue}
                      onChange={setInputValue}
                      onSubmit={handleSubmit}
                      placeholder="e.g. What is our investment research process?"
                      disabled={isGenerating}
                      autoFocus={true}
                      variant="main"
                      uploadedFiles={uploadedFiles}
                      onFileUpload={(files) => handleFileUpload(files, false)}
                      onFileRemove={(fileId) => removeFile(fileId, false)}
                      showFormatDropdown={true}
                      showAttachButton={true}
                      showFileCards={true}
                    />
                  </div>
                </div>

                {/* Examples */}
                <div className="w-full max-w-3xl mb-8">
                  <div className="text-center mb-2">
                    <p className="text-sm text-foreground/80">Try one of these examples:</p>
                  </div>
                  <div className="grid md:grid-cols-2 gap-2">
                    {Object.values(exampleQuestions).map((question, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="text-sm font-normal bg-sidebar-background/50 flex flex-wrap justify-between min-h-14 h-auto px-4 py-2 items-center text-sidebar-foreground hover:bg-sidebar-background/70 border-foreground/10 hover:border-foreground/20 whitespace-normal text-left"
                        onClick={() => handleExampleClick(question)}
                      >
                        <span className="flex flex-1">{question}</span> <PlusCircle className="h-4 w-4 text-sidebar-foreground/70" />
                      </Button>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              /* Chat State (Loading or Answer) */
              <div className="space-y-6 flex-1 pb-8 flex flex-col justify-end w-full px-8">
                {/* User Question */}
                <div className="flex justify-end w-full">
                  <div className="max-w-[90%] flex justify-end items-end flex-col pt-4">
                    {/* Uploaded Files Display - Show during generation or when answer is loaded */}
                    {((isGenerating && uploadedFiles.length > 0) || (currentAnswer?.uploadedFiles && currentAnswer.uploadedFiles.length > 0)) && (
                      <div className="w-full flex gap-2 mb-2 overflow-x-auto">
                        {(isGenerating ? uploadedFiles : currentAnswer.uploadedFiles).map((file) => (
                          <div key={file.id} className="flex items-center gap-2 bg-foreground/5 border border-foreground/10 rounded-lg p-2 min-w-0 flex-shrink-0">
                            <span className="text-sm">📄</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                              <p className="text-xs text-foreground/60">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Filters Display - Show during generation or when answer is loaded */}
                    {((isGenerating && (selectedTags.length > 0 || selectedStrategies.length > 0 || selectedTypes.length > 0 || selectedPriorSamples.length > 0)) || 
                      (currentAnswer?.filters && (
                        currentAnswer.filters.tags.length > 0 || 
                        currentAnswer.filters.strategies.length > 0 || 
                        currentAnswer.filters.types.length > 0 || 
                        currentAnswer.filters.priorSamples.length > 0
                      ))) && (
                        <div className="flex flex-wrap gap-2 mb-2">
                          {/* Show current filters during generation */}
                          {isGenerating ? (
                            <>
                              {selectedTags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  Tag: {tag}
                                </Badge>
                              ))}
                              {selectedStrategies.map(strategy => (
                                <Badge key={strategy} variant="secondary" className="text-xs">
                                  Strategy: {strategy}
                                </Badge>
                              ))}
                              {selectedTypes.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  Type: {type}
                                </Badge>
                              ))}
                              {selectedPriorSamples.map(sampleId => {
                                const sample = fileHistory.find(f => f.id === sampleId);
                                return sample ? (
                                  <Badge key={sampleId} variant="secondary" className="text-xs">
                                    Sample: {sample.name}
                                  </Badge>
                                ) : null;
                              })}
                            </>
                          ) : (
                            /* Show saved filters from answer */
                            <>
                              {currentAnswer.filters.tags.map(tag => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  Tag: {tag}
                                </Badge>
                              ))}
                              {currentAnswer.filters.strategies.map(strategy => (
                                <Badge key={strategy} variant="secondary" className="text-xs">
                                  Strategy: {strategy}
                                </Badge>
                              ))}
                              {currentAnswer.filters.types.map(type => (
                                <Badge key={type} variant="secondary" className="text-xs">
                                  Type: {type}
                                </Badge>
                              ))}
                              {currentAnswer.filters.priorSamples.map(sample => (
                                <Badge key={sample.id} variant="secondary" className="text-xs">
                                  Sample: {sample.name}
                                </Badge>
                              ))}
                            </>
                          )}
                        </div>
                      )
                    }
                    <div className="p-2.5 rounded-lg bg-foreground/5 border border-gray-200 text-foreground text-[15px] leading-6">
                      {isGenerating ? inputValue : currentAnswer.question}
                    </div>
                  </div>
                </div>

                {/* Unified Loading/Answer Component */}
                <div className="flex-1 h-full w-full">
                  <AnswerLoadingState
                    progress={loadingProgress}
                    currentStep={loadingStep}
                    sourcesFound={sourcesFound}
                    mode={selectedMode}
                    streamingText={streamingAnswer}
                    isTransitioning={false}
                    answer={currentAnswer}
                    onCopy={handleCopy}
                    onSave={handleSave}
                    onEmail={handleEmail}
                    onEdit={(type, value) => {
                      // Handle edit actions
                      console.log('Edit:', type, value);
                    }}
                  />
                </div>

                {/* Follow-up Input */}
                <div id="follow-up-input" className="max-w-3xl mx-auto sticky bottom-0 self-end w-full pt-8">
                  <ChatInput
                    value={inputValue}
                    onChange={setInputValue}
                    onSubmit={handleSubmit}
                    placeholder="Add follow-up instructions or click 'Answers' to start fresh..."
                    disabled={isGenerating}
                    variant="followup"
                    uploadedFiles={followUpFiles}
                    onFileUpload={(files) => handleFileUpload(files, true)}
                    onFileRemove={(fileId) => removeFile(fileId, true)}
                    showFormatDropdown={true}
                    showAttachButton={true}
                    showFileCards={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Source Management Panel */}
      <SourceManagementPanel
        isOpen={showSourcePanel}
        onClose={() => setShowSourcePanel(false)}
        query={currentAnswer?.question || ''}
        usedSources={currentAnswer?.sources || []}
        availableSources={availableSources}
        onSourceAdd={handleSourceAdd}
        onSourceRemove={handleSourceRemove}
        onRebuild={handleRebuild}
      />

      {/* Filters Panel */}
      <FiltersPanel
        isOpen={showFiltersPanel}
        onClose={() => setShowFiltersPanel(false)}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
        selectedStrategies={selectedStrategies}
        onStrategiesChange={setSelectedStrategies}
        selectedTypes={selectedTypes}
        onTypesChange={setSelectedTypes}
        selectedPriorSamples={selectedPriorSamples}
        onPriorSamplesChange={setSelectedPriorSamples}
        priorSamples={fileHistory}
        onClearAll={handleClearAllFilters}
      />
    </div>
  );
}
