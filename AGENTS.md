# Anno2070Rechner.de agent instructions

Change this file only when the user explicitly asks for it. Keep it to about one
screen: merge or remove rules instead of appending, and leave anything that a
tool, configuration or test can enforce to that tool.

## Collaboration

- The user is the sole developer; the assistant implements the agreed work.
  Preserve user changes and existing staging. Do not commit, push, tag or
  publish without explicit authorization.
- When the user is discussing a solution, investigate and explain before
  implementing. A discussion is not permission to start the work.
- Agreed decisions live in `docs/decisions.md` and open work in `docs/todo.md`.
  Follow them, keep them current when something changes, and do not repeat their
  content here. `docs/rebuild-plan.md` tracks the rebuild until it is complete.

## Private material

- Never commit images, raw game files, database dumps, user data or server
  credentials. Images never go into build output or release artifacts.
- Scripts that change servers are run by the user only.

## Code and checks

- Use pnpm, Vue Composition API with `<script setup lang="ts">`, kebab-case file
  names and relative imports.
- Preserve the shared `@simbo` configurations. Ask before changing ESLint or
  Prettier rules; parser and file coverage settings can be adjusted directly.
- Test everything where a test makes sense, above all calculations and
  application logic, so that important behavior cannot change unnoticed. Do not
  chase coverage numbers or mirror the implementation in tests.
- Verify with `pnpm check`, `pnpm test` and `pnpm build`, and report checks that
  were not run.
- Documentation, code comments and commit messages are in English. Document
  public functions and interfaces with valid JSDoc.
