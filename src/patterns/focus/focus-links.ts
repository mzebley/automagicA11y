import { focusElement, getFocusableIn, isFocusable } from "../../core/focus";

const FOCUS_NEXT_ATTR = "data-automagica11y-focus-next";
const FOCUS_PREV_ATTR = "data-automagica11y-focus-prev";
const FOCUS_SCOPE_ATTR = "data-automagica11y-focus-scope";
const FOCUS_LOOP_ATTR = "data-automagica11y-focus-loop";
const LINK_SELECTOR = `[${FOCUS_NEXT_ATTR}], [${FOCUS_PREV_ATTR}]`;

type FocusGraphKey = ParentNode | HTMLElement;

interface FocusEdge {
  selector: string;
  scope: ParentNode | Element;
  target: HTMLElement | null;
}

interface FocusLinkNode {
  element: HTMLElement;
  next?: FocusEdge;
  prev?: FocusEdge;
  inboundNext: Set<HTMLElement>;
  inboundPrev: Set<HTMLElement>;
}

interface FocusContainerGraph {
  nodes: Map<HTMLElement, FocusLinkNode>;
}

interface FocusRootState {
  containers: Map<FocusGraphKey, FocusContainerGraph>;
  observer: MutationObserver | null;
  dirty: boolean;
}

const initializedRoots = new WeakSet<ParentNode>();
const rootStates = new WeakMap<ParentNode, FocusRootState>();

/**
 * Hydrate delegated keyboard handling for per-element focus links.
 *
 * The handler inspects `data-automagica11y-focus-next` / `-focus-prev` attributes,
 * builds an adjacency graph per root/container, and routes `Tab` /
 * `Shift+Tab` events according to the author-defined links while skipping
 * hidden, disabled, or inert targets. Call once per root (document or
 * shadow root) to opt into declarative linking.
 */
export function initFocusLinks(root: ParentNode = document) {
  if (initializedRoots.has(root)) return;
  if (!("addEventListener" in root)) return;

  initializedRoots.add(root);
  ensureRootState(root);

  root.addEventListener(
    "keydown",
    (event) => {
      if (!(event instanceof KeyboardEvent)) return;
      if (event.key !== "Tab") return;
      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const eventRoot = target.getRootNode() as ParentNode;
      if (eventRoot !== root) return;

      let state = ensureRootState(root);
      let node = getNodeForElement(target, state, root);

      if (!node && hasFocusLinkAttribute(target)) {
        state.dirty = true;
        state = ensureRootState(root);
        node = getNodeForElement(target, state, root);
      }

      if (!node) {
        return;
      }

      const direction = event.shiftKey ? "prev" : "next";
      const candidate = direction === "next"
        ? findForwardTarget(node, state, root)
        : findBackwardTarget(node, state, root);

      if (!candidate) return;

      event.preventDefault();
      focusElement(candidate);
    },
    true
  );
}

/** Resolve an author-supplied selector within a scope to an element. */
export function resolveFocusTarget(
  fromElement: HTMLElement,
  selector: string,
  scope: ParentNode | Element
): HTMLElement | null {
  const trimmed = selector.trim();
  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed === "self") {
    return fromElement;
  }

  const context = scope;

  if (isDocument(context) && trimmed.startsWith("#")) {
    const byId = context.getElementById(trimmed.slice(1));
    if (byId instanceof HTMLElement) {
      return byId;
    }
  }

  if (hasQuerySelector(context)) {
    try {
      return context.querySelector<HTMLElement>(trimmed);
    } catch {
      return null;
    }
  }

  return null;
}

function ensureRootState(root: ParentNode): FocusRootState {
  let state = rootStates.get(root);
  if (!state) {
    state = {
      containers: new Map(),
      observer: createObserver(root),
      dirty: true
    };
    rootStates.set(root, state);
  }

  const pending = state.observer?.takeRecords();
  if (pending && pending.length > 0) {
    state.dirty = true;
  }

  if (state.dirty) {
    state.containers = buildFocusGraph(root);
    state.dirty = false;
  }

  return state;
}

function createObserver(root: ParentNode): MutationObserver | null {
  if (typeof MutationObserver === "undefined") {
    return null;
  }

  if (!(root instanceof Node)) {
    return null;
  }

  const observer = new MutationObserver(() => {
    const state = rootStates.get(root);
    if (state) {
      state.dirty = true;
    }
  });

  observer.observe(root, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: [FOCUS_NEXT_ATTR, FOCUS_PREV_ATTR, FOCUS_SCOPE_ATTR, FOCUS_LOOP_ATTR]
  });

  return observer;
}

