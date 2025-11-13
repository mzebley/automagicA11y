/**
 * Determine if the current environment exposes at least one fine pointer device
 * (e.g., mouse or precision trackpad). Falls back to `false` when matchMedia is
 * unavailable so that coarse-pointer experiences remain touch friendly in SSR.
 */
export function hasFinePointer(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  try {
    return window.matchMedia("(any-pointer: fine)").matches;
  } catch {
    return false;
  }
}
