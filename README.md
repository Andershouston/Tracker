# DM Initiative Tracker

A lightweight, local-first D&D encounter tracker for running initiative, hit points, effects, notes, rosters, and combat from a browser. It is a static React and TypeScript application built with Radix UI and Radix Colors.

The tracker has no application server, account system, analytics, or hosted database. Encounter data is stored in the browser on the user's machine.

## Features

- Encounter staging and active-combat workflows
- Initiative rolling, sorting, drag reordering, rounds, and turn navigation
- Current, maximum, and temporary HP
- Damage, healing, death saves, stabilization, and revival
- Timed and manually managed conditions and effects
- Encounter notes, entity notes, session notes, and a combat log
- A reusable player and creature roster
- Encounter import/export and full-data backups
- User-managed JSON content packs for effects, creatures, and spells
- Separate D&D 2014 and 2024 ruleset identifiers
- Installable PWA shell with offline support after the first successful load

## Requirements

- [Node.js](https://nodejs.org/) 20 or newer
- npm, which is included with Node.js
- A current version of Chrome, Edge, Firefox, or Safari

No API keys or environment variables are required.

## Download and run locally

Clone the repository and install its exact locked dependencies:

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
npm ci
npm run dev
```

Open [http://localhost:7823](http://localhost:7823). The development server listens on the local network as well, so only run it on a network you trust.

If you downloaded a ZIP from GitHub instead, extract it, open a terminal in the extracted folder, and run the same `npm ci` and `npm run dev` commands.

## Production build

Create an optimized static build with:

```bash
npm run build
```

The deployable site is written to `dist/`. Test that build locally with:

```bash
npm run preview
```

Then open [http://localhost:7823](http://localhost:7823).

### Hosting

Deploy the contents of `dist/` to a static HTTPS host such as Cloudflare Pages, Netlify, Vercel, an S3-compatible static host, or a conventional web server. Recommended provider settings are:

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Publish/output directory | `dist` |
| Node version | `20` or newer |

The current application uses root-relative asset URLs, so deploy it at the root of a domain or subdomain, such as `https://tracker.example.com/`. Hosting it under a nested path such as `https://example.com/tracker/` requires updating the asset base paths first.

HTTPS is strongly recommended. Browser storage persistence, service workers, installation, and offline behavior are most reliable in a secure context. `localhost` is treated as secure for local development.

## How local data works

The app stores encounters, roster entries, notes, settings, and installed content packs in IndexedDB for the exact site origin where the app is opened. This has several important consequences:

- Deployments at different domains do not share data.
- Different browsers and browser profiles do not share data.
- Private/incognito windows may discard data when closed.
- Clearing site data removes the tracker's local data.
- Updating or redeploying the app normally preserves data as long as the domain remains the same.

Use **DM → Export all data** regularly. The resulting JSON file can be restored through **DM → Import encounter or backup**. Encounter-only exports are also available when a smaller file is appropriate.

The app requests persistent browser storage when supported, but backups remain the safest protection against browser cleanup or device loss.

## Content packs

Open **Library** to install, import, edit, export, or remove local JSON packs. Included examples are:

- [`content-packs/example-pack.json`](content-packs/example-pack.json)
- [`content-packs/dnd-2014-srd-conditions.json`](content-packs/dnd-2014-srd-conditions.json)
- [`content-packs/initiative-tracker-2014-effects.json`](content-packs/initiative-tracker-2014-effects.json)

Pack metadata uses:

- `sourceVersion`
- `rulesetCompatibility`
- `requiredAttribution`

There is intentionally no official/homebrew flag. A person compiling or sharing a pack is responsible for ensuring they have permission to distribute its text and artwork and for supplying any required attribution.

Content imported into an encounter is snapshotted. Editing or uninstalling its source pack later does not silently rewrite an encounter already in progress.

## Development commands

```bash
# Start the development server
npm run dev

# Run the test suite once
npm test

# Run tests while editing
npm run test:watch

# Type-check and create a production build
npm run build

# Preview the production build
npm run preview
```

GitHub Actions runs `npm ci`, `npm test`, and `npm run build` for pushes to `main` and for pull requests.

## Project structure

```text
content-packs/       Importable and built-in JSON content packs
public/              PWA files and SVG icon assets
src/app/             Main application orchestration
src/components/      UI components and encounter interactions
src/content/         Content-pack normalization and validation
src/data/            IndexedDB persistence, backup, and migration
src/domain/          Encounter rules and state transitions
PRD.md               Product requirements and UX decisions
PRODUCT.md           Product and architecture context
legacy.html          Preserved original single-file application
```

## Browser and PWA troubleshooting

- If an update appears stale, close all tracker tabs and reload the site. As a last resort, remove the site's service worker through browser developer tools and reload. Export a backup before clearing any site storage.
- If data appears missing, confirm that you are using the same URL, browser, and browser profile as before.
- If PWA installation is unavailable, confirm the deployed site uses HTTPS and that the manifest and service worker are reachable.
- If a JSON pack is rejected, compare it with `content-packs/example-pack.json` and check the required schema fields.

## Publishing this repository

This folder is ready to initialize as a Git repository:

```bash
git init
git add .
git commit -m "Initial public release"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Before publishing, replace the placeholder repository URL above and choose a software license. No `LICENSE` file is included because selecting the rights granted to other people is a project-owner decision. Content-pack attribution and third-party asset rights should be reviewed separately from the application's software license.

## Privacy and security

This is a client-only application. It does not transmit tracker data to an application backend. A hosting provider will still receive ordinary web requests for the static files and may retain standard access logs according to that provider's policy.

Do not import JSON files from sources you do not trust without reviewing them. Imported content is treated as data, but its provenance and licensing remain the user's responsibility.
