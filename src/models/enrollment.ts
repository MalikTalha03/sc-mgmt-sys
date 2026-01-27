export interface Enrollment {
  studentId: string;
  courseCode: string;
  status: "approved" | "pending" | "rejected" | "completed";
  createdAt?: any;
}
