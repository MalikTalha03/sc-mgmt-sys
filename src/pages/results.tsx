import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { studentService, type Student } from "../services/student.service";
import { enrollmentService, type Enrollment } from "../services/enrollment.service";
import { gradeService, type Grade, type GradeItem } from "../services/grade.service";
import { calculateTotalFromItems, calculateGPA } from "../utils/gradeCalculations";
import { Loader2, GraduationCap, Trophy, FileText, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

export default function ResultsPage() {
  const { currentUser } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [gradeItems, setGradeItems] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEnrollment, setSelectedEnrollment] = useState<Enrollment | null>(null);
  const [showGradeDetails, setShowGradeDetails] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (currentUser) loadData();
  }, [currentUser]);

  const loadData = async () => {
    try {
      setLoading(true);
      if (!currentUser) return;

      const studentData = await studentService.getByUserId(currentUser.id);
      if (!studentData) {
        toast.error("No student record found for this user");
        return;
      }
      setStudent(studentData);

      const [enrollmentsData, gradesData, gradeItemsData] = await Promise.all([
        enrollmentService.getAll(),
        gradeService.getAll(),
        gradeService.getAllGradeItems(),
      ]);

      setEnrollments(enrollmentsData.filter(e => e.student_id === studentData.id));
      setGrades(gradesData.filter(g => g.student_id === studentData.id));
      setGradeItems(gradeItemsData);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load results");
    } finally {
      setLoading(false);
    }
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

  const getGradeItemsForCourse = (courseId: number): GradeItem[] => {
    const grade = grades.find(g => g.course_id === courseId);
    if (!grade) return [];
    return gradeItems.filter(gi => gi.grade_id === grade.id);
  };

  if (loading) {
    return (
      <div className="page-bg">
        <div className="loading-container">
          <div className="loading-content">
            <Loader2 size={40} className="loading-spinner" />
            <p className="loading-text">Loading results...</p>
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

  const completedEnrollments = enrollments.filter(e => e.status === 'completed');

  // Overall CGPA across all graded completed courses
  const cgpa = (() => {
    let weightedSum = 0;
    let totalCredits = 0;
    grades.forEach(grade => {
      const enrollment = enrollments.find(e => e.course_id === grade.course_id && e.status === 'completed');
      if (!enrollment) return;
      const credits = enrollment.course?.credit_hours ?? 0;
      const gpa = calculateGPA(calculateGradeTotal(grade.id));
      weightedSum += gpa * credits;
      totalCredits += credits;
    });
    return totalCredits > 0 ? weightedSum / totalCredits : null;
  })();

  // Group completed enrollments by semester
  const semesterMap = new Map<number | string, Enrollment[]>();
  completedEnrollments.forEach(e => {
    const key = e.semester ?? 'Unknown';
    if (!semesterMap.has(key)) semesterMap.set(key, []);
    semesterMap.get(key)!.push(e);
  });

  const sortedKeys = Array.from(semesterMap.keys()).sort((a, b) => {
    if (a === 'Unknown') return 1;
    if (b === 'Unknown') return -1;
    return (a as number) - (b as number);
  });

  return (
    <div className="page-bg">
      <div className="page-content">
        {/* Header */}
        <div className="card">
          <div className="flex-between">
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Trophy size={28} color="#16a34a" />
                Academic Results
              </h1>
              <p className="page-subtitle">
                {student.user?.name && <span className="font-medium text-primary">{student.user.name} • </span>}
                Semester {student.semester} • {completedEnrollments.length} completed course{completedEnrollments.length !== 1 ? 's' : ''}
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

        {/* No results state */}
        {completedEnrollments.length === 0 ? (
          <div className="table-container" style={{ marginTop: '24px' }}>
            <div style={{ textAlign: 'center', padding: '80px', color: '#6b7280' }}>
              <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
              <p style={{ fontSize: '16px', fontWeight: 600, margin: '0 0 8px' }}>No results yet</p>
              <p style={{ margin: 0, fontSize: '14px' }}>Completed courses will appear here once your semester results are announced.</p>
            </div>
          </div>
        ) : (
          <div className="table-container" style={{ marginTop: '24px' }}>
            <div className="card-header-row">
              <h2 className="card-title">Results by Semester</h2>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedKeys.map(semKey => {
                const semEnrollments = semesterMap.get(semKey)!;

                // Semester GPA (credit-weighted)
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
                    <table className="data-table">
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
                                  onClick={() => { setSelectedEnrollment(e); setShowGradeDetails(true); }}
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
          </div>
        )}

        {/* Grade Details Modal */}
        {showGradeDetails && selectedEnrollment && (() => {
          const grade = grades.find(g => g.course_id === selectedEnrollment.course?.id);
          const courseGradeItems = grade ? gradeItems.filter(gi => gi.grade_id === grade.id) : [];
          const gradeTotal = grade ? calculateGradeTotal(grade.id) : null;
          const letterGrade = gradeTotal !== null ? getLetterGrade(gradeTotal) : null;

          const assignments = courseGradeItems.filter(item => item.category === 'assignment');
          const quizzes = courseGradeItems.filter(item => item.category === 'quiz');
          const midterms = courseGradeItems.filter(item => item.category === 'midterm');
          const finals = courseGradeItems.filter(item => item.category === 'final');

          const calcCat = (items: GradeItem[]) => {
            if (!items.length) return { obtained: 0, max: 0, percentage: 0 };
            const obtained = items.reduce((s, i) => s + i.obtained_marks, 0);
            const max = items.reduce((s, i) => s + i.max_marks, 0);
            return { obtained, max, percentage: (obtained / max) * 100 };
          };

          const aT = calcCat(assignments);
          const qT = calcCat(quizzes);
          const mT = calcCat(midterms);
          const fT = calcCat(finals);

          return (
            <div className="modal-overlay">
              <div className="modal-box-md">
                <div className="modal-header-row">
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                    {selectedEnrollment.course?.title} — Grade Details
                  </h2>
                  <button className="btn-close" onClick={() => setShowGradeDetails(false)}>
                    <X size={24} color="#6b7280" />
                  </button>
                </div>

                {courseGradeItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No grade items available for this course yet.</p>
                  </div>
                ) : (
                  <>
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
                          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: '0 0 4px' }}>{letterGrade}</p>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            GPA: <span style={{ fontWeight: '600', color: '#111827' }}>
                              {gradeTotal !== null ? calculateGPA(gradeTotal).toFixed(1) : '—'}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

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
                        {assignments.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="td-d">Assignment {i + 1}</td>
                            <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                            <td className="td-d td-d-center">{item.max_marks}</td>
                            <td className="td-d td-d-center font-semibold">{((item.obtained_marks / item.max_marks) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                        {assignments.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Assignments Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{aT.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{aT.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{aT.percentage.toFixed(1)}%</td>
                          </tr>
                        )}
                        {quizzes.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="td-d">Quiz {i + 1}</td>
                            <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                            <td className="td-d td-d-center">{item.max_marks}</td>
                            <td className="td-d td-d-center font-semibold">{((item.obtained_marks / item.max_marks) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                        {quizzes.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Quizzes Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{qT.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{qT.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{qT.percentage.toFixed(1)}%</td>
                          </tr>
                        )}
                        {midterms.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="td-d">Midterm {midterms.length > 1 ? i + 1 : 'Exam'}</td>
                            <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                            <td className="td-d td-d-center">{item.max_marks}</td>
                            <td className="td-d td-d-center font-semibold">{((item.obtained_marks / item.max_marks) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                        {midterms.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Midterm Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{mT.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{mT.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{mT.percentage.toFixed(1)}%</td>
                          </tr>
                        )}
                        {finals.map((item, i) => (
                          <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td className="td-d">Final {finals.length > 1 ? i + 1 : 'Exam'}</td>
                            <td className="td-d td-d-center font-semibold">{item.obtained_marks}</td>
                            <td className="td-d td-d-center">{item.max_marks}</td>
                            <td className="td-d td-d-center font-semibold">{((item.obtained_marks / item.max_marks) * 100).toFixed(1)}%</td>
                          </tr>
                        ))}
                        {finals.length > 0 && (
                          <tr className="td-d-subtotal">
                            <td className="font-semibold text-muted" style={{ padding: '10px 8px', fontSize: '13px' }}>Final Total</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{fT.obtained}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{fT.max}</td>
                            <td className="td-d-center font-bold" style={{ padding: '10px 8px', fontSize: '13px', color: '#111827' }}>{fT.percentage.toFixed(1)}%</td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    <div className="summary-box">
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }}>Course Summary</p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <span className="text-sm text-muted">Total Assessments: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{courseGradeItems.length}</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted">Credits: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEnrollment.course?.credit_hours || 0} hrs</span>
                        </div>
                        <div>
                          <span className="text-sm text-muted">Semester: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{selectedEnrollment.semester ?? '—'}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
