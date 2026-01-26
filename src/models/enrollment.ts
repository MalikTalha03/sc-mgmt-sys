export interface Enrollment {
  studentId: string;
  courseCode: string;
  status: "approved" | "pending" | "rejected";
  createdAt?: any;
}
