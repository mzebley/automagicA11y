# Contributing to automagicA11y

Thank you for helping improve automagicA11y! This guide explains how to contribute new patterns, fix bugs, or propose enhancements.

---

## Setup

```bash
npm install
npm run build
npm test
```

---

## Code Style

- TypeScript strict mode enabled
- No implicit any or unused variables
- Prettier and ESLint are recommended for formatting

---

## Adding a New Pattern

1. Create a folder under `src/patterns/`.
2. Write your pattern logic in `pattern.ts`.
3. Register it in `src/patterns/index.ts` via `registerPattern()`.
4. Use helpers from `src/core/` whenever possible.
5. Add a demo file in `examples/`.
6. Add tests in `tests/`.
7. Update documentation if needed.

---

## Pull Requests

- Use clear PR titles (e.g., `feat(toggle): add hash persistence plugin`).
- Link issues when applicable.
- Make small, focused commits.

---

## Pattern Checklist

- [ ] Registers via `registerPattern()`
- [ ] Emits lifecycle events
- [ ] Uses truthiness mapping
- [ ] Has example and test coverage
- [ ] Passes build + lint
