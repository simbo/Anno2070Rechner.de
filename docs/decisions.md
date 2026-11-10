Decisions
===

The agreed decisions for Anno2070Rechner.de as a static site. Later work follows
them, and a changed decision is recorded here. Open work is listed in
[todo.md](todo.md).

Goals
---

- Keep the site online without a server-side application to maintain.
- The design, the texts and the fixed 960 px layout stay as they have always
  been. There is no responsive layout and no redesign until there is a reason to
  change a site that is meant to stay as it is.
- Under the hood, use a current frontend setup consistent with the author's
  other projects.
- When the behavior of the old PHP site is unclear, its PHP and JavaScript code
  in the Git history decides. A difference is only called a bug once it is
  substantiated there.
- Deep Ocean is out of scope.

Release and license
---

- Versioning with Changesets, as in the author's other projects.
- The license is MIT since `v2.0.0`; earlier versions were GPL 3. All commits
  before the change are by the author.
- The old PHP code is not part of the repository anymore; it stays in the Git
  history.

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

There is no jQuery or jQuery UI. Sliders, select menus and the autocomplete are
small Vue components that produce the markup and class names of jQuery UI, so
the old stylesheet keeps working unchanged. Calculations, rounding, number
output and sorting follow the old PHP site; references to PHP in the code
describe that.

Routing
---

All URLs of the old site keep working:

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
  page reloads.
- The build generates one HTML file per route and language
  (`population/index.html`, `population/en/index.html`, …) and a `404.html` per
  language, with the correct `<title>`, `lang`, preview tags, canonical link and
  `hreflang` alternates. The page itself, including header and navigation, is
  rendered by the client app.
- One route table is the single source for the router, the generated pages, the
  navigation and `sitemap.xml`. `robots.txt` allows everything and names the
  sitemap, which lists the pages in both languages without query parameters.
- Redirects and the 404 handling are done by the web server, see
  [hosting.md](hosting.md).

### Shareable pages and history

- Commodity chains and the database keep their whole state in the URL. Old
  parameters keep their names and meaning; chains add `prod` and `alt`. The
  population calculator stays at the plain `/population`, so that a bookmark
  always opens the current state.
- A change inside a menu item in the same language replaces the history entry.
  Changing the menu item or the language adds a new one. Parameters survive a
  language change.

Game data
---

- The game data is stored as JSON in this repository, converted once from the
  old MySQL database and updated to the final game version 3.0.8051. No
  extraction tooling is kept; [game-data.md](game-data.md) documents where the
  data comes from and how it was updated.
- All values together are about 6 KB per language with gzip, so the data is not
  split by page:
  - `game-data.json`: language-independent values
  - `names.de.json`, `names.en.json`: localized names
- Both get a content hash in their file names so browsers can cache them
  permanently.
- The header names the game version the data is from: small text in a lighter
  gold (`#ecd07a`) to the right of the logo, its baseline on the one of
  "RECHNER.DE".

Calculator
---

- A building below 100 % productivity works more slowly and uses its raw
  materials as slowly, so its chain does not ask for more raw material
  buildings.
- Rounding errors are dropped before counting buildings: 23.28 t/min at 3.88
  t/min per building are 6 buildings, not 7.
- In the population calculator, the productivities and chosen alternatives set
  in the chain of a production building are kept per building and restored when
  its chain is shown again.
- Changing the productivity of the top building of a chain updates input, count
  and efficiency of its production field at once. The field always calculates
  from the demand. With the maximum production as target, the chain reloads with
  a new target when the slider is released or the building is left.
- The last open population box has no close button. Which boxes are open is a
  general display setting, not part of a game, and reset leaves it alone.
- Reset asks inline for confirmation if the game has inputs. It sets the hidden
  upgrade levels back to the maximum and the chain target back to the demand.

Saved games
---

There is always exactly one current game, saved automatically in the browser's
`localStorage`. There are no accounts and no cookies.

- A disk icon in the header shows the state on every page: without a mark for
  default values, with a green check once inputs differ from them.
- Its flyout has a one-line explanation ("Automatisch im Browser gespeichert." /
  "Automatically saved in your browser.") and the list of games, most recently
  used first. Games can be switched, renamed inline and deleted after an inline
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
  import such a text. Only the current game can be exported. Games have random
  ids of 32 hex digits from `crypto.getRandomValues`; older ids stay valid. An
  import with an unknown id adds a game, the same id and content only opens it,
  and the same id with other content asks whether to overwrite it, add a copy or
  cancel. Invalid texts change nothing.

Appearance
---

New interface elements and icons follow the style of the existing ones.

- **Header tab:** the red tab at the top right is drawn from four slices of the
  original header: the plain panel edge, the tab's left curve, a red middle and
  the right corner. It grows with its icons, and its curve always starts next to
  the leftmost one. The save and background menus hang directly from its red
  edge. The original header is kept outside the repository as
  `bg-header.original.png`.
