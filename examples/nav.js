// Shared navigation for examples
// Centralized list to avoid duplication across pages.
// Assumptions: All examples live in the same folder as this script.

/**
 * Example metadata used to build the navigation and index.
 * Keep titles short and descriptive for mobile.
 */
const EXAMPLES = [
  { file: "animate.html", title: "Animate" },
  { file: "announce.html", title: "Announce" },
  { file: "dialog.html", title: "Dialog" },
  { file: "focus.html", title: "Focus" },
  { file: "popover-basic.html", title: "Popover" },
  { file: "toggle-basic.html", title: "Toggle" },
  { file: "tooltip-basic.html", title: "Tooltip" }
];

/**
 * Renders a top navigation with links to all examples and a home link.
 * Adds aria-current to the active example and provides a Skip link.
 */
function renderExamplesNav() {
  const path = location.pathname;
  let current = path.split("/").pop() || "index.html";
  // Normalize clean-URLs (e.g., /examples/tooltip-basic → tooltip-basic.html)
  if (current && !current.includes(".")) current = `${current}.html`;

  // If we're not inside /examples/, generate absolute links to that folder
  const inExamples = path.includes("/examples/") || /\/examples$/.test(path);
  const base = inExamples ? "./" : "/examples/";
  const header = document.createElement("header");
  header.className = "site-nav";

  header.innerHTML = `
    <a class="skip-link" href="#main">Skip to content</a>
    <div class="site-nav__inner">
      <a class="brand" href="/">automagicA11y</a>
      <nav aria-label="Examples navigation">
        <ul class="site-nav__list">
          <li><a href="${base.replace(/\/$/, '')}" ${current === "index.html" ? 'aria-current="page"' : ''}>Examples</a></li>
          ${EXAMPLES.map(({ file, title }) => {
            const slug = file.replace(/\.html$/, '');
            const active = current === file ? ' aria-current="page"' : '';
            return `<li><a href="${base}${slug}"${active}>${title}</a></li>`;
          }).join("")}
        </ul>
      </nav>
    </div>
  `;

  // Prepend so it appears before main content
  const root = document.body;
  if (root.firstChild) {
    root.insertBefore(header, root.firstChild);
  } else {
    root.appendChild(header);
  }
}

document.addEventListener("DOMContentLoaded", renderExamplesNav);

// Expose list for index page generation if needed
window.__AUTOMAGIC_EXAMPLES__ = EXAMPLES;
