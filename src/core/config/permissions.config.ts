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

  // Courses
  COURSES_FULL_ACCESS = 'courses:full-access',
  COURSES_CREATE = 'courses:create',
  COURSES_READ = 'courses:read',
  COURSES_UPDATE = 'courses:update',
  COURSES_DELETE = 'courses:delete',

  // Modules
  MODULES_FULL_ACCESS = 'modules:full-access',
  MODULES_CREATE = 'modules:create',
  MODULES_READ = 'modules:read',
  MODULES_UPDATE = 'modules:update',
  MODULES_DELETE = 'modules:delete',

  // Lectures
  LECTURES_FULL_ACCESS = 'lectures:full-access',
  LECTURES_CREATE = 'lectures:create',
  LECTURES_READ = 'lectures:read',
  LECTURES_UPDATE = 'lectures:update',
  LECTURES_DELETE = 'lectures:delete',
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
