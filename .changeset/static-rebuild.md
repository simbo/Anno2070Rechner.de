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

This release is not a new calculator. Its purpose is to preserve the existing
one: as a set of plain files that any web server can deliver, with no runtime to
update, no database to run and no user data to protect.

#### Before and now

|             | Old site                                           | Since 2.0                                                 |
| ----------- | -------------------------------------------------- | --------------------------------------------------------- |
| Application | PHP, pages generated on the server                 | Vue and TypeScript, built once into static files          |
| Game data   | MySQL database                                     | JSON files, converted once from that database             |
| Chains      | Calculated on the server for every request         | Calculated in the browser                                 |
| Controls    | jQuery and jQuery UI from 2011                     | Small Vue components with the same markup and class names |
| Your inputs | Cookie                                             | Your browser's local storage                              |
| Accounts    | Login and registration with reCAPTCHA              | None                                                      |
| Third party | jQuery from Google, reCAPTCHA, an analytics script | Nothing is loaded from other servers                      |

#### The same site, on purpose

The design, the texts and the calculations are deliberately unchanged, including
the fixed 960 px layout. There is no responsive or mobile layout and no
modernized design: the site is kept the way it has always looked, and a redesign
was never the goal.

To make sure of this, the rebuild was compared with recordings of the old site
before any fixes went in, and it matched them exactly:

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
- **Faster navigation.** Pages and languages change without reloading the whole
  page.
- **No tracking and no external requests.** The old analytics script is removed,
  and no cookies are set.
- **Better link previews.** Facebook-only tags are replaced by general preview
  tags.
- **Cleaner header.** The "Under Development" ring in the logo is removed.

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

#### Known limitations

- **Game data from early 2012.** The data still comes from the game's first
  patch, and later balance changes were never imported. A first check found 12
  population demand values for 7 goods that are higher than in later game files,
  so the calculator can suggest more buildings than needed for goods such as
  jewelry or champagne. This has not been checked against the final game version
  yet.
- **No Deep Ocean.** The expansion, with its Geniuses and new goods, is still
  not supported.
- **Current browsers only.** The site needs a browser from about 2021 or newer.
  Older ones probably show an empty page.

#### What may come

None of this is promised, and the site stays usable as it is without any of it:

- Moving to a new server, which you should not notice. The old server and its
  database will then be deleted, including all accounts and their e-mail
  addresses.
- A comparison with other calculators and with the final game version, which
  could lead to updated game data.
- Support for Deep Ocean.
- Technical optimizations: modern image formats, optimized icons and a smaller
  download for the population page.
- A responsive layout and other modernization, once there is a reason to change
  a site that is meant to stay as it is.
- Better behavior in old browsers, for example a notice instead of an empty
  page.
- Visible credit for the "Prototype" font.
- Visitor statistics with a self-hosted Umami instance.

#### For developers

- The license changes from GPL 3 to MIT. The "Prototype" font keeps its own
  terms.
- The old PHP code is removed from the repository and stays available in the Git
  history.
- Interface images and game icons are not part of the repository or the release
  for copyright reasons, so a build needs its own copy of them in `img/`.
