import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import type { TourStep } from "@/types/tour";

const TOOLTIP_WIDTH = 320;
const TOOLTIP_GAP = 12; // gap between spotlight edge and card
const ARROW_SIZE = 10;  // half-width of the caret triangle

interface TourTooltipProps {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect | null;
  padding?: number;
  opacity?: number;
  onNext: () => void;
  onPrev: () => void;
  onEnd: () => void;
}

type ArrowSide = "top" | "bottom" | "left" | "right";

interface AnchoredPosition {
  top: number;
  left: number;
  arrowSide: ArrowSide;
  /** px offset of the caret along the card edge, from the card's start edge */
  arrowOffset: number;
}

interface FloatingPosition {
  top: number;
  left: number;
  anchored: AnchoredPosition | null;
}

function computeAnchoredPosition(
  targetRect: DOMRect,
  placement: TourStep["placement"],
  padding: number,
  cardHeight: number,
): AnchoredPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const spotLeft   = targetRect.left   - padding;
  const spotTop    = targetRect.top    - padding;
  const spotRight  = targetRect.right  + padding;
  const spotBottom = targetRect.bottom + padding;
  const spotW      = targetRect.width  + padding * 2;
  const spotH      = targetRect.height + padding * 2;

  const spaceRight  = vw - spotRight;
  const spaceLeft   = spotLeft;
  const spaceBottom = vh - spotBottom;
  const spaceTop    = spotTop;

  const fits = {
    right:  spaceRight  >= TOOLTIP_WIDTH + TOOLTIP_GAP + ARROW_SIZE,
    left:   spaceLeft   >= TOOLTIP_WIDTH + TOOLTIP_GAP + ARROW_SIZE,
    bottom: spaceBottom >= 120 + TOOLTIP_GAP + ARROW_SIZE,
    top:    spaceTop    >= 120 + TOOLTIP_GAP + ARROW_SIZE,
  };

  const effective: TourStep["placement"] = fits[placement]
    ? placement
    : (["bottom", "right", "top", "left"] as const).reduce((best, side) => {
        const space = (s: typeof side) =>
          s === "right" ? spaceRight : s === "left" ? spaceLeft : s === "bottom" ? spaceBottom : spaceTop;
        return space(side) > space(best) ? side : best;
      });

  // Center card alongside spotlight on cross-axis, clamped to viewport
  const crossV = Math.max(8, Math.min(vh - cardHeight - 8, spotTop + spotH / 2 - cardHeight / 2));
  const crossH = Math.max(8, Math.min(vw - TOOLTIP_WIDTH - 8, spotLeft + spotW / 2 - TOOLTIP_WIDTH / 2));

  // Arrow offset: how far along the card edge the caret sits
  const arrowOffsetH = Math.max(ARROW_SIZE + 4, Math.min(TOOLTIP_WIDTH - ARROW_SIZE * 2 - 4,
    spotLeft + spotW / 2 - crossH));
  const arrowOffsetV = Math.max(ARROW_SIZE + 4, Math.min(cardHeight - ARROW_SIZE * 2 - 4,
    spotTop + spotH / 2 - crossV));

  switch (effective) {
    case "right":
      return { top: crossV, left: spotRight + TOOLTIP_GAP, arrowSide: "left", arrowOffset: arrowOffsetV };
    case "left":
      return { top: crossV, left: spotLeft - TOOLTIP_WIDTH - TOOLTIP_GAP, arrowSide: "right", arrowOffset: arrowOffsetV };
    case "top":
      return {
        top: spotTop - cardHeight - TOOLTIP_GAP - ARROW_SIZE,
        left: crossH,
        arrowSide: "bottom",
        arrowOffset: arrowOffsetH,
      };
    case "bottom":
    default:
      return { top: spotBottom + TOOLTIP_GAP, left: crossH, arrowSide: "top", arrowOffset: arrowOffsetH };
  }
}

function Arrow({ side, offset }: { side: ArrowSide; offset: number }) {
  const size = ARROW_SIZE;
  const color = "hsl(var(--background))";
  const border = "hsl(var(--border))";

  const common: React.CSSProperties = {
    position: "absolute",
    width: 0,
    height: 0,
    zIndex: 1,
  };

  if (side === "top") {
    return (
      <>
        {/* border triangle (slightly larger) */}
        <div style={{
          ...common,
          top: -(size + 1),
          left: offset - size,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderBottom: `${size}px solid ${border}`,
        }} />
        {/* fill triangle */}
        <div style={{
          ...common,
          top: -size + 1,
          left: offset - size,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderBottom: `${size}px solid ${color}`,
        }} />
      </>
    );
  }
  if (side === "bottom") {
    return (
      <>
        <div style={{
          ...common,
          bottom: -(size + 1),
          left: offset - size,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderTop: `${size}px solid ${border}`,
        }} />
        <div style={{
          ...common,
          bottom: -size + 1,
          left: offset - size,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderTop: `${size}px solid ${color}`,
        }} />
      </>
    );
  }
  if (side === "left") {
    return (
      <>
        <div style={{
          ...common,
          left: -(size + 1),
          top: offset - size,
          borderTop: `${size}px solid transparent`,
          borderBottom: `${size}px solid transparent`,
          borderRight: `${size}px solid ${border}`,
        }} />
        <div style={{
          ...common,
          left: -size + 1,
          top: offset - size,
          borderTop: `${size}px solid transparent`,
          borderBottom: `${size}px solid transparent`,
          borderRight: `${size}px solid ${color}`,
        }} />
      </>
    );
  }
  // right
  return (
    <>
      <div style={{
        ...common,
        right: -(size + 1),
        top: offset - size,
        borderTop: `${size}px solid transparent`,
        borderBottom: `${size}px solid transparent`,
        borderLeft: `${size}px solid ${border}`,
      }} />
      <div style={{
        ...common,
        right: -size + 1,
        top: offset - size,
        borderTop: `${size}px solid transparent`,
        borderBottom: `${size}px solid transparent`,
        borderLeft: `${size}px solid ${color}`,
      }} />
    </>
  );
}

