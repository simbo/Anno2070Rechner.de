# anno2070rechner

## 2.0.0

### Major Changes

- 4de5f1a: Anno2070Rechner.de is now a purely static website: plain files that
  any web server can deliver, with no server application, no database and no
  user data on a server. May it keep running as it is for as long as people play
  Anno 2070.

  #### Why this rebuild

  I built the calculator at the end of 2011, and its last feature update dates
  from 2012. For 15 years it ran with PHP, MySQL and a user system, and was kept
  alive through updates and server moves, although the data behind it no longer
  changed.

  In 2026 I had it ported with the help of AI. The goal was to preserve the
  calculator, not to build a new one. Along the way, bugs were fixed, the game
  data was brought up to the final game version, and accounts were replaced by
  saved games in the browser.

  #### Before and now

  |             | Old site                                           | Since 2.0                                                  |
  | ----------- | -------------------------------------------------- | ---------------------------------------------------------- |
  | Application | PHP, pages generated on the server                 | Vue and TypeScript, built once into static files           |
  | Game data   | MySQL database                                     | JSON files, converted once from that database              |
  | Chains      | Calculated on the server for every request         | Calculated in the browser                                  |
  | Controls    | jQuery and jQuery UI from 2011                     | Small Vue components with the same markup and class names  |
  | Your inputs | Cookie, or an account                              | Saved games in your browser's local storage                |
  | Accounts    | Login and registration with reCAPTCHA              | None                                                       |
  | Third party | jQuery from Google, reCAPTCHA, an analytics script | Only an anonymous visitor statistic on the author's server |

  #### The same site, on purpose

  The design and the texts stay as they were, including the fixed 960 px layout.
  There is no responsive layout and no new design: the site keeps the look it
  has always had.

  To make sure of this, the rebuild was compared with recordings of the old site
  before any fixes or data updates went in, and it matched them exactly:

  - all 726 recorded commodity chains, in both languages
  - 24 population calculator scenarios, in both languages
  - 31 database views and 26 search suggestion requests
  - 26 pages and interactions as screenshots, pixel-identical

  The only differences were the corrected umlauts. All old URLs and links,
  including shared links to commodity chains, keep working.

  #### What has changed
  - **No more accounts.** Login, registration and the account pages are gone, as
    they offered little beyond managing the account itself. Old links to them
    lead to the population calculator.
  - **Saved games in the browser.** The disk icon from the old header is back,
    for everyone. There is always a current game, saved automatically. Its menu
    keeps several games, switches, renames and deletes them, and exports or
    imports a game as text to take it to another browser. If the browser does
    not allow saving, or the games were saved by a newer version of the site, a
    red cross replaces the check and a notice says what to do.
  - **Enter your inputs once more.** Inputs saved by the old site cannot be
    taken over, because its cookie is not readable by the page.
  - **Shareable pages.** Commodity chains and the database keep their whole
    state in the URL, including the productivities and alternatives set in a
    chain, so a link shows the same result elsewhere. Changes inside a page do
    not fill up the back button.
  - **Chain settings are kept.** In the population calculator, the
    productivities and alternatives of a building's chain are saved per building
    and restored when its chain is shown again. This was started in 2012 and
    never went live; remembering alternatives is new.
  - **Chain and production field in sync.** Changing the productivity of the top
    building of a chain updates input, count and efficiency of its production
    field at once. This, too, was left unfinished in 2012.
  - **All backgrounds.** The site has five Eco and two Tycoon backgrounds, but
    only ever showed one. The background now changes daily, and a picture icon
    in the header lets you preview all of them and keep a favorite. In windows
    larger than 1920 × 1200 px, a blurred copy fills the rest instead of black.
  - **Smaller backgrounds.** Current browsers load them as AVIF or WebP, about
    half the size; older ones keep the JPG files.
  - **Reset asks first.** If there are inputs, the reset buttons ask for
    confirmation. Reset now also sets the target of the commodity chain back.
  - **One box stays.** The last visible box of the population calculator can no
    longer be closed.
  - **Faster navigation.** Pages and languages change without reloading the
    whole page.
  - **Anonymous statistics only.** The old analytics script is replaced by a
    self-hosted visitor statistic without cookies. Nothing else is loaded from
    other servers.
  - **New info page.** A short note on the story of the site, the legal notes
    and a link to the source code replace the outdated forum and support links.
    Imprint and privacy notice are linked below every page.
  - **Slightly larger text.** The base font grows from 13 to 14 px.
  - **Better link previews.** Facebook-only tags are replaced by general preview
    tags.
  - **Cleaner header.** The "Under Development" ring in the logo is removed, and
    the header names the game version of the data.
  - **Older browsers.** The site runs in browsers from about 2016, as far back
    as Vue 3 goes: Chrome 49, Edge 12, Firefox 42, Safari 10 and Opera 36. They
    load a separate bundle, so that current browsers do not pay for it. Even
    older browsers get a short notice instead of an empty page.

  #### Different results

  Some results differ from the old site, because the old ones were wrong:

  - **Final game data.** The data was from before the game's first patch. Now it
    is from the final game version 3.0.8051. 12 population demand values for 7
    goods were too high, by up to 82 %, so the calculator suggested too many
    buildings for goods such as bio drinks, champagne or jewelry. The sawmill
    and the uranium black smoker miner take longer per cycle, and some
    maintenance and build costs were outdated.
  - **Productivity with a building count.** A chain requested for a number of
    buildings ignored their productivity. 2 fisheries at 200 % showed ×1
    building and 4 t/min instead of ×2 and 8 t/min. 176 of the 726 recorded
    chains differ, exactly those with a building count, no target and a
    productivity other than 100 %.
  - **Raw materials below 100 %.** A building below 100 %, for example from an
    energy shortage, works more slowly and uses its raw materials as slowly. Its
    chain therefore no longer asks for more raw material buildings: 2 tool
    factories at 50 % need as much iron as 1 at 100 %, not twice as much.
  - **No building too many.** Rounding errors no longer add a building: 23.28
    t/min at 3.88 t/min per building are 6 buildings, not 7.

  #### Fixed
  - **Broken umlauts.** Names such as "ErdÃ¶lraffinerie" in the database view
    are displayed correctly.
  - **Reset.** It now also sets the hidden upgrade levels back to the maximum.
  - **Efficiency colors.** Efficiencies outside 1 to 100 % get the color of the
    nearest step instead of none.
  - **Small errors.** The misspelled English title of the commodity chains is
    corrected, and the menu marks the info page like any other page.

  #### Known limitations
  - **No Deep Ocean.** The expansion, with its Geniuses and new goods, is still
    not supported. Its Tech demands differ from the base game.

  #### For developers
  - The license changes from GPL 3 to MIT. The "Prototype" font keeps its own
    terms.
  - The old PHP code is removed from the repository and stays available in the
    Git history.
  - Images are not part of the repository or the release for copyright reasons.
    `images.txt` lists them with checksums; the development server downloads
    missing ones from the live site, and `version.txt` in every build names its
    release.
  - What a web server has to do is described in `docs/hosting.md`, with guides
    for Apache and Caddy.
