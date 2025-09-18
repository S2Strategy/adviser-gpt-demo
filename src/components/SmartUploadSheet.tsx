import { useState, useEffect } from "react";
import { X, Check, Lightbulb, Plus, Search, Link, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { STRATEGIES, QuestionItem } from "@/types/vault";
import { MOCK_CONTENT_ITEMS } from "@/data/mockVaultData";

interface SmartUploadSheetProps {
  open: boolean;
  onClose: () => void;
}

export function SmartUploadSheet({ open, onClose }: SmartUploadSheetProps) {
  const { toast } = useToast();
  
  // Form state
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [strategies, setStrategies] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [newStrategy, setNewStrategy] = useState("");
  const [addAnother, setAddAnother] = useState(false);
  
  // Parent question selection state
  const [attachToParent, setAttachToParent] = useState(false);
  const [selectedParent, setSelectedParent] = useState<QuestionItem | null>(null);
  const [parentSearchOpen, setParentSearchOpen] = useState(false);
  const [parentSearchValue, setParentSearchValue] = useState("");

  // Body scroll lock when panel is open
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

  // ESC key handler to close the panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  // Reset form when sheet opens
  useEffect(() => {
    if (open) {
      setQuestion("");
      setAnswer("");
      setStrategies([]);
      setTags([]);
      setNewTag("");
      setNewStrategy("");
      setAddAnother(false);
      setAttachToParent(false);
      setSelectedParent(null);
      setParentSearchValue("");
    }
  }, [open]);

  const handleSave = () => {
    // Basic validation
    if (!question.trim()) {
      toast({
        title: "Question required",
        description: "Please enter a question before saving.",
        variant: "destructive",
      });
      return;
    }

    if (!answer.trim()) {
      toast({
        title: "Answer required", 
        description: "Please enter an answer before saving.",
        variant: "destructive",
      });
      return;
    }

    // Create the QA pair data
    const qaPairData = {
      question: question.trim(),
      answer: answer.trim(),
      strategy: strategies,
      tags,
      parentId: selectedParent?.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // TODO: In a real app, this would save to the backend
    console.log("Saving QA pair:", qaPairData);

    // Show success toast
    toast({
      title: "QA pair saved",
      description: "The question and answer have been added successfully.",
    });

    if (addAnother) {
      // Clear form but keep the sheet open
      setQuestion("");
      setAnswer("");
      setStrategies([]);
      setTags([]);
      setNewTag("");
      setNewStrategy("");
      // Keep addAnother checked, but reset parent selection
      setAttachToParent(false);
      setSelectedParent(null);
      setParentSearchValue("");
    } else {
      // Close the sheet
      onClose();
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAddStrategy = () => {
    if (newStrategy.trim() && !strategies.includes(newStrategy.trim())) {
      setStrategies([...strategies, newStrategy.trim()]);
      setNewStrategy("");
    }
  };

  const handleRemoveStrategy = (strategyToRemove: string) => {
    setStrategies(strategies.filter(strategy => strategy !== strategyToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      handleAddTag();
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
      
      {/* Sheet */}
      <div 
        className={`fixed top-3 right-3 bottom-3 z-50 w-full max-w-2xl bg-background border shadow-2xl rounded-lg transition-all duration-300 transform ${
          open ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
        style={{
          height: 'calc(100vh - 24px)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-lg font-semibold">Add QA Pair</h2>
              <p className="text-sm text-muted-foreground mt-1">Create a new question and answer pair</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Parent Question Selection */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="attachToParent" 
                  checked={attachToParent}
                  onCheckedChange={(checked) => {
                    setAttachToParent(checked as boolean);
                    if (!checked) {
                      setSelectedParent(null);
                      setParentSearchValue("");
                    }
                  }}
                />
                <Label 
                  htmlFor="attachToParent" 
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Attach to existing QA pair
                </Label>
              </div>
              
              {attachToParent && (
                <div className="space-y-3 pl-6 border-l-2 border-gray-400 bg-gray-200/30 p-4 rounded-r-md">
                  <Label className="text-sm font-medium">Select parent question</Label>

                  <Command>
                    <CommandInput 
                      placeholder="Search questions..." 
                      value={parentSearchValue}
                      autoFocus
                      onValueChange={setParentSearchValue}
                      className="ring-offset-[-1]"
                    />
                    <CommandList>
                      <CommandEmpty>No questions found.</CommandEmpty>
                      <CommandGroup>
                        {MOCK_CONTENT_ITEMS.flatMap(doc => 
                          doc.items.filter(item => 
                            item.question && 
                            item.question.toLowerCase().includes(parentSearchValue.toLowerCase())
                          )
                        ).map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.question}
                            onSelect={() => {
                              setSelectedParent(item);
                              setParentSearchOpen(false);
                            }}
                          >
                            <div className="flex flex-col gap-1 w-full">
                              <div className="flex items-center gap-2">
                                <Check
                                  className={`h-4 w-4 ${
                                    selectedParent?.id === item.id ? "opacity-100" : "opacity-0"
                                  }`}
                                />
                                <span className="font-medium text-sm truncate">
                                  {item.question}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground ml-6">
                                {item.documentTitle} • {item.strategy}
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                  
                  {selectedParent && (
                    <div className="bg-white border rounded-md p-3 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                        <Link className="h-4 w-4" />
                        Parent Question Preview
                      </div>
                      <div className="text-sm text-gray-700 line-clamp-2 grid gap-2">
                        <strong>{selectedParent.question}</strong>
                        <p>{selectedParent.answer}</p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Badge variant="outline" className="text-xs">
                          {selectedParent.strategy}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Question Field */}
            <div className="space-y-2">
              <Label htmlFor="question">Question</Label>
              <Textarea
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-24 resize-none"
                placeholder="Enter the question..."
              />
            </div>

            {/* Strategy Field */}
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategies</Label>

              <div className="flex items-start justify-between gap-4">
              
                {/* Current Strategies */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {strategies.map((strategy, index) => (
                    <Badge 
                      key={`${strategy}-${index}`} 
                      variant="outline" 
                      className="flex items-center gap-1"
                    >
                      <Lightbulb className="h-3 w-3" />
                      {strategy}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => handleRemoveStrategy(strategy)}
                      />
                    </Badge>
                  ))}
                </div>
                
                {/* Add New Strategy */}
                <div className="flex gap-2">
                  <Select value={newStrategy} onValueChange={setNewStrategy}>
                    <SelectTrigger className="flex-1 min-w-40">
                      <SelectValue placeholder="Select strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      {STRATEGIES.filter(strategy => !strategies.includes(strategy)).map(strategyOption => (
                        <SelectItem key={strategyOption} value={strategyOption}>
                          {strategyOption}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    type="button" 
                    size="sm"
                    onClick={handleAddStrategy}
                    disabled={!newStrategy.trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Tags Field */}
            <div className="space-y-2">
              <Label>Tags</Label>
              
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Existing Tags */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {tags.map((tag) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      #{tag} 
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  ))}
                </div>

                {/* Add New Tag */}
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add new tag"
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleAddTag} 
                    disabled={!newTag.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </div>
              </div>
            </div>

            {/* Answer Field */}
            <div className="space-y-2">
              <Label htmlFor="answer">Answer</Label>
              <Textarea
                id="answer"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                className="min-h-48 resize-none"
                placeholder="Enter the answer..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 p-6 border-t">
            {/* Add Another Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="addAnother" 
                checked={addAnother}
                onCheckedChange={(checked) => setAddAnother(checked as boolean)}
              />
              <Label 
                htmlFor="addAnother" 
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Add another QA pair after saving
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Check className="h-4 w-4 mr-2" />
                Save QA Pair
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}