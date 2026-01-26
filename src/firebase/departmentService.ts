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
import type { Department } from "../models/department";

const COLLECTION_NAME = "departments";

/**
 * Create a new department
 */
export async function createDepartment(departmentData: Omit<Department, "createdAt">): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...departmentData,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error creating department:", error);
    throw error;
  }
}

/**
 * Get a department by code
 */
export async function getDepartmentByCode(code: string): Promise<Department | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", code)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { ...doc.data() } as Department;
    }
    return null;
  } catch (error) {
    console.error("Error getting department:", error);
    throw error;
  }
}

/**
 * Get all departments
 */
export async function getAllDepartments(): Promise<Department[]> {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    return querySnapshot.docs.map(doc => doc.data()) as Department[];
  } catch (error) {
    console.error("Error getting departments:", error);
    throw error;
  }
}

/**
 * Get active departments only
 */
export async function getActiveDepartments(): Promise<Department[]> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data()) as Department[];
  } catch (error) {
    console.error("Error getting active departments:", error);
    throw error;
  }
}

/**
 * Update a department
 */
export async function updateDepartment(
  code: string, 
  updates: Partial<Omit<Department, "code" | "createdAt">>
): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", code)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await updateDoc(docRef, updates);
    } else {
      throw new Error("Department not found");
    }
  } catch (error) {
    console.error("Error updating department:", error);
    throw error;
  }
}

/**
 * Delete a department
 */
export async function deleteDepartment(code: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("code", "==", code)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const docRef = querySnapshot.docs[0].ref;
      await deleteDoc(docRef);
    } else {
      throw new Error("Department not found");
    }
  } catch (error) {
    console.error("Error deleting department:", error);
    throw error;
  }
}

/**
 * Toggle department active status
 */
export async function toggleDepartmentStatus(code: string): Promise<void> {
  try {
    const department = await getDepartmentByCode(code);
    if (!department) throw new Error("Department not found");
    
    await updateDepartment(code, { isActive: !department.isActive });
  } catch (error) {
    console.error("Error toggling department status:", error);
    throw error;
  }
}
