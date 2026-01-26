export interface Admin {
  adminId: string;
  name: string;
  email: string;
  role: "superadmin" | "admin";
  createdAt?: any;
}
