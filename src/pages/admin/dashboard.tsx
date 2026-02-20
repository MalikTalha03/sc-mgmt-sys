import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Users,
  BookOpen,
  Building2,
  ClipboardList,
  Loader2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import {
  studentService,
  teacherService,
  courseService,
  departmentService,
  enrollmentService,
} from "../../services";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    departments: 0,
    enrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [students, teachers, courses, departments, enrollments] = await Promise.all([
        studentService.getAll(),
        teacherService.getAll(),
        courseService.getAll(),
        departmentService.getAll(),
        enrollmentService.getAll(),
      ]);
      setStats({
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        departments: departments.length,
        enrollments: enrollments.length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-bg loading-page">
        <div className="loading-content" style={{ color: '#6b7280' }}>
          <Loader2 size={32} className="loading-spinner" style={{ margin: '0 auto 12px' }} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="page-content">
        <div style={{ marginBottom: '32px' }}>
          <h1 className="page-title-lg">Dashboard</h1>
          <p className="page-subtitle" style={{ margin: '8px 0 0' }}>Welcome to the School Management System</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-auto">
          <div className="card-no-mb">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label" style={{ margin: '0 0 8px' }}>Total Students</p>
                <h2 className="stat-big-value">{stats.students}</h2>
              </div>
              <div className="icon-box-indigo"><GraduationCap size={24} /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#059669' }}>
              <TrendingUp size={14} /> Active learners
            </div>
          </div>

          <div className="card-no-mb">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label" style={{ margin: '0 0 8px' }}>Total Teachers</p>
                <h2 className="stat-big-value">{stats.teachers}</h2>
              </div>
              <div className="icon-box-green"><Users size={24} /></div>
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '16px' }}>Faculty members</div>
          </div>

          <div className="card-no-mb">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label" style={{ margin: '0 0 8px' }}>Total Courses</p>
                <h2 className="stat-big-value">{stats.courses}</h2>
              </div>
              <div className="icon-box-blue"><BookOpen size={24} /></div>
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '16px' }}>Available courses</div>
          </div>

          <div className="card-no-mb">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label" style={{ margin: '0 0 8px' }}>Departments</p>
                <h2 className="stat-big-value">{stats.departments}</h2>
              </div>
              <div className="icon-box-orange"><Building2 size={24} /></div>
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '16px' }}>Academic departments</div>
          </div>

          <div className="card-no-mb">
            <div className="stat-card-inner">
              <div>
                <p className="stat-label" style={{ margin: '0 0 8px' }}>Total Enrollments</p>
                <h2 className="stat-big-value">{stats.enrollments}</h2>
              </div>
              <div className="icon-box-yellow"><ClipboardList size={24} /></div>
            </div>
            <div className="text-sm text-muted" style={{ marginTop: '16px' }}>Student enrollments</div>
          </div>
        </div>

        {/* Quick Links */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px' }}>Quick Actions</h3>
        <div className="quick-links-grid">
          <Link to="/admin/students" className="quick-link">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-box-indigo"><GraduationCap size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Students</h4>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Add, edit, or remove students</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/teachers" className="quick-link">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-box-green"><Users size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Teachers</h4>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Manage faculty members</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/courses" className="quick-link">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-box-blue"><BookOpen size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Courses</h4>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Configure course offerings</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/departments" className="quick-link">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-box-orange"><Building2 size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Departments</h4>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Organize academic units</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/enrollments" className="quick-link">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="icon-box-yellow"><ClipboardList size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Enrollment Requests</h4>
                <p className="text-sm text-muted" style={{ margin: '4px 0 0' }}>Approve or reject enrollments</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>
        </div>
      </div>
    </div>
  );
}
