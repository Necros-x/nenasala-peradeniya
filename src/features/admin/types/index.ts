export interface StudentProfile {
  id: string;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  status: "Active" | "Inactive" | "Pending Verification";
  created_at: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  programme_id: string;
  status: "Draft" | "Published" | "Archived";
  delivery_mode: "Online" | "In-house" | "Hybrid";
}
