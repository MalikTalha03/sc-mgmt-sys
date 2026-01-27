import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import {
  getAllDepartments,
  deleteDepartment,
  toggleDepartmentStatus,
} from "../firebase";
import type { Department } from "../models/department";
import { getAllStudents } from "../firebase/studentService";
import { getAllTeachers } from "../firebase/teacherService";
import { getAllCourses } from "../firebase/courseService";
import { 
  Building2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Trash2, 
  Power,
  Loader2,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, { students: number; teachers: number; courses: number }>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  useEffect(() => {
    if (departments.length > 0) {
      loadStats();
    }
  }, [departments]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
      alert("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [students, teachers, courses] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        getAllCourses(),
      ]);

      const statsMap: Record<string, { students: number; teachers: number; courses: number }> = {};
      
      departments.forEach(dept => {
        statsMap[dept.code] = {
          students: students.filter(s => s.departmentCode === dept.code).length,
          teachers: teachers.filter(t => t.departmentCode === dept.code).length,
          courses: courses.filter(c => c.departmentCode === dept.code).length,
        };
      });

      setStats(statsMap);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleDeleteDepartment = async (code: string) => {
    if (!confirm(`Are you sure you want to delete department ${code}?`)) return;

    try {
      await deleteDepartment(code);
      alert("Department deleted successfully!");
      loadDepartments();
      loadStats();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  };

  const handleToggleStatus = async (code: string) => {
    try {
      await toggleDepartmentStatus(code);
      alert("Department status updated!");
      loadDepartments();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update status");
    }
  };

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f3f4f6',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  };

  const deptCardStyle: React.CSSProperties = {
    padding: '24px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    marginBottom: '16px',
  };

  const statBoxStyle: React.CSSProperties = {
    textAlign: 'center' as const,
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <Building2 size={32} color="#4f46e5" />
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Departments
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0, marginLeft: '44px' }}>
            View all academic departments and their resources
          </p>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ ...statBoxStyle, background: 'white' }}>
            <Building2 size={24} color="#4f46e5" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#4f46e5' }}>{departments.length}</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Total Departments</p>
          </div>
          <div style={{ ...statBoxStyle, background: 'white' }}>
            <GraduationCap size={24} color="#059669" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#059669' }}>
              {Object.values(stats).reduce((sum, s) => sum + s.students, 0)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Total Students</p>
          </div>
          <div style={{ ...statBoxStyle, background: 'white' }}>
            <Users size={24} color="#0284c7" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#0284c7' }}>
              {Object.values(stats).reduce((sum, s) => sum + s.teachers, 0)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Total Faculty</p>
          </div>
          <div style={{ ...statBoxStyle, background: 'white' }}>
            <BookOpen size={24} color="#7c3aed" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontSize: '28px', fontWeight: '700', color: '#7c3aed' }}>
              {Object.values(stats).reduce((sum, s) => sum + s.courses, 0)}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6b7280' }}>Total Courses</p>
          </div>
        </div>

        {/* Departments List */}
        <Card>
          <CardHeader>All Departments</CardHeader>
          <div style={{ padding: '20px' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
                <p>Loading departments...</p>
              </div>
            ) : departments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
                <Building2 size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No departments found</p>
                <p style={{ fontSize: '14px' }}>Add departments from the Admin Dashboard</p>
              </div>
            ) : (
              departments.map((dept) => (
                <div key={dept.code} style={deptCardStyle}>
                  {/* Header Row */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        background: '#eef2ff',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Building2 size={24} color="#4f46e5" />
                      </div>
                      <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                          {dept.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Code: {dept.code}</p>
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      background: dept.isActive ? '#ecfdf5' : '#fef2f2',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '500',
                      color: dept.isActive ? '#059669' : '#dc2626',
                    }}>
                      {dept.isActive ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {dept.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                    <div style={statBoxStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <GraduationCap size={18} color="#059669" />
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                          {stats[dept.code]?.students || 0}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>Students</p>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <Users size={18} color="#0284c7" />
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#0284c7' }}>
                          {stats[dept.code]?.teachers || 0}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>Faculty</p>
                    </div>
                    <div style={statBoxStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <BookOpen size={18} color="#7c3aed" />
                        <span style={{ fontSize: '24px', fontWeight: '700', color: '#7c3aed' }}>
                          {stats[dept.code]?.courses || 0}
                        </span>
                      </div>
                      <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>Courses</p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => handleToggleStatus(dept.code)}
                    >
                      <Power size={14} />
                      {dept.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button 
                      variant="danger" 
                      size="sm" 
                      onClick={() => handleDeleteDepartment(dept.code)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
