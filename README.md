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

Interface images and game icons are not part of this repository for copyright
reasons. For development, unpack the private image ZIP into `img/` in the
repository root (ignored by Git) with `scripts/setup-images.sh <zip>`; the
development server serves them under `/img/`. Builds never contain them.

| Command          | Purpose                                              |
| ---------------- | ---------------------------------------------------- |
| `pnpm run dev`   | Development server                                   |
| `pnpm run test`  | Unit and component tests with coverage               |
| `pnpm run check` | ESLint, Prettier, type checks and spelling           |
| `pnpm run build` | Production build in `dist/`, one HTML file per route |

## Documentation

- [docs/rebuild-plan.md](docs/rebuild-plan.md): the rebuild from the old PHP
  application, hosting and open work
- [docs/game-data.md](docs/game-data.md): where the game data comes from and how
  it was extracted from the game files
- [docs/calculator-comparison.md](docs/calculator-comparison.md): comparison with
  other Anno 2070 calculators and the final game data
- [docs/game-tests.md](docs/game-tests.md): open questions to test in the running
  game

## License

[MIT](LICENSE.md) © Simon Lepel. The font “Prototype” comes with its own terms
in [Prototype.txt](src/static/fonts/Prototype.txt). Anno 2070 and its content
belong to Ubisoft.
