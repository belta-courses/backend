import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seeding...');

  // Clean existing data (in reverse order of dependencies)
  await prisma.completedLecture.deleteMany();
  await prisma.saveList.deleteMany();
  await prisma.ownedList.deleteMany();
  await prisma.withdraw.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.mentorship.deleteMany();
  await prisma.lecture.deleteMany();
  await prisma.module.deleteMany();
  await prisma.course.deleteMany();
  await prisma.offer.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.user.deleteMany();
  await prisma.accessGroup.deleteMany();
  await prisma.file.deleteMany();
  await prisma.setting.deleteMany();

  console.log('Cleared existing data');

  // Access Groups
  const fullAccessGroup = await prisma.accessGroup.create({
    data: {
      name: 'Full Access',
      description: 'All permissions',
    },
  });

  const usersViewGroup = await prisma.accessGroup.create({
    data: {
      name: 'Users View',
      description: 'View users only',
    },
  });

  const rolesFullAccessGroup = await prisma.accessGroup.create({
    data: {
      name: 'Roles Full Access',
      description: 'Full access to access groups',
    },
  });

  await prisma.permission.createMany({
    data: [
      {
        key: 'users:full-access',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'users:create',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'users:read',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'users:update',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'users:delete',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:full-access',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:create',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:read',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:update',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:delete',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:assign',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'access-groups:unassign',
        accessGroupId: fullAccessGroup.id,
      },
      {
        key: 'users:read',
        accessGroupId: usersViewGroup.id,
      },
      {
        key: 'access-groups:full-access',
        accessGroupId: rolesFullAccessGroup.id,
      },
    ],
  });

  console.log('Created access groups and permissions');

  // Users
  await prisma.user.create({
    data: {
      email: 'student@beltacrourses.com',
      name: 'Belta Student',
      role: 'student',
    },
  });

  await prisma.user.create({
    data: {
      email: 'teacher@beltacrourses.com',
      name: 'Belta Teacher',
      role: 'teacher',
      bio: 'Belta Teacher focuses on practical web development.\nTeaches modern frontend and backend workflows.\nGuides students through real projects and feedback.',
    },
  });

  await prisma.user.create({
    data: {
      email: 'admin@beltacrourses.com',
      name: 'Belta Admin',
      role: 'admin',
    },
  });

  await prisma.user.create({
    data: {
      email: 'employee@beltacrourses.com',
      name: 'Belta Employee',
      role: 'employee',
      accessGroupId: fullAccessGroup.id,
      gender: 'male',
      date_of_birth: '1995-06-20',
    },
  });

  console.log('Created users');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