function buildFocusGraph(root: ParentNode): Map<FocusGraphKey, FocusContainerGraph> {
  const containers = new Map<FocusGraphKey, FocusContainerGraph>();

  for (const element of collectLinkedElements(root)) {
    const containerKey = getContainerKey(element, root);
    const container = ensureContainerGraph(containers, containerKey);
    const node = ensureNode(container, element);
    const scope = resolveScope(element, root);

    const nextAttr = element.getAttribute(FOCUS_NEXT_ATTR);
    if (nextAttr) {
      node.next = createEdge(element, nextAttr, scope, root, containers, "next");
    }

    const prevAttr = element.getAttribute(FOCUS_PREV_ATTR);
    if (prevAttr) {
      node.prev = createEdge(element, prevAttr, scope, root, containers, "prev");
    }
  }

  return containers;
}

function collectLinkedElements(root: ParentNode): HTMLElement[] {
  const elements: HTMLElement[] = [];

  if (root instanceof HTMLElement && hasFocusLinkAttribute(root)) {
    elements.push(root);
  }

  if (hasQuerySelector(root)) {
    root.querySelectorAll<HTMLElement>(LINK_SELECTOR).forEach((el) => {
      elements.push(el);
    });
  }

  return elements;
}

function hasFocusLinkAttribute(element: Element): element is HTMLElement {
  return (
    element instanceof HTMLElement &&
    (element.hasAttribute(FOCUS_NEXT_ATTR) || element.hasAttribute(FOCUS_PREV_ATTR))
  );
}

function ensureContainerGraph(
  containers: Map<FocusGraphKey, FocusContainerGraph>,
  key: FocusGraphKey
): FocusContainerGraph {
  let container = containers.get(key);
  if (!container) {
    container = { nodes: new Map() };
    containers.set(key, container);
  }
  return container;
}

function ensureNode(container: FocusContainerGraph, element: HTMLElement): FocusLinkNode {
  let node = container.nodes.get(element);
  if (!node) {
    node = {
      element,
      inboundNext: new Set(),
      inboundPrev: new Set()
    };
    container.nodes.set(element, node);
  }
  return node;
}

function createEdge(
  element: HTMLElement,
  selector: string,
  scope: ParentNode | Element,
  root: ParentNode,
  containers: Map<FocusGraphKey, FocusContainerGraph>,
  direction: "next" | "prev"
): FocusEdge {
  const trimmed = selector.trim();
  const target = resolveFocusTarget(element, trimmed, scope);

  if (target) {
    const targetNode = ensureNodeForElement(target, root, containers);
    if (direction === "next") {
      targetNode.inboundNext.add(element);
    } else {
      targetNode.inboundPrev.add(element);
    }
  }

  return {
    selector: trimmed,
    scope,
    target: target ?? null
  };
}

function ensureNodeForElement(
  element: HTMLElement,
  root: ParentNode,
  containers: Map<FocusGraphKey, FocusContainerGraph>
): FocusLinkNode {
  const key = getContainerKey(element, root);
  const container = ensureContainerGraph(containers, key);
  return ensureNode(container, element);
}

function getContainerKey(element: HTMLElement, root: ParentNode): FocusGraphKey {
  const loop = element.closest<HTMLElement>(`[${FOCUS_LOOP_ATTR}]`);
  if (loop) {
    return loop;
  }
  return root;
}

function resolveScope(element: HTMLElement, root: ParentNode): ParentNode | Element {
  let cursor: HTMLElement | null = element;
  while (cursor) {
    if (cursor.hasAttribute(FOCUS_SCOPE_ATTR)) {
      const raw = cursor.getAttribute(FOCUS_SCOPE_ATTR);
      const resolved = interpretScopeValue(raw, cursor, root);
      if (resolved) {
        return resolved;
      }
    }
    cursor = cursor.parentElement;
  }
  return root;
}

