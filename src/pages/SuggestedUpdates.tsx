import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle, AlertCircle, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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

  // Load actions from localStorage on component mount
  useEffect(() => {
    const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
    setActions(savedActions);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "initiated":
        return <Clock className="h-4 w-4 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "initiated":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Initiated</Badge>;
      case "completed":
        return <Badge variant="secondary" className="bg-green-100 text-green-700">Completed</Badge>;
      case "failed":
        return <Badge variant="secondary" className="bg-red-100 text-red-700">Failed</Badge>;
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
    <div className="h-screen flex">
      {/* Main Content */}
      <div className="flex-1 h-full flex flex-col">
        {/* Header */}
        <div className="border-b bg-background">
          <div className="flex items-center justify-between px-6 py-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/vault')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Vault
              </Button>
              <div>
                <h1 className="text-2xl font-semibold">AI Actions</h1>
                <p className="text-muted-foreground">Review and manage automated actions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {actions.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No suggested updates</h3>
                <p className="text-gray-500">All actions have been reviewed and processed.</p>
              </div>
            ) : (
              actions.map((action) => (
                <div 
                  key={action.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50/50 transition-colors cursor-pointer group"
                  onClick={() => handleActionClick(action)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(action.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-sm truncate">{action.title}</h3>
                        {getStatusBadge(action.status)}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>
                          {action.impactedRecords === "initiated" ? (
                            <span className="text-blue-600">Initiated</span>
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
                      className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
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
    </div>
  );
}
