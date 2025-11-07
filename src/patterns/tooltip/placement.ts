const OPPOSITE: Record<TooltipPlacement, TooltipPlacement> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

const DEFAULT_ORDER: TooltipPlacement[] = ["bottom", "top", "right", "left"];

export type TooltipPlacement = "top" | "bottom" | "left" | "right";

export type PreferredPlacement = TooltipPlacement | "auto";

interface MeasureConfig {
  viewportWidth(): number;
  viewportHeight(): number;
}

const DEFAULT_MEASURE: MeasureConfig = {
  viewportWidth: () => window.innerWidth || document.documentElement.clientWidth,
  viewportHeight: () => window.innerHeight || document.documentElement.clientHeight,
};

/**
 * Compute the best placement for the tooltip target based on viewport space.
 * Respects the requested `preferred` placement, but flips to the opposite
 * direction whenever the tooltip would overflow the viewport.
 */
export function resolvePlacement(
  trigger: HTMLElement,
  tooltip: HTMLElement,
  preferred: PreferredPlacement,
  measure: MeasureConfig = DEFAULT_MEASURE,
): TooltipPlacement {
  const trigRect = trigger.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  const viewportWidth = measure.viewportWidth();
  const viewportHeight = measure.viewportHeight();

  const order = buildOrder(preferred);

  for (const placement of order) {
    if (fits(placement, trigRect, tooltipRect, viewportWidth, viewportHeight)) {
      return placement;
    }
  }

  return order[0];
}

function buildOrder(preferred: PreferredPlacement): TooltipPlacement[] {
  if (preferred === "auto") {
    return [...DEFAULT_ORDER];
  }

  const fallback = OPPOSITE[preferred];
  return [preferred, fallback, ...DEFAULT_ORDER.filter((place) => place !== preferred && place !== fallback)];
}

function fits(
  placement: TooltipPlacement,
  trigRect: DOMRect,
  tooltipRect: DOMRect,
  viewportWidth: number,
  viewportHeight: number,
): boolean {
  switch (placement) {
    case "top":
      return tooltipRect.height <= trigRect.top;
    case "bottom":
      return tooltipRect.height <= viewportHeight - (trigRect.top + trigRect.height);
    case "left":
      return tooltipRect.width <= trigRect.left;
    case "right":
      return tooltipRect.width <= viewportWidth - (trigRect.left + trigRect.width);
    default:
      return true;
  }
}

