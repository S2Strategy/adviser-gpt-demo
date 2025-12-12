import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ImportSession, ImportSummary } from "@/types/import";
import { CheckCircle2, Undo2, ArrowRight } from "lucide-react";
import { rollbackImport } from "@/utils/importExecution";
import { useVaultEdits } from "@/hooks/useVaultState";
import { deleteImportSession } from "@/utils/importStorage";
import { useToast } from "@/hooks/use-toast";

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

  const handleUndo = () => {
    rollbackImport(session.id, summary.importedItemIds, getEdit, clearEdit);
    deleteImportSession(session.id);
    toast({
      title: "Import rolled back",
      description: "All imported items have been removed.",
    });
    onUndo();
  };

  const handleGoToVault = () => {
    // Navigate to vault with filters for this strategy
    const strategy = session.strategy;
    if (strategy) {
      navigate(`/vault?strategy=${encodeURIComponent(strategy)}`);
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
          Successfully imported {summary.rowsImported} Q&A pair{summary.rowsImported !== 1 ? 's' : ''}{session.strategy ? ` for ${session.strategy}` : ''}.
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
          Go to Vault with these filters
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
        
        <Button
          onClick={handleUndo}
          variant="outline"
          className="w-full"
        >
          <Undo2 className="h-4 w-4 mr-2" />
          Undo this import
        </Button>
      </div>
    </div>
  );
}

