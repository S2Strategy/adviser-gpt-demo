import { useState, useMemo, useRef, useLayoutEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { TourStep } from "@/types/tour";

const TOOLTIP_WIDTH = 320;
const INTRO_CARD_WIDTH = 420;
const THANKYOU_CARD_WIDTH = 440;
const TOOLTIP_GAP = 12;

/** Personal/free email domains not accepted as work email */
const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.co.uk", "ymail.com",
  "hotmail.com", "hotmail.co.uk", "outlook.com", "live.com", "msn.com", "outlook.co.uk",
  "icloud.com", "me.com", "mac.com", "aol.com", "mail.com", "protonmail.com", "proton.me",
  "zoho.com", "gmx.com", "gmx.net", "mail.ru", "yandex.com", "inbox.com", "fastmail.com",
]);

function isWorkEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
  const domain = trimmed.split("@")[1];
  return !PERSONAL_EMAIL_DOMAINS.has(domain);
} // gap between spotlight edge and card
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
  const [bookDemoEmail, setBookDemoEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("tour-user-profile");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { workEmail?: string };
      return parsed.workEmail ?? "";
    } catch {
      return "";
    }
  });
  const [bookDemoTouched, setBookDemoTouched] = useState(false);
  const [bookDemoSubmitted, setBookDemoSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("demo-tour-booked") === "true";
  });
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("tour-user-profile");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { name?: string };
      return parsed.name ?? "";
    } catch {
      return "";
    }
  });
  const [workEmail, setWorkEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("tour-user-profile");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { workEmail?: string };
      return parsed.workEmail ?? "";
    } catch {
      return "";
    }
  });
  const [company, setCompany] = useState(() => {
    if (typeof window === "undefined") return "";
    try {
      const raw = window.localStorage.getItem("tour-user-profile");
      if (!raw) return "";
      const parsed = JSON.parse(raw) as { company?: string };
      return parsed.company ?? "";
    } catch {
      return "";
    }
  });
  const [touched, setTouched] = useState(false);
  const [isIntroSubmitted, setIsIntroSubmitted] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("demo-tour-intro-submitted") === "true";
  });
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [cardHeight, setCardHeight] = useState(260);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const isIntroStep = step.id === "welcome-details";
  const isBookDemoStep = step.id === "book-demo";
  /** Step 2 (Web App Homepage): no Back button so it doesn't cancel or confuse */
  const showBackButton = !isFirst && step.id !== "homepage-overview" && !isBookDemoStep;
  const isThankYouCard = isBookDemoStep && bookDemoSubmitted;
  const cardWidth = isIntroStep ? INTRO_CARD_WIDTH : isThankYouCard ? THANKYOU_CARD_WIDTH : TOOLTIP_WIDTH;

  const emailFormatValid = !workEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(workEmail.trim());
  const emailValid = emailFormatValid && (!workEmail.trim() || isWorkEmail(workEmail));
  const showErrors = touched && isIntroStep;
  const bookEmailFormatValid = !bookDemoEmail || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bookDemoEmail.trim());
  const bookEmailValid = bookEmailFormatValid && (!bookDemoEmail.trim() || isWorkEmail(bookDemoEmail));
  const showBookErrors = bookDemoTouched && isBookDemoStep;

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
    const left = Math.max(8, Math.min(vw - cardWidth - 8, vw / 2 - cardWidth / 2));
    return { top, left, anchored: null };
  }, [anchored, cardHeight, cardWidth]);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    const measured = Math.ceil(cardRef.current.getBoundingClientRect().height);
    if (Math.abs(measured - cardHeight) > 1) {
      setCardHeight(measured);
    }
  }, [step.id, name, workEmail, company, touched, cardHeight, bookDemoEmail, bookDemoTouched, bookDemoSubmitted]);

  const handleNext = () => {
    if (isIntroStep) {
      if (isIntroSubmitted) {
        onNext();
        return;
      }
      setTouched(true);
      const hasAllValues = name.trim() && workEmail.trim() && company.trim() && emailValid;
      if (!hasAllValues) return;
      try {
        window.localStorage.setItem("tour-user-profile", JSON.stringify({
          name: name.trim(),
          workEmail: workEmail.trim(),
          company: company.trim(),
        }));
        window.localStorage.setItem("demo-tour-intro-submitted", "true");
        setIsIntroSubmitted(true);
      } catch {
        // ignore storage errors
      }
    }
    onNext();
  };

  const handleBookDemo = () => {
    setBookDemoTouched(true);
    if (!bookDemoEmail.trim() || !bookEmailValid) return;
    try {
      window.localStorage.setItem("demo-tour-booked", "true");
      window.localStorage.setItem("demo-tour-booked-email", bookDemoEmail.trim());
      setBookDemoSubmitted(true);
    } catch {
      // ignore storage errors
    }
  };

  const cardContent = (
    <div className="rounded-xl border border-border bg-background shadow-2xl overflow-visible relative">
      {/* Caret arrow when anchored to an element */}
      {floating.anchored && <Arrow side={floating.anchored.arrowSide} offset={floating.anchored.arrowOffset} />}

      {/* Header */}
      {!isThankYouCard && (
        <div className={isIntroStep || isThankYouCard ? "px-6 pt-6 pb-3" : "px-5 pt-5 pb-3"}>
          <span className="text-[11px] font-semibold text-muted-foreground tracking-wider uppercase">
            {stepIndex + 1} of {totalSteps}
          </span>
        </div>
      )}

      {/* Body */}
      <div className={isIntroStep || isThankYouCard ? "px-6 pb-6 space-y-4" : "px-5 pb-5 space-y-3"}>
        {!isThankYouCard && (
          <h3
            className="font-semibold text-foreground"
            style={{ fontSize: isIntroStep || isThankYouCard ? "17px" : "15px", lineHeight: "1.4", letterSpacing: "-0.3px" }}
          >
            {step.title}
          </h3>
        )}
        {isIntroStep ? (
          <div className="space-y-4 mt-1">
            <p className="text-muted-foreground" style={{ fontSize: "14px", lineHeight: "1.6" }}>
              {step.content}
            </p>
            <div className="space-y-4 mt-3">
              <div className="space-y-1.5">
                <Label htmlFor="tour-name" className="text-xs font-medium">Name</Label>
                <Input
                  id="tour-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={isIntroStep ? "h-9 text-sm" : "h-8 text-sm"}
                  disabled={isIntroSubmitted}
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
                  className={isIntroStep ? "h-9 text-sm" : "h-8 text-sm"}
                  disabled={isIntroSubmitted}
                />
                {showErrors && !workEmail.trim() && (
                  <p className="text-[11px] text-destructive">Please enter your work email.</p>
                )}
                {showErrors && workEmail.trim() && !emailFormatValid && (
                  <p className="text-[11px] text-destructive">Enter a valid email address.</p>
                )}
                {showErrors && workEmail.trim() && emailFormatValid && !emailValid && (
                  <p className="text-[11px] text-destructive">Please use a work email (no Gmail, Yahoo, etc.).</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tour-company" className="text-xs font-medium">Company</Label>
                <Input
                  id="tour-company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Your firm name"
                  className={isIntroStep ? "h-9 text-sm" : "h-8 text-sm"}
                  disabled={isIntroSubmitted}
                />
                {showErrors && !company.trim() && (
                  <p className="text-[11px] text-destructive">Please enter your company.</p>
                )}
              </div>
            </div>
          </div>
        ) : isBookDemoStep ? (
          <div className="space-y-4 mt-1">
            {bookDemoSubmitted ? (
              <div className="py-6 flex flex-col items-center text-center gap-5">
                <h3 className="font-semibold text-foreground text-[30px] leading-tight tracking-[-0.4px]">
                  Thank you!
                </h3>
                <p className="text-muted-foreground max-w-[360px]" style={{ fontSize: "16px", lineHeight: "1.65" }}>
                  Your demo request has been received and our team will follow up shortly.
                </p>
                <a
                  href="https://www.advisergpt.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button size="sm" className="h-9 px-5">
                    Learn more
                  </Button>
                </a>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                  Enter your work email and we will follow up to schedule your personalized demo.
                </p>
                <div className="space-y-1.5">
                  <Label htmlFor="tour-book-demo-email" className="text-xs font-medium">Work email</Label>
                  <Input
                    id="tour-book-demo-email"
                    value={bookDemoEmail}
                    onChange={(e) => setBookDemoEmail(e.target.value)}
                    placeholder="you@firm.com"
                    type="email"
                    className="h-9 text-sm"
                    autoFocus
                  />
                  {showBookErrors && !bookDemoEmail.trim() && (
                    <p className="text-[11px] text-destructive">Please enter your work email.</p>
                  )}
                  {showBookErrors && bookDemoEmail.trim() && !bookEmailFormatValid && (
                    <p className="text-[11px] text-destructive">Enter a valid email address.</p>
                  )}
                  {showBookErrors && bookDemoEmail.trim() && bookEmailFormatValid && !bookEmailValid && (
                    <p className="text-[11px] text-destructive">Please use a work email (no Gmail, Yahoo, etc.).</p>
                  )}
                </div>
                <div className="pt-2 flex justify-end">
                  <Button size="sm" onClick={handleBookDemo} className="h-8 px-4">
                    Book demo
                  </Button>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground mt-1" style={{ fontSize: "13px", lineHeight: "1.6" }}>
            {step.content}
          </p>
        )}
      </div>

      {/* Progress dots */}
      {!isThankYouCard && (
        <div className={isIntroStep || isThankYouCard ? "flex items-center justify-center gap-1.5 pb-5" : "flex items-center justify-center gap-1.5 pb-4"}>
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-200 ${
                i === stepIndex ? "w-4 h-1.5 bg-foreground" : "w-1.5 h-1.5 bg-foreground/20"
              }`}
            />
          ))}
        </div>
      )}

      {/* Footer */}
      {!isBookDemoStep && (
        <div className={isIntroStep ? "flex items-center justify-end px-6 pb-6 gap-2" : "flex items-center justify-end px-5 pb-5 gap-2"}>
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="outline" size="sm" onClick={onPrev} className="h-8 px-3 gap-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </Button>
            )}
            <Button size="sm" onClick={handleNext} className="h-8 px-4 gap-1">
              {isIntroStep && isIntroSubmitted ? "Continue" : isLast ? "Finish" : "Next"}
              {!isLast && <ChevronRight className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      )}
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
          width: cardWidth,
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
