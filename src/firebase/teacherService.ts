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
import type { Teacher } from "../models/teacher";

const COLLECTION_NAME = "teachers";

/**
 * Create a new teacher
 */
export async function createTeacher(teacherData: Omit<Teacher, "id" | "createdAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...teacherData,
      assignedCourses: teacherData.assignedCourses || [],
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating teacher:", error);
    throw error;
  }
}

/**
 * Get a teacher by ID
 */
export async function getTeacherById(teacherId: string): Promise<Teacher | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, teacherId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { ...docSnap.data(), id: docSnap.id } as Teacher;
    }
    return null;
  } catch (error) {
    console.error("Error getting teacher:", error);
    throw error;
  }
}

/**
 * Get all teachers
 */
export async function getAllTeachers(): Promise<Teacher[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Teacher[];
  } catch (error) {
    console.error("Error getting teachers:", error);
    throw error;
  }
}

/**
 * Get teachers by department
 */
export async function getTeachersByDepartment(departmentCode: string): Promise<Teacher[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("departmentCode", "==", departmentCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    })) as Teacher[];
  } catch (error) {
    console.error("Error getting teachers by department:", error);
    throw error;
  }
}

/**
 * Update a teacher
 */
export async function updateTeacher(
  teacherId: string, 
  updates: Partial<Omit<Teacher, "id" | "createdAt">>
): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, teacherId);
    await updateDoc(docRef, updates);
  } catch (error) {
    console.error("Error updating teacher:", error);
    throw error;
  }
}

/**
 * Delete a teacher
 */
export async function deleteTeacher(teacherId: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, teacherId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting teacher:", error);
    throw error;
  }
}

/**
 * Assign a course to a teacher
 */
export async function assignCourseToTeacher(
  teacherId: string, 
  courseCode: string
): Promise<void> {
  try {
    const teacher = await getTeacherById(teacherId);
    if (!teacher) throw new Error("Teacher not found");
    
    const assignedCourses = teacher.assignedCourses || [];
    if (!assignedCourses.includes(courseCode)) {
      assignedCourses.push(courseCode);
      await updateTeacher(teacherId, { assignedCourses });
    }
  } catch (error) {
    console.error("Error assigning course to teacher:", error);
    throw error;
  }
}

/**
 * Remove a course from a teacher
 */
export async function removeCourseFromTeacher(
  teacherId: string, 
  courseCode: string
): Promise<void> {
  try {
    const teacher = await getTeacherById(teacherId);
    if (!teacher) throw new Error("Teacher not found");
    
    const assignedCourses = (teacher.assignedCourses || []).filter(code => code !== courseCode);
    await updateTeacher(teacherId, { assignedCourses });
  } catch (error) {
    console.error("Error removing course from teacher:", error);
    throw error;
  }
}
