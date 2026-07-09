# Distribution & Installation

Once you have finished developing your CampusOS plugin, you need to package and distribute it for server administrators to install.

## Packaging Your Plugin

Because CampusOS uses a Unified Architecture, packaging is incredibly simple. All you need to do is zip your entire plugin folder.

```bash
cd my-plugin/
zip -r my-plugin-v1.0.0.zip .
```

Ensure that your `plugin.json` sits at the root of the extracted folder or exactly one folder deep inside the zip file.

### Documentation Standard (Required)

To ensure the CampusOS ecosystem remains healthy and collaborative, **all 3rd-party plugins should include a `docs/` folder** inside their plugin package.

Just like the core CampusOS plugins, your documentation should include:

- An overview of what your plugin does.
- Any atomic **Permissions** your plugin registers (e.g., `myplugin:manage`).
- Any **Events** your plugin emits to the `eventBus`.
- Any **Services** you expose to the `registry`.

This guarantees that if other developers want to build dependencies on _your_ plugin, they know exactly what hooks are available!

## Installing a Plugin (Server Admins)

CampusOS provides a built-in CLI Installer designed to seamlessly manage 3rd-party plugins. Server admins can install your plugin by running:

```bash
pnpm plugin:install ./path/to/my-plugin-v1.0.0.zip
```

### What happens during installation?

1. **Extraction**: The CLI unzips the archive into `plugins/my-plugin/`.
2. **NPM Dependencies**: If your plugin has a `package.json`, the CLI will merge your dependencies into the workspace.
3. **Frontend Wiring**: The CLI automatically rewrites `frontend/lib/plugins/init.ts` to include your `frontend/init.ts` React hooks. Next.js will recompile immediately to reflect your UI changes!

## Uninstalling a Plugin

Administrators can cleanly remove plugins using the CLI:

```bash
pnpm plugin:uninstall my-plugin
```

This ensures that both the backend route handlers and frontend UI components are fully eradicated, preventing orphaned code.
