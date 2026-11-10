Rebuild plan: static frontend
===

Anno2070Rechner.de currently runs as a PHP application with a MySQL database. It
is rebuilt as a purely static frontend without any server-side code. The static
site first replaces the PHP version on Uberspace and moves to SRVKIST later.
This document records the agreed plan and its state.

**State:** phases 1 to 3, the release automation and the review round of
2026-11-10 are implemented and verified on the branch `static-rebuild` (see
[Verification](#verification)). What `v2.0.0` still waits for is listed in
[Next steps](#next-steps).

Goals
---

- Keep the site online without a server-side application to maintain.
- Phase 1 looks and behaves exactly like the live PHP version: same design, same
  texts, same calculations including their rounding.
- Under the hood, use a current frontend setup consistent with the author's
  other projects.
- Optimizations, layout changes and modernization (for example a responsive
  layout, modern image and font formats, optimized icons) only follow once the
  rebuild is verified to work exactly like the old site.

Release and license
---

- Versioning with Changesets, as in the author's other projects. The release
  with the rebuild is `v2.0.0`.
- `v2.0.0` has exactly one changeset, `.changeset/static-rebuild.md`. Further
  changes before the release revise it instead of adding more, so it always
  describes the whole release as it stands.
- The license changes from GPL 3 to MIT with the rebuild. All commits so far are
  by the author.
- The old PHP code is removed once it is no longer needed; it stays in the Git
  history.
- The work happens on the branch `static-rebuild` and stays local. When the
  author is satisfied with it, it is merged into `main` locally as a
  fast-forward, so the history looks as if everything had happened on `main`,
  and `main` is pushed. The workflows then create `v2.0.0`, which is meant to be
  the final state of the rebuild. If that fails, the release and tag can be
  deleted and the step repeated.
- Hosting and deployment come after that, see [Next steps](#next-steps).

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
- Navigation no longer reloads the whole page (see [Routing](#routing)).
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
   live. Rounding errors are dropped before counting buildings; 23.28 t/min at
   3.88 t/min per building are 6 buildings, not 7.
2. **Saved chain settings** (`child_productivity` in `f78cae1`). In the
   population calculator, the productivities and chosen alternatives a visitor
   sets in the chain of a production building are kept per building and restored
   when its chain is shown again. They are saved in the browser with the other
   inputs. `f78cae1` only planned the productivities; the alternatives were
   added on purpose.
3. **Sync between chain slider and production field** in the population
   calculator (`f78cae1`): changing the productivity of the top building of the
   chain updates the production field (input, count, efficiency) at once. The
   field always calculates from the demand. With the maximum production as
   target, the chain reloads with a new target when the slider is released or
   the building is left, so chain and field agree again.
4. **Background images.** `img/bg-body-eco1-5.jpg` and
   `img/bg-body-tycoon1-2.jpg` exist, but the live site only shows `eco1`.
   `f78cae1` renamed the matching CSS classes to `bg-eco2` and so on, which is
   taken over. The empty red area at the top right of the header gets a new
   picture icon in the style and with the hover effect of the old icons
   (`img/user-menu.png`); it lets the visitor fix a background. By default the
   background is random and changes daily, never showing the same image as on
   the day before. It is derived from the visitor's local date and only chosen
   when the page loads, never in an open tab. The choice is saved in the
   browser.

   Clicking the icon opens a list in the style of the select menus with "random
   (changes daily)", "Ecos 1–5" and "Tycoons 1–2". Pointing at an entry or
   moving to it with the arrow keys previews it, once the image has loaded. A
   click or Enter saves the choice; Escape or a click elsewhere restores the
   saved one.

5. **Quirks of the old site.** The misspelled English title is corrected to
   "Commodity chains". The menu marks the info page with `current` like any
   other page instead of `info`. "Reset" also sets the hidden upgrade levels
   back to the maximum instead of only moving the sliders. Efficiencies outside
   1 to 100 % get the class of the nearest step (`red`, `green`) instead of
   `undefined`.
6. **Background fill for large windows.** The images keep their 1920 × 1200 px
   and their position at the top center. Every image has a base color taken from
   its edges, which replaces the black. In windows larger than the images, a
   copy of the image scaled to cover the window and blurred with CSS `blur()`
   fills the rest, and the image's left, right and bottom edges fade into it
   over 80 px. Smaller windows get neither blur nor fade, so the image looks as
   before.

### Phase 3: before `v2.0.0`

Agreed on 2026-11-08 after the calculator comparison. Each as a separate,
traceable step:

1. **Game data** from `patch8.rda`, see
   [Update to the final game data](game-data.md#update-to-the-final-game-data).
2. **Game version in the header:** small text in a lighter gold (`#ecd07a`), to
   the right of the logo at the bottom of the header, its baseline on the one of
   "RECHNER.DE": "für Version 3.0.8051", "for Version 3.0.8051".
3. **Search engines:** `robots.txt` allows everything and names the sitemap.
   `sitemap.xml` lists the pages in both languages, generated from the route
   table, without any query parameters.
4. **Population boxes:** the last open box has no close button. Which boxes are
   open is a general display setting, not part of a game, and reset leaves it
   alone.
5. **Reset** asks inline for confirmation if the game has inputs. It also sets
   the chain target back to the demand.
6. **Shareable pages:** commodity chains and database keep their whole state in
   the URL. Old parameters keep their names and meaning; chains add `prod` and
   `alt`. The population calculator stays at the plain `/population`, so that a
   bookmark always opens the current state.
7. **History:** a change inside a menu item in the same language replaces the
   history entry. Changing the menu item or the language adds a new one.
   Parameters survive a language change.
8. **Saved games**, see [Saved games](#saved-games).
9. **Review round** of 2026-11-10, see [Review round](#review-round).

### Review round

Agreed with the author while reviewing phase 3:

- **Header tab:** the red tab at the top right is no longer part of
  `bg-header.png`. A strip of four slices of the original draws it: the plain
  panel edge, the tab's left curve, a red middle and the right corner. The tab
  grows with its icons, and its curve always starts next to the leftmost one.
  With three icons it matches the original header exactly. The save and
  background menus hang directly from the tab's red edge.
- **Typography:** the base font size is 14 px instead of 13 px, also for inputs
  and buttons, and the main menu 15 px. The labels of the search forms got 10 px
  more room for it. Running text on the info page has a line height of 1.4.
- **Info page:** two sentences about the site, a personal note by the author in
  a card, signed and linked to simbo.de, and a "Legal" section with the imprint,
  the source code (MIT license linked as `simbo.mit-license.org/@2011/`, the
  repository with a GitHub icon in the site's icon style), the Anno 2070
  trademark, the "Prototype" font by Justin Callaghan with a link to
  `Prototype.txt`, and privacy. Anno 2070 and Ubisoft link to Wikipedia in the
  page language. Support, forum, source and contact sections and the email
  address are gone.
- **Imprint and privacy notice** are shared pages on simbo.de
  (`https://simbo.de/imprint/`, `https://simbo.de/privacy/`, English under
  `en/`; GitHub Pages needs the trailing slash). Every page links them in its
  language below the page frame, in the style of the language selection; the
  links stay at the bottom of the window as long as the page is shorter. The
  privacy block of the info page mentions the visitor statistics and links the
  section `#analytics` of the privacy notice.
- **Save menu:** the explanation fits on one line: "Automatisch im Browser
  gespeichert." / "Automatically saved in your browser."
- **Game ids** are 32 hex digits from `crypto.getRandomValues`. Older ids stay
  valid.
- **Backgrounds** come as AVIF and WebP, about 60 and 50 % smaller than the JPG
  files, which stay as the fallback. The app checks once before it starts which
  format the browser decodes and marks it on `<html>` for the stylesheet, so
  only one version is loaded.
- **Images** come from the live site in the normal setup, see [Images](#images).
- **Visitor statistics:** Umami on SRVKIST, only in production builds, without
  the recorder and without `data-do-not-track`. `src/index.html` is a Nunjucks
  template again for that.

### Saved games

There is always exactly one current game, saved automatically in the browser.

- A disk icon in the header shows the state on every page: without a mark for
  default values, with a green check once inputs differ from them.
- Its flyout has a short explanation and the list of games, most recently used
  first. Games can be switched, renamed inline and deleted after an inline
  confirmation. "New game" keeps the current one and starts an empty one.
  Choosing a game on another page leads to the population calculator.
- A game holds houses, residents, upgrade levels, information channels,
  productivities, chain target and chain settings. Open boxes and selected
  buildings are not part of it, and the background has its own setting.
- A new game is called "Spiel vom 08.11.2026" or "Game from Nov 8, 2026", using
  its start date, with "(2)" for a second game of a day. These names follow the
  page language until the visitor renames the game.
- Deleting the current game opens the most recently used one; deleting the only
  game leaves an empty one.
- Two small icons in the bottom right corner export the current game as text and
  import such a text. Only the current game can be exported. Games have unique
  random ids: an import with an unknown id adds a game, the same id and content
  only opens it, and the same id with other content asks whether to overwrite
  it, add a copy or cancel. Invalid texts change nothing.
- New interface elements and icons follow the style of the existing ones.

### Browser support

The hard lower limit is what Vue 3 needs: `Proxy`. That means Chrome 49, Edge
12, Firefox from about 42, Safari 10 and Opera 36, listed in `.browserslistrc`.
Older browsers get a short notice instead of an empty page.

- `@vitejs/plugin-legacy` builds a separate bundle that only old browsers load.
- The app's own code stays at ES2018, enforced by `lib` in
  `tsconfig.browser.json`, so that the modern bundle needs almost no polyfills.
  The ESLint rules asking for newer APIs are off for `src/`, with a comment.
- The background works without CSS custom properties, `event.key` is normalized
  for browsers with other key names, and the background fill sits behind
  `@supports`. Browsers without AVIF and WebP get the JPG backgrounds; the
  footer links use flexbox, which all of them support.

### Later

- Optional proposals of the calculator comparison, none of them a fix: exact
  fractions, a global productivity control, the senate ascension bonus, a total
  across all chains.
- Other optimizations and modernization, see [Goals](#goals), for example
  optimizing the icons losslessly.
- Importing the old Umami statistics (website id of this site
  `4c2e9006-f449-4c9f-aec7-897bcceb1168`) is SRVKIST work and paused until
  SRVKIST is fixed, see
  `~/projects/private/srvkist/.local/handoffs/2026-11-10-0251-umami-legacy-import.md`.
- Hosting on SRVKIST, see [Later on SRVKIST](#later-on-srvkist).

Stack
---

Modeled on the author's projects `etikettomat` (Vue setup) and `magawa`
(tooling):

- Node 24 and pnpm 12, as in the author's other projects
- Vite, TypeScript, Vue 3
- Pinia for shared state, VueUse, zod for validating stored data
- `vue-router` (see [Routing](#routing))
- `@simbo/vite-plugin-html-minifier`, `@simbo/vite-plugin-nunjucks` for parts of
  `index.html` that only production builds get, and a small own plugin
  (`route-pages.plugin.ts`) for the generated HTML pages, `sitemap.xml`,
  `robots.txt` and `version.txt`
- `@simbo/eslint-config` extended with `eslint-plugin-vue` and
  `vue-eslint-parser`, type checks with `vue-tsc`
- `@simbo/prettier-config`, `@simbo/tsconfig`, `@simbo/cspell-config`,
  `@simbo/commitlint-config`, husky, changesets
- Vitest with `@vue/test-utils`

jQuery and jQuery UI are dropped. Sliders, select menus and the autocomplete are
rebuilt as small Vue components that produce the same markup and class names, so
the existing stylesheet keeps working unchanged.

Routing
---

All existing URLs keep working:

| URL                                                                                                                                        | Behavior                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------- |
| `/`                                                                                                                                        | 307 to `/population`                            |
| `/en`                                                                                                                                      | 307 to `/population/en`                         |
| `/population`, `/commoditychains`, `/database`, `/info`                                                                                    | German pages                                    |
| `/<page>/en`                                                                                                                               | English pages                                   |
| `/<page>/`                                                                                                                                 | 301 to `/<page>`                                |
| `/<page>/de`                                                                                                                               | Redirect to `/<page>`                           |
| Query parameters such as `?pb_guid=`, `?count=`, `?product=`, `?search=`                                                                   | Unchanged                                       |
| Removed pages (`login`, `register`, `logout`, `account`, `saved-data`, `password-lost`, `resend-activation`, `change-email`, `rda-import`) | 301 to the population page in the same language |
| Anything else                                                                                                                              | 404 page with status 404                        |

- `vue-router` in history mode handles navigation and language switches without
  page reloads. The URL reflects the current state, so for example a commodity
  chain can be shared as a link.
- The build generates one HTML file per route and language
  (`population/index.html`, `population/en/index.html`, …) and a `404.html` per
  language, with the correct `<title>`, `lang`, preview tags, canonical link and
  `hreflang` alternates. The page itself, including header and navigation, is
  rendered by the client app.
- One route table is the single source for the router, the generated pages and
  the navigation.
- Redirects and the 404 handling are done by the web server, see
  [hosting.md](hosting.md).

Game data
---

- The game data is converted once from the export of the old MySQL database and
  stored as JSON in this repository. No extraction tooling is kept; how the data
  originally came from the game files is documented in
  [game-data.md](game-data.md). It was updated to the final game version in
  phase 3.
- All values together are about 6 KB per language with gzip, so the data is not
  split by page:
  - `game-data.json`: language-independent values
  - `names.de.json`, `names.en.json`: localized names
- Both get a content hash in their file names so browsers can cache them
  permanently.

Images
---

The images stay out of this repository for copyright reasons. All of them count
as game graphics, including the author's own icons and the header slices, which
use elements of the game graphics. Ubisoft declined to permit their use, and fan
sites are tolerated, but a public repository would spread them beyond the site
and could not take them back.

- `images.txt` lists every image the site uses with size and SHA-256 checksum.
  `pnpm images:list` writes it from the local `img/` folder; a test makes sure
  that it contains exactly the images the code and the game data refer to.
- `pnpm dev` compares `img/` with the list before it starts, by existence and
  size only, which takes milliseconds. Missing images are downloaded from the
  live site, never replacing an existing file, and only if every file matches
  its checksum. Images with another size only cause a warning, because they may
  have been changed on purpose. Downloading needs a live site from `v2.0.0` on,
  which the build marks with `version.txt`; before that, or if an image is
  wrong, the start stops with instructions for the ZIP.
- The private ZIP `anno2070rechner-images.zip` is the backup and the way in
  before `v2.0.0` is live. `scripts/setup-images.sh` unpacks it and checks every
  checksum, and `--pack` builds it from `img/` by the list.
- When images change: edit them in `img/`, run `pnpm images:list`, pack the ZIP
  and upload the images to the server before or with the release, see
  [hosting.md](hosting.md).
- Build results and release artifacts never contain the images. On the server
  they are stored once, separately from the releases.
- The site does not handle missing images; a missing image is an error to fix.
- The original header is kept in the export folder as `bg-header.original.png`.

The font "Prototype" (`fonts/`) is kept and taken over unchanged in phase 1. It
is only used for headings. According to its `Prototype.txt` it is free for
personal use, and that file must accompany any redistribution. This
non-commercial fan site is treated as personal use, and `Prototype.txt` is
always shipped with the font.

Hosting
---

The site does not depend on a particular host. [hosting.md](hosting.md) lists
what a web server has to do and has short guides for Apache with `.htaccess`
(Uberspace) and for Caddy (SRVKIST). The `.htaccess` is not part of the build.

- **First on Uberspace:** `v2.0.0` replaces the PHP version in the existing web
  folder on Uberspace, uploaded by hand from the release ZIP and the image ZIP.
  The `.htaccess` was tested on 2026-11-10 in a temporary folder for
  `simbo.uber.space`: all routes, redirects, 404 pages per language, caching and
  compression behaved as intended. The existing redirect of
  `www.anno2070rechner.de` drops the path and uses `http`; the guide replaces
  it.
- **Cleanup:** once the static site is live, `scripts/uberspace-cleanup.sh`
  removes the old database from Uberspace, after checking that the server serves
  `v2.0.0` or later.

### Later on SRVKIST

The site moves from Uberspace to SRVKIST, where Caddy serves it directly. The
server side is implemented in the SRVKIST repository; this repository only
provides the build and the release artifact.

- **Caddy:** a site block for `anno2070rechner.de` with a redirect from `www.`,
  `try_files {path} {path}/index.html`, the redirects from [Routing](#routing)
  and the 404 page. Unlike `srvkist.net`, the site is indexable (no `noindex`).
  Hashed assets are cached long-term; HTML is revalidated. The rules are
  maintained in SRVKIST, not taken from this repository.
- **Folders:**
  - `/var/www/anno2070rechner.de/releases/<version>/`, one per release
  - `current` as a symlink to the active release, so switching and rolling back
    are single steps
  - `shared/img/` with the images, served by Caddy under `/img/`
- **Deployment:** done properly from the start, following the plan in the
  SRVKIST roadmap:
  1. A release in this repository builds the site in GitHub Actions and attaches
     the build (without images) to the GitHub release, which records its
     checksum.
  2. The workflow notifies SRVKIST through an authenticated webhook at
     `hooks.srvkist.net` with the release version.
  3. SRVKIST downloads the artifact, verifies the checksum from GitHub, unpacks
     it into a new release folder and switches `current`.

  This depends on the deployment service in SRVKIST, which does not exist yet.

- **Move:** point the A and AAAA records of `anno2070rechner.de` to SRVKIST. The
  MX record stays with Uberspace, which keeps handling the mail. Afterwards the
  web folder and web domains on Uberspace are removed by hand.

Release automation
---

Releases run automatically like in the author's other projects, without an extra
checksum file. The workflows are prepared and checked locally as far as
possible; nothing runs remotely before `main` is pushed for `v2.0.0`. The
workflows of `magawa` and `etikettomat` are taken over 1:1, including names,
icons and the actions they use, and only adapted where this repository differs:

- **`Checks 🧐`** (`checks.yml`) runs on every pull request and on `main`:
  checks, tests and build; pull requests must have a changeset. The file exists
  but has never run. Missing are the last two steps: on `main` with pending
  changesets, it fetches the credentials of the GitHub App and dispatches
  `workflow:release`.
- **`Release 🏷️`** (`release.yml`) verifies that `main` is still the checked
  commit, runs `changeset version`, and commits and tags `ci(release): vX.Y.Z`.
- **`Publish 🚛`** (`publish.yml`) runs on the tag, builds, and creates the
  GitHub release with the notes from `CHANGELOG.md` and `anno2070rechner.zip`.
  The ZIP holds the build without images. The GitHub Pages step of the other
  projects is left out; a notification of SRVKIST (see
  [Later on SRVKIST](#later-on-srvkist)) follows once its counterpart exists.
- **Repository setup:** the secrets `SIMBO_GITHUB_APP_ID` and
  `SIMBO_GITHUB_APP_PRIVATE_KEY` and the GitHub App installation are needed
  before the push. The other settings of those projects follow once `v2.0.0` has
  succeeded: the rulesets "Main Branch" and "Release Tags", squash merges only,
  and deleting merged branches. Until then, a failed attempt can still be
  undone: delete release and tag and, if a workflow has to change, also
  force-push `main` back to before the release commit.

Verification
---

- Everything where a test makes sense is tested properly in this repository,
  above all the calculations and the application logic. The goal is not a
  coverage number but tests that keep important behavior from changing unnoticed
  during later optimizations. Selected outputs recorded from the live site serve
  as expected values.
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
- When the old behavior is unclear, the old PHP and JavaScript code in the Git
  history and the live site (while it runs) decide. A difference is only called
  a bug once it is substantiated there.
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
- Phase 3 changes results deliberately through the final game data. Against the
  recorded references, 174 more cases differ: 152 chains, all of which contain a
  changed building, 8 population scenarios and 14 database views.
- The author reviewed phase 3 on 2026-11-10 and accepted saved games, export and
  import, the shareable URLs, the population boxes, the save menu and the
  release workflows. The simulation of old browsers is accepted as evidence; a
  real old browser is not needed. References to PHP in the code are intended,
  they describe number handling taken over from the old site.
- Review round: with three icons, the header tab matches the original header
  within 1 of 255 per color channel. All pages were compared at 13 and 14 px for
  new line breaks and overflows; only the search form labels needed more room.
  The format check loads exactly one background version. Downloading images from
  the current live site stops with the ZIP instructions, as intended.
- Phase 2 changes results deliberately. 176 of the 726 recorded chains differ
  from the live site, exactly those requesting a count without a target for a
  building whose productivity is not 100 %. 16 population scenarios differ only
  by the class `red` instead of `undefined`, which is hidden on buildings
  without demand. All others still match.

## Next steps

Where the work stands and what follows. Deep Ocean stays out of scope.

1. **Public credentials, by the author, now:** `conf/mysql.ini` with the
   database name, user and password, and the private reCAPTCHA key in
   `conf/site.ini` were in the public Git history since `0723dc1` (1 January
   2012), which is part of `origin/main` and three forks. Treat them as
   compromised and make them useless on the servers: change the password of the
   MySQL user on Uberspace or remove user and database, check whether the
   password was used anywhere else, and revoke the reCAPTCHA key. Rewriting the
   history would not help with forks and copies and would break the
   fast-forward, so it stays as it is.
2. **Before `v2.0.0`:**
   - **Productivity below 100 % and eco with items:** decided without a test in
     the game: a slower cycle uses less raw material, and eco and item bonuses
     multiply, see
     [Below 100 % and eco with items](calculator-comparison.md#below-100--and-eco-with-items).
     Still to decide is whether and when the calculator is changed, see
     [What the calculator would need](calculator-comparison.md#what-the-calculator-would-need).
   - **Image ZIP:** the author reviews the new `anno2070rechner-images.zip` and
     stores it in the cloud.
3. **`v2.0.0`**, when the author decides: set up the secrets and the GitHub App,
   merge `static-rebuild` into `main` locally as a fast-forward and push `main`.
   After a successful release, activate the remaining repository settings and
   close issue #2 (broken umlauts).
4. **Hosting on Uberspace**, by the author, following [hosting.md](hosting.md):
   upload the release and the images, add the `.htaccess`, fix the `www.`
   redirect, then run `scripts/uberspace-cleanup.sh`.
5. **Later:** SRVKIST and the import of the old statistics, see [Later](#later).

Working material outside the repository:

- `~/projects/private/Anno2070Rechner-export`: the Uberspace export (code,
  images, database dump), the current image ZIP and the original header
  `bg-header.original.png`; private. `anno2070rechner-images.2026-11-08.zip` is
  the previous ZIP; its PNGs are losslessly optimized versions of the same
  images, useful when the icons get optimized. `game-files-latest` there holds
  the unpacked files of game version 3.0.8051.
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

<!-- cspell:ignore für vom Automatisch gespeichert -->
