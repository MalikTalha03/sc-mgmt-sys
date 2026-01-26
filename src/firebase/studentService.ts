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
  orderBy,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "./db";
import type { Student } from "../models/student";

const COLLECTION_NAME = "students";

/**
 * Create a new student
 */
export async function createStudent(studentData: Omit<Student, "createdAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...studentData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating student:", error);
    throw error;
  }
}

/**
 * Get a student by ID
 */
export async function getStudentById(studentId: string): Promise<Student | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Student;
    }
    return null;
  } catch (error) {
    console.error("Error getting student:", error);
    throw error;
  }
}

/**
 * Get all students
 */
export async function getAllStudents(): Promise<Student[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    console.log(querySnapshot.docs);
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as Student[];
    
  } catch (error) {
    console.error("Error getting students:", error);
    throw error;
  }
}

/**
 * Get students by department
 */
export async function getStudentsByDepartment(departmentCode: string): Promise<Student[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("departmentCode", "==", departmentCode)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as Student[];
  } catch (error) {
    console.error("Error getting students by department:", error);
    throw error;
  }
}

/**
 * Get students by semester
 */
export async function getStudentsBySemester(semester: number): Promise<Student[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("semester", "==", semester)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      ...doc.data()
    })) as Student[];
  } catch (error) {
    console.error("Error getting students by semester:", error);
    throw error;
  }
}

/**
 * Update a student
 */
export async function updateStudent(
  studentId: string, 
  updates: Partial<Omit<Student, "studentId" | "createdAt">>
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, updates);
    } else {
      throw new Error("Student not found");
    }
  } catch (error) {
    console.error("Error updating student:", error);
    throw error;
  }
}

/**
 * Delete a student
 */
export async function deleteStudent(studentId: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    } else {
      throw new Error("Student not found");
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    throw error;
  }
}

/**
 * Update student's credit hours
 */
export async function updateStudentCreditHours(
  studentId: string, 
  creditHours: number
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("studentId", "==", studentId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, { currentCreditHours: creditHours });
    } else {
      throw new Error("Student not found");
    }
  } catch (error) {
    console.error("Error updating credit hours:", error);
    throw error;
  }
}
