import { Student, Course, Enrollment, Assignment, Quiz, Certificate, Announcement, Notification, CalendarEvent } from '../types';

export const mockStudent: Student = {
  id: 'st_123',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  avatar: 'https://i.pravatar.cc/150?u=alex',
  bio: 'A passionate learner interested in frontend development and UI/UX design.',
  enrolledCourses: ['c_1', 'c_2'],
  joinedDate: '2025-01-15T00:00:00Z',
  preferences: {
    emailAssignments: true,
    emailAnnouncements: false,
  }
};

export const mockCourses: Course[] = [
  {
    id: 'c_1',
    title: 'Advanced Web Development',
    description: 'Master React, Next.js, and modern frontend architecture.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=800&auto=format&fit=crop',
    category: 'Engineering',
    price: 99.99,
    isNew: false,
    instructor: {
      id: 'inst_1',
      name: 'Sarah Drasner',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    totalLessons: 24,
    modules: [
      {
        id: 'm_1',
        title: 'Introduction to Frameworks',
        lessons: [
          { id: 'l_1', title: 'Why use a framework?', type: 'video', duration: 15, completed: true, videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
          { id: 'l_2', title: 'React Basics', type: 'text', completed: true, content: 'React is a library for building user interfaces.' },
          { id: 'l_3', title: 'Setup Guide', type: 'document', completed: true },
        ],
      },
      {
        id: 'm_2',
        title: 'Component Architecture',
        lessons: [
          { id: 'l_4', title: 'Props and State', type: 'video', duration: 25, completed: false },
          { id: 'l_5', title: 'Hooks deep dive', type: 'video', duration: 45, completed: false },
          { id: 'l_6', title: 'Component Quiz', type: 'quiz', completed: false },
        ],
      },
    ],
  },
  {
    id: 'c_2',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn to design beautiful, accessible user interfaces.',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?q=80&w=800&auto=format&fit=crop',
    category: 'Design',
    price: 79.99,
    isNew: false,
    instructor: {
      id: 'inst_2',
      name: 'Gary Simon',
      avatar: 'https://i.pravatar.cc/150?u=gary',
    },
    totalLessons: 12,
    modules: [
      {
        id: 'm_3',
        title: 'Color Theory',
        lessons: [
          { id: 'l_7', title: 'Understanding HSL', type: 'video', duration: 12, completed: false },
        ],
      },
    ],
  },
  {
    id: 'c_3',
    title: 'Machine Learning Basics',
    description: 'An introduction to neural networks, models, and data science.',
    thumbnail: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=800&auto=format&fit=crop',
    category: 'Data Science',
    price: 149.99,
    isNew: true,
    instructor: {
      id: 'inst_3',
      name: 'Andrew Ng',
      avatar: 'https://i.pravatar.cc/150?u=andrew',
    },
    totalLessons: 30,
    modules: [],
  },
  {
    id: 'c_4',
    title: 'Business Communication',
    description: 'Master the art of negotiation, writing, and speaking.',
    thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=800&auto=format&fit=crop',
    category: 'Business',
    price: 49.99,
    isNew: false,
    instructor: {
      id: 'inst_4',
      name: 'Chris Voss',
      avatar: 'https://i.pravatar.cc/150?u=chris',
    },
    totalLessons: 15,
    modules: [],
  },
  {
    id: 'c_5',
    title: 'Mastering Full-Stack Next.js',
    description: 'Build production-ready apps with Next.js 14 and Server Actions.',
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=800&auto=format&fit=crop',
    category: 'Engineering',
    price: 129.99,
    isNew: true,
    instructor: {
      id: 'inst_1',
      name: 'Sarah Drasner',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
    },
    totalLessons: 40,
    modules: [],
  }
];

export const mockEnrollments: Enrollment[] = [
  {
    id: 'en_1',
    studentId: 'st_123',
    courseId: 'c_1',
    progress: 35,
    enrolledAt: '2025-01-20T00:00:00Z',
    completedLessons: 3,
  },
  {
    id: 'en_2',
    studentId: 'st_123',
    courseId: 'c_2',
    progress: 0,
    enrolledAt: '2025-02-10T00:00:00Z',
    completedLessons: 0,
  },
];

export const mockAssignments: Assignment[] = [
  {
    id: 'a_1',
    title: 'Build a Personal Portfolio',
    courseId: 'c_1',
    courseTitle: 'Advanced Web Development',
    description: 'Create a responsive personal portfolio using React and Tailwind CSS.',
    assignedDate: '2025-08-20T00:00:00Z',
    deadline: '2026-09-01T23:59:59Z',
    status: 'Not Submitted',
  },
  {
    id: 'a_2',
    title: 'Design a Login Screen',
    courseId: 'c_2',
    courseTitle: 'UI/UX Design Fundamentals',
    description: 'Use Figma to create a clean login screen.',
    assignedDate: '2025-08-15T00:00:00Z',
    deadline: '2025-08-22T23:59:59Z',
    status: 'Graded',
    grade: 'A',
  },
  {
    id: 'a_3',
    title: 'Midterm Essay on UI Patterns',
    courseId: 'c_2',
    courseTitle: 'UI/UX Design Fundamentals',
    description: 'Write a 1000-word essay comparing geometric and organic UI patterns.',
    assignedDate: '2025-08-20T00:00:00Z',
    deadline: '2025-09-15T23:59:59Z',
    status: 'Submitted',
  },
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'q_1',
    title: 'React Fundamentals Assessment',
    courseId: 'c_1',
    courseTitle: 'Advanced Web Development',
    numberOfQuestions: 5,
    timeLimit: 30,
    status: 'Not Attempted',
    questions: [
      {
        id: 'q_1_1',
        type: 'multiple_choice',
        text: 'What is the correct way to update state in a React functional component?',
        options: [
          'this.setState({value: 1})',
          'state.value = 1',
          'setMyState(1)',
          'updateState(1)'
        ],
        correctAnswer: 'setMyState(1)'
      },
      {
        id: 'q_1_2',
        type: 'true_false',
        text: 'React hooks can be called conditionally inside an if statement.',
        correctAnswer: 'False'
      },
      {
        id: 'q_1_3',
        type: 'multiple_choice',
        text: 'Which hook is used for performing side effects in functional components?',
        options: [
          'useState',
          'useEffect',
          'useContext',
          'useReducer'
        ],
        correctAnswer: 'useEffect'
      },
      {
        id: 'q_1_4',
        type: 'true_false',
        text: 'Props are read-only and cannot be modified by the receiving component.',
        correctAnswer: 'True'
      },
      {
        id: 'q_1_5',
        type: 'multiple_choice',
        text: 'What does JSX stand for?',
        options: [
          'JavaScript XML',
          'Java Syntax Extension',
          'JSON X',
          'JavaScript Execution'
        ],
        correctAnswer: 'JavaScript XML'
      }
    ]
  },
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert_1',
    courseId: 'c_x',
    courseTitle: 'JavaScript Basics',
    issueDate: '2025-06-15T00:00:00Z',
    certificateNumber: 'LMS-2025-987654',
  },
  {
    id: 'cert_2',
    courseId: 'c_1',
    courseTitle: 'Advanced Web Development',
    issueDate: '2025-07-22T00:00:00Z',
    certificateNumber: 'LMS-2025-112233',
  },
  {
    id: 'cert_3',
    courseId: 'c_2',
    courseTitle: 'UI/UX Design Fundamentals',
    issueDate: '2025-08-10T00:00:00Z',
    certificateNumber: 'LMS-2025-445566',
  }
];

