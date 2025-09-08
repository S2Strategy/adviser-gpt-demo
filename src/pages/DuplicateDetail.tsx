import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, Info, Check, CornerDownRight, Lightbulb, Calendar, FileText, X, Save, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";

interface DuplicateQuestion {
  id: string;
  question: string;
  answer: string;
  documentTitle: string;
  strategy: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
}

interface FirmUpdateSuggestion {
  id: string;
  question: string;
  originalAnswer: string;
  suggestedAnswer: string;
  documentTitle: string;
  strategy: string;
  tags: string[];
  updatedAt: string;
  updatedBy: string;
}

interface DuplicateGroup {
  id: string;
  questions: DuplicateQuestion[];
}

interface FirmUpdateGroup {
  id: string;
  suggestions: FirmUpdateSuggestion[];
}

export function DuplicateDetail() {
  const navigate = useNavigate();
  const { actionId } = useParams();
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [reviewedGroups, setReviewedGroups] = useState<Set<number>>(new Set());
  const [groupSelections, setGroupSelections] = useState<Map<number, Set<string>>>(new Map());
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Set<string>>(new Set());
  const [editedAnswers, setEditedAnswers] = useState<Map<string, string>>(new Map());
  const [actionType, setActionType] = useState<"duplicates" | "firm_updates">("duplicates");

  // Mock data - in real app this would come from API
  const firmUpdateGroups: FirmUpdateGroup[] = [
    {
      id: "firm-update-1",
      suggestions: [
        {
          id: "s1",
          question: "What is the minimum investment amount for new clients?",
          originalAnswer: "The minimum investment amount for new clients is $10,000. This threshold ensures we can provide comprehensive financial planning services while maintaining our service quality standards.",
          suggestedAnswer: "The minimum investment amount for new clients is $25,000. This updated threshold reflects our enhanced service offerings and ensures we can provide comprehensive financial planning services while maintaining our premium service quality standards.",
          documentTitle: "Client Onboarding Guide",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["investment", "minimums", "clients"],
          updatedAt: "2024-01-15T10:30:00Z",
          updatedBy: "John Smith"
        },
        {
          id: "s2",
          question: "How do we handle client complaints?",
          originalAnswer: "All client complaints are handled through our formal complaint resolution process. Clients can submit complaints via email, phone, or our online portal.",
          suggestedAnswer: "All client complaints are handled through our formal complaint resolution process. Clients can submit complaints via email, phone, our online portal, or through our dedicated client success team for immediate assistance.",
          documentTitle: "Client Service Manual",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["complaints", "process", "clients"],
          updatedAt: "2024-01-12T11:45:00Z",
          updatedBy: "Lisa Wilson"
        }
      ]
    }
  ];

  const duplicateGroups: DuplicateGroup[] = [
    {
      id: "group-1",
      questions: [
        {
          id: "q1",
          question: "What is the minimum investment amount for new clients?",
          answer: "The minimum investment amount for new clients is $10,000. This threshold ensures we can provide comprehensive financial planning services while maintaining our service quality standards.",
          documentTitle: "Client Onboarding Guide",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["investment", "minimums", "clients"],
          updatedAt: "2024-01-15T10:30:00Z",
          updatedBy: "John Smith"
        },
        {
          id: "q2", 
          question: "What is the minimum investment amount for new clients?",
          answer: "New clients must invest a minimum of $10,000 to open an account with our firm. This minimum helps us deliver personalized service and comprehensive financial planning.",
          documentTitle: "Investment Guidelines",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["investment", "minimums", "clients"],
          updatedAt: "2024-01-10T14:20:00Z",
          updatedBy: "Sarah Johnson"
        },
        {
          id: "q3",
          question: "What is the minimum investment amount for new clients?",
          answer: "The minimum initial investment required is $10,000. This amount allows us to provide thorough financial planning and investment management services.",
          documentTitle: "Client Agreement Terms",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["investment", "minimums", "clients"],
          updatedAt: "2024-01-05T09:15:00Z",
          updatedBy: "Mike Davis"
        }
      ]
    },
    {
      id: "group-2",
      questions: [
        {
          id: "q4",
          question: "How do we handle client complaints?",
          answer: "All client complaints are handled through our formal complaint resolution process. Clients can submit complaints via email, phone, or our online portal.",
          documentTitle: "Client Service Manual",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["complaints", "process", "clients"],
          updatedAt: "2024-01-12T11:45:00Z",
          updatedBy: "Lisa Wilson"
        },
        {
          id: "q5",
          question: "How do we handle client complaints?",
          answer: "We have a structured complaint handling procedure. Clients can reach out through multiple channels including email, phone, or our client portal to submit complaints.",
          documentTitle: "Service Standards",
          strategy: "Firm-Wide (Not Strategy-Specific)",
          tags: ["complaints", "process", "clients"],
          updatedAt: "2024-01-08T16:30:00Z",
          updatedBy: "Tom Brown"
        }
      ]
    }
  ];

  // Determine action type and data based on actionId
  useEffect(() => {
    const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
    const currentAction = savedActions.find((action: any) => action.id === actionId);
    if (currentAction) {
      setActionType(currentAction.type === "find_duplicates" ? "duplicates" : "firm_updates");
    }
  }, [actionId]);

  const currentGroup = actionType === "duplicates" 
    ? duplicateGroups[currentGroupIndex] 
    : firmUpdateGroups[currentGroupIndex];
  const totalGroups = actionType === "duplicates" 
    ? duplicateGroups.length 
    : firmUpdateGroups.length;
  const progressPercentage = (reviewedGroups.size / totalGroups) * 100;
  const isCurrentGroupReviewed = reviewedGroups.has(currentGroupIndex);
  const currentGroupSelection = groupSelections.get(currentGroupIndex) || new Set();

  // Helper function to format relative time (matching QuestionCard pattern)
  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "today";
    if (diffInDays === 1) return "1 day ago";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Restore selection when group index changes
  useEffect(() => {
    const savedSelection = groupSelections.get(currentGroupIndex);
    if (savedSelection) {
      setSelectedQuestions(savedSelection);
    } else {
      setSelectedQuestions(new Set());
    }
  }, [currentGroupIndex, groupSelections]);

  const handleQuestionSelect = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleSelectAll = () => {
    if (actionType === "duplicates") {
      const questions = (currentGroup as DuplicateGroup).questions;
      if (selectedQuestions.size === questions.length) {
        // Deselect all
        setSelectedQuestions(new Set());
      } else {
        // Select all
        setSelectedQuestions(new Set(questions.map(q => q.id)));
      }
    }
  };

  const handleKeepSelected = () => {
    // Save the current selection for this group
    const newGroupSelections = new Map(groupSelections);
    newGroupSelections.set(currentGroupIndex, new Set(selectedQuestions));
    setGroupSelections(newGroupSelections);
    
    // Mark this group as reviewed
    setReviewedGroups(prev => new Set([...prev, currentGroupIndex]));
    setSelectedQuestions(new Set());
    
    // Move to next group or finish
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    } else {
      // All groups reviewed - update the action status in localStorage
      const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
      const updatedActions = savedActions.map((action: any) => {
        if (action.id === actionId) {
          return {
            ...action,
            status: "completed",
            impactedRecords: duplicateGroups.reduce((sum, group) => sum + group.questions.length, 0)
          };
        }
        return action;
      });
      localStorage.setItem('ai-actions', JSON.stringify(updatedActions));
      
      navigate('/vault/suggested-updates');
    }
  };

  const handleUndo = () => {
    // Remove this group from reviewed groups
    setReviewedGroups(prev => {
      const newSet = new Set(prev);
      newSet.delete(currentGroupIndex);
      return newSet;
    });
    
    // Restore the previous selection for this group
    const previousSelection = groupSelections.get(currentGroupIndex) || new Set();
    setSelectedQuestions(previousSelection);
  };

  // Firm update specific handlers
  const handleAcceptSuggestion = (suggestionId: string) => {
    setAcceptedSuggestions(prev => new Set([...prev, suggestionId]));
  };

  const handleRejectSuggestion = (suggestionId: string) => {
    setAcceptedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestionId);
      return newSet;
    });
  };

  const handleUndoSuggestion = (suggestionId: string) => {
    setAcceptedSuggestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(suggestionId);
      return newSet;
    });
    setEditedAnswers(prev => {
      const newMap = new Map(prev);
      newMap.delete(suggestionId);
      return newMap;
    });
  };

  const handleEditAnswer = (suggestionId: string, newAnswer: string) => {
    setEditedAnswers(prev => new Map(prev).set(suggestionId, newAnswer));
  };

  const handleSaveAndNext = () => {
    // Save all accepted suggestions and edited answers
    // In real app, this would update the backend
    setReviewedGroups(prev => new Set([...prev, currentGroupIndex]));
    
    // Move to next group or finish
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    } else {
      // All groups reviewed - update the action status in localStorage
      const savedActions = JSON.parse(localStorage.getItem('ai-actions') || '[]');
      const updatedActions = savedActions.map((action: any) => {
        if (action.id === actionId) {
          return {
            ...action,
            status: "completed",
            impactedRecords: actionType === "duplicates" 
              ? duplicateGroups.reduce((sum, group) => sum + group.questions.length, 0)
              : firmUpdateGroups.reduce((sum, group) => sum + group.suggestions.length, 0)
          };
        }
        return action;
      });
      localStorage.setItem('ai-actions', JSON.stringify(updatedActions));
      
      navigate('/vault/suggested-updates');
    }
  };

  const handleArchive = () => {
    // Archive all suggestions in current group
    setReviewedGroups(prev => new Set([...prev, currentGroupIndex]));
    
    // Move to next group or finish
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    } else {
      navigate('/vault/suggested-updates');
    }
  };

  const handlePreviousGroup = () => {
    if (currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
      // Restore selection for the previous group if it exists
      const previousGroupSelection = groupSelections.get(currentGroupIndex - 1) || new Set();
      setSelectedQuestions(previousGroupSelection);
    }
  };

  const handleNextGroup = () => {
    if (currentGroupIndex < totalGroups - 1) {
      setCurrentGroupIndex(prev => prev + 1);
      // Restore selection for the next group if it exists
      const nextGroupSelection = groupSelections.get(currentGroupIndex + 1) || new Set();
      setSelectedQuestions(nextGroupSelection);
    }
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
                onClick={() => navigate('/vault/suggested-updates')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Actions
              </Button>
                <div>
                  <h1 className="text-2xl font-semibold">
                    {actionType === "duplicates" 
                      ? `Review Duplicates (${currentGroupIndex + 1} / ${totalGroups})`
                      : `Review Suggestions (${currentGroupIndex + 1} / ${totalGroups})`
                    }
                  </h1>
                  <p className="text-muted-foreground">
                    {actionType === "duplicates" 
                      ? "Review and select questions to keep. Unselected questions will be archived."
                      : "Review impacted content and make changes as needed."
                    }
                  </p>
                </div>
            </div>
          </div>
        </div>

        {/* Progress Header */}
        <div className="border-b bg-gray-50/50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{reviewedGroups.size} Reviewed</span>
              </div>
              <div className="flex-1 max-w-md">
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousGroup}
                disabled={currentGroupIndex === 0}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              {actionType === "duplicates" ? (
                <>
                  <Button
                    variant="outline"
                    onClick={handleSelectAll}
                    className="text-sm"
                  >
                    Select All
                  </Button>
                  {isCurrentGroupReviewed ? (
                    <Button
                      onClick={handleUndo}
                      className="min-w-24 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      onClick={handleKeepSelected}
                      disabled={selectedQuestions.size === 0}
                      className="min-w-24 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Keep {selectedQuestions.size}
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleArchive}
                    className="text-sm"
                  >
                    Archive
                  </Button>
                  {isCurrentGroupReviewed ? (
                    <Button
                      onClick={handleUndo}
                      className="min-w-24 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      Undo
                    </Button>
                  ) : (
                    <Button
                      onClick={handleSaveAndNext}
                      disabled={acceptedSuggestions.size === 0}
                      className="min-w-24 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Save & Next
                    </Button>
                  )}
                </>
              )}
              <Button
                variant="outline"
                onClick={handleNextGroup}
                disabled={currentGroupIndex === totalGroups - 1}
                className="flex items-center gap-2"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-4 justify-center px-6 py-2 border-b bg-white">
          <span className="text-sm">
            <span className="font-bold">{currentGroupIndex + 1}</span> <span className="text-muted-foreground">of</span> <span className="font-bold">{totalGroups}</span> {actionType === "duplicates" ? "duplicate groups" : "suggestion groups"}
          </span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-4">
            {actionType === "duplicates" ? (
              // Duplicate questions rendering
              (currentGroup as DuplicateGroup).questions.map((question) => {
                const isSelected = selectedQuestions.has(question.id);
                return (
                  <div 
                    key={question.id} 
                    className={`border rounded-lg bg-card vault-result-card cursor-pointer transition-all duration-200 hover:shadow-md ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50/50 border-blue-200' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleQuestionSelect(question.id)}
                  >
                    {/* Header with file info and selection indicator */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] px-6 py-4">
                      <div className="flex items-center min-w-0 gap-3 flex-1">
                        <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#71717A' }} />
                        <div 
                          className="font-bold break-words min-w-0 text-sm"
                          style={{ 
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                            fontSize: '14px', 
                            lineHeight: '1.4' 
                          }}
                        >
                          {question.documentTitle}
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-4 w-4" style={{ color: '#71717A' }} />
                            <span style={{ color: '#71717A' }}>Last edited</span>
                            <span className="text-foreground">{formatFullDate(question.updatedAt)}</span>
                            <span style={{ color: '#71717A' }}>by</span>
                            <span style={{ color: '#27272A' }}>{question.updatedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {/* Selection Indicator */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          isSelected 
                            ? 'bg-blue-500 border-blue-500' 
                            : 'border-gray-300 hover:border-blue-400'
                        }`}>
                          {isSelected && <Check className="h-4 w-4 text-white" />}
                        </div>
                      </div>
                    </div>

                    {/* Answer Section */}
                    {question.answer && (
                      <div className="space-y-2 px-6 py-4">
                        <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Answer</h4>
                        <div className="bg-muted/50 rounded-md p-4">
                          <p className="text-sm leading-relaxed">
                            {question.answer}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Question Section */}
                    {question.question && (
                      <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
                        <div className="flex items-start gap-2">
                          <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#71717A' }} />
                          <div className="space-y-2">
                            <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Question</h4>
                            <p 
                              style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '700', letterSpacing: '-0.4px' }}
                            >
                              {question.question}
                            </p>
                           
                            {/* Tags in Question Section */}
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge 
                                variant="outline" 
                                className="vault-tag flex items-center gap-1"
                              >
                                <Lightbulb className="h-3 w-3" />
                                {question.strategy}
                              </Badge>
                              {question.tags.map(tag => (
                                <Badge 
                                  key={tag}
                                  variant="secondary" 
                                  className="text-xs"
                                >
                                  #{tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // Firm update suggestions rendering
              (currentGroup as FirmUpdateGroup).suggestions.map((suggestion) => {
                const isAccepted = acceptedSuggestions.has(suggestion.id);
                const editedAnswer = editedAnswers.get(suggestion.id);
                const currentAnswer = editedAnswer || suggestion.suggestedAnswer;
                
                return (
                  <div 
                    key={suggestion.id} 
                    className="border rounded-lg bg-card vault-result-card transition-all duration-200 hover:shadow-md"
                  >
                    {/* Header with file info */}
                    <div className="flex items-center justify-between pb-4 border-b border-[#E4E4E7] px-6 py-4">
                      <div className="flex items-center min-w-0 gap-3 flex-1">
                        <FileText className="h-4 w-4 flex-shrink-0" style={{ color: '#71717A' }} />
                        <div 
                          className="font-bold break-words min-w-0 text-sm"
                          style={{ 
                            wordBreak: 'break-word',
                            hyphens: 'auto',
                            fontSize: '14px', 
                            lineHeight: '1.4' 
                          }}
                        >
                          {suggestion.documentTitle}
                        </div>
                        <div className="flex items-center gap-4 text-sm" style={{ fontSize: '14px', lineHeight: '1.4' }}>
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="h-4 w-4" style={{ color: '#71717A' }} />
                            <span style={{ color: '#71717A' }}>Last edited</span>
                            <span className="text-foreground">{formatFullDate(suggestion.updatedAt)}</span>
                            <span style={{ color: '#71717A' }}>by</span>
                            <span style={{ color: '#27272A' }}>{suggestion.updatedBy}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4 flex-shrink-0">
                        {isAccepted ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUndoSuggestion(suggestion.id)}
                            className="text-xs"
                          >
                            Undo
                          </Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectSuggestion(suggestion.id)}
                              className="text-xs"
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAcceptSuggestion(suggestion.id)}
                              className="text-xs bg-green-600 hover:bg-green-700 text-white"
                            >
                              Accept
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Answer Section with Diff */}
                    <div className="space-y-2 px-6 py-4">
                      <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Answer</h4>
                      {isAccepted ? (
                        <div className="space-y-2">
                          <Textarea
                            value={currentAnswer}
                            onChange={(e) => handleEditAnswer(suggestion.id, e.target.value)}
                            className="min-h-32 resize-none"
                          />
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-md p-4 space-y-3">
                          {/* Original answer with strikethrough */}
                          <div className="text-sm leading-relaxed">
                            <span className="text-red-600 line-through bg-red-50 px-1 rounded">
                              {suggestion.originalAnswer}
                            </span>
                          </div>
                          {/* Suggested answer with green highlight */}
                          <div className="text-sm leading-relaxed">
                            <span className="text-green-700 bg-green-50 px-1 rounded">
                              {suggestion.suggestedAnswer}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question Section */}
                    <div className="space-y-2 px-6 pb-4" style={{ paddingInlineStart: '40px' }}>
                      <div className="flex items-start gap-2">
                        <CornerDownRight className="h-4 w-4 mt-1 flex-shrink-0" style={{ color: '#71717A' }} />
                        <div className="space-y-2">
                          <h4 style={{ fontSize: '12px', fontWeight: 'bold', lineHeight: '1.5', letterSpacing: '-0.2px' }}>Question</h4>
                          <p 
                            style={{ fontSize: '16px', lineHeight: '1.5', fontWeight: '700', letterSpacing: '-0.4px' }}
                          >
                            {suggestion.question}
                          </p>
                         
                          {/* Tags in Question Section */}
                          <div className="flex flex-wrap items-center gap-2 mt-3">
                            <Badge 
                              variant="outline" 
                              className="vault-tag flex items-center gap-1"
                            >
                              <Lightbulb className="h-3 w-3" />
                              {suggestion.strategy}
                            </Badge>
                            {suggestion.tags.map(tag => (
                              <Badge 
                                key={tag}
                                variant="secondary" 
                                className="text-xs"
                              >
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

