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
 * Calculate GPA from total marks — returns a discrete standard point (4.0 scale).
 * Maps to the same thresholds as the letter grade scale:
 * A≥85→4.0, A-≥80→3.7, B≥75→3.3, B-≥70→3.0,
 * C≥65→2.7, C-≥60→2.3, D≥55→2.0, D-≥50→1.7, F→0.0
 */
export function calculateGPA(percentage: number): number {
  if (percentage >= 85) return 4.0;
  if (percentage >= 80) return 3.7;
  if (percentage >= 75) return 3.3;
  if (percentage >= 70) return 3.0;
  if (percentage >= 65) return 2.7;
  if (percentage >= 60) return 2.3;
  if (percentage >= 55) return 2.0;
  if (percentage >= 50) return 1.7;
  return 0.0;
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
  // calculate percentage for each category, then apply weightage
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
