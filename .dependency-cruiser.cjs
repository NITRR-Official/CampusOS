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
