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

  if (loading) {
    return (
      <div className="page-bg">
        <div className="loading-container">
          <div className="loading-content">
            <Loader2 size={40} className="loading-spinner-purple" />
            <p className="loading-text">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="page-bg">
        <div className="empty-state-container">
          <div className="empty-state-card">
            <Users size={64} className="empty-state-icon" />
            <h1 className="empty-state-title">No Teacher Record</h1>
            <p className="empty-state-description">No teacher record found for your account.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = courses.reduce((sum, course) => 
    sum + getEnrollmentCountForCourse(course.id), 0
  );

  return (
    <div className="page-bg">
      <div className="page-content">
        {/* Header */}
        <div className="card">
          <div className="flex-between">
            <div>
              <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={28} color="#9333ea" />
                Teacher Dashboard
              </h1>
              <p className="page-subtitle">
                {teacher.user?.name && <span style={{ fontWeight: '500', color: '#111827' }}>{teacher.user.name} • </span>}
                {department?.name} • {formatDesignation(teacher.designation)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea', margin: 0 }}>{courses.length}</p>
              <p className="stat-label">Courses</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid-sm">
          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-purple">
                <BookOpen size={24} color="#9333ea" />
              </div>
              <div>
                <p className="stat-value">{courses.length}</p>
                <p className="stat-label">Active Courses</p>
              </div>
            </div>
          </div>

          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-pink">
                <Users size={24} color="#ec4899" />
              </div>
              <div>
                <p className="stat-value">{totalStudents}</p>
                <p className="stat-label">Total Students</p>
              </div>
            </div>
          </div>

          <div className="card-no-mb">
            <div className="stats-row">
              <div className="stat-icon-indigo">
                <Building2 size={24} color="#4f46e5" />
              </div>
              <div>
                <p style={{ fontSize: '18px', fontWeight: '700', color: '#111827', margin: 0 }}>{department?.code}</p>
                <p className="stat-label">Department</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses List */}
        <div className="table-container">
          <div className="card-header-row">
            <h2 className="card-title">My Courses</h2>
          </div>
          {courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No courses assigned</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th">Course</th>
                  <th className="th">Credits</th>
                  <th className="th">Students</th>
                  <th className="th">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const enrolledCount = getEnrollmentCountForCourse(course.id);
                  return (
                    <tr key={course.id}>
                      <td className="td">
                        <span className="font-medium text-primary">{course.title}</span>
                      </td>
                      <td className="td">{course.credit_hours} hrs</td>
                      <td className="td">
                        <span className="badge-purple-sm">
                          <Users size={12} />
                          {enrolledCount} students
                        </span>
                      </td>
                      <td className="td">
                        <button className="btn-sm-purple" onClick={() => handleManageGrades(course.id)}>
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
