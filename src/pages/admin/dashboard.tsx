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
  Megaphone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  studentService,
  teacherService,
  courseService,
  departmentService,
  enrollmentService,
  type AnnounceResultsResponse,
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
  const [announceLoading, setAnnounceLoading] = useState(false);
  const [announceResult, setAnnounceResult] = useState<AnnounceResultsResponse | null>(null);
  const [showAnnounceModal, setShowAnnounceModal] = useState(false);

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

  const handleAnnounceResults = async () => {
    setAnnounceLoading(true);
    try {
      const result = await enrollmentService.announceResults();
      setAnnounceResult(result);
      setShowAnnounceModal(true);
      if (result.success) {
        loadStats(); // Refresh counts after completion
      }
    } catch (error: any) {
      setAnnounceResult({ success: false, message: error.message || "Failed to process request" });
      setShowAnnounceModal(true);
    } finally {
      setAnnounceLoading(false);
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

        {/* Semester Operations */}
        <div className="card announce-results-card" style={{ marginTop: '32px' }}>
          <div className="card-header-row">
            <div>
              <h3 className="card-title" style={{ margin: 0 }}>Semester Operations</h3>
              <p className="text-sm text-muted" style={{ margin: '6px 0 0' }}>
                Announce results once all final grades are uploaded. This will promote student semesters and close all active enrollments.
              </p>
            </div>
            <button
              className="btn-announce"
              onClick={handleAnnounceResults}
              disabled={announceLoading}
            >
              {announceLoading
                ? <><Loader2 size={16} className="btn-spinner" /> Processing...</>
                : <><Megaphone size={16} /> Announce Results</>
              }
            </button>
          </div>
        </div>

        {/* Announce Results Modal */}
        {showAnnounceModal && announceResult && (
          <div className="modal-overlay" onClick={() => setShowAnnounceModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h2 className="card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {announceResult.success
                    ? <><CheckCircle2 size={22} color="#16a34a" /> Results Announced!</>
                    : <><AlertTriangle size={22} color="#d97706" /> Incomplete Grades</>
                  }
                </h2>
                <button className="btn-close" onClick={() => setShowAnnounceModal(false)}>
                  <XCircle size={20} />
                </button>
              </div>

              {announceResult.success ? (
                <div className="announce-success-body">
                  <p className="announce-success-msg">{announceResult.message}</p>
                  <div className="announce-stats-row">
                    <div className="announce-stat-box announce-stat-green">
                      <span className="announce-stat-num">{announceResult.promoted_count}</span>
                      <span className="announce-stat-label">Students Promoted</span>
                    </div>
                    <div className="announce-stat-box announce-stat-blue">
                      <span className="announce-stat-num">{announceResult.completed_count}</span>
                      <span className="announce-stat-label">Enrollments Completed</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="announce-fail-body">
                  <p className="announce-fail-msg">{announceResult.message}</p>
                  {announceResult.incomplete_courses && announceResult.incomplete_courses.length > 0 && (
                    <>
                      <p className="announce-fail-subtitle">The following courses have students with missing final grades:</p>
                      <div className="incomplete-courses-list">
                        {announceResult.incomplete_courses.map((course) => (
                          <div key={course.id} className="incomplete-course-item">
                            <div className="incomplete-course-name">{course.title}</div>
                            <span className="incomplete-course-badge">
                              {course.incomplete_count} student{course.incomplete_count !== 1 ? 's' : ''} ungraded
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button className="btn-primary" onClick={() => setShowAnnounceModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
