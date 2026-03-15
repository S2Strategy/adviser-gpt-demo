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
const TOUR_INTRO_SUBMITTED_KEY = "demo-tour-intro-submitted";
const TOUR_USER_PROFILE_KEY = "tour-user-profile";
const INTRO_LOCK_INDEX = 1;

function readBoolean(key: string, fallback: boolean): boolean {
  if (typeof window === "undefined") return fallback;
  const value = window.localStorage.getItem(key);
  if (value === null) return fallback;
  return value === "true";
}

function readStoredStepIndex(): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(TOUR_STEP_INDEX_KEY);
  if (!raw) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isIntroSubmitted(): boolean {
  if (typeof window === "undefined") return false;
  return (
    readBoolean(TOUR_INTRO_SUBMITTED_KEY, false) ||
    Boolean(window.localStorage.getItem(TOUR_USER_PROFILE_KEY))
  );
}

function clampStepIndex(index: number, minIndex: number, stepsLength: number): number {
  return Math.min(Math.max(index, minIndex), Math.max(stepsLength - 1, minIndex));
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TourState>({
    isActive: false,
    currentStepIndex: 0,
    steps: [],
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const completed = readBoolean(TOUR_COMPLETED_KEY, false);
    if (completed) {
      setState({ isActive: false, currentStepIndex: 0, steps: [] });
      return;
    }

    const introSubmitted = isIntroSubmitted();
    if (introSubmitted) {
      window.localStorage.setItem(TOUR_INTRO_SUBMITTED_KEY, "true");
    }

    const minIndex = introSubmitted ? INTRO_LOCK_INDEX : 0;
    const requestedIndex = readStoredStepIndex();
    const stepIndex = clampStepIndex(requestedIndex, minIndex, mainTourSteps.length);

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
    const minIndex = isIntroSubmitted() ? INTRO_LOCK_INDEX : 0;
    setState({ isActive: true, currentStepIndex: minIndex, steps });
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
      const minIndex = isIntroSubmitted() ? INTRO_LOCK_INDEX : 0;
      if (prev.currentStepIndex > minIndex) {
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

