To do
===

Open work beyond the rebuild. None of it is promised, and the site stays usable
as it is without any of it. Agreed decisions are in
[decisions.md](decisions.md).

SRVKIST
---

The site moves from Uberspace to SRVKIST, where Caddy serves it directly. The
server side is implemented in the SRVKIST repository; this repository only
provides the build and the release artifact.

- **Caddy:** a site block for `anno2070rechner.de` with a redirect from `www.`,
  `try_files {path} {path}/index.html`, the redirects from
  [Routing](decisions.md#routing) and the 404 page. Unlike `srvkist.net`, the
  site is indexable (no `noindex`). Hashed assets are cached long-term; HTML is
  revalidated. The rules are maintained in SRVKIST, not taken from this
  repository.
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
  2. The `Publish 🚛` workflow notifies SRVKIST through an authenticated webhook
     at `hooks.srvkist.net` with the release version.
  3. SRVKIST downloads the artifact, verifies the checksum from GitHub, unpacks
     it into a new release folder and switches `current`.

  This depends on the deployment service in SRVKIST, which does not exist yet.

- **Move:** point the A and AAAA records of `anno2070rechner.de` to SRVKIST. The
  MX record stays with Uberspace, which keeps handling the mail. Afterwards the
  web folder and web domains on Uberspace are removed by hand.
- **Old statistics:** importing the old Umami statistics (website id of this
  site `4c2e9006-f449-4c9f-aec7-897bcceb1168`) is SRVKIST work and paused until
  SRVKIST is fixed, see
  `~/projects/private/srvkist/.local/handoffs/2026-11-10-0251-umami-legacy-import.md`.

Calculator
---

Optional proposals of the
[calculator comparison](calculator-comparison.md#proposed-changes), none of them
a fix:

- Show exact fractions of buildings as well, for example in a tooltip.
- A global productivity control.
- The senate ascension bonus.
- A total across all chains.
- Support for Deep Ocean, which is out of scope for now, see
  [Goals](decisions.md#goals).

Optimizations
---

- Optimize the icons losslessly. The image ZIP of 2026-11-08 in the private
  backup holds losslessly optimized versions of the same PNGs. Optimized files
  get new checksums, so `images.txt` and the images on the server change with
  them.
- A responsive layout and other modernization, once there is a reason to change
  the site, see [Goals](decisions.md#goals).
