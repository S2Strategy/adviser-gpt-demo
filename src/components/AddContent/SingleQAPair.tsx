import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useVaultEdits } from "@/hooks/useVaultState";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useTagTypes } from "@/hooks/useTagTypes";
import { QuestionItem, Tag } from "@/types/vault";
import { Plus, ChevronDown, X, Tag as TagIcon } from "lucide-react";

export function SingleQAPair() {
  const { toast } = useToast();
  const { saveEdit } = useVaultEdits();
  const { profile } = useUserProfile();
  const { getAllTagTypes } = useTagTypes();
  
  const [question, setQuestion] = useState<string>("");
  const [answer, setAnswer] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagTypePopoverOpen, setTagTypePopoverOpen] = useState(false);
  const [valuePopoverOpen, setValuePopoverOpen] = useState(false);
  const [selectedTagType, setSelectedTagType] = useState<string | null>(null);
  const [tagValueSearchQuery, setTagValueSearchQuery] = useState("");
  const addTagButtonRef = useRef<HTMLButtonElement>(null);
  
  const tagTypes = getAllTagTypes();

  const handleTagTypeSelect = (tagTypeName: string) => {
    setSelectedTagType(tagTypeName);
    setTagTypePopoverOpen(false);
    // Small delay to ensure the first popover closes before opening the second
    setTimeout(() => {
      setValuePopoverOpen(true);
    }, 100);
    setTagValueSearchQuery("");
  };


  const handleTagValueToggle = (value: string) => {
    if (!selectedTagType) return;
    
    const tag: Tag = { type: selectedTagType, value };
    const tagExists = selectedTags.some(t => t.type === tag.type && t.value === tag.value);
    
    if (tagExists) {
      setSelectedTags(prev => prev.filter(t => !(t.type === tag.type && t.value === tag.value)));
    } else {
      setSelectedTags(prev => [...prev, tag]);
    }
  };

  const handleAddTags = () => {
    setValuePopoverOpen(false);
    setSelectedTagType(null);
    setTagValueSearchQuery("");
  };

  const handleRemoveTag = (tagToRemove: Tag) => {
    setSelectedTags(prev => prev.filter(t => !(t.type === tagToRemove.type && t.value === tagToRemove.value)));
  };

  const handleSave = () => {
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

    // Create the new item
    const newItem: QuestionItem = {
      id: `qa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: "Questionnaires",
      tags: selectedTags,
      question: question.trim(),
      answer: answer.trim(),
      updatedAt: new Date().toISOString(),
      updatedBy: profile.fullName || "Current User",
      documentTitle: "Manual Entry",
    };

    // Save to vault
    saveEdit(newItem.id, newItem);

    toast({
      title: "Saved to Vault ✓",
      description: "Your question and answer have been saved successfully.",
    });

    // Reset form
    setQuestion("");
    setAnswer("");
    setSelectedTags([]);
    setSelectedTagType(null);
    setTagValueSearchQuery("");
  };

  const getSelectedValuesForTagType = (tagTypeName: string): string[] => {
    return selectedTags
      .filter(tag => tag.type === tagTypeName)
      .map(tag => tag.value);
  };

  const getCurrentTagType = () => {
    return tagTypes.find(tt => tt.name === selectedTagType);
  };

  const filteredTagValues = () => {
    const tagType = getCurrentTagType();
    if (!tagType) return [];
    if (!tagValueSearchQuery) return tagType.values;
    return tagType.values.filter(value =>
      value.toLowerCase().includes(tagValueSearchQuery.toLowerCase())
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {/* Attach tags section */}
        <div className="space-y-2">
          <Label>Attach tags</Label>
          
          {/* Selected tags display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag, index) => (
                <Badge
                  key={`${tag.type}-${tag.value}-${index}`}
                  variant="outline"
                  className="text-xs vault-tag flex items-center gap-1 px-2 py-1"
                >
                  <TagIcon className="h-3 w-3" />
                  <span>{tag.type}: {tag.value}</span>
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-sidebar-accent"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}

          {/* Add Tag button and dropdowns */}
          <div className="flex items-center gap-2 relative">
            {!selectedTagType ? (
              <Popover 
                open={tagTypePopoverOpen} 
                onOpenChange={setTagTypePopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    ref={addTagButtonRef}
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-sm font-normal"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Tag
                    <ChevronDown className="h-4 w-4 ml-1.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[200px]" align="start">
                  <Command>
                    <CommandList>
                      <CommandEmpty>No tag types found.</CommandEmpty>
                      <CommandGroup>
                        {tagTypes.map((tagType) => (
                          <CommandItem
                            key={tagType.id}
                            onSelect={() => handleTagTypeSelect(tagType.name)}
                            className="cursor-pointer"
                          >
                            {tagType.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            ) : (
              <Popover 
                open={valuePopoverOpen} 
                onOpenChange={(open) => {
                  setValuePopoverOpen(open);
                  if (!open) {
                    setSelectedTagType(null);
                    setTagValueSearchQuery("");
                  }
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    ref={addTagButtonRef}
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-sm font-normal"
                  >
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add Tag
                    <ChevronDown className="h-4 w-4 ml-1.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent 
                  className="p-0 w-[300px]" 
                  align="start"
                >
                  <Command>
                    <CommandInput
                      placeholder={`Search ${selectedTagType.toLowerCase()}...`}
                      value={tagValueSearchQuery}
                      onValueChange={setTagValueSearchQuery}
                    />
                    <CommandList>
                      <CommandEmpty>No values found.</CommandEmpty>
                      <CommandGroup>
                        {filteredTagValues().map((value) => {
                          const isSelected = getSelectedValuesForTagType(selectedTagType).includes(value);
                          return (
                            <div
                              key={value}
                              className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-foreground/10 cursor-pointer"
                              onClick={() => handleTagValueToggle(value)}
                            >
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleTagValueToggle(value)}
                              />
                              <label className="text-sm font-normal cursor-pointer flex-1">
                                {value}
                              </label>
                            </div>
                          );
                        })}
                      </CommandGroup>
                    </CommandList>
                    {getSelectedValuesForTagType(selectedTagType).length > 0 && (
                      <div className="border-t p-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={handleAddTags}
                          className="w-full h-8"
                        >
                          Add ({getSelectedValuesForTagType(selectedTagType).length})
                        </Button>
                      </div>
                    )}
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Input
            id="question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Enter your question"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="answer">Answer</Label>
          <Textarea
            id="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Enter your answer"
            rows={6}
          />
        </div>

        <Button
          onClick={handleSave}
          className="bg-sidebar-primary hover:bg-sidebar-primary/80"
        >
          Save to Vault
        </Button>
      </div>
    </div>
  );
}

