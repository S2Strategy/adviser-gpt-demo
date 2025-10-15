import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Eye, X, ChevronRight, Home, Copy, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VaultSidebar } from "@/components/VaultSidebar";
import { FindDuplicatesModal } from "@/components/FindDuplicatesModal";
import { FirmUpdatesModal } from "@/components/FirmUpdatesModal";

interface ActionItem {
  id: string;
  type: "find_duplicates" | "firm_update";
  title: string;
  description: string;
  status: "initiated" | "completed" | "failed";
  impactedRecords: number | "initiated";
  dateRun: string;
  strategy?: string;
}

export function SuggestedUpdates() {
  const navigate = useNavigate();
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [showFindDuplicatesModal, setShowFindDuplicatesModal] = useState(false);
  const [showFirmUpdatesModal, setShowFirmUpdatesModal] = useState(false);

  // Load actions from localStorage on component mount
  useEffect(() => {
    const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
    setActions(savedActions);
  }, []);

  // Reload actions when modals close (in case new actions were created)
  useEffect(() => {
    if (!showFindDuplicatesModal && !showFirmUpdatesModal) {
      const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
      setActions(savedActions);
    }
  }, [showFindDuplicatesModal, showFirmUpdatesModal]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "initiated":
        return <Clock className="h-4 w-4 text-accent" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-sidebar-primary" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-sidebar-accent" />;
      default:
        return <Clock className="h-4 w-4 text-foreground/60" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initiated":
        return <Badge variant="secondary" className="bg-accent/10 text-accent">Initiated</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-sidebar-primary/10 text-sidebar-primary">Completed</Badge>;
      case "failed":
        return <Badge variant="secondary" className="bg-sidebar-accent/10 text-sidebar-accent">Failed</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return "Yesterday";
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleActionClick = (action: ActionItem) => {
    if (action.type === "find_duplicates") {
      if (action.status === "initiated") {
        // Navigate to duplicate detail page
        navigate(`/vault/duplicates/${action.id}`);
      } else if (action.status === "completed") {
        // Navigate to completed duplicate review
        navigate(`/vault/duplicates/${action.id}`);
      }
    } else if (action.type === "firm_update") {
      if (action.status === "initiated") {
        // Navigate to firm update detail page
        navigate(`/vault/duplicates/${action.id}`);
      } else if (action.status === "completed") {
        // Navigate to completed firm update review
        navigate(`/vault/duplicates/${action.id}`);
      }
    }
  };

  const handleIgnore = (actionId: string) => {
    const updatedActions = actions.filter(action => action.id !== actionId);
    setActions(updatedActions);
    // Update localStorage
    localStorage.setItem('ai-actions', JSON.stringify(updatedActions));
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="bg-sidebar-background flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <VaultSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden bg-background mt-4 ml-4 rounded-tl-2xl vault-scroll">
          {/* Header with Breadcrumbs */}
          <div className="border-b border-foreground/10 bg-background">
            {/* Breadcrumbs */}
            <div className="flex items-center gap-2 text-sm mb-6 px-6 pt-6 max-w-[100rem] mx-auto">
              <Link to="/" className="text-foreground/70 hover:text-foreground">
                <Home className="h-4 w-4" />
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <Link 
                to="/vault" 
                className="text-foreground/70 hover:text-foreground"
              >
                Vault
              </Link>
              <ChevronRight className="h-4 w-4 text-foreground/70" />
              <span className="text-foreground font-medium">
                AI Actions
              </span>
            </div>

            {/* Main Title */}
            <div className="flex items-center justify-between px-6 pb-6 max-w-[100rem] mx-auto">
              <div>
                <h1 className="text-2xl font-semibold">AI Actions</h1>
                <p className="text-foreground/70">Review and manage automated actions</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="space-y-4 p-6 max-w-4xl mx-auto">
              {actions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-foreground/60" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No suggested updates</h3>
                  <p className="text-foreground/70 mb-8">All actions have been reviewed and processed.<br />Start a new AI action to continue.</p>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center justify-center gap-4">
                    <Button 
                      onClick={() => setShowFindDuplicatesModal(true)}
                      className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-foreground/20 bg-sidebar-background/50 text-foreground text-sm font-medium leading-tight tracking-tight hover:border-foreground/30 hover:bg-sidebar-background/70 transition-colors capitalize"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Find duplicates
                    </Button>
                    <Button 
                      onClick={() => setShowFirmUpdatesModal(true)}
                      className="flex h-10 px-4 py-2 pl-3 justify-center items-center rounded-md border border-foreground/20 bg-sidebar-background/50 text-foreground text-sm font-medium leading-tight tracking-tight hover:border-foreground/30 hover:bg-sidebar-background/70 transition-colors capitalize"
                    >
                      <Building2 className="h-4 w-4 mr-2" />
                      Firm updates
                    </Button>
                  </div>
                </div>
              ) : (
                actions.map((action) => (
                  <div 
                    key={action.id} 
                    className="flex items-center justify-between p-4 border border-foreground/20 rounded-lg hover:bg-sidebar-background/50 transition-colors cursor-pointer group"
                    onClick={() => handleActionClick(action)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {getStatusIcon(action.status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-sm truncate">{action.title}</h3>
                          {getStatusBadge(action.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-foreground/70">
                          <span>
                            {action.impactedRecords === "initiated" ? (
                              <span className="text-accent">Initiated</span>
                            ) : (
                              `${action.impactedRecords} QA pairs`
                            )}
                          </span>
                          <span>•</span>
                          <span>{formatDate(action.dateRun)}</span>
                          {action.strategy && (
                            <>
                              <span>•</span>
                              <span className="truncate">{action.strategy}</span>
                            </>
                          )}
                          {action.description && (
                            <>
                              <span>•</span>
                              <span className="truncate">{action.description}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {action.status === "initiated" ? "View" : "Review"}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIgnore(action.id);
                        }}
                        className="text-foreground/60 hover:text-sidebar-accent opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modals */}
        <FindDuplicatesModal
          open={showFindDuplicatesModal}
          onClose={() => setShowFindDuplicatesModal(false)}
        />
        
        <FirmUpdatesModal
          open={showFirmUpdatesModal}
          onClose={() => setShowFirmUpdatesModal(false)}
        />
      </div>
    </div>
  );
}
