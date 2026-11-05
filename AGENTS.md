# Anno2070Rechner.de agent instructions

## Collaboration and scope

- The user is the sole developer; the assistant implements the agreed work.
  Preserve user changes and existing staging. Do not commit, push, tag or
  publish without explicit authorization.
- When the user is discussing a solution, investigate and explain before
  implementing. A design discussion is not permission to start the work.
- `docs/rebuild-plan.md` records the agreed decisions. Update it when a decision
  changes and keep agreed-but-pending work distinguishable from what is
  implemented. Do not record proposals as decisions.
- Before implementation starts after a planning discussion, propose lasting
  lessons for this file or the documentation in the final scope summary, for
  review before the go-ahead. Say so when there are none. Do not add unreviewed
  lessons.
- Keep these instructions in this file, grouped by topic. No extra agent
  documents or skills without a concrete need and prior discussion.

## Rebuild rules

- Phase 1 must look and behave exactly like the live PHP site. Do not change
  design, texts, calculations or rounding beyond the deviations listed in the
  plan. Phase 2 changes are separate, traceable steps.
- Optimizations and modernization wait until parity with the old site is
  verified, even when they would not change the appearance.
- When behavior is unclear, check the old PHP and JavaScript code in the Git
  history and the live site while it still runs. Substantiate findings before
  presenting them as bugs.
- Keep the old URLs working as listed in the plan. The route table is the single
  source for the router, the generated pages and the navigation.

## Private material

- Never commit images, raw game files, database dumps, user data or server
  credentials. Images never go into build output or release artifacts.
- The Uberspace export outside the repository is private working material.
- Scripts that change servers are run by the user. Never run
  `scripts/uberspace-cleanup.sh --execute`.

## Code and checks

- Use pnpm, Vue Composition API with `<script setup lang="ts">`, kebab-case file
  names and relative imports.
- Preserve the shared `@simbo` configurations. Ask before changing ESLint or
  Prettier rules; parser and file coverage settings can be adjusted directly.
  Review new ignores and rule exceptions explicitly.
- Verify with `pnpm check`, `pnpm test` and `pnpm build`. Report checks that
  were not run.
- Tooling that is only needed to compare the rebuild with the live site stays
  outside the repository.

## Documentation

- Documentation, code comments and commit messages are in English.
- Document public functions and interfaces with valid JSDoc.
