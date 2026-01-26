/**
 * Script to create an admin user
 * Run this in the browser console or create a temporary page to execute
 */

import { registerUser } from "../firebase/authService";

export async function createAdminUser() {
  const email = "admin@school.com";
  const password = "admin123";
  const role = "admin";

  try {
    const user = await registerUser(email, password, role, "");
    console.log("Admin user created successfully:", user);
    return user;
  } catch (error: any) {
    if (error.code === "auth/email-already-in-use") {
      console.log("Admin user already exists. You can login with:");
      console.log("Email: admin@school.com");
      console.log("Password: admin123");
    } else {
      console.error("Error creating admin:", error);
    }
    throw error;
  }
}
