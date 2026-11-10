Rebuild plan: static frontend
===

Anno2070Rechner.de ran as a PHP application with a MySQL database. It is rebuilt
as a purely static frontend without any server-side code, which first replaces
the PHP version on Uberspace. This document records the steps of the rebuild and
its state; it is removed once the rebuild is complete. The decisions that stay
valid are in [decisions.md](decisions.md), open work beyond the rebuild in
[todo.md](todo.md).

**State:** phases 1 to 3, the release automation and the review round of
2026-11-10 are implemented and verified on the branch `static-rebuild` (see
[Verification](#verification)). What is left is listed in
[Next steps](#next-steps).

Release `v2.0.0`
---

- `v2.0.0` is the release with the rebuild and has exactly one changeset,
  `.changeset/static-rebuild.md`. Further changes before the release revise it
  instead of adding more, so it always describes the whole release as it stands.
- Phase 1 looked and behaved exactly like the live PHP version: same design,
  same texts, same calculations including their rounding. Fixes and
  modernization only followed once that was verified.
- The work happens on the branch `static-rebuild` and stays local. When the
  author is satisfied with it, it is merged into `main` locally as a
  fast-forward, so the history looks as if everything had happened on `main`,
  and `main` is pushed. The workflows then create `v2.0.0`, which is meant to be
  the final state of the rebuild.
- The workflows have never run before that push. If it fails, delete release and
  tag and repeat the step; if a workflow has to change, also force-push `main`
  back to before the release commit. The remaining repository settings (see
  [Release automation](decisions.md#release-automation)) are only activated once
  `v2.0.0` has succeeded, so this stays possible until then.

Phases
---

### Phase 1: exact rebuild

Same appearance and behavior as the live site, including the fixed 960 px
layout, with these deliberate differences:

- Login, registration and the account pages are removed.
- The "Under Development" ring in the logo is removed.
- Broken umlauts (for example "ErdÃ¶lraffinerie" in the database view) are
  fixed. They come from `utf8_encode` in the PHP code; the data itself is clean
  UTF-8.
- Navigation no longer reloads the whole page (see
  [Routing](decisions.md#routing)).
- Calculator inputs are saved in `localStorage` instead of a cookie. Inputs
  saved by the old site cannot be taken over, because its cookie is `httpOnly`.
- Facebook-only preview tags are replaced by general preview tags.
- The old analytics script is removed.

The target-TPM bug and the quirks listed in phase 2 are kept in this phase on
purpose.

### Phase 2: fixes and unfinished features

Each as a separate, traceable step:

1. **Target TPM with productivity.** When a commodity chain is requested for a
   number of buildings without an explicit target, the live site ignores the
   building's productivity. Example: 2 fisheries at 200 % show ×1 building and 4
   t/min instead of ×2 and 8 t/min. Fixed in commit `f78cae1`, which never ran
   live. Rounding errors are dropped before counting buildings.
2. **Saved chain settings** (`child_productivity` in `f78cae1`), see
   [Calculator](decisions.md#calculator). `f78cae1` only planned the
   productivities; the alternatives were added on purpose.
3. **Sync between chain slider and production field** (`f78cae1`), see
   [Calculator](decisions.md#calculator).
4. **Background images.** All seven backgrounds exist, but the live site only
   showed `eco1`. `f78cae1` renamed the matching CSS classes to `bg-eco2` and so
   on, which is taken over. The empty red area at the top right of the header
   gets a picture icon in the style of the old icons (`img/user-menu.png`), see
   [Appearance](decisions.md#appearance).
5. **Quirks of the old site.** The misspelled English title is corrected to
   "Commodity chains". The menu marks the info page with `current` like any
   other page instead of `info`. "Reset" also sets the hidden upgrade levels
   back to the maximum instead of only moving the sliders. Efficiencies outside
   1 to 100 % get the class of the nearest step (`red`, `green`) instead of
   `undefined`.
6. **Background fill for large windows**, see
   [Appearance](decisions.md#appearance).

### Phase 3: before `v2.0.0`

Agreed on 2026-11-08 after the calculator comparison. Each as a separate,
traceable step:

1. **Game data** from `patch8.rda`, see
   [Update to the final game data](game-data.md#update-to-the-final-game-data).
2. **Game version in the header**, see [Game data](decisions.md#game-data).
3. **Search engines:** `robots.txt` and `sitemap.xml`, see
   [Routing](decisions.md#routing).
4. **Population boxes**, see [Calculator](decisions.md#calculator).
5. **Reset** asks for confirmation, see [Calculator](decisions.md#calculator).
6. **Shareable pages**, see
   [Shareable pages and history](decisions.md#shareable-pages-and-history).
7. **History**, see the same section.
8. **Saved games**, see [Saved games](decisions.md#saved-games).
9. **Review round** of 2026-11-10 with the author: header tab, typography, info
   page, imprint and privacy notice, save menu, game ids, background formats,
   images from the live site and visitor statistics, see
   [decisions.md](decisions.md). The labels of the search forms got 10 px more
   room for the larger font.

After phase 3, the raw material need below 100 % was changed as well (see
[Calculator](decisions.md#calculator)); the old site, like most other
calculators, did not tell it apart.

Move to Uberspace
---

- `v2.0.0` replaces the PHP version in the existing web folder on Uberspace,
  uploaded by hand from the release ZIP and the image ZIP, following
  [hosting.md](hosting.md).
- The `.htaccess` was tested on 2026-11-10 in a temporary folder for
  `simbo.uber.space`: all routes, redirects, 404 pages per language, caching and
  compression behaved as intended. The existing redirect of
  `www.anno2070rechner.de` drops the path and uses `http`; the guide replaces
  it.
- **Cleanup:** once the static site is live, `scripts/uberspace-cleanup.sh`
  removes the old database from Uberspace, after checking that the server serves
  `v2.0.0` or later.

Verification
---

- Everything where a test makes sense is tested in this repository, above all
  the calculations and the application logic. Selected outputs recorded from the
  live site serve as expected values.
- The output of the live PHP site was recorded as a reference (November 2026),
  and the rebuild matches it exactly:
  - all 726 recorded commodity chains (every production building, with counts,
    targets, productivities and preferred alternatives, in both languages)
  - 24 population calculator scenarios in both languages
  - 31 database views and 26 search suggestion requests, apart from the fixed
    umlauts
- Screenshot comparisons between the live site and the rebuild cover 26 views
  and interactions (pages, chains, alternatives, productivity sliders, select
  menus, search suggestions, reset). They are pixel-identical, apart from the
  fixed umlauts.
- The reference data and the comparison tooling are only needed for the rebuild
  and are kept outside this repository.
- The screenshot comparison was repeated at the end of phase 3, hiding the
  header icons and the game version and using the old background. What still
  differs in the visible area are the fixed umlauts, the final game data, the
  marked info page and the reset confirmation.
- Old browsers: a real Firefox 52 ESR does not start on the author's current
  macOS ("Minimum OS version requirement not met"), so no real old browser was
  tested. Instead, a current browser ran both bundles with all newer APIs
  removed, through the population calculator, the database and chains, without
  errors. The syntax of the legacy bundle was checked to be ES2015. Differences
  in browser engines themselves are not covered.
- Phase 2 changes results deliberately. 176 of the 726 recorded chains differ
  from the live site, exactly those requesting a count without a target for a
  building whose productivity is not 100 %. 16 population scenarios differ only
  by the class `red` instead of `undefined`, which is hidden on buildings
  without demand. All others still match.
- Phase 3 changes results deliberately through the final game data. Against the
  recorded references, 174 more cases differ: 152 chains, all of which contain a
  changed building, 8 population scenarios and 14 database views.
- The author reviewed phase 3 on 2026-11-10 and accepted saved games, export and
  import, the shareable URLs, the population boxes, the save menu and the
  release workflows. The simulation of old browsers is accepted as evidence; a
  real old browser is not needed.
- Review round: with three icons, the header tab matches the original header
  within 1 of 255 per color channel. All pages were compared at 13 and 14 px for
  new line breaks and overflows; only the search form labels needed more room.
  The format check loads exactly one background version. Downloading images from
  the current live site stops with the ZIP instructions, as intended.
- The raw material need below 100 % changes results deliberately (2026-11-10): a
  production building with raw materials below 100 % no longer raises the need
  of the buildings supplying it. The recorded references were not compared
  again; a unit test covers the new behavior.

## Next steps

1. **Public credentials, done by the author (2026-11-10):** `conf/mysql.ini`
   with the database name, user and password, and the private reCAPTCHA key in
   `conf/site.ini` were in the public Git history since `0723dc1` (1 January
   2012), which is part of `origin/main` and three forks. They have been made
   useless on the servers. Rewriting the history would not help with forks and
   copies and would break the fast-forward, so it stays as it is.
2. **Before `v2.0.0`, done by the author (2026-11-10):** the new
   `anno2070rechner-images.zip` is reviewed and stored in the cloud, together
   with a backup of the export folder (database, web folder, export details and
   original images).
3. **`v2.0.0`**, when the author decides: the secrets and the GitHub App are set
   up (2026-11-10); merge `static-rebuild` into `main` locally as a fast-forward
   and push `main`. After a successful release, activate the remaining
   repository settings and close issue #2 (broken umlauts).
4. **Hosting on Uberspace**, by the author, following [hosting.md](hosting.md):
   upload the release and the images, add the `.htaccess`, fix the `www.`
   redirect, then run `scripts/uberspace-cleanup.sh`.
5. **Closing the rebuild:** once the static site runs on Uberspace, this plan is
   removed; it stays in the Git history. The working material below is then no
   longer needed, apart from the backup.

Working material outside the repository:

- `~/projects/private/Anno2070Rechner-export`: the Uberspace export (code,
  images, database dump), the current image ZIP and the original header
  `bg-header.original.png`; private. `anno2070rechner-images.2026-11-08.zip` is
  the previous ZIP; its PNGs are losslessly optimized versions of the same
  images. `game-files-latest` there holds the unpacked files of game version
  3.0.8051. `anno2070rechner-backup-2026-11-10.zip` is the backup stored in the
  cloud.
- `~/projects/private/Anno2070Rechner-verify`: recorded live reference data and
  the comparison tooling (`capture.py`, `live-capture.mjs`, `compare.mjs`,
  parity tests run with
  `pnpm exec vitest run --config ../Anno2070Rechner-verify/vitest.config.ts`
  from the repository). `calculator-comparison` there holds the raw results and
  scripts of the comparison with other calculators. Throwaway once the rebuild
  is released.
- `img/` in the repository is a local link to the exported images (ignored by
  Git), which also holds the images added since. `user-menu.png` there also
  holds the picture icon of the background menu, and `save-menu.png` holds the
  icons of the save menu. The old `user-menu.png` is kept in the export folder
  as `user-menu.original.png`.
