import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { studentService, type Student } from "../services/student.service";
import { enrollmentService, type Enrollment } from "../services/enrollment.service";
import { gradeService, type Grade, type GradeItem } from "../services/grade.service";
import { courseService, type Course } from "../services/course.service";
import { type Department } from "../services/department.service";
import { Loader2, GraduationCap, BookOpen, Trophy, Calendar, X, FileText, Plus } from "lucide-react";

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
        alert("No student record found for this user");
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
      alert("Failed to load student data");
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
    
    const total = items.reduce((sum, item) => {
      const percentage = (item.obtained_marks / item.max_marks) * 100;
      return sum + percentage;
    }, 0);
    
    return total / items.length;
  };

  const getLetterGrade = (percentage: number): string => {
    if (percentage >= 85) return 'A';
    if (percentage >= 75) return 'B';
    if (percentage >= 65) return 'C';
    if (percentage >= 50) return 'D';
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

  const handleRequestEnrollment = async (courseId: number) => {
    if (!student) return;

    try {
      setRequesting(true);
      await enrollmentService.requestEnrollment(courseId);
      alert('Enrollment request submitted successfully! Waiting for admin approval.');
      await loadStudentData();
    } catch (error: any) {
      console.error('Error requesting enrollment:', error);
      alert(error.message || 'Failed to submit enrollment request');
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

  const cgpa = grades.length > 0 ? 
    grades.reduce((sum, grade) => sum + (calculateGradeTotal(grade.id) / 25), 0) / grades.length : 
    null;

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

        {/* Enrollments List */}
        <div className="table-container">
          <div className="card-header-row">
            <h2 className="card-title">My Courses</h2>
            <button className="btn-primary" onClick={() => setShowEnrollModal(true)}>
              <Plus size={18} />
              Request Enrollment
            </button>
          </div>
          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No enrollments found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th">Course</th>
                  <th className="th">Credits</th>
                  <th className="th">Status</th>
                  <th className="th">Grade</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
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
                      <td className="td">
                        {letterGrade ? (
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>{letterGrade}</span>
                        ) : (
                          <span className="text-sm-gray">Not graded</span>
                        )}
                      </td>
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
          )}
        </div>

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
                            {gradeTotal?.toFixed(1)}%
                          </p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 4px' }}>Letter Grade</p>
                          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
                            {letterGrade}
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

              <p className="text-sm text-muted" style={{ marginBottom: '20px' }}>
                Select a course to request enrollment. Your request will be sent to the admin for approval.
              </p>

              {(() => {
                const availableCourses = getAvailableCourses();

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
                    {availableCourses.map((course) => (
                      <div key={course.id} className="course-request-item">
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
                            {course.title}
                          </h3>
                          <p className="text-sm text-muted" style={{ margin: 0 }}>
                            {course.credit_hours} credits • {course.teacher?.user?.name || 'No teacher assigned'}
                          </p>
                        </div>
                        <button
                          className="btn-request"
                          onClick={() => {
                            handleRequestEnrollment(course.id);
                            setShowEnrollModal(false);
                          }}
                          disabled={requesting}
                          style={{ opacity: requesting ? 0.5 : 1, cursor: requesting ? 'not-allowed' : 'pointer' }}
                        >
                          {requesting ? 'Requesting...' : 'Request'}
                        </button>
                      </div>
                    ))}
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