- **Backgrounds:** the five Eco and two Tycoon backgrounds are all used. By
  default the background changes daily and never repeats the one of the day
  before. It is derived from the visitor's local date and only chosen when the
  page loads. A picture icon in the header opens a list in the style of the
  select menus with "random (changes daily)", "Ecos 1–5" and "Tycoons 1–2";
  pointing at an entry or moving to it with the arrow keys previews it, a click
  or Enter saves the choice, and Escape or a click elsewhere restores the saved
  one.
- **Background formats:** backgrounds come as AVIF and WebP, with the JPG files
  as the fallback. The app checks once before it starts which format the browser
  decodes and marks it on `<html>`, so only one version is loaded.
- **Large windows:** the backgrounds keep their 1920 × 1200 px and their
  position at the top center. Every image has a base color taken from its edges.
  In larger windows, a copy scaled to cover the window and blurred with CSS
  `blur()` fills the rest, and the image's left, right and bottom edges fade
  into it over 80 px. Smaller windows get neither.
- **Typography:** the base font size is 14 px, also for inputs and buttons, and
  the main menu 15 px. Running text on the info page has a line height of 1.4.
- **Info page:** two sentences about the site, a personal note by the author in
  a card, signed and linked to simbo.de, and a "Legal" section with the imprint,
  the source code (MIT license linked as `simbo.mit-license.org/@2011/`, the
  repository with a GitHub icon in the site's icon style), the Anno 2070
  trademark, the "Prototype" font and privacy. Anno 2070 and Ubisoft link to
  Wikipedia in the page language.
- **Imprint and privacy notice** are shared pages on simbo.de
  (`https://simbo.de/imprint/`, `https://simbo.de/privacy/`, English under
  `en/`; GitHub Pages needs the trailing slash). Every page links them in its
  language below the page frame, in the style of the language selection; the
  links stay at the bottom of the window as long as the page is shorter.

Visitor statistics
---

Umami on SRVKIST, only in production builds, without the recorder and without
`data-do-not-track`. `src/index.html` is a Nunjucks template for that. The
privacy block of the info page mentions it and links the section `#analytics` of
the privacy notice. Nothing else is loaded from other servers.

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
- The private ZIP `anno2070rechner-images.zip` is the backup.
  `scripts/setup-images.sh` unpacks it and checks every checksum, and `--pack`
  builds it from `img/` by the list.
- When images change: edit them in `img/`, run `pnpm images:list`, pack the ZIP
  and upload the images to the server before or with the release, see
  [hosting.md](hosting.md).
- Build results and release artifacts never contain the images. On the server
  they are stored once, separately from the releases.
- The site does not handle missing images; a missing image is an error to fix.

The font "Prototype" (`fonts/`) is only used for headings. According to its
`Prototype.txt` it is free for personal use, and that file must accompany any
redistribution. This non-commercial fan site is treated as personal use, and
`Prototype.txt` is always shipped with the font.

Browser support
---

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
- No real old browser is tested. A current browser with all newer APIs removed
  running both bundles is accepted as evidence.

Hosting
---

The site does not depend on a particular host. [hosting.md](hosting.md) lists
what a web server has to do and has short guides for Apache with `.htaccess`
(Uberspace) and for Caddy (SRVKIST). The `.htaccess` is not part of the build.
The site runs on Uberspace, uploaded by hand from the release ZIP and the image
ZIP; the move to SRVKIST is planned in [todo.md](todo.md#srvkist).

Release automation
---

Releases run automatically like in the author's other projects, without an extra
checksum file. The workflows of `magawa` and `etikettomat` are taken over 1:1,
including names, icons and the actions they use, and only adapted where this
repository differs:

- **`Checks 🧐`** (`checks.yml`) runs on every pull request and on `main`:
  checks, tests and build; pull requests must have a changeset. On `main` with
  pending changesets, it fetches the credentials of the GitHub App and
  dispatches `workflow:release`.
- **`Release 🏷️`** (`release.yml`) verifies that `main` is still the checked
  commit, runs `changeset version`, and commits and tags `ci(release): vX.Y.Z`.
- **`Publish 🚛`** (`publish.yml`) runs on the tag, builds, and creates the
  GitHub release with the notes from `CHANGELOG.md` and `anno2070rechner.zip`.
  The ZIP holds the build without images. The GitHub Pages step of the other
  projects is left out.
- **Repository setup:** the secrets `SIMBO_GITHUB_APP_ID` and
  `SIMBO_GITHUB_APP_PRIVATE_KEY` and the installed GitHub App. After the first
  release: the rulesets "Main Branch" and "Release Tags", squash merges only,
  and deleting merged branches.

<!-- cspell:ignore für vom Automatisch gespeichert -->
