import {
  resolveAnchoredPlacement,
  AnchoredPlacement,
  PreferredAnchoredPlacement,
} from "@core/placement";

export type TooltipPlacement = AnchoredPlacement;

export type PreferredPlacement = PreferredAnchoredPlacement;

export { resolveAnchoredPlacement as resolvePlacement };
