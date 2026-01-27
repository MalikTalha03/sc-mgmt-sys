import { useState, useEffect } from "react";
import { Button } from "../components/button";
import {
  getAllCourses,
  getAllTeachers,
  assignCourseToTeacher,
  removeCourseFromTeacher,
  countCourseEnrollments,
} from "../firebase";
import type { Course } from "../models/course";
import type { Teacher } from "../models/teacher";
import { 
  BookOpen, 
  Users, 
  UserCheck, 
  UserX, 
  Loader2,
  GraduationCap,
  Building2,
  Clock
} from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, teachersData] = await Promise.all([
        getAllCourses(),
        getAllTeachers(),
      ]);
      
      setCourses(coursesData);
      setTeachers(teachersData);

      const counts: Record<string, number> = {};
      for (const course of coursesData) {
        counts[course.code] = await countCourseEnrollments(course.code);
      }
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const getTeacherForCourse = (courseCode: string): Teacher | undefined => {
    return teachers.find(t => t.assignedCourses.includes(courseCode));
  };

  const handleAssignTeacher = async (courseCode: string) => {
    if (!selectedTeacher) {
      alert("Please select a teacher");
      return;
    }

    try {
      await assignCourseToTeacher(selectedTeacher, courseCode);
      alert("Teacher assigned successfully!");
      setSelectedCourse(null);
      setSelectedTeacher("");
      loadData();
    } catch (error) {
      console.error("Error assigning teacher:", error);
      alert("Failed to assign teacher");
    }
  };

  const handleUnassignTeacher = async (courseCode: string) => {
    const teacher = getTeacherForCourse(courseCode);
    if (!teacher) return;

    if (!confirm(`Unassign ${teacher.name} from this course?`)) return;

    try {
      await removeCourseFromTeacher(teacher.id!, courseCode);
      alert("Teacher unassigned successfully!");
      loadData();
    } catch (error) {
      console.error("Error unassigning teacher:", error);
      alert("Failed to unassign teacher");
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

  const statsRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '32px',
  };

  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  };

  const tableContainerStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    padding: '14px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  };

  const tdStyle: React.CSSProperties = {
    padding: '16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  };

  const badgeStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  };

  const totalStudents = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);
  const coursesWithTeacher = courses.filter(c => getTeacherForCourse(c.code)).length;
  const totalCredits = courses.reduce((sum, c) => sum + c.creditHours, 0);

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <BookOpen size={28} color="#4f46e5" />
            <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: 0 }}>
              Courses
            </h1>
          </div>
          <p style={{ color: '#6b7280', fontSize: '14px', margin: 0, marginLeft: '40px' }}>
            Manage courses and faculty assignments
          </p>
        </div>

        {/* Stats Row */}
        <div style={statsRowStyle}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '10px' }}>
                <BookOpen size={20} color="#4f46e5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{courses.length}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Total Courses</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px' }}>
                <UserCheck size={20} color="#059669" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{coursesWithTeacher}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>With Instructor</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '10px' }}>
                <GraduationCap size={20} color="#d97706" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{totalStudents}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Total Enrollments</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f3e8ff', borderRadius: '10px' }}>
                <Clock size={20} color="#7c3aed" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{totalCredits}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Total Credits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Courses Table */}
        <div style={tableContainerStyle}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb' }}>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>All Courses</h2>
          </div>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p>Loading courses...</p>
            </div>
          ) : courses.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={48} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No courses found</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Department</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Credits</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Semester</th>
                  <th style={{ ...thStyle, textAlign: 'center' }}>Students</th>
                  <th style={thStyle}>Instructor</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((course) => {
                  const teacher = getTeacherForCourse(course.code);
                  return (
                    <tr key={course.code} style={{ background: 'white' }}>
                      <td style={tdStyle}>
                        <div>
                          <p style={{ margin: 0, fontWeight: '600', color: '#111827' }}>{course.title}</p>
                          <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{course.code}</p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ ...badgeStyle, background: '#eef2ff', color: '#4f46e5' }}>
                          <Building2 size={12} />
                          {course.departmentCode}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600' }}>{course.creditHours}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{course.semester}</td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>
                        <span style={{ ...badgeStyle, background: '#f3f4f6', color: '#374151' }}>
                          <Users size={12} />
                          {enrollmentCounts[course.code] || 0}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        {teacher ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '32px',
                              height: '32px',
                              background: '#ecfdf5',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <UserCheck size={14} color="#059669" />
                            </div>
                            <span style={{ fontWeight: '500', color: '#059669' }}>{teacher.name}</span>
                          </div>
                        ) : (
                          <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Not assigned</span>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {teacher ? (
                          <Button variant="danger" size="sm" onClick={() => handleUnassignTeacher(course.code)}>
                            <UserX size={14} />
                            Unassign
                          </Button>
                        ) : selectedCourse === course.code ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                            <select
                              value={selectedTeacher}
                              onChange={(e) => setSelectedTeacher(e.target.value)}
                              style={{
                                padding: '6px 10px',
                                border: '1px solid #d1d5db',
                                borderRadius: '6px',
                                fontSize: '13px',
                                minWidth: '150px',
                              }}
                            >
                              <option value="">Select teacher</option>
                              {teachers
                                .filter(t => t.departmentCode === course.departmentCode)
                                .map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name}
                                  </option>
                                ))}
                            </select>
                            <Button variant="primary" size="sm" onClick={() => handleAssignTeacher(course.code)}>
                              Save
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => setSelectedCourse(null)}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button variant="primary" size="sm" onClick={() => setSelectedCourse(course.code)}>
                            <UserCheck size={14} />
                            Assign
                          </Button>
                        )}
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
