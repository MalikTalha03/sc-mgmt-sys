export type UserRole = "admin" | "student" | "teacher";

export interface AppUser {
  uid: string;
  email: string;
  role: UserRole;
  linkedId: string; // studentId for students, teacher document id for teachers, empty for admin
  createdAt?: any;
}
