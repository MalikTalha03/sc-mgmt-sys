import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { teacherService, type Teacher } from "../services/teacher.service";
import { courseService, type Course } from "../services/course.service";
import { type Department } from "../services/department.service";
import { enrollmentService, type Enrollment } from "../services/enrollment.service";
import { Loader2, Users, BookOpen, Building2, Edit2 } from "lucide-react";

export default function TeacherPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [allEnrollments, setAllEnrollments] = useState<Enrollment[]>([]);
  const [department, setDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadTeacherData();
    }
  }, [currentUser]);

  const loadTeacherData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser) return;
      
      const teacherData = await teacherService.getByUserId(currentUser.id);
      if (!teacherData) {
        alert("No teacher record found for this user");
        return;
      }
      setTeacher(teacherData);

      const [coursesData, enrollmentsData] = await Promise.all([
        courseService.getAll(),
        enrollmentService.getAll(),
      ]);

      const myCourses = coursesData.filter(c => c.teacher_id === teacherData.id);
      setCourses(myCourses);
      setAllEnrollments(enrollmentsData);
      setDepartment(teacherData.department || null);
    } catch (error) {
      console.error("Error loading teacher data:", error);
      alert("Failed to load teacher data");
    } finally {
      setLoading(false);
    }
  };

  const getEnrollmentCountForCourse = (courseId: number) => {
    return allEnrollments.filter(e => e.course_id === courseId && e.status === 'approved').length;
  };

  const handleManageGrades = (courseId: number) => {
    navigate(`/teacher/${courseId}/grades`);
  };

  const formatDesignation = (designation: string) => {
    return designation.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#9333ea' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', padding: '40px', textAlign: 'center' }}>
            <Users size={64} style={{ margin: '0 auto 16px', color: '#9ca3af' }} />
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 8px' }}>No Teacher Record</h1>
            <p style={{ color: '#6b7280', margin: 0 }}>No teacher record found for your account.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((sum, course) => 
    sum + getEnrollmentCountForCourse(course.id), 0
  );

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={28} color="#9333ea" />
                Teacher Dashboard
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
                {teacher.user?.name && <span style={{ fontWeight: '500', color: '#111827' }}>{teacher.user.name} • </span>}
                {department?.name} • {formatDesignation(teacher.designation)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea', margin: 0 }}>{courses.length}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Courses</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#f3e8ff', borderRadius: '10px', padding: '12px' }}>
                <BookOpen size={24} color="#9333ea" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{courses.length}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Active Courses</p>
              </div>
            </div>
          </div>

          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#fce7f3', borderRadius: '10px', padding: '12px' }}>
                <Users size={24} color="#ec4899" />
              </div>
              <div>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{totalStudents}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Total Students</p>
              </div>
            </div>
          </div>

          <div style={statsCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: '#e0e7ff', borderRadius: '10px', padding: '12px' }}>
                <Building2 size={24} color="#4f46e5" />
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>{department?.code}</p>
                <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Department</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div style={tableContainerStyle}>
          <div style={{ padding: '20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>My Courses</h2>
          </div>
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No courses assigned</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Credits</th>
                  <th style={thStyle}>Students</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const enrolledCount = getEnrollmentCountForCourse(course.id);
                  
                  return (
                    <tr key={course.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '500', color: '#111827' }}>{course.title}</span>
                      </td>
                      <td style={tdStyle}>
                        {course.credit_hours} hrs
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f3e8ff', color: '#7e22ce', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                          <Users size={12} />
                          {enrolledCount} students
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <button
                          onClick={() => handleManageGrades(course.id)}
                          style={{
                            padding: '6px 12px',
                            background: '#9333ea',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '13px',
                            fontWeight: '500',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Edit2 size={14} />
                          Manage Grades
                        </button>
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
