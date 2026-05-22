import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import type { TourStep, TourState } from "@/types/tour";
import { mainTourSteps } from "@/tour/steps";

interface TourContextValue extends TourState {
  startTour: (steps: TourStep[]) => void;
  nextStep: () => void;
  prevStep: () => void;
  endTour: () => void;
}

const TourContext = createContext<TourContextValue | null>(null);

const TOUR_COMPLETED_KEY = "demo-tour-completed";
const TOUR_ACTIVE_KEY = "demo-tour-active";
const TOUR_STEP_INDEX_KEY = "demo-tour-step-index";
const TOUR_MIGRATION_KEY = "demo-tour-v2-no-intro";
/** @deprecated removed intro step — cleaned up on migrate */
const TOUR_INTRO_SUBMITTED_KEY = "demo-tour-intro-submitted";
/** @deprecated removed intro step — cleaned up on migrate */
const TOUR_USER_PROFILE_KEY = "tour-user-profile";

function readBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function migrateTourStorageIfNeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(TOUR_MIGRATION_KEY) === "true") return;

  const raw = window.localStorage.getItem(TOUR_STEP_INDEX_KEY);
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  if (Number.isFinite(parsed) && parsed > 0) {
    window.localStorage.setItem(TOUR_STEP_INDEX_KEY, String(parsed - 1));
  }

  window.localStorage.removeItem(TOUR_INTRO_SUBMITTED_KEY);
  window.localStorage.removeItem(TOUR_USER_PROFILE_KEY);
  window.localStorage.setItem(TOUR_MIGRATION_KEY, "true");
}

function readStoredStepIndex(): number {
  if (typeof window === "undefined") return 0;
  migrateTourStorageIfNeeded();
  const raw = window.localStorage.getItem(TOUR_STEP_INDEX_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

function clampStepIndex(index: number, stepsLength: number): number {
  return Math.min(Math.max(index, 0), Math.max(stepsLength - 1, 0));
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>(() => {
    if (typeof window === "undefined") {
      return {
        isActive: true,
        currentStepIndex: 0,
        steps: mainTourSteps,
      };
    }

    const stepIndex = clampStepIndex(readStoredStepIndex(), mainTourSteps.length);

    return {
      isActive: true,
      currentStepIndex: stepIndex,
      steps: mainTourSteps,
    };
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Demo environment: always keep users in the tour, even if they had completed it previously.
    window.localStorage.setItem(TOUR_COMPLETED_KEY, "false");

    const stepIndex = clampStepIndex(readStoredStepIndex(), mainTourSteps.length);

    window.localStorage.setItem(TOUR_ACTIVE_KEY, "true");
    window.localStorage.setItem(TOUR_STEP_INDEX_KEY, String(stepIndex));
    setState({ isActive: true, currentStepIndex: stepIndex, steps: mainTourSteps });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.steps.length === 0) return;

    window.localStorage.setItem(TOUR_ACTIVE_KEY, String(state.isActive));
    window.localStorage.setItem(TOUR_STEP_INDEX_KEY, String(state.currentStepIndex));
  }, [state.isActive, state.currentStepIndex, state.steps.length]);

  const startTour = useCallback((steps: TourStep[]) => {
    if (steps.length === 0) return;
    setState({ isActive: true, currentStepIndex: 0, steps });
  }, []);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentStep = prev.steps[prev.currentStepIndex];
      if (currentStep?.id === "book-demo") {
        return prev;
      }
      if (prev.currentStepIndex < prev.steps.length - 1) {
        return { ...prev, currentStepIndex: prev.currentStepIndex + 1 };
      }
      // Last step — end the tour
      window.localStorage.setItem(TOUR_COMPLETED_KEY, "true");
      window.localStorage.setItem(TOUR_ACTIVE_KEY, "false");
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
    const completed = readBoolean(TOUR_COMPLETED_KEY, false);
    if (!completed) return;
    setState({ isActive: false, currentStepIndex: 0, steps: [] });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!state.isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextStep();
      if (e.key === "ArrowLeft") prevStep();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [state.isActive, nextStep, prevStep]);

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
