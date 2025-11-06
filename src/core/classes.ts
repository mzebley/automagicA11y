// Truthiness mapping and class toggling

const truthy = new Set(["open","expanded","shown","active","pressed","true","on"]);
const falsy  = new Set(["closed","collapsed","hidden","inactive","unpressed","false","off"]);

const sides = ["trigger", "target"] as const;
type Side = typeof sides[number];

const stateKeywords = [
  "open",
  "closed",
  "expanded",
  "collapsed",
  "shown",
  "hidden",
  "active",
  "inactive",
  "pressed",
  "unpressed",
  "true",
  "false",
  "on",
  "off"
] as const;
type StateKeyword = typeof stateKeywords[number];

export interface A11yClassConfig {
  trigger: { true: string[]; false: string[] };
  target:  { true: string[]; false: string[] };
}

function parseClassList(val: string | null): string[] {
  if (!val) return [];
  if (val.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {
      // fall through to whitespace parsing
    }
  }
  return val.trim().split(/\s+/).filter(Boolean);
}

export function getClassConfig(el: HTMLElement): A11yClassConfig {
  const cfg: A11yClassConfig = { trigger: { true: [], false: [] }, target: { true: [], false: [] } };
  sides.forEach((side: Side) => {
    stateKeywords.forEach((state: StateKeyword) => {
      const attr = el.getAttribute(`data-automagica11y-${side}-class-${state}`);
      if (!attr) return;
      const list = parseClassList(attr);
      if (truthy.has(state)) cfg[side].true.push(...list);
      else if (falsy.has(state)) cfg[side].false.push(...list);
    });
  });
  // defaults on trigger if nothing provided
  if (!cfg.trigger.true.length && !cfg.trigger.false.length) {
    cfg.trigger.true = ["automagic-toggle-open"];
    cfg.trigger.false = ["automagic-toggle-closed"];
  }
  return cfg;
}

export function applyClasses(cfg: A11yClassConfig, expanded: boolean, trigger: HTMLElement, target?: HTMLElement) {
  const addT = expanded ? cfg.trigger.true : cfg.trigger.false;
  const remT = expanded ? cfg.trigger.false : cfg.trigger.true;
  if (remT.length) trigger.classList.remove(...remT);
  if (addT.length) trigger.classList.add(...addT);

  if (target) {
    const add = expanded ? cfg.target.true : cfg.target.false;
    const rem = expanded ? cfg.target.false : cfg.target.true;
    if (rem.length) target.classList.remove(...rem);
    if (add.length) target.classList.add(...add);
  }
}
