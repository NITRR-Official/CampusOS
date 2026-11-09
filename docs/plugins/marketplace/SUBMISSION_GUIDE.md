# CampusOS Plugin Marketplace Submission & Distribution Guide

This guide details how third-party developers, student clubs, and open-source contributors can build, package, test, and distribute modular plugins for the CampusOS ecosystem.

---

## 📦 1. Package Structure Requirements

Every CampusOS plugin distributed through the community marketplace or sideloaded as a `.zip` archive must adhere to the standard package specification:

```
my-plugin.zip
├── plugin.json                 # (Required) Root manifest describing the plugin
├── package.json                # (Optional) Node/ESM dependency metadata
├── backend/                    # (Required if manifest `backend !== false`)
│   └── src/
│       ├── index.js            # Entrypoint exporting `export function init(app, registry) {}`
│       ├── routes/             # Express API route handlers
│       ├── service/            # Core business logic layer
│       ├── controller/         # Request/response validation & serialization
│       └── repository/         # Data access & persistence abstraction
├── frontend/                   # (Required if manifest `frontend !== false`)
│   ├── init.ts                 # Frontend registration entrypoint (widgets & links)
│   └── pages/                  # Page components (e.g. index.tsx)
└── dist/
    └── bundle.esm.js           # Pre-compiled browser ES module (generated via esbuild)
```

---

## 📝 2. Manifest Contract (`plugin.json`)

The manifest specifies metadata and security boundaries:

```json
{
  "name": "hackathon-portal",
  "version": "1.0.0",
  "description": "Hackathon operations, submissions judging, and live leaderboards.",
  "author": "DevClub NITRR",
  "tier": "community",
  "defaultEnabled": true,
  "capabilities": ["db:rw", "events:emit", "events:listen", "ui:slot"],
  "dependencies": {}
}
```

### Security Capabilities

Declare only the minimum permissions your plugin requires:

- `db:rw`: Direct read and write access to database collections.
- `db:r`: Read-only queries against database records.
- `events:listen`: Subscribe to system and domain lifecycle events.
- `events:emit`: Publish custom domain events via EventBus.
- `network:outbound`: Communicate with external APIs or webhooks.
- `storage:upload`: Store user-uploaded files or media assets.
- `ui:slot`: Mount widgets in dashboard slots or navigation sidebars.

---

## 🛠️ 3. Frontend Bundling

Compile your TypeScript/JSX frontend into an optimized standalone ES module without bundling duplicate host dependencies:

```bash
# Build frontend bundle into dist/bundle.esm.js
pnpm plugin:build-frontend <plugin-name> --minify
```

The bundler automatically shims:

- `react` and `react-dom` -> `window.React` & `window.ReactDOM`
- `@campusos/design-system` -> `window.CampusOS.ui`
- `lucide-react` -> `window.CampusOS.icons`
- `@campus-os/shared` -> `window.CampusOS`

---

## 🧪 4. Local Validation

Before publishing your release archive, run the built-in validator:

```bash
# Validate your plugin directory
node scripts/plugin.js validate plugins/<plugin-name> --strict

# Or validate your packaged .zip archive
node scripts/plugin.js validate ./my-plugin-1.0.0.zip
```

The validator checks:

1. Manifest schema adherence and kebab-case naming.
2. Valid SemVer version formatting.
3. Path traversal protection (Zip Slip resistance).
4. Backend entrypoint export (`init`).
5. Architectural layer separation (`routes`, `service`, `controller`).
6. Zero cross-plugin direct file imports.

---

## 🚀 5. Publishing to GitHub Releases & Submitting to Catalog

1. **Tag & Release on GitHub:**
   - Create a GitHub Release (e.g. `v1.0.0`).
   - Attach your built `my-plugin-1.0.0.zip` file as a release asset.
2. **Submit PR to the Community Catalog:**
   - Add your plugin entry to `backend/src/services/marketplace.service.js` (or submit to the centralized marketplace API):

```json
{
  "id": "hackathon-portal",
  "name": "Hackathon Hub",
  "version": "1.0.0",
  "author": "Your Team",
  "verified": true,
  "category": "Events",
  "icon": "Trophy",
  "description": "Short description of your plugin capabilities.",
  "downloadUrl": "https://github.com/YourOrg/CampusOS-Plugin/releases/download/v1.0.0/plugin.zip",
  "capabilities": ["db:rw", "events:emit"]
}
```

Once merged, your plugin will instantly appear in the CampusOS In-App Marketplace Store with 1-Click Install enabled!
