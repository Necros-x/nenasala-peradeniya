import { StudentProfile } from "../../types";

// This file abstracts data fetching, allowing the UI to remain agnostic
// of whether we're using Supabase directly, a custom API, or local mocks.

export const StudentService = {
  async getStudents(): Promise<StudentProfile[]> {
    // In the future, this will be:
    // const { data } = await supabase.from('students').select('*')
    // return data;
    
    return [
      { id: "1", registration_id: "NPU-STU-202600041", first_name: "Ramika", last_name: "Perera", email: "ramika@example.com", phone: "+94770000000", status: "Active", created_at: "2026-08-24" },
    ];
  },

  async registerStudent(data: Partial<StudentProfile>): Promise<{ success: boolean; tempPassword?: string; studentId?: string }> {
    // In the future, this might call a secure Next.js Server Action / API Route
    // to create the Auth user and insert the database record in one transaction.
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          tempPassword: "tempPassword123",
          studentId: "NPU-STU-202600099"
        });
      }, 1000);
    });
  }
}
