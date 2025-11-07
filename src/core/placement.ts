const OPPOSITE: Record<AnchoredPlacement, AnchoredPlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const DEFAULT_ORDER: AnchoredPlacement[] = ["bottom", "top", "right", "left"];

export type AnchoredPlacement = "top" | "bottom" | "left" | "right";

export type PreferredAnchoredPlacement = AnchoredPlacement | "auto";

export interface AnchoredPlacementMeasureConfig {
  viewportWidth(): number;
  viewportHeight(): number;
}

const DEFAULT_MEASURE: AnchoredPlacementMeasureConfig = {
  viewportWidth: () => window.innerWidth || document.documentElement.clientWidth,
  viewportHeight: () => window.innerHeight || document.documentElement.clientHeight,
};

/**
 * Determine the best placement for an anchored surface (tooltip, popover, etc.).
 * Prefers the requested placement, but will fall back to the opposite side or
 * a sensible default whenever the surface would overflow the viewport.
 */
export function resolveAnchoredPlacement(
  trigger: HTMLElement,
  surface: HTMLElement,
  preferred: PreferredAnchoredPlacement,
  measure: AnchoredPlacementMeasureConfig = DEFAULT_MEASURE,
): AnchoredPlacement {
  const triggerRect = trigger.getBoundingClientRect();
  const surfaceRect = surface.getBoundingClientRect();

  const viewportWidth = measure.viewportWidth();
  const viewportHeight = measure.viewportHeight();

  const order = buildOrder(preferred);

  for (const placement of order) {
    if (fits(placement, triggerRect, surfaceRect, viewportWidth, viewportHeight)) {
      return placement;
    }
  }

  return order[0];
}

function buildOrder(preferred: PreferredAnchoredPlacement): AnchoredPlacement[] {
  if (preferred === "auto") {
    return [...DEFAULT_ORDER];
  }

  const fallback = OPPOSITE[preferred];
  return [preferred, fallback, ...DEFAULT_ORDER.filter((place) => place !== preferred && place !== fallback)];
}

function fits(
  placement: AnchoredPlacement,
  triggerRect: DOMRect,
  surfaceRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  switch (placement) {
    case "top":
      return surfaceRect.height <= triggerRect.top;
    case "bottom":
      return surfaceRect.height <= viewportHeight - (triggerRect.top + triggerRect.height);
    case "left":
      return surfaceRect.width <= triggerRect.left;
    case "right":
      return surfaceRect.width <= viewportWidth - (triggerRect.left + triggerRect.width);
    default:
      return true;
  }
}
