import { Course, Instructor, Intake, Testimonial, FAQ } from "../types";

export const COURSES: Course[] = [
  {
    id: "c1",
    slug: "cyber-security-fundamentals",
    title: "Cyber Security Fundamentals",
    shortDescription: "Learn the foundations of modern cyber security and network defence.",
    description: "This comprehensive course introduces you to the core concepts of cyber security. You will learn about threat landscapes, network vulnerabilities, cryptography, and best practices for securing modern systems. Perfect for beginners looking to start a career in information security.",
    category: "Cyber Security",
    duration: "12 Weeks",
    level: "Beginner",
    instructorId: "i1",
    thumbnail: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1600",
    modules: [
      { title: "Introduction to Cyber Security", lessons: 5 },
      { title: "Network Architecture & Protocols", lessons: 7 },
      { title: "Threats, Vulnerabilities & Mitigation", lessons: 6 },
      { title: "Cryptography Basics", lessons: 4 },
      { title: "Incident Response", lessons: 5 },
    ]
  },
  {
    id: "c2",
    slug: "ccna-networking",
    title: "CCNA Networking",
    shortDescription: "Master the fundamentals of enterprise networking and routing.",
    description: "Prepare for the Cisco Certified Network Associate (CCNA) certification. This course covers networking fundamentals, IP connectivity, IP services, security fundamentals, and automation and programmability.",
    category: "Networking",
    duration: "16 Weeks",
    level: "Intermediate",
    instructorId: "i2",
    thumbnail: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&q=80&w=1600",
    modules: [
      { title: "Network Fundamentals", lessons: 8 },
      { title: "Network Access", lessons: 6 },
      { title: "IP Connectivity", lessons: 10 },
      { title: "IP Services", lessons: 5 },
      { title: "Security Fundamentals", lessons: 7 },
    ]
  },
  {
    id: "c3",
    slug: "artificial-intelligence-fundamentals",
    title: "Artificial Intelligence Fundamentals",
    shortDescription: "An introduction to AI, machine learning, and neural networks.",
    description: "Explore the fascinating world of Artificial Intelligence. Learn the basic principles of machine learning, deep learning, and how AI is transforming industries.",
    category: "Artificial Intelligence",
    duration: "10 Weeks",
    level: "Beginner",
    instructorId: "i3",
    thumbnail: "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "c4",
    slug: "web-development-bootcamp",
    title: "Modern Web Development",
    shortDescription: "Build responsive, full-stack web applications from scratch.",
    description: "A comprehensive journey through HTML, CSS, JavaScript, React, and Node.js. Build real-world projects and prepare for a career as a web developer.",
    category: "Software Development",
    duration: "24 Weeks",
    level: "All Levels",
    instructorId: "i1",
    thumbnail: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "c5",
    slug: "cloud-architecture-aws",
    title: "Cloud Architecture (AWS)",
    shortDescription: "Master cloud infrastructure and prepare for AWS certification.",
    description: "Learn to design, deploy, and manage robust, secure, and highly available cloud architectures on Amazon Web Services (AWS). From EC2 and S3 to advanced serverless computing.",
    category: "Cloud Computing",
    duration: "12 Weeks",
    level: "Intermediate",
    instructorId: "i2",
    thumbnail: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "c6",
    slug: "ui-ux-design-masterclass",
    title: "UI/UX Design Masterclass",
    shortDescription: "Create intuitive, beautiful, and user-centered digital experiences.",
    description: "Dive deep into the entire design process, from user research and wireframing to high-fidelity prototyping using Figma. Build a stunning portfolio to launch your design career.",
    category: "Design",
    duration: "10 Weeks",
    level: "Beginner",
    instructorId: "i1",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "c7",
    slug: "data-science-analytics",
    title: "Data Science & Analytics",
    shortDescription: "Turn raw data into actionable insights using Python and SQL.",
    description: "Master the skills needed to analyze large datasets. You will learn Python programming, statistical analysis, data visualization, and how to query databases with SQL.",
    category: "Data Science",
    duration: "16 Weeks",
    level: "Beginner",
    instructorId: "i3",
    thumbnail: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "c8",
    slug: "mobile-app-development",
    title: "Mobile App Development",
    shortDescription: "Build cross-platform mobile apps for iOS and Android.",
    description: "Learn React Native to build native-like mobile applications. Understand mobile UI patterns, device APIs, and app store deployment processes.",
    category: "Software Development",
    duration: "14 Weeks",
    level: "Intermediate",
    instructorId: "i1",
    thumbnail: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&q=80&w=1600",
  }
];

