import { useState, useEffect } from "react";
import { Button } from "../components/button";
import { useAuth } from "../context/AuthContext";
import {
  getStudentById,
  getAllCourses,
  getEnrollmentsByStudent,
  getGradesByStudent,
  calculateStudentCGPA,
  calculateTotal,
  calculateGPA,
  createEnrollment,
} from "../firebase";
import type { Student } from "../models/student";
import type { Course } from "../models/course";
import type { Enrollment } from "../models/enrollment";
import type { Grade } from "../models/grade";
import {
  GraduationCap,
  BookOpen,
  Clock,
  Award,
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Building2,
  TrendingUp
} from "lucide-react";

export default function StudentPage() {
  const { userData } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string>("");
  const [requestingEnrollment, setRequestingEnrollment] = useState(false);

  useEffect(() => {
    if (userData?.linkedId) {
      loadStudentData(userData.linkedId);
    }
  }, [userData]);

  const loadStudentData = async (studentId: string) => {
    try {
      setLoading(true);
      const [studentData, coursesData, enrollmentsData, gradesData, cgpaValue] = await Promise.all([
        getStudentById(studentId),
        getAllCourses(),
        getEnrollmentsByStudent(studentId),
        getGradesByStudent(studentId),
        calculateStudentCGPA(studentId),
      ]);
      setStudent(studentData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setGrades(gradesData);
      setCgpa(cgpaValue);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseByCode = (code: string) => {
    return courses.find(c => c.code === code);
  };

  const handleRequestEnrollment = async () => {
    if (!student || !selectedCourseForEnrollment) {
      alert("Please select a course");
      return;
    }

    try {
      setRequestingEnrollment(true);
      await createEnrollment({
        studentId: student.studentId,
        courseCode: selectedCourseForEnrollment,
        status: "pending",
      });
      alert("Enrollment request submitted successfully!");
      await loadStudentData(student.studentId);
      setSelectedCourseForEnrollment("");
    } catch (error: any) {
      console.error("Error requesting enrollment:", error);
      alert(error.message || "Failed to submit enrollment request");
    } finally {
      setRequestingEnrollment(false);
    }
  };

  const availableCourses = courses.filter(course => 
    !enrollments.some(e => e.courseCode === course.code)
  );

  const approvedEnrollments = enrollments.filter(e => e.status === "approved");
  const pendingEnrollments = enrollments.filter(e => e.status === "pending");
  const totalCredits = approvedEnrollments.reduce((sum, e) => {
    const course = getCourseByCode(e.courseCode);
    return sum + (course?.creditHours || 0);
  }, 0);

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f3f4f6',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  };

  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  };

  const statusBadgeStyle = (status: string): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    background: status === 'approved' ? '#ecfdf5' : status === 'pending' ? '#fef3c7' : '#fef2f2',
    color: status === 'approved' ? '#059669' : status === 'pending' ? '#d97706' : '#dc2626',
  });

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ margin: 0 }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={containerStyle}>
        <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Student data not found. Please contact administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                Welcome, {student.name}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {student.studentId} • {student.departmentCode} • Semester {student.semester}
              </p>
            </div>
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>CGPA</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700' }}>{cgpa.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px' }}>
                <CheckCircle size={20} color="#059669" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{approvedEnrollments.length}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Enrolled Courses</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '10px' }}>
                <Clock size={20} color="#d97706" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{pendingEnrollments.length}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Pending Requests</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '10px' }}>
                <BookOpen size={20} color="#4f46e5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{totalCredits}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Credit Hours</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f3e8ff', borderRadius: '10px' }}>
                <Award size={20} color="#7c3aed" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{grades.length}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Graded Courses</p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Request Enrollment */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <Plus size={18} color="#4f46e5" />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Request Enrollment</h2>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Select Course
                </label>
                <select
                  value={selectedCourseForEnrollment}
                  onChange={(e) => setSelectedCourseForEnrollment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    background: 'white',
                  }}
                >
                  <option value="">Choose a course...</option>
                  {availableCourses.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.title} ({c.code}) - {c.creditHours} Credits
                    </option>
                  ))}
                </select>
              </div>
              {selectedCourseForEnrollment && (
                <div style={{
                  padding: '12px 16px',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  border: '1px solid #bae6fd',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Building2 size={14} color="#0284c7" />
                    <span style={{ fontSize: '13px', color: '#0369a1' }}>
                      {getCourseByCode(selectedCourseForEnrollment)?.departmentCode}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '13px', color: '#0369a1' }}>
                    Semester {getCourseByCode(selectedCourseForEnrollment)?.semester} • {getCourseByCode(selectedCourseForEnrollment)?.creditHours} Credits
                  </p>
                </div>
              )}
              <Button
                variant="primary"
                fullWidth
                onClick={handleRequestEnrollment}
                disabled={!selectedCourseForEnrollment || requestingEnrollment}
              >
                {requestingEnrollment ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Current Enrollments */}
          <div style={sectionStyle}>
            <div style={sectionHeaderStyle}>
              <BookOpen size={18} color="#4f46e5" />
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>My Enrollments</h2>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {enrollments.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
                  <BookOpen size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No enrollments yet</p>
                </div>
              ) : (
                <table style={tableStyle}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Course</th>
                      <th style={{ ...thStyle, textAlign: 'center' }}>Credits</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const course = getCourseByCode(enrollment.courseCode);
                      return (
                        <tr key={enrollment.courseCode}>
                          <td style={tdStyle}>
                            <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{course?.title || enrollment.courseCode}</p>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{enrollment.courseCode}</p>
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'center' }}>{course?.creditHours || '-'}</td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <span style={statusBadgeStyle(enrollment.status)}>
                              {enrollment.status === 'approved' && <CheckCircle size={12} />}
                              {enrollment.status === 'pending' && <Clock size={12} />}
                              {enrollment.status === 'rejected' && <XCircle size={12} />}
                              {enrollment.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Grades Section */}
        <div style={sectionStyle}>
          <div style={sectionHeaderStyle}>
            <TrendingUp size={18} color="#4f46e5" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>Academic Performance</h2>
          </div>
          {grades.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
              <Award size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No grades recorded yet</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Course</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Assignments (10%)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Quizzes (15%)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Mid (25%)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Final (50%)</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>GPA</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => {
                  const course = getCourseByCode(grade.courseCode);
                  const total = calculateTotal(grade.marks);
                  const gpa = calculateGPA(total);
                  
                  const avgAssignment = grade.marks.assignments.length > 0 
                    ? grade.marks.assignments.reduce((a, b) => a + b, 0) / grade.marks.assignments.length 
                    : 0;
                  const avgQuiz = grade.marks.quizzes.length > 0 
                    ? grade.marks.quizzes.reduce((a, b) => a + b, 0) / grade.marks.quizzes.length 
                    : 0;

                  return (
                    <tr key={grade.courseCode}>
                      <td style={tdStyle}>
                        <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{course?.title || grade.courseCode}</p>
                        <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{grade.courseCode}</p>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{avgAssignment.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{avgQuiz.toFixed(1)}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{grade.marks.mid}/{grade.marks.maxMid}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{grade.marks.final}/{grade.marks.maxFinal}</td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600', color: '#4f46e5' }}>{total.toFixed(1)}%</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          background: gpa >= 3.0 ? '#ecfdf5' : gpa >= 2.0 ? '#fef3c7' : '#fef2f2',
                          color: gpa >= 3.0 ? '#059669' : gpa >= 2.0 ? '#d97706' : '#dc2626',
                          borderRadius: '6px',
                          fontWeight: '600',
                          fontSize: '13px',
                        }}>
                          {gpa.toFixed(2)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