export function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  padding = 12,
  opacity = 1,
  onNext,
  onPrev,
  onEnd,
}: TourTooltipProps) {
  const [name, setName] = useState("");
  const [workEmail, setWorkEmail] = useState("");
  const [company, setCompany] = useState("");
  const [touched, setTouched] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState(260);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isIntroStep = step.id === "welcome-details";
  const isBookDemoStep = step.id === "book-demo";

  const emailValid = !workEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail);
  const showErrors = touched && isIntroStep;

  const anchored = useMemo<AnchoredPosition | null>(() => {
    if (!targetRect) return null;
    return computeAnchoredPosition(targetRect, step.placement, padding, cardHeight);
  }, [targetRect, step.placement, padding, cardHeight]);

  const floating = useMemo<FloatingPosition>(() => {
    if (anchored) {
      return { top: anchored.top, left: anchored.left, anchored };
    }

    const vh = window.innerHeight;
    const vw = window.innerWidth;
    const top = Math.max(8, Math.min(vh - cardHeight - 8, vh / 2 - cardHeight / 2));
    const left = Math.max(8, Math.min(vw - TOOLTIP_WIDTH - 8, vw / 2 - TOOLTIP_WIDTH / 2));
    return { top, left, anchored: null };
  }, [anchored, cardHeight]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const measured = Math.ceil(cardRef.current.getBoundingClientRect().height);
    if (Math.abs(measured - cardHeight) > 1) {
      setCardHeight(measured);
    }
  }, [step.id, name, workEmail, company, touched, cardHeight]);

  const handleNext = () => {
    if (isIntroStep) {
      setTouched(true);
      const hasAllValues = name.trim() && workEmail.trim() && company.trim() && emailValid;
      if (!hasAllValues) return;
      try {
        window.localStorage.setItem("tour-user-profile", JSON.stringify({
          name: name.trim(),
          workEmail: workEmail.trim(),
          company: company.trim(),
        }));
      } catch {
        // ignore storage errors
      }
    }
    onNext();
  };

  const cardContent = (
    <div className="rounded-xl border border-border bg-background shadow-2xl overflow-visible relative">
      {/* Caret arrow when anchored to an element */}
      {floating.anchored && <Arrow side={floating.anchored.arrowSide} offset={floating.anchored.arrowOffset} />}

      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-5 pb-3">
        <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
          {stepIndex + 1} of {totalSteps}
        </span>
        <button
          onClick={onEnd}
          className="text-muted-foreground hover:text-foreground transition-colors rounded-md p-0.5 -mr-1 -mt-1"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 space-y-3">
        <h3
          className="font-semibold text-foreground"
          style={{ fontSize: "15px", lineHeight: "1.4", letterSpacing: "-0.3px" }}
        >
          {step.title}
        </h3>
        {isIntroStep ? (
          <div className="space-y-3 mt-1">
            <p className="text-muted-foreground" style={{ fontSize: "13px", lineHeight: "1.6" }}>
              {step.content}
            </p>
            <div className="space-y-3 mt-2">
              <div className="space-y-1.5">
                <Label htmlFor="tour-name" className="text-xs font-medium">Name</Label>
                <Input
                  id="tour-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="h-8 text-sm"
                />
                {showErrors && !name.trim() && (
                  <p className="text-[11px] text-destructive">Please enter your name.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tour-email" className="text-xs font-medium">Work email</Label>
                <Input
                  id="tour-email"
                  value={workEmail}
                  onChange={(e) => setWorkEmail(e.target.value)}
                  placeholder="you@firm.com"
                  type="email"
                  className="h-8 text-sm"
                />
                {showErrors && !workEmail.trim() && (
                  <p className="text-[11px] text-destructive">Please enter your work email.</p>
                )}
                {showErrors && workEmail.trim() && !emailValid && (
                  <p className="text-[11px] text-destructive">Enter a valid email address.</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tour-company" className="text-xs font-medium">Company</Label>
                <Input
                  id="tour-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your firm name"
                  className="h-8 text-sm"
                />
                {showErrors && !company.trim() && (
                  <p className="text-[11px] text-destructive">Please enter your company.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground mt-1" style={{ fontSize: "13px", lineHeight: "1.6" }}>
            {step.content}
          </p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pb-4">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-200 ${
              i === stepIndex ? "w-4 h-1.5 bg-foreground" : "w-1.5 h-1.5 bg-foreground/20"
            }`}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-5 pb-5 gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onEnd}
          className="text-muted-foreground hover:text-foreground text-xs h-8"
        >
          Skip tour
        </Button>
        <div className="flex items-center gap-2">
          {!isFirst && (
            <Button variant="outline" size="sm" onClick={onPrev} className="h-8 px-3 gap-1">
              <ChevronLeft className="w-3.5 h-3.5" />
              Back
            </Button>
          )}
          <Button size="sm" onClick={handleNext} className="h-8 px-4 gap-1">
            {isBookDemoStep ? "Book demo" : isLast ? "Finish" : "Next"}
            {!isLast && !isBookDemoStep && <ChevronRight className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div
        ref={cardRef}
        style={{
          position: "fixed",
          top: floating.top,
          left: floating.left,
          width: TOOLTIP_WIDTH,
          zIndex: 9999,
          pointerEvents: opacity > 0 ? "auto" : "none",
          opacity,
          transition: "opacity 90ms ease",
        }}
      >
        {cardContent}
      </div>
    </>
  );
}
