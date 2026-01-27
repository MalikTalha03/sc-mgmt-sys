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
import { getStudentById, updateStudentCreditHours } from "./studentService";
import { getCourseByCode } from "./courseService";

const COLLECTION_NAME = "enrollments";

/**
 * Create a new enrollment with credit hour validation
 */
export async function createEnrollment(enrollmentData: Omit<Enrollment, "createdAt">): Promise<string> {
  try {
    // Check if enrollment already exists
    const existing = await getEnrollment(enrollmentData.studentId, enrollmentData.courseCode);
    if (existing) {
      // Allow re-application only if the previous enrollment was rejected or completed
      if (existing.status === "rejected" || existing.status === "completed") {
        // Delete the old enrollment so a new one can be created
        await deleteEnrollment(enrollmentData.studentId, enrollmentData.courseCode);
      } else if (existing.status === "pending") {
        throw new Error("Enrollment request already pending for this course");
      } else if (existing.status === "approved") {
        throw new Error("Student already enrolled in this course");
      }
    }

    // Get student and course to validate credit hours
    const student = await getStudentById(enrollmentData.studentId);
    const course = await getCourseByCode(enrollmentData.courseCode);

    if (!student) {
      throw new Error("Student not found");
    }

    if (!course) {
      throw new Error("Course not found");
    }

    // Check if student has enough credit hours available
    const availableCreditHours = student.maxCreditHours - student.currentCreditHours;
    if (course.creditHours > availableCreditHours) {
      throw new Error(`Not enough credit hours available. Required: ${course.creditHours}, Available: ${availableCreditHours}`);
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
 * Get a specific enrollment (prioritizes active enrollments over completed/rejected)
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
      // Prioritize: approved > pending > rejected > completed
      const enrollments = querySnapshot.docs.map(doc => doc.data() as Enrollment);
      const priority = ["approved", "pending", "rejected", "completed"];
      enrollments.sort((a, b) => priority.indexOf(a.status) - priority.indexOf(b.status));
      return enrollments[0];
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
 * Complete all approved enrollments for a student (used when upgrading semester)
 * This marks all approved enrollments as completed
 */
export async function completeAllEnrollmentsForStudent(studentId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId),
      where("status", "==", "approved")
    );
    const querySnapshot = await getDocs(q);
    
    const updatePromises = querySnapshot.docs.map(doc => 
      updateDoc(doc.ref, { status: "completed" })
    );
    
    await Promise.all(updatePromises);
    console.log(`Completed ${querySnapshot.docs.length} enrollments for student ${studentId}`);
  } catch (error) {
    console.error("Error completing enrollments:", error);
    throw error;
  }
}

/**
 * Get all enrollments (with id included)
 */
export async function getAllEnrollments(): Promise<(Enrollment & { id: string })[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as (Enrollment & { id: string })[];
  } catch (error) {
    console.error("Error getting all enrollments:", error);
    throw error;
  }
}

/**
 * Update enrollment status and manage credit hours
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
      const currentEnrollment = querySnapshot.docs[0].data() as Enrollment;
      const previousStatus = currentEnrollment.status;
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { status });

      // Update credit hours based on status change
      const student = await getStudentById(studentId);
      const course = await getCourseByCode(courseCode);
      
      if (student && course) {
        let newCreditHours = student.currentCreditHours;
        
        // If approving enrollment, add credit hours
        if (status === "approved" && previousStatus !== "approved") {
          newCreditHours = student.currentCreditHours + course.creditHours;
        }
        // If changing from approved to something else, subtract credit hours
        else if (previousStatus === "approved" && status !== "approved") {
          newCreditHours = Math.max(0, student.currentCreditHours - course.creditHours);
        }
        
        if (newCreditHours !== student.currentCreditHours) {
          await updateStudentCreditHours(studentId, newCreditHours);
        }
      }
    } else {
      throw new Error("Enrollment not found");
    }
  } catch (error) {
    console.error("Error updating enrollment status:", error);
    throw error;
  }
}

/**
 * Delete all enrollments for a student+course combination and update credit hours if any was approved
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
      // Check if any enrollment was approved (for credit hour adjustment)
      const hasApproved = querySnapshot.docs.some(doc => 
        (doc.data() as Enrollment).status === "approved"
      );
      
      // If any enrollment was approved, subtract credit hours (only once)
      if (hasApproved) {
        const student = await getStudentById(studentId);
        const course = await getCourseByCode(courseCode);
        
        if (student && course) {
          const newCreditHours = Math.max(0, student.currentCreditHours - course.creditHours);
          await updateStudentCreditHours(studentId, newCreditHours);
        }
      }
      
      // Delete ALL matching documents (clean up duplicates)
      const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
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

/**
 * Clean up duplicate enrollments - keeps only one enrollment per student+course combination
 * Priority: approved > pending > rejected > completed (keeps the highest priority one)
 */
export async function cleanupDuplicateEnrollments(): Promise<number> {
  try {
    console.log("Starting enrollment cleanup...");
    
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const allDocs = querySnapshot.docs;
    
    console.log(`Found ${allDocs.length} total enrollment documents`);
    
    // Group by studentId + courseCode
    const groups: Map<string, { ref: any; data: Enrollment }[]> = new Map();
    
    allDocs.forEach(doc => {
      const data = doc.data() as Enrollment;
      const key = `${data.studentId}|${data.courseCode}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push({ ref: doc.ref, data });
    });
    
    // Find duplicates and delete extras
    const priority = ["approved", "pending", "rejected", "completed"];
    let deletedCount = 0;
    
    for (const [key, docs] of groups) {
      if (docs.length > 1) {
        console.log(`Found ${docs.length} duplicates for: ${key}`);
        
        // Sort by priority - keep the first one (highest priority)
        docs.sort((a, b) => priority.indexOf(a.data.status) - priority.indexOf(b.data.status));
        
        const toDelete = docs.slice(1);
        
        for (const doc of toDelete) {
          console.log(`  Deleting: ${doc.data.status}`);
          await deleteDoc(doc.ref);
          deletedCount++;
        }
      }
    }
    
    console.log(`Cleanup complete! Deleted ${deletedCount} duplicate enrollments.`);
    return deletedCount;
  } catch (error) {
    console.error("Error during cleanup:", error);
    throw error;
  }
}
