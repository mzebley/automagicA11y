import { resolveAnchoredPlacement } from "../../core/placement";
import type { AnchoredPlacement, PreferredAnchoredPlacement } from "../../core/placement";

export type TooltipPlacement = AnchoredPlacement;

export type PreferredPlacement = PreferredAnchoredPlacement;

export { resolveAnchoredPlacement as resolvePlacement };
