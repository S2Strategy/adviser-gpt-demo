interface TourSpotlightProps {
  targetRect: DOMRect | null;
  padding?: number;
  radius?: number;
  opacity?: number;
}

/**
 * Full-screen SVG overlay with an SVG mask that cuts a transparent "hole"
 * around the highlighted element. The result is the classic spotlight effect:
 * everything outside the target dims, the target remains fully visible.
 */
export function TourSpotlight({ targetRect, padding = 12, radius = 8, opacity = 1 }: TourSpotlightProps) {
  const holeX = targetRect ? targetRect.left - padding : 0;
  const holeY = targetRect ? targetRect.top - padding : 0;
  const holeW = targetRect ? targetRect.width + padding * 2 : 0;
  const holeH = targetRect ? targetRect.height + padding * 2 : 0;

  if (!targetRect) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          pointerEvents: "none",
          background: "rgba(0, 0, 0, 0.65)",
          opacity,
          transition: "opacity 90ms ease",
        }}
      />
    );
  }

  return (
    <>
      <div
        style={{
          position: "fixed",
          left: holeX,
          top: holeY,
          width: holeW,
          height: holeH,
          borderRadius: radius,
          zIndex: 9998,
          pointerEvents: "none",
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.65)",
          opacity,
          transition: "opacity 90ms ease",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: holeX,
          top: holeY,
          width: holeW,
          height: holeH,
          borderRadius: radius,
          zIndex: 9998,
          pointerEvents: "none",
          border: "2px solid rgba(255,255,255,0.25)",
          opacity,
          transition: "opacity 90ms ease",
        }}
      />
    </>
  );
}

