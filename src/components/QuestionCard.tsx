import { useState } from "react";
import { File, ChevronDown, ChevronUp, MoreVertical, Mail, Copy, Plus, Check, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { QuestionSheet } from "./QuestionSheet";

interface QuestionCardData {
  id: string;
  fileName: string;
  updatedAt: Date;
  updatedBy: string;
  question: string;
  answer: string;
  duration: string;
  strategy: string;
  tags: string[];
}

interface QuestionCardProps {
  data: QuestionCardData;
}

export function QuestionCard({ data }: QuestionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [tags, setTags] = useState(data.tags);
  const [duration, setDuration] = useState(data.duration);
  const [strategy, setStrategy] = useState(data.strategy);
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleCopyAnswer = async () => {
    try {
      await navigator.clipboard.writeText(data.answer);
      toast({
        title: "Answer copied",
        description: "The answer has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy the answer to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
      setIsAddingTag(false);
      toast({
        title: "Tag added",
        description: `Tag "${newTag.trim()}" has been added.`,
      });
    }
  };

  const handleCancelAddTag = () => {
    setNewTag("");
    setIsAddingTag(false);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  return (
    <>
      <div className="bg-vault-card rounded-lg border p-6 hover:shadow-[var(--shadow-vault-card)] transition-shadow">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <File className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-medium">{data.fileName}</h3>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Updated {formatDistanceToNow(data.updatedAt, { addSuffix: true })} (
            {data.updatedAt.toLocaleDateString('en-US', { 
              month: 'long', 
              day: 'numeric', 
              year: 'numeric' 
            })}) by {data.updatedBy}
          </div>
        </div>

        {/* Question */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Question</h4>
          <p className="text-foreground mb-4">{data.question}</p>
          
          {/* Question Metadata */}
          <div className="flex items-center gap-4">
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Evergreen">Evergreen</SelectItem>
                <SelectItem value="Annually">Annually</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={strategy} onValueChange={setStrategy}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Firm Wide (Not Strategy Specific)">
                  Firm Wide (Not Strategy Specific)
                </SelectItem>
                <SelectItem value="Large Cap Growth">Large Cap Growth</SelectItem>
                <SelectItem value="Small Cap Growth">Small Cap Growth</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="bg-vault-tag text-vault-tag-foreground">
                  #{tag}
                </Badge>
              ))}
              
              {isAddingTag ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Tag name"
                    className="h-8 w-24"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') handleCancelAddTag();
                    }}
                    autoFocus
                  />
                  <Button size="sm" variant="ghost" onClick={handleAddTag}>
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancelAddTag}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsAddingTag(true)}
                  className="h-8 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  New
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Answer */}
        <div className="mb-6">
          <h4 className="font-medium mb-3">Answer</h4>
          <div className="relative">
            <div 
              className={`bg-vault-answer-bg p-4 rounded-lg transition-all duration-300 ${
                isExpanded ? 'max-h-none' : 'max-h-32 overflow-hidden'
              }`}
            >
              <p className="text-foreground whitespace-pre-wrap">{data.answer}</p>
            </div>
            
            {!isExpanded && (
              <div 
                className="absolute bottom-0 left-0 right-0 h-8"
                style={{ background: 'var(--gradient-fade)' }}
              />
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-xs"
            >
              {isExpanded ? (
                <>
                  Show less
                  <ChevronUp className="h-3 w-3 ml-1" />
                </>
              ) : (
                <>
                  Show more
                  <ChevronDown className="h-3 w-3 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-end gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Actions
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleEdit}>Edit</DropdownMenuItem>
              <DropdownMenuItem>Mark as Stale</DropdownMenuItem>
              <DropdownMenuItem>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Mail className="h-4 w-4 mr-2" />
                Email
                <MoreVertical className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Open in Gmail</DropdownMenuItem>
              <DropdownMenuItem>Open in Mail</DropdownMenuItem>
              <DropdownMenuItem>Open in Outlook</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button size="sm" onClick={handleCopyAnswer}>
            <Copy className="h-4 w-4 mr-2" />
            Copy Answer
          </Button>
        </div>
      </div>

      <QuestionSheet 
        data={data}
        open={isEditing}
        onOpenChange={setIsEditing}
      />
    </>
  );
}