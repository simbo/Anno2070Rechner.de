---
'anno2070rechner': major
---

Rebuild Anno2070Rechner.de as a purely static website, so that it can stay
online for as long as people play Anno 2070, with no server application left to
maintain.

#### Why this rebuild

Anno2070Rechner.de has been online since 2011, and its last feature update dates
from 2012. Even so, it still depended on PHP, a MySQL database and a user
system, all of which need upkeep although the data behind them no longer
changes.

Its main purpose is to preserve the existing calculator: as a set of plain files
that any web server can deliver, with no runtime to update, no database to run
and no user data on a server. While at it, the game data was brought up to date,
and accounts were replaced by saved games in the browser.

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

The design and the texts are deliberately unchanged, including the fixed 960 px
layout. There is no responsive or mobile layout and no modernized design: the
site is kept the way it has always looked, and a redesign was never the goal.

To make sure of this, the rebuild was compared with recordings of the old site
before any fixes or data updates went in, and it matched them exactly:

- all 726 recorded commodity chains, in both languages
- 24 population calculator scenarios, in both languages
- 31 database views and 26 search suggestion requests
- 26 pages and interactions as screenshots, pixel-identical

The only differences were the corrected umlauts. All old URLs and links,
including shared links to commodity chains, keep working.

#### What is different

- **Accounts are gone.** Login, registration and the account pages are removed,
  as they offered little beyond managing the account itself. Old links to these
  pages lead to the population calculator.
- **Enter your inputs once more.** Inputs are now saved in your browser. Those
  saved by the old site cannot be taken over, because its cookie is not readable
  by the page.
- **Reset asks first.** If there are inputs, the reset buttons ask for
  confirmation. Reset now also sets the target of the commodity chain back.
- **One box stays.** The last visible box of the population calculator can no
  longer be closed.
- **Faster navigation.** Pages and languages change without reloading the whole
  page.
- **Anonymous statistics only.** The old analytics script is replaced by a
  self-hosted visitor statistic without cookies. Nothing else is loaded from
  other servers.
- **New info page.** A short note on the story of the site, the legal notes and
  a link to the source code replace the outdated forum and support links.
  Imprint and privacy notice are linked below every page.
- **A little larger text.** The base font grows from 13 to 14 px.
- **Smaller backgrounds.** Current browsers load the backgrounds as AVIF or
  WebP, about half the size; older ones keep the JPG files.
- **Better link previews.** Facebook-only tags are replaced by general preview
  tags.
- **Cleaner header.** The "Under Development" ring in the logo is removed.

#### Saved games

The disk icon from the old header is back, for everyone and without an account.
There is always a current game, saved automatically in your browser. The icon
shows a green check once it has inputs, and you do not have to care about
anything else.

If you want to, its menu lets you keep several games, switch between them,
rename and delete them. Two small icons export the current game as text and
import it in another browser. Importing another version of a game you already
have asks whether to overwrite it or add a copy.

#### Shareable pages

Commodity chains and the database keep their whole state in the URL, including
the productivities and alternatives set in a chain, so a link shows the same
result elsewhere. All old links keep working. Changes inside a page do not fill
up the back button: each menu item and language is one step.

#### Final game data

The data was from before the game's first patch, as a check against the final
game version 3.0.8051 showed. Now it is from that version, which the header
names.

- 12 population demand values for 7 goods were too high, by up to 82 %, so the
  calculator suggested too many buildings for goods such as bio drinks,
  champagne or jewelry.
- The sawmill and the uranium black smoker miner take longer per cycle, and some
  maintenance and build costs were outdated.

**This changes results compared with the old site.**

#### Finished at last

The last commit of March 2012 contained work that never went live. It is now
finished:

- **Chain settings are kept.** In the population calculator, the productivities
  and chosen alternatives of a building's chain are saved per building and
  restored when its chain is shown again. Remembering alternatives is new.
- **Chain and production field stay in sync.** Changing the productivity of the
  top building of a chain updates input, count and efficiency of its production
  field at once.
- **All background images.** The site has five Eco and two Tycoon backgrounds,
  but only ever showed one. By default, the background now changes daily and
  never repeats the one of the day before. A new picture icon in the header lets
  you preview all of them and keep your favorite.

One addition is new: in windows larger than the 1920 × 1200 px background, a
blurred copy fills the rest of the window instead of black. Smaller windows look
as before.

#### Fixed

- **Chains with productivity show correct results.** A chain requested for a
  number of buildings ignored their productivity. 2 fisheries at 200 % showed ×1
  building and 4 t/min instead of ×2 and 8 t/min. **This changes results
  compared with the old site:** 176 of the 726 recorded chains differ, exactly
  those with a building count, no target and a productivity other than 100 %.
- **No building too many.** Rounding errors no longer add a building: 23.28
  t/min at 3.88 t/min per building are 6 buildings, not 7.
- **Broken umlauts.** Names such as "ErdÃ¶lraffinerie" in the database view are
  displayed correctly.
- **Reset.** It now also sets the hidden upgrade levels back to the maximum.
- **Efficiency colors.** Efficiencies outside 1 to 100 % get the color of the
  nearest step instead of none.
- **Small errors.** The misspelled English title of the commodity chains is
  corrected, and the menu marks the info page like any other page.

#### Older browsers

The site runs in browsers from about 2016, as far back as its Vue 3 framework
goes: Chrome 49, Edge 12, Firefox 42, Safari 10 and Opera 36. Those old browsers
load a separate bundle, so that current browsers do not pay for it. Older
browsers get a short notice instead of an empty page.

#### Known limitations

- **No Deep Ocean.** The expansion, with its Geniuses and new goods, is still
  not supported. Its Tech demands differ from the base game.

#### What may come

None of this is promised, and the site stays usable as it is without any of it:

- Moving to a new server, which you should not notice.
- Deleting the database of the old site, including all accounts and their e-mail
  addresses. This is planned right after the release.
- Support for Deep Ocean.
- Exact fractions of buildings, a global productivity control, the senate
  ascension bonus, or a total across all chains.
- Technical optimizations such as smaller icons.
- A responsive layout and other modernization, once there is a reason to change
  a site that is meant to stay as it is.

#### For developers

- The license changes from GPL 3 to MIT. The "Prototype" font keeps its own
  terms.
- The old PHP code is removed from the repository and stays available in the Git
  history.
- Images are not part of the repository or the release for copyright reasons.
  `images.txt` lists them with checksums; the development server downloads
  missing ones from the live site, and `version.txt` in every build names its
  release.
- The red tab at the top right of the header grows with its icons, and the game
  version sits on the baseline of the logo.
- What a web server has to do is described in `docs/hosting.md`, with guides for
  Apache and Caddy.
