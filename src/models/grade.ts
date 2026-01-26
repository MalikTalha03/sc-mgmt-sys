export interface GradeMarks {
  assignments: number[];
  quizzes: number[];
  mid: number;
  final: number;
  maxAssignments: number[];
  maxQuizzes: number[];
  maxMid: number;
  maxFinal: number;
}

export interface Grade {
  studentId: string;
  courseCode: string;
  marks: GradeMarks;
  total?: number; // Calculated at runtime, not stored in DB
  gpa?: number;   // Calculated at runtime, not stored in DB
  createdAt?: any;
}
