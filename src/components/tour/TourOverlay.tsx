import { useEffect, useState, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";
import { useTour } from "@/contexts/TourContext";
import { TourSpotlight } from "./TourSpotlight";
import { TourTooltip } from "./TourTooltip";

/**
 * Orchestrates the tour: handles route navigation, DOM targeting,
 * spotlight positioning, and resize/scroll synchronisation.
 * Rendered once at the app root — portal-renders into document.body.
 */
export function TourOverlay() {
  const { isActive, currentStepIndex, steps, nextStep, prevStep, endTour } = useTour();
  const navigate = useNavigate();
  const location = useLocation();

  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isStepReady, setIsStepReady] = useState(false);
  const [chromeOpacity, setChromeOpacity] = useState(1);
  const retryTimeoutRef = useRef<number | null>(null);
  const measureTimeoutRef = useRef<number | null>(null);
  const fadeTimeoutRef = useRef<number | null>(null);
  const revealTimeoutRef = useRef<number | null>(null);

  const currentStep = steps[currentStepIndex] ?? null;
  const padding = currentStep?.spotlightPadding ?? 12;
  const radius = currentStep?.spotlightRadius ?? 8;

  const clearRetryTimeout = useCallback(() => {
    if (retryTimeoutRef.current !== null) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    if (measureTimeoutRef.current !== null) {
      window.clearTimeout(measureTimeoutRef.current);
      measureTimeoutRef.current = null;
    }
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
    }
    if (revealTimeoutRef.current !== null) {
      window.clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
    }
  }, []);

  /** Measure the target element and update the stored rect */
  const measureTarget = useCallback((attempt = 0) => {
    if (!currentStep) {
      setTargetRect(null);
      setIsStepReady(false);
      return;
    }
    // Explicit overlay-only steps are intentionally centered with no spotlight.
    if (currentStep.tourId.endsWith("-overlay")) {
      setTargetRect(null);
      setIsStepReady(true);
      return;
    }
    const el = document.querySelector<HTMLElement>(
      `[data-tour-id="${currentStep.tourId}"]`
    );
    if (el) {
      clearRetryTimeout();
      el.scrollIntoView({ block: "center", behavior: "auto" });
      // Small delay so scroll settles before we measure
      measureTimeoutRef.current = window.setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
        setIsStepReady(true);
        measureTimeoutRef.current = null;
      }, 120);
    } else {
      // Some targets (like opened drawers/panels) mount slightly after step change.
      // Retry briefly so spotlight can lock onto dynamically rendered targets.
      if (attempt < 150) {
        clearRetryTimeout();
        retryTimeoutRef.current = window.setTimeout(() => measureTarget(attempt + 1), 100);
      } else {
        // If we exhaust retries, gracefully fall back to centered card.
        setTargetRect(null);
        setIsStepReady(true);
      }
    }
  }, [currentStep, clearRetryTimeout]);

  // Navigate to the step's route if it differs from the current path (compare pathname only; route may include query)
  useEffect(() => {
    if (!isActive || !currentStep) return;
    clearRetryTimeout();
    setIsStepReady(false);

    const stepPath = currentStep.route?.split("?")[0] ?? "";
    if (currentStep.route && location.pathname !== stepPath) {
      navigate(currentStep.route);
      // Wait for route transition before measuring
      const id = setTimeout(measureTarget, 300);
      return () => {
        clearTimeout(id);
        clearRetryTimeout();
      };
    } else {
      measureTarget();
    }
    return () => {
      clearRetryTimeout();
    };
  }, [isActive, currentStep, location.pathname, navigate, measureTarget, clearRetryTimeout]);

  // Re-measure on resize (scroll is blocked during tour)
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => measureTarget();
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isActive, measureTarget]);

  useEffect(() => {
    return () => {
      clearRetryTimeout();
    };
  }, [clearRetryTimeout]);

  useEffect(() => {
    if (!isActive) {
      setIsStepReady(false);
      setChromeOpacity(1);
    }
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    if (isStepReady || currentStep?.id === "homepage-trust-score") {
      if (revealTimeoutRef.current !== null) {
        window.clearTimeout(revealTimeoutRef.current);
      }
      revealTimeoutRef.current = window.setTimeout(() => {
        setChromeOpacity(1);
        revealTimeoutRef.current = null;
      }, 20);
    }
  }, [isActive, isStepReady, currentStep?.id]);

  // Proactively block ALL interaction with the page while tour is active
  useEffect(() => {
    if (!isActive) return;

    const blockEvent = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };

    // Prevent scroll via wheel, touch, and keyboard scroll keys
    const blockScroll = (e: Event) => {
      e.stopPropagation();
      e.preventDefault();
    };

    const blockKeys = (e: KeyboardEvent) => {
      const scrollKeys = ["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End", " "];
      if (scrollKeys.includes(e.key)) {
        e.preventDefault();
      }
    };

    // Lock body scroll
    const scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.overflow = "hidden";

    window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
    window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
    window.addEventListener("keydown", blockKeys, { capture: true });

    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      window.scrollTo(0, scrollY);

      window.removeEventListener("wheel", blockScroll, { capture: true });
      window.removeEventListener("touchmove", blockScroll, { capture: true });
      window.removeEventListener("keydown", blockKeys, { capture: true });
    };
  }, [isActive]);

  if (!isActive || !currentStep) return null;

  const showPendingCard = !isStepReady && currentStep.id === "homepage-trust-score";
  const fadeToStep = (direction: "next" | "prev") => {
    setChromeOpacity(0);
    if (fadeTimeoutRef.current !== null) {
      window.clearTimeout(fadeTimeoutRef.current);
    }
    fadeTimeoutRef.current = window.setTimeout(() => {
      if (direction === "next") {
        nextStep();
      } else {
        prevStep();
      }
      fadeTimeoutRef.current = null;
    }, 80);
  };

  return createPortal(
    <>
      {/* Full-screen click/pointer blocker — sits behind the spotlight and tooltip */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9997,
          cursor: "default",
        }}
        aria-hidden="true"
        onClickCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
        onMouseUpCapture={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onPointerUpCapture={(e) => e.stopPropagation()}
        onTouchStartCapture={(e) => e.stopPropagation()}
        onTouchEndCapture={(e) => e.stopPropagation()}
      />
      <TourSpotlight
        targetRect={isStepReady ? targetRect : null}
        padding={padding}
        radius={radius}
        opacity={chromeOpacity}
      />
      {(isStepReady || showPendingCard) && (
        <TourTooltip
          step={currentStep}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
          targetRect={isStepReady ? targetRect : null}
          padding={padding}
          opacity={chromeOpacity}
          onNext={() => fadeToStep("next")}
          onPrev={() => fadeToStep("prev")}
          onEnd={endTour}
        />
      )}
    </>,
    document.body
  );
}

