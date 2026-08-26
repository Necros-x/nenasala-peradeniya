export type Student = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  enrolledCourses: string[]; // Course IDs
  joinedDate: string;
  preferences?: {
    emailAssignments: boolean;
    emailAnnouncements: boolean;
  };
};

export type CalendarEvent = {
  id: string;
  title: string;
  type: 'live_session' | 'deadline' | 'assignment';
  date: string; // ISO string
  time?: string; // e.g., "10:00 AM - 11:30 AM"
  courseTitle: string;
  description?: string;
  link?: string;
};

export type Instructor = {
  id: string;
  name: string;
  avatar?: string;
};

export type LessonType = 'video' | 'text' | 'document' | 'quiz' | 'assignment';

export type Lesson = {
  id: string;
  title: string;
  type: LessonType;
  duration?: number; // in minutes
  completed?: boolean;
  content?: string; // HTML or markdown
  videoUrl?: string; // e.g. youtube link
};

export type Module = {
  id: string;
  title: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  instructor: Instructor;
  modules: Module[];
  category: string;
  totalLessons: number;
  price?: number;
  isNew?: boolean;
};

export type Enrollment = {
  id: string;
  studentId: string;
  courseId: string;
  progress: number; // 0-100
  enrolledAt: string;
  completedLessons: number;
};

export type AssignmentStatus = 'Not Submitted' | 'Submitted' | 'Late' | 'Graded';

export type Assignment = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  description: string;
  assignedDate: string;
  deadline: string;
  status: AssignmentStatus;
  grade?: string;
};

export type QuestionType = 'multiple_choice' | 'true_false';

export type Question = {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[]; // Used for multiple_choice
  correctAnswer: string | boolean;
};

export type Quiz = {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  numberOfQuestions: number;
  timeLimit?: number; // in minutes
  status: 'Not Attempted' | 'Passed' | 'Failed';
  score?: number;
  questions?: Question[];
};

export type Certificate = {
  id: string;
  courseId: string;
  courseTitle: string;
  issueDate: string;
  certificateNumber: string;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'urgent' | 'general' | 'course';
  courseId?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'course' | 'assignment' | 'announcement' | 'system';
  link?: string;
};
