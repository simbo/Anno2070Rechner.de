Rebuild plan: static frontend
===

Anno2070Rechner.de currently runs as a PHP application with a MySQL database. It
is rebuilt as a purely static frontend without any server-side code and moved to
SRVKIST. This document records the agreed plan and its state.

**State:** phase 1 is implemented and verified on the branch `static-rebuild`
(see [Verification](#verification)). Hosting on SRVKIST, the release and phase 2
are still open.

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
- The license changes from GPL 3 to MIT with the rebuild. All commits so far are
  by the author.
- The old PHP code is removed once it is no longer needed; it stays in the Git
  history.
- The work happens on the branch `static-rebuild` and is only pushed when the
  rebuild is finished.
- Hosting and deployment come last: phase 2 is done first. Right before the
  release: set up SRVKIST and move the DNS records. Tidy up the private image
  ZIP and store it in the cloud.

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

The target-TPM bug below is kept in this phase on purpose, and so are these
quirks of the live site, which can be reconsidered later:

- The English page title "Commdity chains" (the menu says "Commodity chains").
- The menu marks the info page with the class `info` instead of `current`.
- "Reset" moves the upgrade sliders to the top but keeps the hidden upgrade
  levels.
- An efficiency of 0 % gets the class `undefined`.

### Phase 2: fixes and unfinished features

Each as a separate, traceable step:

1. **Target TPM with productivity.** When a commodity chain is requested for a
   number of buildings without an explicit target, the live site ignores the
   building's productivity. Example: 2 fisheries at 200 % show ×1 building and 4
   t/min instead of ×2 and 8 t/min. Fixed in commit `f78cae1`, which never ran
   live.
2. **Saved chain settings** (`child_productivity` in `f78cae1`). In the
   population calculator, the productivities and chosen alternatives a visitor
   sets in the chain of a production building are kept per building and restored
   when its chain is shown again. They are saved in the browser with the other
   inputs. `f78cae1` only planned the productivities; the alternatives were
   added on purpose.
3. **Sync between chain slider and production field** in the population
   calculator (`f78cae1`): changing the productivity of the top building of the
   chain updates the production field (input, count, efficiency) at once.
4. **Background images.** `img/bg-body-eco1-5.jpg` and
   `img/bg-body-tycoon1-2.jpg` exist, but the live site only shows `eco1`.
   `f78cae1` renamed the matching CSS classes to `bg-eco2` and so on, which is
   taken over. The empty red area at the top right of the header gets the gear
   icon that already exists in the old icon sprite (`img/user-menu.png`); it
   lets the visitor fix a background. By default the background is random and
   changes daily, never showing the same image as on the day before. The choice
   is saved in the browser.

### Later

- Optimizations and modernization, see [Goals](#goals), for example serving the
  background images as WebP or AVIF, or reducing the population page bundle
  (about 32 KB with gzip, mostly zod).
- Credit the "Prototype" font and its authors visibly on the site, in the way
  its `Prototype.txt` asks for.
- Add analytics with the Umami instance on SRVKIST
  (`https://trk.srvkist.net/trk.js`, own website id).

Stack
---

Modeled on the author's projects `etikettomat` (Vue setup) and `magawa`
(tooling):

- Node 24 and pnpm 12, as in the author's other projects
- Vite, TypeScript, Vue 3
- Pinia for shared state, VueUse, zod for validating stored data
- `vue-router` (see [Routing](#routing))
- `@simbo/vite-plugin-html-minifier`, and a small own plugin
  (`route-pages.plugin.ts`) for the generated HTML pages
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
- Redirects and the 404 handling are done by Caddy on SRVKIST.

Game data
---

- The game data is converted once from the export of the old MySQL database and
  stored as JSON in this repository. No extraction tooling is kept; how the data
  originally came from the game files is documented in
  [game-data.md](game-data.md).
- All values together are about 6 KB per language with gzip, so the data is not
  split by page:
  - `game-data.json`: language-independent values
  - `names.de.json`, `names.en.json`: localized names
- Both get a content hash in their file names so browsers can cache them
  permanently.

Images
---

Interface images and game icons stay out of this repository for copyright
reasons. They are static archive material and are kept in a private ZIP file.

- For development, the ZIP is unpacked into the working copy (ignored by Git).
- Build results and release artifacts never contain the images. On the server
  they are stored once, separately from the releases (see
  [Hosting](#hosting-on-srvkist)).
- The ZIP is rebuilt once the rebuild is finished and contains exactly the
  images the new site uses.
- Later, the icons can be optimized losslessly (about 4 KB per file today).

The font "Prototype" (`fonts/`) is kept and taken over unchanged in phase 1. It
is only used for headings. According to its `Prototype.txt` it is free for
personal use, and that file must accompany any redistribution. This
non-commercial fan site is treated as personal use, and `Prototype.txt` is
always shipped with the font.

Hosting on SRVKIST
---

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
     the build (without images) and its checksum to the GitHub release.
  2. The workflow notifies SRVKIST through an authenticated webhook at
     `hooks.srvkist.net` with the release version.
  3. SRVKIST downloads the artifact, verifies the checksum, unpacks it into a
     new release folder and switches `current`.

  This depends on the deployment service in SRVKIST, which does not exist yet.

- **Move:** point the A and AAAA records of `anno2070rechner.de` to SRVKIST. The
  MX record stays with Uberspace, which keeps handling the mail.
- **Cleanup:** afterwards, `scripts/uberspace-cleanup.sh` removes the old site,
  database and domains from Uberspace. It refuses to run while the domain still
  points to Uberspace.

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
- Phase 2 must change the expected values for the target-TPM bug deliberately.

## Next steps

Where the work stands and what follows, in this order:

1. **Phase 2** (decided, not started). For the background chooser, the open
   detail is its interface; proposal: clicking the gear opens a small list in
   the style of the select menus with "random (changes daily)" and the seven
   images, and pointing at an entry previews it. Phase 2 deliberately changes
   the expected values for the target-TPM bug in the tests.
2. **Optimizations and modernization**, see [Later](#later).
3. **Release:** SRVKIST site block, deployment service with webhook and release
   workflow, final image ZIP with a setup script, DNS move, push, `v2.0.0`, then
   the Uberspace cleanup. The old PHP code is removed then. The reCAPTCHA key in
   `conf/site.ini` is public in the Git history and should be revoked by the
   author.

Working material outside the repository:

- `~/projects/private/Anno2070Rechner-export`: the Uberspace export (code,
  images, database dump) and the current image ZIP; private.
- `~/projects/private/Anno2070Rechner-verify`: recorded live reference data and
  the comparison tooling (`capture.py`, `live-capture.mjs`, `compare.mjs`,
  parity tests run with
  `pnpm exec vitest run --config ../Anno2070Rechner-verify/vitest.config.ts`
  from the repository). Throwaway once the rebuild is released.
- `img/` in the repository is a local link to the exported images (ignored by
  Git).
