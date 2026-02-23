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

/**
 * Calculate weighted total percentage from raw GradeItem records (backend data).
 * Weightage: assignments 10%, quizzes 15%, midterm 25%, final 50%.
 * Each category is first normalised to a 0-100 percentage then weighted.
 */
export function calculateTotalFromItems(
  items: Array<{ category: string; obtained_marks: number; max_marks: number }>
): number {
  const assignments = items.filter(i => i.category === 'assignment');
  const quizzes    = items.filter(i => i.category === 'quiz');
  const midterm    = items.find(i => i.category === 'midterm');
  const final      = items.find(i => i.category === 'final');

  const pct = (obtained: number, max: number) => (max > 0 ? (obtained / max) * 100 : 0);

  const assignmentPct = assignments.length > 0
    ? pct(
        assignments.reduce((s, i) => s + i.obtained_marks, 0),
        assignments.reduce((s, i) => s + i.max_marks, 0)
      )
    : 0;

  const quizPct = quizzes.length > 0
    ? pct(
        quizzes.reduce((s, i) => s + i.obtained_marks, 0),
        quizzes.reduce((s, i) => s + i.max_marks, 0)
      )
    : 0;

  const midPct   = midterm ? pct(midterm.obtained_marks, midterm.max_marks) : 0;
  const finalPct = final   ? pct(final.obtained_marks,   final.max_marks)   : 0;

  return (
    assignmentPct * GRADE_WEIGHTAGE.assignments +
    quizPct       * GRADE_WEIGHTAGE.quizzes +
    midPct        * GRADE_WEIGHTAGE.mid +
    finalPct      * GRADE_WEIGHTAGE.final
  );
}
