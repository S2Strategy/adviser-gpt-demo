import React from 'react';
import { BookOpenText, Search, FileText, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface AnswerLoadingStateProps {
  progress: number;
  currentStep: string;
  sourcesFound: number;
  mode?: 'answer' | 'chat';
}

export function AnswerLoadingState({ 
  progress, 
  currentStep, 
  sourcesFound,
  mode = 'answer'
}: AnswerLoadingStateProps) {
  // Define steps based on mode
  const answerModeSteps = [
    { id: 'Searching Vault', label: 'Searching Vault', icon: Search },
    { id: 'Analyzing Sources', label: 'Analyzing Sources', icon: BookOpenText },
    { id: 'Composing Answer', label: 'Composing Answer', icon: FileText },
    { id: 'Verifying Compliance', label: 'Verifying Compliance', icon: CheckCircle }
  ];

  const chatModeSteps = [
    { id: 'Searching the web', label: 'Searching the web', icon: Search },
    { id: 'Analyzing Sources', label: 'Analyzing Sources', icon: BookOpenText },
    { id: 'Composing Answer', label: 'Composing Answer', icon: FileText }
  ];

  const steps = mode === 'answer' ? answerModeSteps : chatModeSteps;

  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-background rounded-lg overflow-hidden border border-foreground/20 shadow-sm">
        {/* Header */}
        <div className="pt-4 px-4 bg-sidebar-background border-b border-foreground/10">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-600 text-white">AdviserGPT</Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-300">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="font-semibold text-sm">Building</span>
                </div>
                <span className="text-xs ml-1">From Vault</span>
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-foreground/70">
              <span>Assembling your firm's approved content...</span>
              <span>{sourcesFound > 0 ? `Gathering ${sourcesFound} relevant sources...` : 'Searching Vault...'}</span>
            </div>
            
            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progress} className="h-2 bg-foreground/10" />
              <div className="text-xs text-foreground/70 text-center">
                {Math.round(progress)}% complete
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Question */}

          {/* Steps */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-foreground/70">
              Building from: {mode === 'answer' ? 'Vault' : 'Web'}
            </h3>
            
            {/* Source Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-2 bg-sidebar-background border-foreground/10 rounded border animate-pulse">
                <div className="w-4 h-4 bg-foreground/10 rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-foreground/10 rounded w-48 mb-1" />
                  <div className="h-2 bg-foreground/10 rounded w-32" />
                </div>
                <Badge variant="outline" className="bg-foreground/10">
                  <div className="w-8 h-2 bg-foreground/10 rounded" />
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-sidebar-background border-foreground/10 rounded border animate-pulse">
                <div className="w-4 h-4 bg-foreground/10 rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-foreground/10 rounded w-40 mb-1" />
                  <div className="h-2 bg-foreground/10 rounded w-28" />
                </div>
                <Badge variant="outline" className="bg-foreground/10">
                  <div className="w-8 h-2 bg-foreground/10 rounded" />
                </Badge>
              </div>
              <div className="flex items-center gap-2 p-2 bg-sidebar-background border-foreground/10 rounded border animate-pulse">
                <div className="w-4 h-4 bg-foreground/10 rounded" />
                <div className="flex-1">
                  <div className="h-3 bg-foreground/10 rounded w-36 mb-1" />
                  <div className="h-2 bg-foreground/10 rounded w-24" />
                </div>
                <Badge variant="outline" className="bg-foreground/10">
                  <div className="w-8 h-2 bg-foreground/10 rounded" />
                </Badge>
              </div>
            </div>

            {/* Process Steps */}
            <div className="space-y-2">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isCompleted = index < currentStepIndex;
                const isCurrent = index === currentStepIndex;
                
                return (
                  <div 
                    key={step.id}
                    className={`flex items-center gap-3 p-2 rounded ${
                      isCurrent ? 'bg-blue-50 border border-blue-200' : 
                      isCompleted ? 'bg-green-50 border border-green-200' : 
                      'bg-foreground/5 border border-foreground/10'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white animate-pulse' :
                      'bg-foreground/10 text-foreground/70'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Icon className="w-4 h-4" />
                      )}
                    </div>
                    <span className={`text-sm ${
                      isCurrent ? 'text-blue-800 font-medium' :
                      isCompleted ? 'text-green-800' :
                      'text-foreground/70'
                    }`}>
                      {step.label}
                    </span>
                    {isCurrent && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
