# Anno2070Rechner.de

A calculator and database for the game Anno 2070 by Ubisoft, online at
[anno2070rechner.de](https://anno2070rechner.de):

- **Population:** from houses or residents per faction to their demands and the
  production buildings needed to cover them.
- **Commodity chains:** every production building with all buildings it depends
  on, including alternatives, productivity and costs.
- **Database:** all production buildings, other buildings and goods, with
  search.

The site is in German and English. It is a private, non-commercial fan site.

## History

**2011 and 2012:** Anno 2070 came out in November 2011, and the calculator was
built right after it, with the same enthusiasm the game was played with. It was
a PHP application with a MySQL database, jQuery UI controls and user accounts,
first released in January 2012. Updates followed until February 2012, among them
tons per minute in the database and chains for either the exact demand of a
population or the full capacity of its buildings. Work started in March 2012 was
never finished, and the expansion Deep Ocean was never added.

**2012 to 2026:** the site kept running on Uberspace for almost 15 years,
maintained through PHP updates and server moves, with small fixes that never
made it into this repository.

**2026:** with the help of AI, the site was rebuilt as a purely static frontend
that any web server can deliver, with no server application, database or user
data left to maintain. The rebuild was compared with recordings of the old site
and matched them exactly, before bugs were fixed, the unfinished work of 2012
was completed and the game data was brought up to the final game version
3.0.8051. This is release `v2.0.0`; see the [changelog](CHANGELOG.md) for
everything that changed.

The design, the texts and the fixed 960 px layout are deliberately kept as they
have always been.

## How it works

- Pages are built once into static HTML, one file per route and language. All
  old URLs keep working.
- Population demands and commodity chains are calculated in the browser. Their
  rounding and number output follow the old PHP site exactly.
- The game data is stored as JSON in this repository, converted once from the
  old database.
- Inputs are kept as saved games in the browser's local storage. There are no
  accounts and no cookies.
- Commodity chains and the database keep their state in the URL, so links can be
  shared.
- Browsers from about 2016 on are supported through a separate legacy bundle.

## Development

The site is built with Vite, Vue.js and TypeScript. It needs Node.js 24 and
pnpm 12.

```sh
pnpm install
pnpm run dev
```

Images are not part of this repository for copyright reasons. `images.txt` lists
the ones the site uses with their checksums. `pnpm run dev` checks `img/` in the
repository root (ignored by Git) against it and downloads missing images from
the live site, which works once `v2.0.0` is live. Until then, unpack the private
image ZIP with `scripts/setup-images.sh <zip>`. The development server serves
the images under `/img/`; builds never contain them.

| Command             | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `pnpm run dev`      | Development server                                   |
| `pnpm run test`     | Unit and component tests with coverage               |
| `pnpm run check`    | ESLint, Prettier, type checks and spelling           |
| `pnpm run build`    | Production build in `dist/`, one HTML file per route |
| `pnpm images:list`  | Rewrite `images.txt` after changing images           |
| `pnpm images:check` | Compare `img/` with `images.txt`                     |

Releases are created with Changesets: merging to `main` with a pending changeset
versions, tags and publishes the release on GitHub, with the build as
`anno2070rechner.zip`.

## Documentation

- [docs/decisions.md](docs/decisions.md): the agreed decisions on behavior,
  appearance, data, images, browser support and releases
- [docs/todo.md](docs/todo.md): open work, such as the move to SRVKIST and
  optional calculator features
- [docs/hosting.md](docs/hosting.md): what a web server needs, with guides for
  Apache and Caddy
- [docs/game-data.md](docs/game-data.md): where the game data comes from and how
  it was extracted from the game files
- [docs/calculator-comparison.md](docs/calculator-comparison.md): comparison
  with other Anno 2070 calculators and the final game data
- [docs/game-tests.md](docs/game-tests.md): tests in the running game, not run,
  kept as an outline

The PHP version is available in the Git history up to `e4713a8`, the state that
last ran live.

## License

[MIT © Simon Lepel](https://simbo.mit-license.org/@2011/). Versions before
`v2.0.0` were published under GPL 3.

The font “Prototype” by Justin Callaghan comes with its own terms in
[Prototype.txt](src/static/fonts/Prototype.txt). Anno 2070 is a trademark of
Ubisoft, and its graphics and game data belong to their owners. This site is not
an official Ubisoft offering.
