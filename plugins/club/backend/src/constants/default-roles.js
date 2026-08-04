export const DEFAULT_ROLES = [
  {
    name: 'owner',
    permissions: ['administrator'],
    hierarchyLevel: 1000,
    isTemplate: true,
    color: '#ff4d4f'
  },
  {
    name: 'admin',
    permissions: ['administrator'],
    hierarchyLevel: 100,
    isTemplate: true
  },
  {
    name: 'coordinator',
    permissions: ['member:manage'],
    hierarchyLevel: 50,
    isTemplate: true
  },
  {
    name: 'volunteer',
    permissions: [],
    hierarchyLevel: 10,
    isTemplate: true
  }
];
