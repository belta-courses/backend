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

  // 1. Create Files
  const files = await Promise.all([
    prisma.file.create({
      data: {
        key: 'avatars/admin-avatar.jpg',
        url: 'https://example.com/avatars/admin-avatar.jpg',
        name: 'admin-avatar.jpg',
        size: 245678,
        mime_type: 'image/jpeg',
        bucket: 'belta-courses',
      },
    }),
    prisma.file.create({
      data: {
        key: 'avatars/teacher1-avatar.jpg',
        url: 'https://example.com/avatars/teacher1-avatar.jpg',
        name: 'teacher1-avatar.jpg',
        size: 198234,
        mime_type: 'image/jpeg',
        bucket: 'belta-courses',
      },
    }),
    prisma.file.create({
      data: {
        key: 'covers/course1-cover.jpg',
        url: 'https://example.com/covers/course1-cover.jpg',
        name: 'course1-cover.jpg',
        size: 512345,
        mime_type: 'image/jpeg',
        bucket: 'belta-courses',
      },
    }),
    prisma.file.create({
      data: {
        key: 'videos/intro-video.mp4',
        url: 'https://example.com/videos/intro-video.mp4',
        name: 'intro-video.mp4',
        size: 15678912,
        mime_type: 'video/mp4',
        bucket: 'belta-courses',
      },
    }),
    prisma.file.create({
      data: {
        key: 'videos/lecture1-video.mp4',
        url: 'https://example.com/videos/lecture1-video.mp4',
        name: 'lecture1-video.mp4',
        size: 25678912,
        mime_type: 'video/mp4',
        bucket: 'belta-courses',
      },
    }),
    prisma.file.create({
      data: {
        key: 'videos/lecture2-video.mp4',
        url: 'https://example.com/videos/lecture2-video.mp4',
        name: 'lecture2-video.mp4',
        size: 32456789,
        mime_type: 'video/mp4',
        bucket: 'belta-courses',
      },
    }),
  ]);

  console.log('Created files');

  // 2. Create Access Groups
  const adminGroup = await prisma.accessGroup.create({
    data: {
      name: 'Admin Group',
      description: 'Full system access',
    },
  });

  const employeeGroup = await prisma.accessGroup.create({
    data: {
      name: 'Employee Group',
      description: 'Limited administrative access',
    },
  });

  console.log('Created access groups');

  // 3. Create Permissions
  await Promise.all([
    prisma.permission.create({
      data: {
        key: 'courses.manage',
        accessGroupId: adminGroup.id,
      },
    }),
    prisma.permission.create({
      data: {
        key: 'users.manage',
        accessGroupId: adminGroup.id,
      },
    }),
    prisma.permission.create({
      data: {
        key: 'transactions.view',
        accessGroupId: adminGroup.id,
      },
    }),
    prisma.permission.create({
      data: {
        key: 'courses.view',
        accessGroupId: employeeGroup.id,
      },
    }),
  ]);

  console.log('Created permissions');

  // 4. Create Users
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@beltacourses.com',
      name: 'Admin User',
      role: 'admin',
      coverId: files[0].id,
    },
  });

  const teacher1 = await prisma.user.create({
    data: {
      email: 'teacher1@belta-courses.com',
      name: 'John Smith',
      role: 'teacher',
      coverId: files[1].id,
      bio: 'Experienced software engineer with 10+ years in web development. Passionate about teaching and helping students achieve their goals.',
    },
  });

  const teacher2 = await prisma.user.create({
    data: {
      email: 'teacher2@belta-courses.com',
      name: 'Sarah Johnson',
      role: 'teacher',
      bio: 'Full-stack developer and educator specializing in modern JavaScript frameworks and cloud technologies.',
    },
  });

  const employee1 = await prisma.user.create({
    data: {
      email: 'employee1@belta-courses.com',
      name: 'Mike Wilson',
      role: 'employee',
      accessGroupId: employeeGroup.id,
      gender: 'male',
      date_of_birth: '1995-06-20',
    },
  });

  const student1 = await prisma.user.create({
    data: {
      email: 'student1@example.com',
      name: 'Alice Brown',
      role: 'student',
    },
  });

  const student2 = await prisma.user.create({
    data: {
      email: 'student2@example.com',
      name: 'Bob Davis',
      role: 'student',
    },
  });

  const student3 = await prisma.user.create({
    data: {
      email: 'student3@example.com',
      name: 'Charlie Miller',
      role: 'student',
    },
  });

  console.log('Created users');

  // 5. Create Coupons
  const coupon1 = await prisma.coupon.create({
    data: {
      value: 'WELCOME50',
    },
  });

  const coupon2 = await prisma.coupon.create({
    data: {
      value: 'SUMMER25',
    },
  });

  console.log('Created coupons');

  // 6. Create Offers
  const offer1 = await prisma.offer.create({
    data: {
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      uses_limit: 100,
      uses_count: 25,
      value: 50,
      teacherId: teacher1.id,
    },
  });

  const offer2 = await prisma.offer.create({
    data: {
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      uses_limit: 50,
      uses_count: 10,
      value: 0.2,
      teacherId: teacher2.id,
    },
  });

  const offer3 = await prisma.offer.create({
    data: {
      value: 20,
      couponId: coupon2.id,
    },
  });

  console.log('Created offers');

  // 7. Create Courses
  const course1 = await prisma.course.create({
    data: {
      name: 'Complete Web Development Bootcamp',
      description:
        'Learn web development from scratch. Covers HTML, CSS, JavaScript, React, Node.js, and more. Perfect for beginners!',
      price: 99.99,
      status: 'published',
      publishedAt: new Date('2024-01-15'),
      coverId: files[2].id,
      introVideoId: files[3].id,
      teacherId: teacher1.id,
    },
  });

  const course2 = await prisma.course.create({
    data: {
      name: 'Advanced JavaScript Patterns',
      description:
        'Master advanced JavaScript concepts including closures, prototypes, async/await, and design patterns.',
      price: 149.99,
      status: 'published',
      publishedAt: new Date('2024-02-20'),
      teacherId: teacher2.id,
      offerId: offer2.id,
    },
  });

  const course3 = await prisma.course.create({
    data: {
      name: 'Cloud Computing Fundamentals',
      description:
        'Introduction to cloud computing with AWS, Azure, and Google Cloud Platform.',
      price: 199.99,
      status: 'draft',
      teacherId: teacher2.id,
    },
  });

  console.log('Created courses');

  // 8. Create Modules
  const module1_course1 = await prisma.module.create({
    data: {
      name: 'Introduction to Web Development',
      order: 1,
      description: 'Learn the basics of web development',
      duration: '2 hours',
      courseId: course1.id,
    },
  });

  const module2_course1 = await prisma.module.create({
    data: {
      name: 'HTML & CSS Fundamentals',
      order: 2,
      description: 'Master HTML and CSS',
      duration: '4 hours',
      courseId: course1.id,
    },
  });

  const module3_course1 = await prisma.module.create({
    data: {
      name: 'JavaScript Basics',
      order: 3,
      description: 'Learn JavaScript programming',
      duration: '6 hours',
      courseId: course1.id,
    },
  });

  const module1_course2 = await prisma.module.create({
    data: {
      name: 'Closures and Scope',
      order: 1,
      description: 'Deep dive into JavaScript closures',
      duration: '3 hours',
      courseId: course2.id,
    },
  });

  const module2_course2 = await prisma.module.create({
    data: {
      name: 'Async JavaScript',
      order: 2,
      description: 'Master promises and async/await',
      duration: '4 hours',
      courseId: course2.id,
    },
  });

  const module1_course3 = await prisma.module.create({
    data: {
      name: 'Cloud Computing Fundamentals',
      order: 1,
      description:
        'Introduction to cloud computing with AWS, Azure, and Google Cloud Platform.',
      duration: '6 hours',
      courseId: course3.id,
    },
  });

  console.log('Created modules');

  // 9. Create Lectures
  const lecture1 = await prisma.lecture.create({
    data: {
      name: 'Welcome to the Course',
      order: 1,
      description: 'Course overview and what to expect',
      duration: '10 minutes',
      content:
        'Welcome to the Complete Web Development Bootcamp! In this lecture...',
      videoId: files[4].id,
      demo: true,
      moduleId: module1_course1.id,
    },
  });

  const lecture2 = await prisma.lecture.create({
    data: {
      name: 'Setting Up Your Development Environment',
      order: 2,
      description: 'Install necessary tools and software',
      duration: '20 minutes',
      content: "Let's set up your development environment. You will need...",
      videoId: files[5].id,
      demo: false,
      moduleId: module1_course1.id,
    },
  });

  const lecture3 = await prisma.lecture.create({
    data: {
      name: 'HTML Structure',
      order: 1,
      description: 'Learn about HTML document structure',
      duration: '30 minutes',
      content: 'HTML is the foundation of web development. In this lecture...',
      demo: false,
      moduleId: module2_course1.id,
    },
  });

  const lecture4 = await prisma.lecture.create({
    data: {
      name: 'CSS Selectors',
      order: 2,
      description: 'Master CSS selectors and specificity',
      duration: '35 minutes',
      content: 'CSS selectors are crucial for styling your web pages...',
      demo: false,
      moduleId: module2_course1.id,
    },
  });

  const lecture5 = await prisma.lecture.create({
    data: {
      name: 'Variables and Data Types',
      order: 1,
      description: 'Understanding JavaScript variables',
      duration: '25 minutes',
      content: 'JavaScript variables can hold different types of data...',
      demo: true,
      moduleId: module3_course1.id,
    },
  });

  const lecture6 = await prisma.lecture.create({
    data: {
      name: 'Understanding Closures',
      order: 1,
      description: 'Deep dive into JavaScript closures',
      duration: '45 minutes',
      content:
        'Closures are one of the most powerful features in JavaScript...',
      demo: false,
      moduleId: module1_course2.id,
    },
  });

  const lecture7 = await prisma.lecture.create({
    data: {
      name: 'Cloud Computing Fundamentals',
      order: 1,
      description:
        'Introduction to cloud computing with AWS, Azure, and Google Cloud Platform.',
      duration: '6 hours',
      content: 'Cloud computing is the future of computing...',
      demo: false,
      moduleId: module1_course3.id,
    },
  });

  console.log('Created lectures');

  // 10. Create Mentorships
  await prisma.mentorship.create({
    data: {
      name: '1-on-1 Coding Mentorship',
      description:
        'Personalized mentorship sessions to help you achieve your coding goals',
      price: 100,
      duration: '1 hour',
      disabled: false,
      order: 1,
      teacherId: teacher1.id,
    },
  });

  await prisma.mentorship.create({
    data: {
      name: 'Career Guidance Session',
      description:
        'Get advice on your tech career path and job search strategies',
      price: 75,
      duration: '45 minutes',
      disabled: false,
      order: 2,
      teacherId: teacher1.id,
    },
  });

  await prisma.mentorship.create({
    data: {
      name: 'Code Review Session',
      description: 'Have your code reviewed by an experienced developer',
      price: 50,
      duration: '30 minutes',
      disabled: false,
      order: 3,
      teacherId: teacher2.id,
    },
  });

  console.log('Created mentorships');

  // 11. Create Wallets
  await Promise.all([
    prisma.wallet.create({
      data: {
        userId: teacher1.id,
        amount: 2500.5,
      },
    }),
    prisma.wallet.create({
      data: {
        userId: teacher2.id,
        amount: 1200.75,
      },
    }),
  ]);

  console.log('Created wallets');

  // 12. Create Transactions
  const transaction1 = await prisma.transaction.create({
    data: {
      studentId: student1.id,
      teacherId: course1.teacherId,
      originalPrice: course1.price,
      paidPrice: course1.price.toNumber() - offer1.value.toNumber(),
      // the offer has a teacher and doesn't have courses then its offer on all teacher courses
      // the offer value is more than 1 then it's a fixed value to be subtracted
      teacherProfitPercent: 70,
      teacherProfit: course1.price.toNumber() - offer1.value.toNumber() * 0.7,
      coupon: coupon1.value,
      offerId: offer1.id,
      courseId: course1.id,
    },
  });

  const transaction2 = await prisma.transaction.create({
    data: {
      studentId: student2.id,
      teacherId: teacher2.id,
      originalPrice: course3.price,
      // course and teacher don't have offer and the user doesn't have old transactions
      // then he take the new users offer which is offer3
      paidPrice: course3.price.toNumber() - offer3.value.toNumber(),
      teacherProfitPercent: 70,
      // the offer had be set by system not teacher, then the teacher take profit of original price
      teacherProfit: course3.price.toNumber() * 0.7,
      offerId: offer3.id,
      courseId: course3.id,
    },
  });

  const transaction3 = await prisma.transaction.create({
    data: {
      studentId: student3.id,
      teacherId: course3.teacherId,
      originalPrice: course3.price,
      // the course has an offer that is a coupon and user used the coupon
      paidPrice: course3.price.toNumber() - offer3.value.toNumber(),
      teacherProfitPercent: 70,
      // the offer had been set by the teacher, then the teacher take profit of final price
      teacherProfit: (course3.price.toNumber() - offer3.value.toNumber()) * 0.7,
      coupon: coupon2.value,
      offerId: offer3.id,
      courseId: course3.id,
    },
  });

  console.log('Created transactions');

  // 13. Create OwnedLists (Purchased Courses)
  await Promise.all([
    prisma.ownedList.create({
      data: {
        studentId: transaction1.studentId,
        courseId: transaction1.courseId!,
        transactionId: transaction1.id,
      },
    }),
    prisma.ownedList.create({
      data: {
        studentId: transaction2.studentId,
        courseId: transaction2.courseId!,
        transactionId: transaction2.id,
      },
    }),
    prisma.ownedList.create({
      data: {
        studentId: transaction3.studentId,
        courseId: transaction3.courseId!,
        transactionId: transaction3.id,
      },
    }),
  ]);

  console.log('Created owned lists');

  // 14. Create SaveLists (Wishlist)
  await Promise.all([
    prisma.saveList.create({
      data: {
        studentId: student1.id,
        courseId: course2.id,
      },
    }),
    prisma.saveList.create({
      data: {
        studentId: student2.id,
        courseId: course1.id,
      },
    }),
    prisma.saveList.create({
      data: {
        studentId: student3.id,
        courseId: course2.id,
      },
    }),
  ]);

  console.log('Created save lists');

  // 15. Create CompletedLectures
  await Promise.all([
    prisma.completedLecture.create({
      data: {
        studentId: student1.id,
        lectureId: lecture1.id,
      },
    }),
    prisma.completedLecture.create({
      data: {
        studentId: student1.id,
        lectureId: lecture2.id,
      },
    }),
    prisma.completedLecture.create({
      data: {
        studentId: student1.id,
        lectureId: lecture3.id,
      },
    }),
    prisma.completedLecture.create({
      data: {
        studentId: student3.id,
        lectureId: lecture7.id,
      },
    }),
  ]);

  console.log('Created completed lectures');

  // 16. Create Withdraws
  await Promise.all([
    prisma.withdraw.create({
      data: {
        userId: teacher1.id,
        createdAt: new Date('2024-01-30'),
        amount: 500,
      },
    }),
    prisma.withdraw.create({
      data: {
        userId: teacher1.id,
        createdAt: new Date('2024-02-28'),
        amount: 750,
      },
    }),
  ]);

  console.log('Created withdraws');

  // 17. Create Refunds
  const refund1 = await prisma.refund.create({
    data: {
      message: 'Course content did not meet my expectations',
      status: 'waiting',
      userId: student2.id,
      transactionId: transaction2.id,
    },
  });

  const refund2 = await prisma.refund.create({
    data: {
      message: 'Changed my mind about this course',
      response: 'Refund approved as per our policy',
      status: 'approved',
      reviewedAt: new Date(),
      userId: student3.id,
      transactionId: transaction3.id,
    },
  });

  prisma.ownedList.deleteMany({
    where: {
      studentId: student3.id,
      courseId: transaction3.courseId!, // FIXME: tansaction may have course or ownership
    },
  });

  console.log('Created refunds');

  // 18. Create Settings
  await Promise.all([
    prisma.setting.create({
      data: {
        key: 'teacher_profit_percent',
        value: '70',
      },
    }),
    prisma.setting.create({
      data: {
        key: 'min_withdraw_amount',
        value: '50',
      },
    }),
    prisma.setting.create({
      data: {
        key: 'support_email',
        value: 'support@belta-courses.com',
      },
    }),
  ]);

  console.log('Created settings');

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
