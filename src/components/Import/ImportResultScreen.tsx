import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ImportSession, ImportSummary } from "@/types/import";
import { CheckCircle2, Undo2, ArrowRight, Loader2, FolderOpen } from "lucide-react";
import { rollbackImport } from "@/utils/importExecution";
import { useVaultEdits } from "@/hooks/useVaultState";
import { deleteImportSession } from "@/utils/importStorage";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface ImportResultScreenProps {
  session: ImportSession;
  summary: ImportSummary;
  onUndo: () => void;
}

export function ImportResultScreen({
  session,
  summary,
  onUndo,
}: ImportResultScreenProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { getEdit, clearEdit } = useVaultEdits();
  const [isUndoing, setIsUndoing] = useState(false);

  const handleUndo = () => {
    if (isUndoing) return;
    
    setIsUndoing(true);
    
    try {
      // Check if there are items to undo
      if (!summary.importedItemIds || summary.importedItemIds.length === 0) {
        toast({
          title: "Nothing to undo",
          description: "No items were imported in this session.",
        });
        setIsUndoing(false);
        onUndo();
        return;
      }
      
      const itemsToClear = summary.importedItemIds;
      
      // Only batch if there are many items (> 100) to prevent UI freeze
      if (itemsToClear.length > 100) {
        let processed = 0;
        const batchSize = 100;
        
        const processBatch = () => {
          const batch = itemsToClear.slice(processed, processed + batchSize);
          batch.forEach(itemId => {
            const item = getEdit(itemId);
            if (item && item.documentId === session.id) {
              clearEdit(itemId);
            }
          });
          
          processed += batch.length;
          
          if (processed < itemsToClear.length) {
            requestAnimationFrame(processBatch);
          } else {
            // All items processed
            const actuallyRemoved = itemsToClear.filter(itemId => {
              const item = getEdit(itemId);
              return item && item.documentId === session.id;
            }).length;
            
            deleteImportSession(session.id);
            toast({
              title: "Import rolled back",
              description: actuallyRemoved > 0 
                ? `${actuallyRemoved} item${actuallyRemoved !== 1 ? 's' : ''} removed.`
                : "Import rolled back.",
            });
            setIsUndoing(false);
            onUndo();
          }
        };
        
        requestAnimationFrame(processBatch);
      } else {
        // For small batches, clear immediately
        let actuallyRemoved = 0;
        itemsToClear.forEach(itemId => {
          const item = getEdit(itemId);
          if (item && item.documentId === session.id) {
            clearEdit(itemId);
            actuallyRemoved++;
          }
        });
        
        deleteImportSession(session.id);
        toast({
          title: "Import rolled back",
          description: actuallyRemoved > 0
            ? `${actuallyRemoved} item${actuallyRemoved !== 1 ? 's' : ''} removed.`
            : "Import rolled back.",
        });
        setIsUndoing(false);
        onUndo();
      }
    } catch (error) {
      console.error('Error during undo:', error);
      toast({
        title: "Error rolling back import",
        description: error instanceof Error ? error.message : "Failed to rollback import.",
        variant: "destructive",
      });
      setIsUndoing(false);
    }
  };

  const handleGoToVault = () => {
    // Navigate to vault filtered by document
    const documentTitle = session.fileMetadata.filename;
    if (documentTitle) {
      navigate(`/vault?fileName=${encodeURIComponent(documentTitle)}`);
    } else {
      navigate('/vault');
    }
  };

  return (
    <div className="space-y-6">
      {/* Success State */}
      <div className="flex flex-col items-center justify-center p-8 bg-sidebar-background rounded-lg border border-foreground/10">
        <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
        <h2 className="text-2xl font-semibold mb-2">Import Complete</h2>
        <p className="text-foreground/70 text-center max-w-md">
          Successfully imported {summary.rowsImported} Q&A pair{summary.rowsImported !== 1 ? 's' : ''}.
        </p>
      </div>

      {/* Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Import Summary</h3>
        
        <div className="p-4 bg-sidebar-background rounded-lg border border-foreground/10 space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Labels:</p>
            {Object.keys(summary.tagsByType).length > 0 ? (
              <ul className="space-y-1 text-sm text-foreground/70">
                {Object.entries(summary.tagsByType).map(([tagType, stats]) => (
                  <li key={tagType}>
                    • {stats.existingUsed} existing {tagType} labels used
                    {stats.newCreated > 0 && (
                      <> • {stats.newCreated} new {tagType} labels created</>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-foreground/60">No labels were imported</p>
            )}
          </div>
        </div>
      </div>

      {/* Import Details */}
      <div className="p-4 bg-sidebar-background rounded-lg border border-foreground/10">
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-foreground/70">File:</span>
            <span className="font-medium">{session.fileMetadata.filename}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Uploaded:</span>
            <span>{new Date(session.fileMetadata.uploadedAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-foreground/70">Uploaded by:</span>
            <span>{session.fileMetadata.uploadedBy}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={handleGoToVault}
          className="bg-sidebar-primary hover:bg-sidebar-primary/80 w-full"
          size="lg"
        >
          See in Vault
          <FolderOpen className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          onClick={handleUndo}
          variant="outline"
          className="w-full"
          disabled={isUndoing}
        >
          {isUndoing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Rolling back...
            </>
          ) : (
            <>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo this import
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

