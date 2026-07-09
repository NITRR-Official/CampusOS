# The Plugin Manifest (plugin.json)

Every plugin in CampusOS **must** contain a `plugin.json` manifest at the root of its folder.

This file is the single source of truth for the Plugin Loader. It dictates the plugin's identity, metadata, and crucially, its dependencies.

## Structure

```json
{
  "name": "recruitment",
  "version": "1.0.0",
  "description": "Handles club member applications and interviews",
  "dependencies": {
    "club": "^1.0.0",
    "auth": "^1.0.0"
  }
}
```

### Fields

| Field          | Type     | Description                                                                                                  |
| -------------- | -------- | ------------------------------------------------------------------------------------------------------------ |
| `name`         | `string` | **Required.** The unique identifier for your plugin. Must be lowercase, URL-safe, and match the folder name. |
| `version`      | `string` | **Required.** The semantic version of your plugin (e.g. `1.0.2`).                                            |
| `description`  | `string` | Optional. A short description of what your plugin does.                                                      |
| `dependencies` | `object` | Optional. A key-value map of other plugins your plugin relies on.                                            |

## Dependency Resolution & Topological Sorting

CampusOS guarantees that plugins are loaded safely.

If your plugin relies on the `club` plugin's services, you must declare it in the `dependencies` object.

```json
  "dependencies": {
    "club": "^1.2.0"
  }
```

The Plugin Loader will read this and perform a **Topological Sort** to construct a dependency graph.

- It guarantees that the `club` plugin is fully initialized _before_ your `recruitment` plugin is even required.
- If the `club` plugin is missing, or its version does not satisfy your requested `^1.2.0` semver constraint, the Plugin Loader will gracefully skip loading your plugin and log an error to the console. This prevents hard crashes in production.
