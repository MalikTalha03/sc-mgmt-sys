import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import type { User } from "firebase/auth";
import { db } from "./db";
import { auth } from "./firebase";
import type { AppUser, UserRole } from "../models/user";

const COLLECTION_NAME = "users";

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  role: UserRole,
  linkedId: string = ""
): Promise<AppUser> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { uid } = userCredential.user;

    // Create user document in Firestore
    const userData: AppUser = {
      uid,
      email,
      role,
      linkedId,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, COLLECTION_NAME, uid), userData);

    return userData;
  } catch (error) {
    console.error("Error registering user:", error);
    throw error;
  }
}

/**
 * Sign in with email and password
 */
export async function loginUser(email: string, password: string): Promise<AppUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userData = await getUserByUid(userCredential.user.uid);
    
    if (!userData) {
      throw new Error("User data not found");
    }
    
    return userData;
  } catch (error) {
    console.error("Error logging in:", error);
    throw error;
  }
}

/**
 * Sign out current user
 */
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error logging out:", error);
    throw error;
  }
}

/**
 * Get user by UID
 */
export async function getUserByUid(uid: string): Promise<AppUser | null> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data() as AppUser;
    }
    return null;
  } catch (error) {
    console.error("Error getting user:", error);
    throw error;
  }
}

/**
 * Get user by linked ID (studentId or teacher id)
 */
export async function getUserByLinkedId(linkedId: string): Promise<AppUser | null> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("linkedId", "==", linkedId)
    );
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as AppUser;
    }
    return null;
  } catch (error) {
    console.error("Error getting user by linked ID:", error);
    throw error;
  }
}

/**
 * Update user role
 */
export async function updateUserRole(uid: string, role: UserRole): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await updateDoc(docRef, { role });
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

/**
 * Delete user
 */
export async function deleteUser(uid: string): Promise<void> {
  try {
    const docRef = doc(db, COLLECTION_NAME, uid);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

/**
 * Get current auth user
 */
export function getCurrentAuthUser(): User | null {
  return auth.currentUser;
}