export const mockAnnouncements: Announcement[] = [
  {
    id: 'ann_1',
    title: 'System Maintenance This Weekend',
    content: 'The LMS will be down for scheduled maintenance on Sunday from 2 AM to 4 AM EST.',
    author: 'System Admin',
    date: '2026-08-24T10:00:00Z',
    priority: 'urgent',
  },
  {
    id: 'ann_2',
    title: 'New React Course Material Added',
    content: 'We have updated Module 3 with new lessons on Server Components.',
    author: 'Sarah Drasner',
    date: '2026-08-20T14:30:00Z',
    priority: 'course',
    courseId: 'c_1',
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 'not_1',
    title: 'Assignment Due Soon',
    message: 'Your assignment "Build a Personal Portfolio" is due in 3 days.',
    timestamp: '2026-08-25T08:00:00Z',
    read: false,
    type: 'assignment',
  },
  {
    id: 'not_2',
    title: 'Course Completed',
    message: 'Congratulations on completing JavaScript Basics!',
    timestamp: '2025-06-15T09:00:00Z',
    read: true,
    type: 'course',
  },
];

export const mockEvents: CalendarEvent[] = [
  {
    id: 'evt_1',
    title: 'React Hooks Deep Dive Q&A',
    type: 'live_session',
    date: '2026-08-26T14:00:00Z',
    time: '2:00 PM - 3:30 PM',
    courseTitle: 'Advanced Web Development',
    description: 'Join the live Q&A session discussing advanced React hooks, performance optimization, and best practices.',
    link: '/courses/c_1'
  },
  {
    id: 'evt_2',
    title: 'Project Proposal Due',
    type: 'deadline',
    date: '2026-08-27T23:59:59Z',
    time: '11:59 PM',
    courseTitle: 'Advanced Web Development',
    description: 'Submit your final project proposal for review.'
  },
  {
    id: 'evt_3',
    title: 'Design Critique Session',
    type: 'live_session',
    date: '2026-08-30T10:00:00Z',
    time: '10:00 AM - 12:00 PM',
    courseTitle: 'UI/UX Design Fundamentals',
    description: 'Live workshop to critique the submitted wireframes.'
  },
  {
    id: 'evt_4',
    title: 'Midterm Essay on UI Patterns',
    type: 'assignment',
    date: '2026-09-02T23:59:59Z',
    time: '11:59 PM',
    courseTitle: 'UI/UX Design Fundamentals',
    description: 'Submit your essay detailing geometric vs. organic UI patterns.',
    link: '/assignments/a_3'
  }
];
