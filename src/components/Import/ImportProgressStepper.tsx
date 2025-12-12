import { CheckCircle2, Circle } from "lucide-react";

interface ImportProgressStepperProps {
  currentStep: 'upload' | 'tags' | 'review' | 'result';
}

export function ImportProgressStepper({ currentStep }: ImportProgressStepperProps) {
  const steps = [
    { id: 'upload', label: 'Columns' },
    { id: 'tags', label: 'Labels' },
    { id: 'review', label: 'Review' },
    { id: 'result', label: 'Import' },
  ] as const;

  const getStepIndex = (step: string) => {
    return steps.findIndex(s => s.id === step);
  };

  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((step, index) => {
        const stepIndex = getStepIndex(step.id);
        const isCompleted = stepIndex < currentIndex;
        const isCurrent = stepIndex === currentIndex;
        const isUpcoming = stepIndex > currentIndex;

        return (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                  isCompleted
                    ? 'bg-sidebar-primary border-sidebar-primary text-white'
                    : isCurrent
                    ? 'border-sidebar-primary text-sidebar-primary'
                    : 'border-foreground/20 text-foreground/40'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <Circle className="h-5 w-5" />
                )}
              </div>
              <span
                className={`text-xs mt-1 ${
                  isCurrent ? 'font-medium text-sidebar-primary' : 'text-foreground/60'
                }`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? 'bg-sidebar-primary' : 'bg-foreground/20'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

