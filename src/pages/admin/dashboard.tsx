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
  Clock,
} from "lucide-react";
import {
  getAllStudents,
  getAllTeachers,
  getAllCourses,
  getAllDepartments,
  getAllEnrollments,
} from "../../firebase";
import type { Enrollment } from "../../models/enrollment";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    students: 0,
    teachers: 0,
    courses: 0,
    departments: 0,
    pendingEnrollments: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [students, teachers, courses, departments, enrollments] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        getAllCourses(),
        getAllDepartments(),
        getAllEnrollments(),
      ]);
      setStats({
        students: students.length,
        teachers: teachers.length,
        courses: courses.length,
        departments: departments.length,
        pendingEnrollments: enrollments.filter((e: Enrollment & { id: string }) => e.status === "pending").length,
      });
    } catch (error) {
      console.error("Error loading stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6' };
  const contentStyle: React.CSSProperties = { padding: '24px 32px' };
  const headerStyle: React.CSSProperties = { marginBottom: '32px' };
  const statsGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' };
  
  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
  };

  const quickLinksStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '16px',
  };

  const quickLinkStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px 24px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textDecoration: 'none',
    color: '#374151',
    transition: 'all 0.2s',
  };

  const iconBoxStyle = (color: string): React.CSSProperties => ({
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: color === 'indigo' ? '#eef2ff' : color === 'green' ? '#ecfdf5' : color === 'blue' ? '#eff6ff' : color === 'orange' ? '#fff7ed' : '#fef3c7',
    color: color === 'indigo' ? '#4f46e5' : color === 'green' ? '#059669' : color === 'blue' ? '#2563eb' : color === 'orange' ? '#ea580c' : '#d97706',
  });

  if (loading) {
    return (
      <div style={{ ...containerStyle, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: '#6b7280' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>Dashboard</h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: '8px 0 0' }}>Welcome to the School Management System</p>
        </div>

        {/* Stats Grid */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>Total Students</p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.students}</h2>
              </div>
              <div style={iconBoxStyle('indigo')}><GraduationCap size={24} /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#059669' }}>
              <TrendingUp size={14} /> Active learners
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>Total Teachers</p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.teachers}</h2>
              </div>
              <div style={iconBoxStyle('green')}><Users size={24} /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6b7280' }}>
              Faculty members
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>Total Courses</p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.courses}</h2>
              </div>
              <div style={iconBoxStyle('blue')}><BookOpen size={24} /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6b7280' }}>
              Available courses
            </div>
          </div>

          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: '0 0 8px' }}>Departments</p>
                <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#111827', margin: 0 }}>{stats.departments}</h2>
              </div>
              <div style={iconBoxStyle('orange')}><Building2 size={24} /></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6b7280' }}>
              Academic departments
            </div>
          </div>

          {stats.pendingEnrollments > 0 && (
            <div style={{ ...statCardStyle, background: '#fffbeb', borderColor: '#fcd34d' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#92400e', margin: '0 0 8px' }}>Pending Enrollments</p>
                  <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#92400e', margin: 0 }}>{stats.pendingEnrollments}</h2>
                </div>
                <div style={iconBoxStyle('yellow')}><Clock size={24} /></div>
              </div>
              <div style={{ marginTop: '16px' }}>
                <Link to="/admin/enrollments" style={{ fontSize: '13px', color: '#d97706', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Review requests <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Quick Links */}
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 16px' }}>Quick Actions</h3>
        <div style={quickLinksStyle}>
          <Link to="/admin/students" style={quickLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={iconBoxStyle('indigo')}><GraduationCap size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Students</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Add, edit, or remove students</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/teachers" style={quickLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={iconBoxStyle('green')}><Users size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Teachers</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Manage faculty members</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/courses" style={quickLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={iconBoxStyle('blue')}><BookOpen size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Courses</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Configure course offerings</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/departments" style={quickLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={iconBoxStyle('orange')}><Building2 size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Manage Departments</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Organize academic units</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>

          <Link to="/admin/enrollments" style={quickLinkStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={iconBoxStyle('yellow')}><ClipboardList size={22} /></div>
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: '#111827' }}>Enrollment Requests</h4>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Approve or reject enrollments</p>
              </div>
            </div>
            <ArrowRight size={18} color="#9ca3af" />
          </Link>
        </div>
      </div>
    </div>
  );
}