function interpretScopeValue(
  value: string | null,
  owner: HTMLElement,
  root: ParentNode
): ParentNode | Element | null {
  if (value === null) return null;
  const trimmed = value.trim();
  if (trimmed.length === 0) return null;
  if (trimmed === "self") return owner;
  if (trimmed === "document" || trimmed === "root") return root;

  if (trimmed.startsWith("#") && isDocument(root)) {
    const byId = root.getElementById(trimmed.slice(1));
    if (byId instanceof HTMLElement) {
      return byId;
    }
  }

  if (hasQuerySelector(root)) {
    try {
      const scoped = root.querySelector<HTMLElement>(trimmed);
      if (scoped) {
        return scoped;
      }
    } catch {
      return null;
    }
  }

  return null;
}

function getNodeForElement(
  element: HTMLElement,
  state: FocusRootState,
  root: ParentNode
): FocusLinkNode | undefined {
  const key = getContainerKey(element, root);
  const container = state.containers.get(key);
  return container?.nodes.get(element);
}

function findForwardTarget(
  node: FocusLinkNode,
  state: FocusRootState,
  root: ParentNode,
  visited: Set<HTMLElement> = new Set()
): HTMLElement | null {
  if (visited.has(node.element)) {
    return null;
  }
  visited.add(node.element);

  const direct = followEdge(node, state, root, "next", visited);
  if (direct) {
    return direct;
  }

  for (const candidate of node.inboundPrev) {
    if (visited.has(candidate)) continue;
    const candidateNode = getNodeForElement(candidate, state, root);
    if (!candidateNode) continue;
    const focusable = getFocusableCandidate(candidate);
    if (focusable) {
      return focusable;
    }
    const fallback = findForwardTarget(candidateNode, state, root, visited);
    if (fallback) {
      return fallback;
    }
  }

  return null;
}

function findBackwardTarget(
  node: FocusLinkNode,
  state: FocusRootState,
  root: ParentNode,
  visited: Set<HTMLElement> = new Set()
): HTMLElement | null {
  if (visited.has(node.element)) {
    return null;
  }
  visited.add(node.element);

  const direct = followEdge(node, state, root, "prev", visited);
  if (direct) {
    return direct;
  }

  for (const candidate of node.inboundNext) {
    if (visited.has(candidate)) continue;
    const candidateNode = getNodeForElement(candidate, state, root);
    if (!candidateNode) continue;
    const focusable = getFocusableCandidate(candidate);
    if (focusable) {
      return focusable;
    }
    const fallback = findBackwardTarget(candidateNode, state, root, visited);
    if (fallback) {
      return fallback;
    }
  }

  return null;
}

function followEdge(
  node: FocusLinkNode,
  state: FocusRootState,
  root: ParentNode,
  direction: "next" | "prev",
  visited: Set<HTMLElement>
): HTMLElement | null {
  let current: FocusLinkNode | null = node;

  while (current) {
    const edge = direction === "next" ? current.next : current.prev;
    if (!edge) {
      return null;
    }

    const target = getEdgeTarget(edge, current.element);
    if (!target || visited.has(target)) {
      return null;
    }
    visited.add(target);

    const focusable = getFocusableCandidate(target);
    if (focusable) {
      return focusable;
    }

    const nextNode = getNodeForElement(target, state, root);
    if (!nextNode) {
      return null;
    }

    current = nextNode;
  }

  return null;
}

function getEdgeTarget(edge: FocusEdge, source: HTMLElement): HTMLElement | null {
  if (edge.target && edge.target.isConnected) {
    return edge.target;
  }
  const refreshed = resolveFocusTarget(source, edge.selector, edge.scope);
  edge.target = refreshed;
  return refreshed;
}

function getFocusableCandidate(target: HTMLElement): HTMLElement | null {
  if (!target.isConnected) {
    return null;
  }

  if (target.closest("[inert]")) {
    return null;
  }

  if (isFocusable(target)) {
    return target;
  }

  const focusables = getFocusableIn(target);
  for (const candidate of focusables) {
    if (candidate.closest("[inert]")) {
      continue;
    }
    if (isFocusable(candidate)) {
      return candidate;
    }
  }

  return null;
}

function hasQuerySelector(node: ParentNode | Element): node is ParentNode & {
  querySelector<K extends keyof HTMLElementTagNameMap>(
    selectors: string
  ): HTMLElementTagNameMap[K] | null;
  querySelector<E extends Element = Element>(selectors: string): E | null;
} {
  return typeof (node as Document).querySelector === "function";
}

function isDocument(node: ParentNode | Element): node is Document {
  return typeof (node as Document).getElementById === "function";
}
