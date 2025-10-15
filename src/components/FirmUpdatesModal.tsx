import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Building2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface FirmUpdatesModalProps {
  open: boolean;
  onClose: () => void;
}

export function FirmUpdatesModal({ open, onClose }: FirmUpdatesModalProps) {
  const navigate = useNavigate();
  const [description, setDescription] = useState("");
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
      setDescription("");
      setIsLoading(false);
    }
  }, [open]);

  const handleRun = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a detailed description of the changes needed.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create new action item
      const newAction = {
        id: `firm-update-${Date.now()}`,
        type: "firm_update" as const,
        title: "Firm Updates",
        description: description.length > 100 ? description.substring(0, 100) + "..." : description,
        status: "initiated" as const,
        impactedRecords: "initiated" as const,
        dateRun: new Date().toISOString()
      };
      
      // Get existing actions from localStorage
      const existingActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
      
      // Add new action to the beginning of the list
      const updatedActions = [newAction, ...existingActions];
      
      // Save to localStorage
      localStorage.setItem('ai-actions', JSON.stringify(updatedActions));
      
      toast({
        title: "Firm updates submitted",
        description: "Your firm update request has been submitted successfully. You can track the progress in Suggested Updates.",
      });
      
      onClose();
      // Navigate to Suggested Updates page
      navigate('/vault/suggested-updates');
    } catch (error) {
      toast({
        title: "Error submitting request",
        description: "There was an error submitting your firm update request. Please try again.",
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
              <div className="p-2 bg-sidebar-primary/10 rounded-lg">
                <Building2 className="h-5 w-5 text-sidebar-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Firm Updates</h2>
                <p className="text-sm text-foreground/70 mt-1">Request changes to your firm's information</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="font-normal text-foreground">
                Please provide a detailed description of the changes needed. The more specific you are about both the current state and desired changes, the more accurately we can update your firm's information.
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-32 text-foreground placeholder:text-foreground/70 resize-none transition"
                placeholder="Describe your changes in detail. Please include: 
- What specific information needs to be updated
- The current state of the data
- The desired new state
- Any context that would help understand why this change is needed"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t bg-sidebar-background/50">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleRun} 
              disabled={isLoading || !description.trim()}
              className="bg-sidebar-primary hover:bg-sidebar-primary/80 text-sidebar-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Run'
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
