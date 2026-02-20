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

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6' };
  const contentStyle: React.CSSProperties = { padding: '24px 32px' };
  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px', marginBottom: '20px' };
  const statsCardStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '20px' };
  const tableContainerStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#3b82f6' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center' }}>
            <GraduationCap size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>No Student Record</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>No student record found for your account.</p>
          </div>
        </div>
      </div>
    );
  }

  const cgpa = grades.length > 0 ? 
    grades.reduce((sum, grade) => sum + (calculateGradeTotal(grade.id) / 25), 0) / grades.length : 
    null;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <GraduationCap size={28} color="#3b82f6" />
                Student Dashboard
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                {student.user?.name && <span style={{ fontWeight: '500', color: '#111827' }}>{student.user.name} • </span>}
                {department?.name} • Semester {student.semester}
              </p>
            </div>
            {cgpa !== null && (
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '28px', fontWeight: '700', color: '#3b82f6', margin: 0 }}>{cgpa.toFixed(2)}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>CGPA</p>
              </div>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#dbeafe', borderRadius: '10px', padding: '12px' }}>
                <BookOpen size={24} color="#3b82f6" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{enrollments.filter(e => e.status === 'approved').length}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Active Courses</p>
              </div>
            </div>
          </div>

          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#dcfce7', borderRadius: '10px', padding: '12px' }}>
                <Trophy size={24} color="#16a34a" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{enrollments.filter(e => e.status === 'completed').length}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Completed</p>
              </div>
            </div>
          </div>

          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f3e8ff', borderRadius: '10px', padding: '12px' }}>
                <Calendar size={24} color="#9333ea" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{student.semester}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Current Semester</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enrollments List */}
        <div style={tableContainerStyle}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>My Courses</h2>
            <button
              onClick={() => setShowEnrollModal(true)}
              style={{
                padding: '10px 20px',
                background: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
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
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Credits</th>
                  <th style={thStyle}>Status</th>
                  <th style={thStyle}>Grade</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {enrollments.map((enrollment) => {
                  const grade = getGradeForEnrollment(enrollment.id);
                  const gradeTotal = grade ? calculateGradeTotal(grade.id) : null;
                  const letterGrade = gradeTotal !== null ? getLetterGrade(gradeTotal) : null;
                  const courseGradeItems = enrollment.course?.id ? getGradeItemsForCourse(enrollment.course.id) : [];
                  
                  return (
                    <tr key={enrollment.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '500', color: '#111827' }}>{enrollment.course?.title || 'N/A'}</span>
                      </td>
                      <td style={tdStyle}>
                        {enrollment.course?.credit_hours || 0} hrs
                      </td>
                      <td style={tdStyle}>
                        <span style={{
                          padding: '4px 10px',
                          background: enrollment.status === 'approved' ? '#dbeafe' : enrollment.status === 'completed' ? '#dcfce7' : '#fee2e2',
                          color: enrollment.status === 'approved' ? '#1e40af' : enrollment.status === 'completed' ? '#15803d' : '#991b1b',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: '500'
                        }}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {letterGrade ? (
                          <span style={{ fontWeight: '600', color: '#3b82f6' }}>{letterGrade}</span>
                        ) : (
                          <span style={{ color: '#9ca3af' }}>Not graded</span>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleViewGrades(enrollment)}
                          style={{
                            padding: '6px 12px',
                            background: courseGradeItems.length > 0 ? '#3b82f6' : '#9ca3af',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: courseGradeItems.length > 0 ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '750px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  {selectedEnrollment.course?.title} - Grade Details
                </h2>
                <button
                  onClick={() => setShowGradeDetails(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
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
                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                      <thead>
                        <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                          <th style={{ padding: '12px 8px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                            Category
                          </th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                            Obtained
                          </th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                            Max Marks
                          </th>
                          <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                            Percentage
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Assignments */}
                        {assignments.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>
                                Assignment {index + 1}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {item.obtained_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center' }}>
                                {item.max_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {/* Category Total for Assignments */}
                        {assignments.length > 0 && (
                          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                              Assignments Total
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {assignmentTotal.obtained}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {assignmentTotal.max}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {assignmentTotal.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )}

                        {/* Quizzes */}
                        {quizzes.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>
                                Quiz {index + 1}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {item.obtained_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center' }}>
                                {item.max_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {/* Category Total for Quizzes */}
                        {quizzes.length > 0 && (
                          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                              Quizzes Total
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {quizTotal.obtained}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {quizTotal.max}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {quizTotal.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )}

                        {/* Midterms */}
                        {midterms.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>
                                Midterm {midterms.length > 1 ? index + 1 : 'Exam'}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {item.obtained_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center' }}>
                                {item.max_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {/* Category Total for Midterms */}
                        {midterms.length > 0 && (
                          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                              Midterm Total
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {midtermTotal.obtained}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {midtermTotal.max}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {midtermTotal.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )}

                        {/* Finals */}
                        {finals.map((item, index) => {
                          const percentage = (item.obtained_marks / item.max_marks) * 100;
                          return (
                            <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827' }}>
                                Final {finals.length > 1 ? index + 1 : 'Exam'}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {item.obtained_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center' }}>
                                {item.max_marks}
                              </td>
                              <td style={{ padding: '12px 8px', fontSize: '14px', color: '#111827', textAlign: 'center', fontWeight: '600' }}>
                                {percentage.toFixed(1)}%
                              </td>
                            </tr>
                          );
                        })}
                        {/* Category Total for Finals */}
                        {finals.length > 0 && (
                          <tr style={{ borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#6b7280', fontWeight: '600' }}>
                              Final Total
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {finalTotal.obtained}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {finalTotal.max}
                            </td>
                            <td style={{ padding: '10px 8px', fontSize: '13px', color: '#111827', textAlign: 'center', fontWeight: '700' }}>
                              {finalTotal.percentage.toFixed(1)}%
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>

                    {/* Summary */}
                    <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
                      <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px' }}>Course Summary</p>
                      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Assessments: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>{courseGradeItems.length}</span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Total Points: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {courseGradeItems.reduce((sum, item) => sum + item.obtained_marks, 0)}/
                            {courseGradeItems.reduce((sum, item) => sum + item.max_marks, 0)}
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Credits: </span>
                          <span style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                            {selectedEnrollment.course?.credit_hours || 0} hrs
                          </span>
                        </div>
                        <div>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>Status: </span>
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
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>
                  Request Course Enrollment
                </h2>
                <button
                  onClick={() => setShowEnrollModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <X size={24} color="#6b7280" />
                </button>
              </div>

              <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                Select a course to request enrollment. Your request will be sent to the admin for approval.
              </p>

              {(() => {
                const availableCourses = getAvailableCourses();
                
                if (availableCourses.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <BookOpen size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                      <p style={{ margin: 0 }}>No available courses to enroll in.</p>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {availableCourses.map((course) => (
                      <div
                        key={course.id}
                        style={{
                          padding: '16px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: '0 0 4px' }}>
                            {course.title}
                          </h3>
                          <p style={{ fontSize: '13px', color: '#6b7280', margin: 0 }}>
                            {course.credit_hours} credits • {course.teacher?.user?.name || 'No teacher assigned'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            handleRequestEnrollment(course.id);
                            setShowEnrollModal(false);
                          }}
                          disabled={requesting}
                          style={{
                            padding: '8px 16px',
                            background: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '600',
                            cursor: requesting ? 'not-allowed' : 'pointer',
                            opacity: requesting ? 0.5 : 1
                          }}
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
