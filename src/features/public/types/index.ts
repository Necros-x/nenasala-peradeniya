export type Course = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string;
  thumbnail?: string;
  category: string;
  duration?: string;
  level?: string;
  instructorId?: string;
  modules?: { title: string; lessons: number }[];
};

export type Instructor = {
  id: string;
  slug: string;
  name: string;
  role?: string;
  bio?: string;
  image?: string;
  expertise?: string[];
};

export type Intake = {
  id: string;
  courseId: string;
  title: string;
  startDate: string;
  applicationDeadline?: string;
  status: "open" | "closing-soon" | "upcoming" | "full" | "closed";
};

export type Testimonial = {
  id: string;
  name: string;
  photo?: string;
  courseId?: string;
  testimonial: string;
  rating?: number;
};

export type FAQ = {
  id: string;
  question: string;
  answer: string;
  category: string;
};
