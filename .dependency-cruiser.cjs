/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'no-cross-plugin-file-imports',
      comment:
        'Cross-plugin imports are forbidden in CampusOS! All cross-plugin communication must occur via registry.getService() or eventBus.emit().',
      severity: 'error',
      from: {
        path: '^plugins/([^/]+)/'
      },
      to: {
        path: '^plugins/([^/]+)/',
        pathNot: '^plugins/$1/'
      }
    },
    {
      name: 'no-plugin-to-backend-internal-imports',
      comment:
        'Plugins must not import directly from backend internals. Use @campus-os/shared or registry services.',
      severity: 'error',
      from: {
        path: '^plugins/'
      },
      to: {
        path: '^backend/'
      }
    },
    {
      name: 'no-plugin-to-scripts-imports',
      comment:
        'Plugins must not import from scripts. CLI tooling must not be a dependency of plugins.',
      severity: 'error',
      from: {
        path: '^plugins/'
      },
      to: {
        path: '^scripts/'
      }
    },
    {
      name: 'no-backend-to-scripts-imports',
      comment:
        'Backend code must not import from scripts. CLI scripts may import backend services, not vice versa.',
      severity: 'error',
      from: {
        path: '^backend/'
      },
      to: {
        path: '^scripts/'
      }
    }
  ],
  options: {
    doNotFollow: {
      path: 'node_modules'
    },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default']
    }
  }
};
