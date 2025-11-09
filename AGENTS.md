```yaml

code_editing_rules:
  - "Everything should be modular and reusable. Avoid repeating code or data across files."
  - "If a dataset (e.g., list of stateKeywords) is used in multiple places, define it in a single core file and import it where needed."
  - "Avoid the 'any' type. When inference is insufficient, use narrow utility types like Pick, Partial, or Record before defining new interfaces."
  - "Provide inline documentation for each exported function so new contributors can understand intent and flow."
  - "Follow the event naming convention 'automagica11y:<pattern>:<action>' to simplify debugging and ensure consistency."
  - "Prefer clear, atomic commits and thorough PR descriptions for auditability."
  - "All documentation updates must be reflected in three places: inline code comments, README files, and the Astro site within the /docs folder at the project root. The Astro site serves as the canonical documentation source."
  - "Examples for every new or updated feature must be built and maintained exclusively within the Astro /docs folder. Inline or README snippets are allowed for quick reference, but full working examples should live in the site."

guiding_principles:
  - "Maximize accessibility with minimal developer friction. Automate ARIA and role defaults whenever possible."
  - "Default to declarative data-attribute setup, but support imperative configuration via the API."
  - "Embrace progressive enhancement: start from minimal accessible baselines (no JS, reduced motion) and enhance upward."
  - "Maintain the 'meet developers where they are' philosophy—allow flexibility in naming and truthiness mapping so developers aren’t locked into rigid conventions."
  - "Ease of use for library consumers is equally important to end-user accessibility."

testing_philosophy:
  - "All relevant files must include both unit and behavioral tests."
  - "Each pattern or plugin should include a test for the happy path and at least one accessibility fallback (e.g., reduced motion)."
  - "Prefer behavioral assertions over DOM snapshots."
  - "Integration tests should verify ARIA synchronization, hidden states, and visual transition timing."

self_reflection:
  - "Before contributing new functionality, define a rubric with 5–7 categories to evaluate completeness, clarity, and accessibility impact."
  - "Think through what makes a world-class, one-shot web library and use that rubric internally before merging code."
  - "Contributors should iterate until the feature meets top marks across all categories, then document reasoning inline."

persistence:
  - "Agents should make reasonable, semantically appropriate assumptions when ambiguity arises."
  - "Document all assumptions clearly in code comments or commit messages."
  - "Avoid decision paralysis — clarity and progress are better than indefinite deliberation."
```

# AutomagicA11y Agent Guidelines

This document defines the behavioral, architectural, and decision-making rules for all AutomagicA11y code-generation, testing, and documentation agents.

Agents should follow the structured YAML block above for machine parsing and reference the sections below for human-readable context.

---

## Code Editing Rules

All new code and refactors must prioritize reusability and clarity. Avoid repetition and redundant definitions. Shared data (like truthiness mappings or token sets) belongs in core utility modules, not scattered through patterns or plugins.

Type safety is mandatory—avoid `any` and prefer utility types (`Pick`, `Partial`, `Record`) when inference fails. Write inline documentation so any contributor can understand the file without external context.

Use standardized event names (`automagica11y:<pattern>:<action>`) for consistent debugging, and ensure PR descriptions communicate intent and scope.

All documentation and examples should be synchronized with the Astro documentation site under `/docs`. This site acts as the single source of truth for both contributor and consumer-facing documentation. Each new or modified feature must include a working example there.  
Inline and README documentation remain necessary for context, but contributors should prioritize the Astro site for discoverability and cohesion.

---

## Guiding Principles

AutomagicA11y’s goal is to deliver maximum accessibility with minimum developer effort.  
All patterns should function out-of-the-box with data attributes alone, requiring zero additional setup for basic use.  
When developers want finer control, APIs and plugin hooks should be ready and intuitive.

Accessibility and developer experience carry equal weight. Always favor progressive enhancement—don’t remove or override browser-native accessibility affordances.

Maintain the philosophy of “meet developers where they are” by allowing flexible naming and truthiness mappings so developers aren’t locked into rigid conventions.

---

## Testing Philosophy

Each pattern and plugin must be covered by:

- **Unit tests** to validate behavior in isolation.  
- **Integration tests** to verify ARIA state, hidden logic, and transition timing.  
- **Fallback tests** to confirm reduced-motion and no-JS states behave safely.

Prefer testing outcomes (behavioral assertions) over implementation details or DOM snapshots.

---

## Self Reflection

Contributors should define a private rubric to self-evaluate the completeness, accessibility, and maintainability of their work.  
This ensures each addition moves the library toward being a “world-class, one-shot accessibility toolkit.”

The rubric typically includes 5–7 categories focused on clarity, modularity, accessibility impact, documentation, and test coverage.

Contributors should iterate until the feature meets top marks across all categories, then document reasoning inline for future maintainers.

---

## Persistence / Assumptions

Agents and maintainers must proceed decisively when ambiguity arises.  
If a decision isn’t clear-cut:  

- Choose the most semantically correct assumption.  
- Document the reasoning inline in code comments or commit messages.  
- Move forward confidently, trusting iteration over indecision.
```
