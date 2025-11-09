import { getDataAttribute } from "@core/attributes";
import { enableFocusTrap, readFocusTrapOptionsFromAttributes } from "@core/focus-trap";

interface TrapHandle {
  release: (() => void) | null;
  autoObserver: MutationObserver | null;
  removalObserver: MutationObserver | null;
  destroy: () => void;
  auto: boolean;
}

const initialized = new WeakSet<HTMLElement>();

function isContainerVisible(container: HTMLElement) {
  if (!container.isConnected) return false;
  if (container.hasAttribute("hidden")) return false;
  if (container.getAttribute("aria-hidden") === "true") return false;
  if (container.hasAttribute("disabled")) return false;
  if (typeof container.closest === "function" && container.closest("[inert]")) return false;
  return true;
}

function detailTargetsMatches(container: HTMLElement, detail: unknown) {
  if (!detail || typeof detail !== "object") return false;
  const candidate = detail as { target?: HTMLElement; targets?: HTMLElement[] | NodeListOf<HTMLElement> };
  if (candidate.target && candidate.target === container) return true;
  if (Array.isArray(candidate.targets) && candidate.targets.includes(container)) return true;
  if (candidate.targets instanceof NodeList) {
    return Array.from(candidate.targets).includes(container);
  }
  return false;
}

function enable(container: HTMLElement, handle: TrapHandle, options = readFocusTrapOptionsFromAttributes(container)) {
  if (handle.release) return;
  handle.release = enableFocusTrap(container, {
    initial: options.initial,
    returnFocus: options.returnFocus,
    escapeDismiss: options.escapeDismiss,
  });
}

function disable(handle: TrapHandle) {
  if (!handle.release) return;
  const release = handle.release;
  handle.release = null;
  release();
}

function ensureAutoObserver(container: HTMLElement, handle: TrapHandle) {
  if (!handle.auto || handle.autoObserver || typeof MutationObserver === "undefined") return;
  const observer = new MutationObserver(() => {
    if (isContainerVisible(container)) {
      enable(container, handle);
    } else {
      disable(handle);
    }
  });
  observer.observe(container, {
    attributes: true,
    attributeFilter: ["hidden", "aria-hidden", "style", "class", "disabled"],
  });
  handle.autoObserver = observer;
}

function ensureRemovalObserver(container: HTMLElement, handle: TrapHandle) {
  if (handle.removalObserver || typeof MutationObserver === "undefined") return;
  const root = container.ownerDocument?.body;
  if (!root) return;
  const observer = new MutationObserver(() => {
    if (!container.isConnected) {
      disable(handle);
      handle.destroy();
    }
  });
  observer.observe(root, { childList: true, subtree: true });
  handle.removalObserver = observer;
}

function setupAuto(container: HTMLElement, handle: TrapHandle) {
  if (!handle.auto) return;
  ensureAutoObserver(container, handle);
  if (isContainerVisible(container)) {
    enable(container, handle);
  }
}

function teardown(handle: TrapHandle) {
  disable(handle);
  handle.autoObserver?.disconnect();
  handle.removalObserver?.disconnect();
  handle.autoObserver = null;
  handle.removalObserver = null;
}

function createHandle(container: HTMLElement, auto: boolean): TrapHandle {
  const doc = container.ownerDocument ?? document;
  const handle: TrapHandle = {
    release: null,
    autoObserver: null,
    removalObserver: null,
    auto,
    destroy() {
      teardown(handle);
      doc.removeEventListener("automagica11y:toggle", onToggle, true);
      doc.removeEventListener("automagica11y:toggle:opened", onToggle, true);
      doc.removeEventListener("automagica11y:toggle:closed", onToggle, true);
      doc.removeEventListener("automagica11y:shown", onShown, true);
      doc.removeEventListener("automagica11y:hidden", onHidden, true);
    },
  };

  const onToggle = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    if (!detailTargetsMatches(container, event.detail)) return;
    if (event.type === "automagica11y:toggle") {
      const expanded = Boolean((event.detail as { expanded?: boolean }).expanded);
      if (expanded) enable(container, handle);
      else disable(handle);
      return;
    }
    if (event.type.endsWith(":opened")) {
      enable(container, handle);
    } else if (event.type.endsWith(":closed")) {
      disable(handle);
    }
  };

  const onShown = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    if (!detailTargetsMatches(container, event.detail)) return;
    enable(container, handle);
  };

  const onHidden = (event: Event) => {
    if (!(event instanceof CustomEvent)) return;
    if (!detailTargetsMatches(container, event.detail)) return;
    disable(handle);
  };

  doc.addEventListener("automagica11y:toggle", onToggle, true);
  doc.addEventListener("automagica11y:toggle:opened", onToggle, true);
  doc.addEventListener("automagica11y:toggle:closed", onToggle, true);
  doc.addEventListener("automagica11y:shown", onShown, true);
  doc.addEventListener("automagica11y:hidden", onHidden, true);

  ensureRemovalObserver(container, handle);

  return handle;
}

export function initFocusTrap(node: Element) {
  if (!(node instanceof HTMLElement)) return;
  if (initialized.has(node)) return;
  initialized.add(node);

  const attr = getDataAttribute(node, "focus-trap");
  if (attr === null) return;
  const options = readFocusTrapOptionsFromAttributes(node);
  const auto = options.auto !== false;
  const handle = createHandle(node, auto);

  setupAuto(node, handle);
}
