import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Copy, Loader2, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { STRATEGIES } from "@/types/vault";

interface FindDuplicatesModalProps {
  open: boolean;
  onClose: () => void;
}

export function FindDuplicatesModal({ open, onClose }: FindDuplicatesModalProps) {
  const navigate = useNavigate();
  const [selectedStrategy, setSelectedStrategy] = useState<string>("Firm-Wide (Not Strategy-Specific)");
  const [isLoading, setIsLoading] = useState(false);
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
      setSelectedStrategy("Firm-Wide (Not Strategy-Specific)");
      setIsLoading(false);
    }
  }, [open]);

  const handleFindDuplicates = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new action item
      const newAction = {
        id: `find-duplicates-${Date.now()}`,
        type: "find_duplicates" as const,
        title: "Find Duplicates",
        description: "Find Duplicates Run",
        status: "initiated" as const,
        impactedRecords: "initiated" as const,
        dateRun: new Date().toISOString(),
        strategy: selectedStrategy
      };
      
      // Get existing actions from localStorage
      const existingActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
      
      // Add new action to the beginning of the list
      const updatedActions = [newAction, ...existingActions];
      
      // Save to localStorage
      localStorage.setItem('ai-actions', JSON.stringify(updatedActions));
      
      toast({
        title: "Duplicate search initiated",
        description: `Searching for duplicates in ${selectedStrategy}. You can review the results in Suggested Updates.`,
      });
      
      onClose();
      // Navigate to Suggested Updates page
      navigate('/vault/suggested-updates');
    } catch (error) {
      toast({
        title: "Error finding duplicates",
        description: "There was an error searching for duplicates. Please try again.",
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
        className={`fixed left-1/2 top-1/2 z-50 w-full max-w-2xl bg-background border border-foreground/20 shadow-2xl rounded-lg transition-all duration-300 transform ${
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
              <div className="p-2 bg-sidebar-accent/10 rounded-lg">
                <Copy className="h-5 w-5 text-sidebar-accent" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Find Duplicates</h2>
                <p className="text-sm text-foreground/70 mt-1">Find and merge duplicate questions</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-foreground">
                Find and merge duplicate questions. Check all questions that don't have a strategy assigned.
              </p>
              
              <div className="space-y-2">
                <Label htmlFor="strategy" className="text-sm font-medium">
                  Select Strategy
                </Label>
                <Select 
                  value={selectedStrategy} 
                  onValueChange={setSelectedStrategy}
                  disabled={isLoading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    {STRATEGIES.map((strategy) => (
                      <SelectItem key={strategy} value={strategy}>
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-foreground/70" />
                          {strategy}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-sidebar-background/50">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleFindDuplicates} 
              disabled={isLoading}
              className="bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-accent-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Find Duplicates
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
