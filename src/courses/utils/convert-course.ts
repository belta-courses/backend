import { Course } from 'src/generated/prisma/client';

export interface NoDecimalCourse extends Omit<Course, 'price'> {
  price: string;
}

export function getNoDecimalCourse(course: Course): NoDecimalCourse {
  return {
    ...course,
    price: course.price.toString(),
  };
}