export const INSTRUCTORS: Instructor[] = [
  {
    id: "i1",
    slug: "dr-sarah-chen",
    name: "Dr. Sarah Chen",
    role: "Lead Security Researcher",
    bio: "Sarah has over 15 years of experience in cyber security and penetration testing. She previously worked at major tech firms securing enterprise networks.",
    expertise: ["Cyber Security", "Penetration Testing", "Cryptography"],
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "i2",
    slug: "michael-rodriguez",
    name: "Michael Rodriguez",
    role: "Senior Network Architect",
    bio: "Michael is a CCIE certified professional with a passion for teaching complex networking concepts in an accessible way.",
    expertise: ["Cisco Routing", "Network Architecture", "Cloud Infrastructure"],
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=800",
  },
  {
    id: "i3",
    slug: "dr-emily-watson",
    name: "Dr. Emily Watson",
    role: "AI Research Scientist",
    bio: "Emily holds a PhD in Machine Learning and works on applied AI solutions. She loves demystifying AI for beginners.",
    expertise: ["Machine Learning", "Neural Networks", "Data Science"],
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
  }
];

export const INTAKES: Intake[] = [
  {
    id: "int1",
    courseId: "c1",
    title: "Fall 2026 - Evening Cohort",
    startDate: "2026-09-15",
    applicationDeadline: "2026-08-30",
    status: "open"
  },
  {
    id: "int2",
    courseId: "c1",
    title: "Spring 2027 - Weekend Cohort",
    startDate: "2027-02-10",
    status: "upcoming"
  },
  {
    id: "int3",
    courseId: "c2",
    title: "Fall 2026 - Intensive Bootcamp",
    startDate: "2026-09-01",
    applicationDeadline: "2026-08-15",
    status: "closing-soon"
  },
  {
    id: "int4",
    courseId: "c4",
    title: "Summer 2026 - Full Stack",
    startDate: "2026-06-01",
    status: "full"
  }
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "t1",
    name: "James Wilson",
    courseId: "c1",
    testimonial: "The Cyber Security Fundamentals course completely changed my career trajectory. The instructors were incredibly knowledgeable and the practical labs prepared me for the real world.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "t2",
    name: "Priya Patel",
    courseId: "c2",
    testimonial: "I passed my CCNA on the first try after taking this course! Michael is a fantastic instructor who breaks down complex subnetting into easy-to-understand concepts.",
    rating: 5,
    photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400"
  }
];

export const FAQS: FAQ[] = [
  {
    id: "f1",
    category: "Enrollment",
    question: "How do I apply for a course?",
    answer: "You can apply for any open intake directly from the course page. Simply click 'Enroll Now' and follow the application instructions. Once your application is reviewed, you will receive an email with next steps."
  },
  {
    id: "f2",
    category: "Courses",
    question: "Are the courses entirely online?",
    answer: "Most of our courses are delivered fully online through our advanced Learning Management System. Some specialized courses may offer hybrid or in-person practical sessions depending on the intake."
  },
  {
    id: "f3",
    category: "Student Portal",
    question: "When do I get access to the Student LMS?",
    answer: "You will receive your Student LMS login credentials exactly one week before your intake's official start date. This allows you to explore the platform and complete orientation modules early."
  }
];

// Data Service Abstraction
export const getFeaturedCourses = () => Promise.resolve(COURSES.slice(0, 3));
export const getCourses = () => Promise.resolve(COURSES);
export const getCourseBySlug = (slug: string) => Promise.resolve(COURSES.find(c => c.slug === slug));

export const getUpcomingIntakes = () => Promise.resolve(INTAKES.filter(i => i.status !== 'closed' && i.status !== 'full'));
export const getIntakesByCourseId = (courseId: string) => Promise.resolve(INTAKES.filter(i => i.courseId === courseId));

export const getInstructors = () => Promise.resolve(INSTRUCTORS);
export const getInstructorById = (id: string) => Promise.resolve(INSTRUCTORS.find(i => i.id === id));

export const getTestimonials = () => Promise.resolve(TESTIMONIALS);
export const getFAQs = () => Promise.resolve(FAQS);
