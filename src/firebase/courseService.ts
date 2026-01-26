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
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./db";
import type { Course } from "../models/course";

const COLLECTION_NAME = "courses";

/**
 * Create a new course
 */
export async function createCourse(courseData: Omit<Course, "createdAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...courseData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

/**
 * Get a course by code
 */
export async function getCourseByCode(courseCode: string): Promise<Course | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...doc.data() } as Course;
    }
    return null;
  } catch (error) {
    console.error("Error getting course:", error);
    throw error;
  }
}

/**
 * Get all courses
 */
export async function getAllCourses(): Promise<Course[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => doc.data()) as Course[];
  } catch (error) {
    console.error("Error getting courses:", error);
    throw error;
  }
}

/**
 * Get courses by department
 */
export async function getCoursesByDepartment(departmentCode: string): Promise<Course[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("departmentCode", "==", departmentCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Course[];
  } catch (error) {
    console.error("Error getting courses by department:", error);
    throw error;
  }
}

/**
 * Get courses by semester
 */
export async function getCoursesBySemester(semester: number): Promise<Course[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("semester", "==", semester)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Course[];
  } catch (error) {
    console.error("Error getting courses by semester:", error);
    throw error;
  }
}

/**
 * Update a course
 */
export async function updateCourse(
  courseCode: string, 
  updates: Partial<Omit<Course, "code" | "createdAt">>
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, updates);
    } else {
      throw new Error("Course not found");
    }
  } catch (error) {
    console.error("Error updating course:", error);
    throw error;
  }
}

/**
 * Delete a course
 */
export async function deleteCourse(courseCode: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", courseCode)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    } else {
      throw new Error("Course not found");
    }
  } catch (error) {
    console.error("Error deleting course:", error);
    throw error;
  }
}
