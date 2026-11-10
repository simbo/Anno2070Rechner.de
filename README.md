# Anno2070Rechner.de

A calculator and database for the game Anno 2070 by Ubisoft, online at
[anno2070rechner.de](https://anno2070rechner.de) since 2011:

- **Population:** from houses or residents per faction to their demands and the
  production buildings needed to cover them.
- **Commodity chains:** every production building with all buildings it depends
  on, including alternatives, productivity and costs.
- **Database:** all production buildings, other buildings and goods, with
  search.

The site is in German and English. It is a private, non-commercial fan site.

## Development

The site is a static frontend built with Vite, Vue.js and TypeScript. It needs
Node.js 24 and pnpm 12.

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

## Documentation

- [docs/rebuild-plan.md](docs/rebuild-plan.md): the rebuild from the old PHP
  application and open work
- [docs/hosting.md](docs/hosting.md): what a web server needs, with guides for
  Apache and Caddy
- [docs/game-data.md](docs/game-data.md): where the game data comes from and how
  it was extracted from the game files
- [docs/calculator-comparison.md](docs/calculator-comparison.md): comparison
  with other Anno 2070 calculators and the final game data
- [docs/game-tests.md](docs/game-tests.md): tests in the running game, not run,
  kept as an outline

## License

[MIT © Simon Lepel](https://simbo.mit-license.org/@2011/)

The font “Prototype” comes with its own terms in
[Prototype.txt](src/static/fonts/Prototype.txt). Anno 2070 and its content
belong to Ubisoft.
