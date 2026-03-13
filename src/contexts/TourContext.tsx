import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { TourStep, TourState } from "@/types/tour";

interface TourContextValue extends TourState {
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    steps: [],
  });

  const startTour = useCallback((steps: TourStep[]) => {
    if (steps.length === 0) return;
    setState({ isActive: true, currentStepIndex: 0, steps });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStepIndex < prev.steps.length - 1) {
        return { ...prev, currentStepIndex: prev.currentStepIndex + 1 };
      }
      // Last step — end the tour
      localStorage.setItem("tour-completed", "true");
      return { isActive: false, currentStepIndex: 0, steps: [] };
    });
  }, []);

  const prevStep = useCallback(() => {
    setState((prev) => {
      if (prev.currentStepIndex > 0) {
        return { ...prev, currentStepIndex: prev.currentStepIndex - 1 };
      }
      return prev;
    });
  }, []);

  const endTour = useCallback(() => {
    setState({ isActive: false, currentStepIndex: 0, steps: [] });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") endTour();
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isActive, endTour, nextStep, prevStep]);

  return (
    <TourContext.Provider value={{ ...state, startTour, nextStep, prevStep, endTour }}>
      {children}
    </TourContext.Provider>
  );
}

export function useTour(): TourContextValue {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTour must be used inside <TourProvider>");
  return ctx;
}

