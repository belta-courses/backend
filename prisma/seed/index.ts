import { PrismaClient } from 'src/generated/prisma/client';
import { seedUsers } from './users-seed';
import { seedCourses } from './courses-seed';
import { PrismaPg } from '@prisma/adapter-pg';

import dotenv from 'dotenv';
dotenv.config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL || '',
});
const prisma = new PrismaClient({ adapter });

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

  // Seed users (access groups, permissions, users)
  await seedUsers(prisma);

  // Seed courses (courses, modules, lectures)
  await seedCourses(prisma);

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
