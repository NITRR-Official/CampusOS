export function registerClubPermissions(registry) {
  if (!registry.permissions) return;

  registry.permissions.register({
    id: 'club:manage',
    module: 'club',
    label: 'Manage Club Settings',
    description:
      'Allows editing core club details like description and category'
  });

  registry.permissions.register({
    id: 'member:manage',
    module: 'club',
    label: 'Manage Members',
    description: 'Allows kicking members and assigning basic roles'
  });

  registry.permissions.register({
    id: 'role:manage',
    module: 'club',
    label: 'Manage Roles',
    description: 'Allows creating custom roles and editing the role hierarchy'
  });
}
