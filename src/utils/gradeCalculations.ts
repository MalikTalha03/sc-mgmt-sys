// Grade calculation utilities
// These are helper functions for grade calculations

export interface GradeMarks {
  assignments: number[];
  quizzes: number[];
  mid: number;
  final: number;
  maxAssignments?: number[];
  maxQuizzes?: number[];
  maxMid?: number;
  maxFinal?: number;
}

// Weightage for grade calculation (matches old Firebase implementation)
const GRADE_WEIGHTAGE = {
  assignments: 0.10, 
  quizzes: 0.15,
  mid: 0.25,
  final: 0.5
};

/**
 * Calculate total marks from grade components
 */
export function calculateTotal(marks: GradeMarks): number {
  const totalAssignment = marks.assignments.reduce((a, b) => a + b, 0);
  const totalQuizzes = marks.quizzes.reduce((a, b) => a + b, 0);

  const weightedTotal =
    (totalAssignment / (marks.assignments.length || 1)) * GRADE_WEIGHTAGE.assignments * 100 +
    (totalQuizzes / (marks.quizzes.length || 1)) * GRADE_WEIGHTAGE.quizzes * 100 +
    marks.mid * GRADE_WEIGHTAGE.mid +
    marks.final * GRADE_WEIGHTAGE.final;

  return weightedTotal;
}

/**
 * Calculate GPA from total marks (0-4.0 scale)
 */
export function calculateGPA(total: number): number {
  // Convert percentage to 4.0 scale
  const gpa = (total / 100) * 4.0;
  return Math.max(0, Math.min(4.0, gpa));
}

/**
 * Calculate student CGPA from all grades
 */
export function calculateStudentCGPA(grades: Array<{ marks: GradeMarks }>): number {
  if (grades.length === 0) return 0;
  
  const totalGPA = grades.reduce((sum, grade) => {
    const total = calculateTotal(grade.marks);
    const gpa = calculateGPA(total);
    return sum + gpa;
  }, 0);
  
  return totalGPA / grades.length;
}
