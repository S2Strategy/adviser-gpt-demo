export interface TourStep {
  /** Unique identifier for this step */
  id: string;
  /** Matches the `data-tour-id` attribute on the target DOM element */
  tourId: string;
  /** Card heading shown in the tooltip */
  title: string;
  /** Explanatory body text shown in the tooltip */
  content: string;
  /** Preferred side to render the tooltip relative to the spotlight */
  placement: "top" | "bottom" | "left" | "right";
  /** Optional route to navigate to before this step becomes active */
  route?: string;
  /** Extra space (px) around the highlighted element. Default: 12 */
  spotlightPadding?: number;
  /** Border-radius (px) of the spotlight cutout. Default: 8 */
  spotlightRadius?: number;
}

export interface TourState {
  isActive: boolean;
  currentStepIndex: number;
  steps: TourStep[];
}

