import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { studentService, type Student } from "../services/student.service";
import { enrollmentService, type Enrollment } from "../services/enrollment.service";
import { gradeService, type Grade, type GradeItem } from "../services/grade.service";
import { courseService, type Course } from "../services/course.service";
import { type Department } from "../services/department.service";
import { calculateTotalFromItems, calculateGPA } from "../utils/gradeCalculations";
import { Loader2, GraduationCap, BookOpen, Trophy, Calendar, X, FileText, Plus } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function StudentPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showGradeDetails, setShowGradeDetails] = useState(false);
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [courseTab, setCourseTab] = useState<'enrolled' | 'completed' | 'rejected'>('enrolled');
  const toast = useToast();

  useEffect(() => {
    if (currentUser) {
      loadStudentData();
    }
  }, [currentUser]);

  const loadStudentData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;
      
      const studentData = await studentService.getByUserId(currentUser.id);
      if (!studentData) {
        toast.error("No student record found for this user");
        return;
      }
      setStudent(studentData);

      const [enrollmentsData, gradesData, gradeItemsData, coursesData] = await Promise.all([
        enrollmentService.getAll(),
        gradeService.getAll(),
        gradeService.getAllGradeItems(),
        courseService.getAll(),
      ]);

      // Filter enrollments for this student (already includes course and department data)
      const myEnrollments = enrollmentsData.filter(e => e.student_id === studentData.id);
      setEnrollments(myEnrollments);
      setCourses(coursesData);
      
      const myGrades = gradesData.filter(g => g.student_id === studentData.id);
      setGrades(myGrades);
      setGradeItems(gradeItemsData);
      
      setDepartment(studentData.department || null);
    } catch (error) {
      console.error("Error loading student data:", error);
      toast.error("Failed to load student data");
    } finally {
      setLoading(false);
    }
  };

  const getGradeForEnrollment = (enrollmentId: number) => {
    return grades.find(g => g.course_id === enrollments.find(e => e.id === enrollmentId)?.course_id);
  };

  const calculateGradeTotal = (gradeId: number): number => {
    const items = gradeItems.filter(gi => gi.grade_id === gradeId);
    if (items.length === 0) return 0;
    return calculateTotalFromItems(items);
  };

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'A-';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'B-';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'C-';
    if (percentage >= 55) return 'D';
    if (percentage >= 50) return 'D-';
    return 'F';
  };

  const handleViewGrades = (enrollment: Enrollment) => {
    setSelectedEnrollment(enrollment);
    setShowGradeDetails(true);
  };

  const getGradeItemsForCourse = (courseId: number): GradeItem[] => {
    const grade = grades.find(g => g.course_id === courseId);
    if (!grade) return [];
    return gradeItems.filter(gi => gi.grade_id === grade.id);
  };

  const MAX_CREDIT_HOURS = 21;

  const getCurrentCreditHours = (): number => {
    return enrollments
      .filter(e => e.status === 'approved' || e.status === 'pending')
      .reduce((sum, e) => sum + (e.course?.credit_hours ?? 0), 0);
  };

  const handleRequestEnrollment = async (courseId: number) => {
    if (!student) return;

    // Client-side credit hour guard
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const currentCredits = getCurrentCreditHours();
      const maxCredits = student.max_credit_per_semester ?? MAX_CREDIT_HOURS;
      if (currentCredits + course.credit_hours > maxCredits) {
        const remaining = maxCredits - currentCredits;
        toast.warning(
          `Credit limit exceeded — ${currentCredits + course.credit_hours}/${maxCredits} credit hrs needed. ` +
          `Only ${Math.max(remaining, 0)} hr(s) remaining.`
        );
        return;
      }
    }

    try {
      setRequesting(true);
      await enrollmentService.requestEnrollment(courseId);
      toast.success('Enrollment request submitted! Waiting for admin approval.');
      await loadStudentData();
    } catch (error: any) {
      console.error('Error requesting enrollment:', error);
      toast.error(error.message || 'Failed to submit enrollment request');
    } finally {
      setRequesting(false);
    }
  };

  const getAvailableCourses = (): Course[] => {
    const enrolledCourseIds = enrollments.map(e => e.course_id);
    return courses.filter(c => !enrolledCourseIds.includes(c.id));
  };

  if (loading) {
    return (
      <div className="page-bg">
        <div className="loading-container">
          <div className="loading-content">
            <Loader2 size={40} className="loading-spinner" />
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="page-bg">
        <div className="empty-state-container">
          <div className="empty-state-card">
            <GraduationCap size={64} className="empty-state-icon" />
            <h1 className="empty-state-title">No Student Record</h1>
            <p className="empty-state-description">No student record found for your account.</p>
          </div>
        </div>
      </div>
    );
  }

  // CGPA = Σ(GPA × creditHours) / Σ(creditHours) across all graded courses
  const cgpa = (() => {
    if (grades.length === 0) return null;
    let weightedSum = 0;
    let totalCredits = 0;
    grades.forEach(grade => {
      const creditHours = enrollments.find(e => e.course_id === grade.course_id)?.course?.credit_hours ?? 0;
      const gpa = calculateGPA(calculateGradeTotal(grade.id));
      weightedSum += gpa * creditHours;
      totalCredits += creditHours;
    });
    return totalCredits > 0 ? weightedSum / totalCredits : 0;
  })();

  return (
    <div className="page-bg">
      <div className="page-content">
        {/* Header */}
        <div className="card">
          <div className="flex-between">
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={28} color="#3b82f6" />
                Student Dashboard
              </h1>
              <p className="page-subtitle">
                {student.user?.name && <span className="font-medium text-primary">{student.user.name} • </span>}
                {department?.name} • Semester {student.semester}
              </p>
            </div>
            {cgpa !== null && (
              <div style={{ textAlign: 'right' }}>
                <p className="cgpa-value">{cgpa.toFixed(2)}</p>
                <p className="cgpa-label">CGPA</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid-sm">
          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-blue">
                <BookOpen size={24} color="#3b82f6" />
              </div>
              <div>
                <p className="stat-value">{enrollments.filter(e => e.status === 'approved').length}</p>
                <p className="stat-label">Active Courses</p>
              </div>
            </div>
          </div>

          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-green">
                <Trophy size={24} color="#16a34a" />
              </div>
              <div>
                <p className="stat-value">{enrollments.filter(e => e.status === 'completed').length}</p>
                <p className="stat-label">Completed</p>
              </div>
            </div>
          </div>

          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-purple">
                <Calendar size={24} color="#9333ea" />
              </div>
              <div>
                <p className="stat-value">{student.semester}</p>
                <p className="stat-label">Current Semester</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses - Tabbed */}
        <div className="table-container">
          <div className="card-header-row">
            <h2 className="card-title">My Courses</h2>
            <button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
              <Plus size={18} />
              Request Enrollment
            </button>
          </div>

          {/* Tabs */}
          <div className="course-tabs">
            <button
              className={`course-tab-btn${courseTab === 'enrolled' ? ' course-tab-active' : ''}`}
              onClick={() => setCourseTab('enrolled')}
            >
              Currently Enrolled
              <span className="course-tab-badge">
                {enrollments.filter(e => e.status === 'approved' || e.status === 'pending').length}
              </span>
            </button>
            <button
              className={`course-tab-btn${courseTab === 'completed' ? ' course-tab-active' : ''}`}
              onClick={() => setCourseTab('completed')}
            >
              Completed
              <span className="course-tab-badge">
                {enrollments.filter(e => e.status === 'completed').length}
              </span>
            </button>
            <button
              className={`course-tab-btn${courseTab === 'rejected' ? ' course-tab-active' : ''}`}
              onClick={() => setCourseTab('rejected')}
            >
              Inactive
              <span className="course-tab-badge">
                {enrollments.filter(e => e.status === 'rejected' || e.status === 'dropped' || e.status === 'withdrawn').length}
              </span>
            </button>
          </div>

          {(() => {
            const tabEnrollments =
              courseTab === 'enrolled'
                ? enrollments.filter(e => e.status === 'approved' || e.status === 'pending')
                : courseTab === 'completed'
                ? enrollments.filter(e => e.status === 'completed')
                : enrollments.filter(e => e.status === 'rejected' || e.status === 'dropped' || e.status === 'withdrawn');

            if (tabEnrollments.length === 0) {
              return (
                <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                  <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>
                    {courseTab === 'enrolled' ? 'No active enrollments' : courseTab === 'completed' ? 'No completed courses yet' : 'No inactive enrollments'}
                  </p>
                </div>
              );
            }

            return (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">Course</th>
                    <th className="th">Credits</th>
                    <th className="th">Status</th>
                    {(courseTab === 'enrolled' || courseTab === 'completed') && <th className="th">Grade</th>}
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tabEnrollments.map((enrollment) => {
                    const grade = getGradeForEnrollment(enrollment.id);
                    const gradeTotal = grade ? calculateGradeTotal(grade.id) : null;
                    const letterGrade = gradeTotal !== null ? getLetterGrade(gradeTotal) : null;
                    const courseGradeItems = enrollment.course?.id ? getGradeItemsForCourse(enrollment.course.id) : [];
                    const statusClass =
                      enrollment.status === 'approved' ? 'enrollment-status-approved' :
                      enrollment.status === 'completed' ? 'enrollment-status-completed' :
                      'enrollment-status-other';

                    return (
                      <tr key={enrollment.id}>
                        <td className="td">
                          <span className="font-medium text-primary">{enrollment.course?.title || 'N/A'}</span>
                        </td>
                        <td className="td">{enrollment.course?.credit_hours || 0} hrs</td>
                        <td className="td">
                          <span className={statusClass}>{enrollment.status}</span>
                        </td>
                        {(courseTab === 'enrolled' || courseTab === 'completed') && (
                          <td className="td">
                            {letterGrade && gradeTotal !== null ? (
                              <span style={{ fontWeight: '600', color: '#3b82f6' }}>
                                {letterGrade}
                                <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '400', marginLeft: '4px' }}>
                                  ({calculateGPA(gradeTotal).toFixed(1)})
                                </span>
                              </span>
                            ) : (
                              <span className="text-sm-gray">Not graded</span>
                            )}
                          </td>
                        )}
                        <td className="td">
                          <button
                            onClick={() => handleViewGrades(enrollment)}
                            className={courseGradeItems.length > 0 ? 'btn-sm-blue' : 'btn-sm-gray'}
                            disabled={courseGradeItems.length === 0}
                          >
                            <FileText size={14} />
                            View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Academic Results — completed courses grouped by semester */}
        {enrollments.some(e => e.status === 'completed') && (
          <div className="table-container" style={{ marginTop: '24px' }}>
            <div className="card-header-row">
              <h2 className="card-title">Academic Results</h2>
            </div>

            {(() => {
              const completedEnrollments = enrollments.filter(e => e.status === 'completed');

              // Group by semester (fall back to '?' if missing)
              const semesterMap = new Map<number | string, Enrollment[]>();
              completedEnrollments.forEach(e => {
                const key = e.semester ?? 'Unknown';
                if (!semesterMap.has(key)) semesterMap.set(key, []);
                semesterMap.get(key)!.push(e);
              });

              // Sort by semester number ascending; 'Unknown' goes last
              const sortedKeys = Array.from(semesterMap.keys()).sort((a, b) => {
                if (a === 'Unknown') return 1;
                if (b === 'Unknown') return -1;
                return (a as number) - (b as number);
              });

              return (
                <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sortedKeys.map(semKey => {
                const semEnrollments = semesterMap.get(semKey)!;

                // Calculate semester GPA (credit-weighted)
                let semWeightedSum = 0;
                let semTotalCredits = 0;
                semEnrollments.forEach(e => {
                  const grade = grades.find(g => g.course_id === e.course_id);
                  if (!grade) return;
                  const total = calculateGradeTotal(grade.id);
                  const gpa = calculateGPA(total);
                  const credits = e.course?.credit_hours ?? 0;
                  semWeightedSum += gpa * credits;
                  semTotalCredits += credits;
                });
                const semGPA = semTotalCredits > 0 ? semWeightedSum / semTotalCredits : null;

                return (
                  <div key={String(semKey)} className="semester-results-group">
                    <div className="semester-results-header">
                      <span className="semester-results-title">
                        {semKey === 'Unknown' ? 'Semester Unknown' : `Semester ${semKey}`}
                      </span>
                      {semGPA !== null && (
                        <span className="semester-gpa-badge">
                          Semester GPA: <strong>{semGPA.toFixed(2)}</strong>
                        </span>
                      )}
                    </div>
                    <table className="data-table" style={{ marginBottom: 0 }}>
                      <thead>
                        <tr>
                          <th className="th">Course</th>
                          <th className="th">Credits</th>
                          <th className="th">Score</th>
                          <th className="th">Letter Grade</th>
                          <th className="th">GPA Points</th>
                          <th className="th">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semEnrollments.map(e => {
                          const grade = grades.find(g => g.course_id === e.course_id);
                          const total = grade ? calculateGradeTotal(grade.id) : null;
                          const letter = total !== null ? getLetterGrade(total) : null;
                          const gpaPoints = total !== null ? calculateGPA(total) : null;
                          const courseGradeItems = e.course?.id ? getGradeItemsForCourse(e.course.id) : [];
                          return (
                            <tr key={e.id}>
                              <td className="td">
                                <span className="font-medium text-primary">{e.course?.title || 'N/A'}</span>
                              </td>
                              <td className="td">{e.course?.credit_hours ?? 0} hrs</td>
                              <td className="td">
                                {total !== null ? (
                                  <span style={{ fontWeight: 600 }}>{total.toFixed(1)}/100</span>
                                ) : (
                                  <span className="text-sm-gray">—</span>
                                )}
                              </td>
                              <td className="td">
                                {letter ? (
                                  <span className="enrollment-status-completed" style={{ fontWeight: 700 }}>{letter}</span>
                                ) : (
                                  <span className="text-sm-gray">—</span>
                                )}
                              </td>
                              <td className="td">
                                {gpaPoints !== null ? (
                                  <span style={{ fontWeight: 600, color: '#6366f1' }}>{gpaPoints.toFixed(1)}</span>
                                ) : (
                                  <span className="text-sm-gray">—</span>
                                )}
                              </td>
                              <td className="td">
                                <button
                                  onClick={() => handleViewGrades(e)}
                                  className={courseGradeItems.length > 0 ? 'btn-sm-blue' : 'btn-sm-gray'}
                                  disabled={courseGradeItems.length === 0}
                                >
                                  <FileText size={14} />
                                  View
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
                })}
                </div>
              );
            })()}
          </div>
        )}

        {/* Grade Details Modal */}
        {showGradeDetails && selectedEnrollment && (
          <div className="modal-overlay">
            <div className="modal-box-md">
              <div className="modal-header-row">
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {selectedEnrollment.course?.title} - Grade Details
                </h2>
                <button className="btn-close" onClick={() => setShowGradeDetails(false)}>
                  <X size={24} color="#6b7280" />
                </button>
              </div>

              {(() => {
                const grade = grades.find(g => g.course_id === selectedEnrollment.course?.id);
                const courseGradeItems = grade ? gradeItems.filter(gi => gi.grade_id === grade.id) : [];
                const gradeTotal = grade ? calculateGradeTotal(grade.id) : null;
                const letterGrade = gradeTotal !== null ? getLetterGrade(gradeTotal) : null;

                if (courseGradeItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No grade items available for this course yet.</p>
                    </div>
                  );
                }

                // Group items by category
                const assignments = courseGradeItems.filter(item => item.category === 'assignment');
                const quizzes = courseGradeItems.filter(item => item.category === 'quiz');
                const midterms = courseGradeItems.filter(item => item.category === 'midterm');
                const finals = courseGradeItems.filter(item => item.category === 'final');

                // Calculate totals for each category
                const calculateCategoryTotal = (items: GradeItem[]) => {
                  if (items.length === 0) return { obtained: 0, max: 0, percentage: 0 };
                  const obtained = items.reduce((sum, item) => sum + item.obtained_marks, 0);
                  const max = items.reduce((sum, item) => sum + item.max_marks, 0);
                  return { obtained, max, percentage: (obtained / max) * 100 };
                };

                const assignmentTotal = calculateCategoryTotal(assignments);
                const quizTotal = calculateCategoryTotal(quizzes);
                const midtermTotal = calculateCategoryTotal(midterms);
                const finalTotal = calculateCategoryTotal(finals);

                return (
                  <>
                    {/* Overall Performance */}
                    <div className="performance-box">
                      <div className="flex-between">
                        <div>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Overall Performance</p>
                          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                            {gradeTotal?.toFixed(0)}<span style={{ fontSize: '16px', color: '#6b7280', fontWeight: '500' }}>/100</span>
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Letter Grade</p>
                          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>
                            {letterGrade}
                          </p>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            GPA:{' '}
                            <span style={{ fontWeight: '600', color: '#111827' }}>
                              {gradeTotal !== null ? calculateGPA(gradeTotal).toFixed(1) : '—'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Grade Items Table */}
                    <table className="grade-modal-table">
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th className="th-d">Category</th>
                          <th className="th-d td-d-center">Obtained</th>
                          <th className="th-d td-d-center">Max Marks</th>
                          <th className="th-d td-d-center">Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Assignments */}
                        {assignments.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="td-d">Assignment {index + 1}</td>
                              <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                              <td className="td-d td-d-center">{item.max_marks}</td>
                              <td className="td-d td-d-center font-semibold">{percentage.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {assignments.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Assignments Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{assignmentTotal.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{assignmentTotal.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{assignmentTotal.percentage.toFixed(1)}%</td>
                          </tr>
                        )}

                        {/* Quizzes */}
                        {quizzes.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="td-d">Quiz {index + 1}</td>
                              <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                              <td className="td-d td-d-center">{item.max_marks}</td>
                              <td className="td-d td-d-center font-semibold">{percentage.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {quizzes.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Quizzes Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{quizTotal.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{quizTotal.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{quizTotal.percentage.toFixed(1)}%</td>
                          </tr>
                        )}

                        {/* Midterms */}
                        {midterms.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="td-d">Midterm {midterms.length > 1 ? index + 1 : 'Exam'}</td>
                              <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                              <td className="td-d td-d-center">{item.max_marks}</td>
                              <td className="td-d td-d-center font-semibold">{percentage.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {midterms.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Midterm Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{midtermTotal.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{midtermTotal.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{midtermTotal.percentage.toFixed(1)}%</td>
                          </tr>
                        )}

                        {/* Finals */}
                        {finals.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td className="td-d">Final {finals.length > 1 ? index + 1 : 'Exam'}</td>
                              <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                              <td className="td-d td-d-center">{item.max_marks}</td>
                              <td className="td-d td-d-center font-semibold">{percentage.toFixed(1)}%</td>
                            </tr>
                          );
                        })}
                        {finals.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Final Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{finalTotal.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{finalTotal.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{finalTotal.percentage.toFixed(1)}%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div className="summary-box">
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }}>Course Summary</p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <span className="text-sm text-muted">Total Assessments: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{courseGradeItems.length}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted">Total Points: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {courseGradeItems.reduce((sum, item) => sum + item.obtained_marks, 0)}/
                            {courseGradeItems.reduce((sum, item) => sum + item.max_marks, 0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted">Credits: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {selectedEnrollment.course?.credit_hours || 0} hrs
                          </span>
                        </div>
                        <div>
                          <span className="text-sm text-muted">Status: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {selectedEnrollment.status.charAt(0).toUpperCase() + selectedEnrollment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* Enrollment Request Modal */}
        {showEnrollModal && (
          <div className="modal-overlay">
            <div className="modal-box-lg">
              <div className="modal-header-row">
                <h2 className="page-title">Request Course Enrollment</h2>
                <button className="btn-close" onClick={() => setShowEnrollModal(false)}>
                  <X size={24} color="#6b7280" />
                </button>
              </div>

              <p className="text-sm text-muted" style={{ marginBottom: '12px' }}>
                Select a course to request enrollment. Your request will be sent to the admin for approval.
              </p>

              {/* Credit hour usage bar */}
              {(() => {
                const usedCredits = getCurrentCreditHours();
                const maxCredits = student?.max_credit_per_semester ?? MAX_CREDIT_HOURS;
                const pct = Math.min((usedCredits / maxCredits) * 100, 100);
                const barColor = usedCredits >= maxCredits ? '#ef4444' : usedCredits >= maxCredits * 0.8 ? '#f59e0b' : '#6366f1';
                return (
                  <div className="credit-hours-bar-container" style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#374151', marginBottom: '6px' }}>
                      <span>Credit hours used (approved + pending)</span>
                      <span style={{ fontWeight: 600, color: barColor }}>{usedCredits} / {maxCredits}</span>
                    </div>
                    <div style={{ background: '#e5e7eb', borderRadius: '6px', height: '8px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: '6px', transition: 'width 0.3s' }} />
                    </div>
                    {usedCredits >= maxCredits && (
                      <p style={{ fontSize: '12px', color: '#ef4444', margin: '6px 0 0', fontWeight: 500 }}>
                        Credit limit reached. Drop a pending/approved enrollment to request more courses.
                      </p>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const availableCourses = getAvailableCourses();
                const usedCredits = getCurrentCreditHours();
                const maxCredits = student?.max_credit_per_semester ?? MAX_CREDIT_HOURS;

                if (availableCourses.length === 0) {
                  return (
                    <div className="select-placeholder-box">
                      <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No available courses to enroll in.</p>
                    </div>
                  );
                }

                return (
                  <div className="course-request-list">
                    {availableCourses.map((course) => {
                      const wouldExceed = usedCredits + course.credit_hours > maxCredits;
                      return (
                        <div key={course.id} className="course-request-item" style={{ opacity: wouldExceed ? 0.6 : 1 }}>
                          <div>
                            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
                              {course.title}
                            </h3>
                            <p className="text-sm text-muted" style={{ margin: 0 }}>
                              {course.credit_hours} credits • {course.teacher?.user?.name || 'No teacher assigned'}
                              {wouldExceed && (
                                <span style={{ color: '#ef4444', fontWeight: 500, marginLeft: '8px' }}>
                                  — exceeds limit (+{course.credit_hours} would be {usedCredits + course.credit_hours}/{maxCredits})
                                </span>
                              )}
                            </p>
                          </div>
                          <button
                            className="btn-request"
                            onClick={() => {
                              handleRequestEnrollment(course.id);
                              setShowEnrollModal(false);
                            }}
                            disabled={requesting || wouldExceed}
                            title={wouldExceed ? `Adding this course would exceed your ${maxCredits} credit hour limit` : undefined}
                            style={{ opacity: requesting || wouldExceed ? 0.5 : 1, cursor: requesting || wouldExceed ? 'not-allowed' : 'pointer' }}
                          >
                            {requesting ? 'Requesting...' : wouldExceed ? 'Limit reached' : 'Request'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
