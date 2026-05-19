# CampusOS Frontend

This is the frontend application for [CampusOS](https://github.com/NITRR-Official/CampusOS), built using Next.js, React, and Tailwind CSS.

## 🚀 Quick Start

### Prerequisites

- Node.js v18.0.0+
- pnpm v10.0.0+

### Installation & Development

The frontend is part of the CampusOS monorepo. Ensure you have installed dependencies from the root directory.

```bash
# Navigate to the frontend directory
cd frontend

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📁 Structure

- `app/` - Next.js App Router pages and layouts.
- `components/` - Reusable UI components (buttons, cards, modals).
- `lib/` - API clients, utility functions, and shared logic.
- `../docs/frontend/` - Frontend-specific documentation (e.g., [Design System](../docs/frontend/DESIGN_SYSTEM.md), [Dark Mode](../docs/frontend/DARK_MODE.md)).

## 🎨 Design System

CampusOS uses a custom design system based on Tailwind CSS.
For details on colors, typography, spacing, and component guidelines, please see the **[Design System Documentation](../docs/frontend/DESIGN_SYSTEM.md)**.

## 🌙 Dark Mode

Dark mode is supported out of the box using Tailwind's `dark:` classes.
See the **[Dark Mode Guide](../docs/frontend/DARK_MODE.md)** for implementation details.

## 🛠️ Building for Production

```bash
pnpm build
pnpm start
```

## 🤝 Contributing

Before contributing, please review the root [CONTRIBUTING.md](../CONTRIBUTING.md) guide and the [Code of Conduct](../CODE_OF_CONDUCT.md). Ensure that your UI components follow the established Design System.
