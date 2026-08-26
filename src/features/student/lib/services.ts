// Mock services layer to prepare for Supabase integration
import { 
  mockStudent, mockCourses, mockEnrollments, 
  mockAssignments, mockQuizzes, mockCertificates,
  mockAnnouncements, mockNotifications, mockEvents
} from './mock-data';
import { Course, Enrollment, Lesson } from '../types';

// Simulate network delay
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export async function getCurrentStudent() {
  await delay(500);
  return mockStudent;
}

export async function getStudentCourses() {
  await delay(500);
  return mockCourses.filter(c => mockStudent.enrolledCourses.includes(c.id));
}

export async function getCourseById(id: string): Promise<Course | undefined> {
  await delay(300);
  return mockCourses.find(c => c.id === id);
}

export async function getEnrollmentByCourse(courseId: string): Promise<Enrollment | undefined> {
  await delay(300);
  return mockEnrollments.find(e => e.studentId === mockStudent.id && e.courseId === courseId);
}

export async function getEnrolledCourses(): Promise<Enrollment[]> {
  await delay(300);
  return mockEnrollments.filter(e => e.studentId === mockStudent.id);
}

export async function getUpcomingAssignments() {
  await delay(400);
  return mockAssignments.filter(a => a.status === 'Not Submitted');
}

export async function getAllCourses() {
  await delay(300);
  return mockCourses;
}

export async function getAnnouncements() {
  await delay(300);
  return mockAnnouncements;
}

export async function getAnnouncementById(id: string) {
  await delay(300);
  return mockAnnouncements.find(a => a.id === id);
}

export async function getNotifications() {
  await delay(300);
  return mockNotifications;
}

export async function getAllAssignments() {
  await delay(400);
  return mockAssignments;
}

export async function getAssignmentById(id: string) {
  await delay(300);
  return mockAssignments.find(a => a.id === id);
}

export async function submitAssignment(id: string, content: string) {
  await delay(800);
  const assignment = mockAssignments.find(a => a.id === id);
  if (assignment) {
    assignment.status = 'Submitted';
  }
  return true;
}

export async function searchGlobal(query: string) {
  await delay(300);
  if (!query.trim()) {
    return { courses: [], lessons: [], assignments: [] };
  }
  
  const lowerQuery = query.toLowerCase();

  const courses = mockCourses.filter(c => 
    c.title.toLowerCase().includes(lowerQuery) || 
    c.description.toLowerCase().includes(lowerQuery)
  );

  const lessons: { courseId: string; courseTitle: string; lesson: Lesson }[] = [];
  mockCourses.forEach(c => {
    c.modules.forEach(m => {
      m.lessons.forEach(l => {
        if (l.title.toLowerCase().includes(lowerQuery) || (l.content && l.content.toLowerCase().includes(lowerQuery))) {
          lessons.push({ courseId: c.id, courseTitle: c.title, lesson: l });
        }
      });
    });
  });

  const assignments = mockAssignments.filter(a => 
    a.title.toLowerCase().includes(lowerQuery) || 
    a.description.toLowerCase().includes(lowerQuery)
  );

  return { courses, lessons, assignments };
}

export async function getAllQuizzes() {
  await delay(400);
  return mockQuizzes;
}

export async function getQuizById(id: string) {
  await delay(300);
  return mockQuizzes.find(q => q.id === id);
}

export async function submitQuiz(id: string, score: number) {
  await delay(600);
  const quiz = mockQuizzes.find(q => q.id === id);
  if (quiz) {
    quiz.status = score >= 60 ? 'Passed' : 'Failed';
    quiz.score = score;
  }
  return true;
}

export async function getCertificates() {
  await delay(400);
  return mockCertificates;
}

export async function updateProfile(updates: Partial<typeof mockStudent>) {
  await delay(600);
  Object.assign(mockStudent, updates);
  return mockStudent;
}

export async function markLessonComplete(courseId: string, lessonId: string) {
  await delay(500);
  console.log(`Marked lesson ${lessonId} as complete in course ${courseId}`);
  // In a real app, update DB and re-fetch progress
  return true;
}

export async function markNotificationRead(id: string) {
  await delay(200);
  const notification = mockNotifications.find(n => n.id === id);
  if (notification) {
    notification.read = true;
  }
  return true;
}

export async function markAllNotificationsRead() {
  await delay(300);
  mockNotifications.forEach(n => n.read = true);
  return true;
}

export async function getEvents() {
  await delay(400);
  // Optional: sort by date ascending
  return [...mockEvents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}
