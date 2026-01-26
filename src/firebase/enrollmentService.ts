import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  and,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./db";
import type { Enrollment } from "../models/enrollment";

const COLLECTION_NAME = "enrollments";

/**
 * Create a new enrollment
 */
export async function createEnrollment(enrollmentData: Omit<Enrollment, "createdAt">): Promise<string> {
  try {
    // Check if enrollment already exists
    const existing = await getEnrollment(enrollmentData.studentId, enrollmentData.courseCode);
    if (existing) {
      throw new Error("Student already enrolled in this course");
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...enrollmentData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating enrollment:", error);
    throw error;
  }
}

/**
 * Get a specific enrollment
 */
export async function getEnrollment(studentId: string, courseCode: string): Promise<Enrollment | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId),
      where("courseCode", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Enrollment;
    }
    return null;
  } catch (error) {
    console.error("Error getting enrollment:", error);
    throw error;
  }
}

/**
 * Get all enrollments for a student
 */
export async function getEnrollmentsByStudent(studentId: string): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Enrollment[];
  } catch (error) {
    console.error("Error getting enrollments by student:", error);
    throw error;
  }
}

/**
 * Get all enrollments for a course
 */
export async function getEnrollmentsByCourse(courseCode: string): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("courseCode", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Enrollment[];
  } catch (error) {
    console.error("Error getting enrollments by course:", error);
    throw error;
  }
}

/**
 * Get approved enrollments for a student
 */
export async function getApprovedEnrollments(studentId: string): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Enrollment[];
  } catch (error) {
    console.error("Error getting approved enrollments:", error);
    throw error;
  }
}

/**
 * Get pending enrollments
 */
export async function getPendingEnrollments(): Promise<Enrollment[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("status", "==", "pending")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Enrollment[];
  } catch (error) {
    console.error("Error getting pending enrollments:", error);
    throw error;
  }
}

/**
 * Update enrollment status
 */
export async function updateEnrollmentStatus(
  studentId: string,
  courseCode: string,
  status: "approved" | "pending" | "rejected"
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId),
      where("courseCode", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { status });
    } else {
      throw new Error("Enrollment not found");
    }
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    throw error;
  }
}

/**
 * Delete an enrollment
 */
export async function deleteEnrollment(studentId: string, courseCode: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId),
      where("courseCode", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    } else {
      throw new Error("Enrollment not found");
    }
  } catch (error) {
    console.error("Error deleting enrollment:", error);
    throw error;
  }
}

/**
 * Count enrollments for a course
 */
export async function countCourseEnrollments(courseCode: string): Promise<number> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("courseCode", "==", courseCode),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error("Error counting course enrollments:", error);
    throw error;
  }
}
