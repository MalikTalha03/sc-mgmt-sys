import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";
import { db } from "./db";
import type { Grade, GradeMarks } from "../models/grade";

const COLLECTION_NAME = "grades";

/**
 * Calculate total marks from GradeMarks
 * Standard 100-mark system: Assignments=10, Quizzes=15, Mid=25, Final=50
 */
export function calculateTotal(marks: GradeMarks): number {
    // Calculate average percentage for assignments
    let assignmentScore = 0;
    if (marks.assignments.length > 0) {
        const assignmentPercentages = marks.assignments.map((mark, i) => {
            const max = marks.maxAssignments[i] || 100;
            return (mark / max) * 100;
        });
        const avgAssignmentPercentage = assignmentPercentages.reduce((sum, p) => sum + p, 0) / assignmentPercentages.length;
        assignmentScore = (avgAssignmentPercentage / 100) * 10; // Convert to 10 marks
    }

    // Calculate average percentage for quizzes
    let quizScore = 0;
    if (marks.quizzes.length > 0) {
        const quizPercentages = marks.quizzes.map((mark, i) => {
            const max = marks.maxQuizzes[i] || 100;
            return (mark / max) * 100;
        });
        const avgQuizPercentage = quizPercentages.reduce((sum, p) => sum + p, 0) / quizPercentages.length;
        quizScore = (avgQuizPercentage / 100) * 15; // Convert to 15 marks
    }

    // Calculate mid term score out of 25
    const midScore = marks.maxMid > 0 ? (marks.mid / marks.maxMid) * 25 : 0;

    // Calculate final score out of 50
    const finalScore = marks.maxFinal > 0 ? (marks.final / marks.maxFinal) * 50 : 0;

    // Total out of 100
    return assignmentScore + quizScore + midScore + finalScore;
}

/**
 * Calculate GPA from total marks (0-100)
 */
export function calculateGPA(total: number): number {
    if (total >= 85) return 4.00;
    if (total >= 80) return 3.66;
    if (total >= 75) return 3.33;
    if (total >= 71) return 3.00;
    if (total >= 68) return 2.66;
    if (total >= 64) return 2.33;
    if (total >= 61) return 2.00;
    if (total >= 58) return 1.66;
    if (total >= 55) return 1.33;
    if (total >= 50) return 1.00;
    return 0.00;
}

/**
 * Create or update a grade
 * Note: GPA and total are calculated at runtime, not stored in database
 */
export async function setGrade(gradeData: Omit<Grade, "total" | "gpa" | "createdAt">): Promise<string> {
    try {
        // Check if grade already exists
        const existing = await getGrade(gradeData.studentId, gradeData.courseCode);

        if (existing) {
            // Update existing grade
            const q = query(
                collection(db, COLLECTION_NAME),
                where("studentId", "==", gradeData.studentId),
                where("courseCode", "==", gradeData.courseCode)
            );
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const docRef = querySnapshot.docs[0].ref;
                await updateDoc(docRef, {
                    marks: gradeData.marks,
                });
                return querySnapshot.docs[0].id;
            }
        }

        // Create new grade
        const docRef = await addDoc(collection(db, COLLECTION_NAME), {
            ...gradeData,
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error setting grade:", error);
        throw error;
    }
}

/**
 * Get a specific grade
 */
export async function getGrade(studentId: string, courseCode: string): Promise<Grade | null> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("studentId", "==", studentId),
            where("courseCode", "==", courseCode)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data() as Grade;
        }
        return null;
    } catch (error) {
        console.error("Error getting grade:", error);
        throw error;
    }
}

/**
 * Get all grades for a student
 */
export async function getGradesByStudent(studentId: string): Promise<Grade[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("studentId", "==", studentId)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data()) as Grade[];
    } catch (error) {
        console.error("Error getting grades by student:", error);
        throw error;
    }
}

/**
 * Get all grades for a course
 */
export async function getGradesByCourse(courseCode: string): Promise<Grade[]> {
    try {
        const q = query(
            collection(db, COLLECTION_NAME),
            where("courseCode", "==", courseCode)
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data()) as Grade[];
    } catch (error) {
        console.error("Error getting grades by course:", error);
        throw error;
    }
}

/**
 * Calculate student's CGPA
 * Calculates GPA for each course at runtime and returns average
 */
export async function calculateStudentCGPA(studentId: string): Promise<number> {
    try {
        const grades = await getGradesByStudent(studentId);

        if (grades.length === 0) return 0.0;

        const totalGPA = grades.reduce((sum, grade) => {
            const total = calculateTotal(grade.marks);
            const gpa = calculateGPA(total);
            return sum + gpa;
        }, 0);
        return parseFloat((totalGPA / grades.length).toFixed(2));
    } catch (error) {
        console.error("Error calculating CGPA:", error);
        throw error;
    }
}

/**
 * Delete a grade
 */
export async function deleteGrade(studentId: string, courseCode: string): Promise<void> {
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
            throw new Error("Grade not found");
        }
    } catch (error) {
        console.error("Error deleting grade:", error);
        throw error;
    }
}

/**
 * Update individual marks components
 */
export async function updateGradeMarks(
    studentId: string,
    courseCode: string,
    marksUpdate: Partial<GradeMarks>
): Promise<void> {
    try {
        const grade = await getGrade(studentId, courseCode);
        if (!grade) throw new Error("Grade not found");

        const updatedMarks = { ...grade.marks, ...marksUpdate };
        await setGrade({ studentId, courseCode, marks: updatedMarks });
    } catch (error) {
        console.error("Error updating grade marks:", error);
        throw error;
    }
}
