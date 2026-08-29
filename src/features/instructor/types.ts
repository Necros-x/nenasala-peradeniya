import type { getInstructorDashboardData } from "@/lib/services/instructor-portal";

export type AwaitedReturn = Awaited<ReturnType<typeof getInstructorDashboardData>>;
