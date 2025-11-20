export const permissions = {
  users: {
    create: 'user:create',
    read: 'user:read',
    update: 'user:update',
    delete: 'user:delete',
  },
};

export const permissionsList = [
  {
    resource: 'Users',
    actions: [
      {
        name: 'Create',
        value: permissions.users.create,
      },
      {
        name: 'Read',
        value: permissions.users.read,
      },
      {
        name: 'Update',
        value: permissions.users.update,
      },
      {
        name: 'Delete',
        value: permissions.users.delete,
      },
    ],
  },
];
