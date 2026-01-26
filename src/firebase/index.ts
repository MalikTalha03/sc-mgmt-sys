// Export all Firebase service functions
export * from './studentService';
export * from './teacherService';
export * from './courseService';
export * from './departmentService';
export * from './enrollmentService';
export * from './gradeService';
export * from './authService';

// Re-export db for convenience
export { db } from './db';
export { auth } from './firebase';
