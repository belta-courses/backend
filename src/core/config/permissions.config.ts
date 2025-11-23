export enum Permission {
  // Users
  USERS_FULL_ACCESS = 'users:full-access',
  USERS_CREATE = 'users:create',
  USERS_READ = 'users:read',
  USERS_UPDATE = 'users:update',
  USERS_DELETE = 'users:delete',

  // Access Groups
  ACCESS_GROUPS_FULL_ACCESS = 'access-groups:full-access',
  ACCESS_GROUPS_CREATE = 'access-groups:create',
  ACCESS_GROUPS_READ = 'access-groups:read',
  ACCESS_GROUPS_UPDATE = 'access-groups:update',
  ACCESS_GROUPS_DELETE = 'access-groups:delete',
  ACCESS_GROUPS_ASSIGN = 'access-groups:assign',
  ACCESS_GROUPS_UNASSIGN = 'access-groups:unassign',
}

export const permissionsList = [
  {
    resource: 'Users',
    actions: [
      {
        name: 'Full Access',
        value: Permission.USERS_FULL_ACCESS,
      },
      {
        name: 'Create',
        value: Permission.USERS_CREATE,
      },
      {
        name: 'Read',
        value: Permission.USERS_READ,
      },
      {
        name: 'Update',
        value: Permission.USERS_UPDATE,
      },
      {
        name: 'Delete',
        value: Permission.USERS_DELETE,
      },
    ],
  },
  {
    resource: 'Access Groups',
    actions: [
      {
        name: 'Full Access',
        value: Permission.ACCESS_GROUPS_FULL_ACCESS,
      },
      {
        name: 'Create',
        value: Permission.ACCESS_GROUPS_CREATE,
      },
      {
        name: 'Read',
        value: Permission.ACCESS_GROUPS_READ,
      },
      {
        name: 'Update',
        value: Permission.ACCESS_GROUPS_UPDATE,
      },
      {
        name: 'Delete',
        value: Permission.ACCESS_GROUPS_DELETE,
      },
      {
        name: 'Assign Employee',
        value: Permission.ACCESS_GROUPS_ASSIGN,
      },
      {
        name: 'Unassign Employee',
        value: Permission.ACCESS_GROUPS_UNASSIGN,
      },
    ],
  },
];
