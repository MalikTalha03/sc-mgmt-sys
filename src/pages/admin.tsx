import { useState, useEffect } from "react";
import { CourseForm } from "../components/courseForm";
import { StudentForm } from "../components/studentform";
import { TeacherForm } from "../components/teacherform";
import { DepartmentForm } from "../components/departmentForm";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Dropdown } from "../components/dropdown";
import {
  Users,
  GraduationCap,
  BookOpen,
  Building2,
  ClipboardList,
  AlertCircle,
  Trash2,
  Check,
  X,
  Loader2
} from "lucide-react";
import {
  getAllStudents,
  createStudent,
  deleteStudent,
  getAllTeachers,
  createTeacher,
  deleteTeacher,
  getAllCourses,
  createCourse,
  deleteCourse,
  getAllDepartments,
  createDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
  getPendingEnrollments,
  createEnrollment,
  updateEnrollmentStatus,
  deleteEnrollment,
  getEnrollmentsByStudent,
} from "../firebase";
import type { Student } from "../models/student";
import type { Teacher } from "../models/teacher";
import type { Course } from "../models/course";
import type { Department } from "../models/department";
import type { Enrollment } from "../models/enrollment";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<"students" | "teachers" | "courses" | "departments" | "enrollments">("students");
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingEnrollmentCount, setPendingEnrollmentCount] = useState(0);

  // Enrollment states
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    loadData();
    loadPendingEnrollments();
    loadDepartments();
  }, [activeTab]);

  const loadDepartments = async () => {
    try {
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadPendingEnrollments = async () => {
    try {
      const pending = await getPendingEnrollments();
      setPendingEnrollmentCount(pending.length);
    } catch (error) {
      console.error("Error loading pending enrollments:", error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      if (activeTab === "students") {
        const data = await getAllStudents();
        setStudents(data);
      } else if (activeTab === "teachers") {
        const data = await getAllTeachers();
        setTeachers(data);
      } else if (activeTab === "courses") {
        const data = await getAllCourses();
        setCourses(data);
      } else if (activeTab === "departments") {
        const data = await getAllDepartments();
        setDepartments(data);
      } else if (activeTab === "enrollments") {
        const [studentsData, coursesData, enrollmentsData] = await Promise.all([
          getAllStudents(),
          getAllCourses(),
          getPendingEnrollments(),
        ]);
        setStudents(studentsData);
        setCourses(coursesData);
        setPendingEnrollments(enrollmentsData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (data: any) => {
    try {
      await createStudent({
        studentId: data.studentId,
        name: data.name,
        semester: parseInt(data.semester),
        departmentCode: data.departmentCode,
        currentCreditHours: 0,
        maxCreditHours: 18,
      });
      alert("Student created successfully!");
      loadData();
    } catch (error) {
      console.error("Error creating student:", error);
      alert("Failed to create student");
    }
  };

  const handleCreateTeacher = async (data: any) => {
    try {
      await createTeacher({
        name: data.name,
        designation: data.designation,
        departmentCode: data.departmentCode,
        assignedCourses: [],
      });
      alert("Teacher created successfully!");
      loadData();
    } catch (error) {
      console.error("Error creating teacher:", error);
      alert("Failed to create teacher");
    }
  };

  const handleCreateCourse = async (data: any) => {
    try {
      await createCourse({
        code: data.code,
        title: data.title,
        creditHours: parseInt(data.creditHours),
        departmentCode: data.departmentCode,
        semester: parseInt(data.semester),
      });
      alert("Course created successfully!");
      loadData();
    } catch (error) {
      console.error("Error creating course:", error);
      alert("Failed to create course");
    }
  };

  const handleCreateDepartment = async (data: { code: string; name: string; isActive: boolean }) => {
    try {
      await createDepartment(data);
      alert("Department created successfully!");
      loadData();
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Failed to create department");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    try {
      await deleteStudent(studentId);
      alert("Student deleted!");
      loadData();
    } catch (error) {
      console.error("Error deleting student:", error);
      alert("Failed to delete student");
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    try {
      await deleteTeacher(teacherId);
      alert("Teacher deleted!");
      loadData();
    } catch (error) {
      console.error("Error deleting teacher:", error);
      alert("Failed to delete teacher");
    }
  };

  const handleDeleteCourse = async (courseCode: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;
    try {
      await deleteCourse(courseCode);
      alert("Course deleted!");
      loadData();
    } catch (error) {
      console.error("Error deleting course:", error);
      alert("Failed to delete course");
    }
  };

  const handleDeleteDepartment = async (code: string) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    try {
      await deleteDepartment(code);
      alert("Department deleted!");
      loadData();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  };

  // Enrollment handlers
  const handleStudentSelect = async (studentId: string) => {
    setSelectedStudent(studentId);
    setSelectedCourse("");

    if (studentId) {
      try {
        const enrollments = await getEnrollmentsByStudent(studentId);
        setStudentEnrollments(enrollments);
      } catch (error) {
        console.error("Error loading student enrollments:", error);
      }
    } else {
      setStudentEnrollments([]);
    }
  };

  const handleRequestEnrollment = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert("Please select both student and course");
      return;
    }

    try {
      setLoading(true);
      await createEnrollment({
        studentId: selectedStudent,
        courseCode: selectedCourse,
        status: "pending",
      });
      alert("Enrollment request submitted successfully!");

      await loadData();
      const enrollments = await getEnrollmentsByStudent(selectedStudent);
      setStudentEnrollments(enrollments);
      setSelectedCourse("");
    } catch (error: any) {
      console.error("Error requesting enrollment:", error);
      alert(error.message || "Failed to request enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleApproveEnrollment = async (enrollment: Enrollment) => {
    try {
      setLoading(true);
      await updateEnrollmentStatus(enrollment.studentId, enrollment.courseCode, "approved");
      alert("Enrollment approved successfully!");
      await loadData();
      await loadPendingEnrollments();
    } catch (error) {
      console.error("Error approving enrollment:", error);
      alert("Failed to approve enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleRejectEnrollment = async (enrollment: Enrollment) => {
    try {
      setLoading(true);
      await updateEnrollmentStatus(enrollment.studentId, enrollment.courseCode, "rejected");
      alert("Enrollment rejected!");
      await loadData();
      await loadPendingEnrollments();
    } catch (error) {
      console.error("Error rejecting enrollment:", error);
      alert("Failed to reject enrollment");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEnrollment = async (enrollment: Enrollment) => {
    if (!confirm("Are you sure you want to delete this enrollment?")) {
      return;
    }

    try {
      setLoading(true);
      await deleteEnrollment(enrollment.studentId, enrollment.courseCode);
      alert("Enrollment deleted successfully!");
      await loadData();
      await loadPendingEnrollments();
    } catch (error) {
      console.error("Error deleting enrollment:", error);
      alert("Failed to delete enrollment");
    } finally {
      setLoading(false);
    }
  };

  const getStudentById = (studentId: string) => {
    return students.find(s => s.studentId === studentId);
  };

  const getCourseByCode = (courseCode: string) => {
    return courses.find(c => c.code === courseCode);
  };

  const isEnrolled = (courseCode: string) => {
    return studentEnrollments.some(e => e.courseCode === courseCode);
  };

  const availableCourses = courses.filter(course => !isEnrolled(course.code));

  const tabs = [
    { id: "students", label: "Students", icon: GraduationCap },
    { id: "teachers", label: "Teachers", icon: Users },
    { id: "courses", label: "Courses", icon: BookOpen },
    { id: "departments", label: "Departments", icon: Building2 },
    { id: "enrollments", label: "Enrollments", icon: ClipboardList },
  ];

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f3f4f6',
    paddingLeft: '280px',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '32px 24px',
  };

  const headerStyle: React.CSSProperties = {
    marginBottom: '32px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 8px 0',
  };

  const subtitleStyle: React.CSSProperties = {
    color: '#6b7280',
    fontSize: '15px',
    margin: 0,
  };

  const tabsContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '8px',
    background: 'white',
    padding: '8px',
    borderRadius: '14px',
    marginBottom: '32px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  };

  const itemCardStyle: React.CSSProperties = {
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={headerStyle}>
          <h1 style={titleStyle}>Admin Dashboard</h1>
          <p style={subtitleStyle}>Manage students, teachers, courses, and departments</p>
        </div>

        {/* Pending Enrollments Alert */}
        {pendingEnrollmentCount > 0 && activeTab !== "enrollments" && (
          <div style={{
            marginBottom: '24px',
            padding: '16px 20px',
            background: '#fef3c7',
            border: '1px solid #fcd34d',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={20} color="#d97706" />
              <div>
                <p style={{ margin: 0, fontWeight: '600', color: '#92400e', fontSize: '14px' }}>
                  Pending Enrollment Requests
                </p>
                <p style={{ margin: 0, color: '#a16207', fontSize: '13px' }}>
                  You have {pendingEnrollmentCount} request{pendingEnrollmentCount !== 1 ? 's' : ''} waiting
                </p>
              </div>
            </div>
            <Button variant="primary" size="sm" onClick={() => setActiveTab("enrollments")}>
              Review Now
            </Button>
          </div>
        )}

        {/* Tabs */}
        <div style={tabsContainerStyle}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '10px',
                  border: 'none',
                  background: isActive ? '#4f46e5' : 'transparent',
                  color: isActive ? 'white' : '#6b7280',
                  fontWeight: '500',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div>
              <StudentForm onSubmit={handleCreateStudent} departments={departments} />
            </div>
            <div>
              <Card>
                <CardHeader>All Students ({students.length})</CardHeader>
                <div style={{ padding: '20px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      <p>Loading...</p>
                    </div>
                  ) : students.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No students found</p>
                  ) : (
                    students.map((student) => (
                      <div key={student.studentId} style={itemCardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                              {student.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                              ID: {student.studentId} • {student.departmentCode} • Semester {student.semester}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                              Credits: {student.currentCreditHours}/{student.maxCreditHours}
                            </p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.studentId)}>
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
        )}

        {/* Teachers Tab */}
        {activeTab === "teachers" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div>
              <TeacherForm onSubmit={handleCreateTeacher} departments={departments} />
            </div>
            <div>
              <Card>
                <CardHeader>All Teachers ({teachers.length})</CardHeader>
                <div style={{ padding: '20px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      <p>Loading...</p>
                    </div>
                  ) : teachers.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No teachers found</p>
                  ) : (
                    teachers.map((teacher) => (
                      <div key={teacher.id} style={itemCardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                              {teacher.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                              {teacher.designation} • {teacher.departmentCode}
                            </p>
                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#6b7280' }}>
                              Courses: {teacher.assignedCourses.length}
                            </p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id!)}>
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
        )}

        {/* Courses Tab */}
        {activeTab === "courses" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div>
              <CourseForm onSubmit={handleCreateCourse} departments={departments} />
            </div>
            <div>
              <Card>
                <CardHeader>All Courses ({courses.length})</CardHeader>
                <div style={{ padding: '20px' }}>
                  {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      <p>Loading...</p>
                    </div>
                  ) : courses.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>No courses found</p>
                  ) : (
                    courses.map((course) => (
                      <div key={course.code} style={itemCardStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                              {course.title}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                              {course.code} • {course.departmentCode} • {course.creditHours} Credits • Semester {course.semester}
                            </p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.code)}>
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
        )}

        {/* Departments Tab */}
        {activeTab === "departments" && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
            <div>
              <DepartmentForm onSubmit={handleCreateDepartment} />
            </div>
            <div>
              <Card>
                <CardHeader>All Departments ({departments.length})</CardHeader>
                <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  {loading ? (
                    <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                      <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                      <p>Loading...</p>
                    </div>
                  ) : departments.length === 0 ? (
                    <p style={{ gridColumn: 'span 2', textAlign: 'center', color: '#6b7280', padding: '40px' }}>No departments found</p>
                  ) : (
                    departments.map((dept) => (
                      <div key={dept.code} style={{
                        padding: '20px',
                        background: 'white',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                          <div>
                            <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                              {dept.name}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Code: {dept.code}</p>
                          </div>
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '500',
                            background: dept.isActive ? '#dcfce7' : '#fee2e2',
                            color: dept.isActive ? '#166534' : '#991b1b',
                          }}>
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <Button variant="secondary" size="sm" onClick={() => toggleDepartmentStatus(dept.code).then(loadData)}>
                            {dept.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteDepartment(dept.code)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Enrollments Tab */}
        {activeTab === "enrollments" && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* New Enrollment Request Form */}
            <Card>
              <CardHeader>Request New Enrollment</CardHeader>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                  <Dropdown
                    label="Select Student"
                    options={students.map(s => ({ value: s.studentId, label: `${s.name} (${s.studentId})` }))}
                    value={selectedStudent}
                    onChange={handleStudentSelect}
                    placeholder="Choose a student"
                  />
                  <Dropdown
                    label="Select Course"
                    options={availableCourses.map(c => ({
                      value: c.code,
                      label: `${c.title} (${c.code})`
                    }))}
                    value={selectedCourse}
                    onChange={setSelectedCourse}
                    placeholder={selectedStudent ? "Choose a course" : "Select student first"}
                    disabled={!selectedStudent}
                  />
                </div>

                {selectedStudent && studentEnrollments.length > 0 && (
                  <div style={{
                    marginBottom: '20px',
                    padding: '16px',
                    background: '#f9fafb',
                    borderRadius: '12px',
                  }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                      Current Enrollments for {getStudentById(selectedStudent)?.name}
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {studentEnrollments.map(enrollment => {
                        const course = getCourseByCode(enrollment.courseCode);
                        const statusColors: Record<string, { bg: string; color: string }> = {
                          approved: { bg: '#dcfce7', color: '#166534' },
                          pending: { bg: '#fef3c7', color: '#92400e' },
                          rejected: { bg: '#fee2e2', color: '#991b1b' },
                        };
                        const colors = statusColors[enrollment.status] || statusColors.pending;
                        return (
                          <div key={enrollment.courseCode} style={{
                            padding: '10px 14px',
                            background: 'white',
                            borderRadius: '8px',
                            border: '1px solid #e5e7eb',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                          }}>
                            <span style={{ fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                              {course?.title} ({enrollment.courseCode})
                            </span>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: '600',
                              textTransform: 'uppercase',
                              background: colors.bg,
                              color: colors.color,
                            }}>
                              {enrollment.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleRequestEnrollment}
                  disabled={!selectedStudent || !selectedCourse || loading}
                >
                  {loading ? "Processing..." : "Submit Enrollment Request"}
                </Button>
              </div>
            </Card>

            {/* Pending Enrollments List */}
            <Card>
              <CardHeader>Pending Enrollment Requests ({pendingEnrollments.length})</CardHeader>
              <div style={{ padding: '24px' }}>
                {loading && pendingEnrollments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                    <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
                    <p>Loading...</p>
                  </div>
                ) : pendingEnrollments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px' }}>
                    <Check size={48} color="#10b981" style={{ margin: '0 auto 12px' }} />
                    <p style={{ fontSize: '16px', color: '#6b7280', margin: 0 }}>No pending enrollment requests</p>
                    <p style={{ fontSize: '13px', color: '#9ca3af', margin: '4px 0 0 0' }}>All enrollments have been processed</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {pendingEnrollments.map((enrollment) => {
                      const student = getStudentById(enrollment.studentId);
                      const course = getCourseByCode(enrollment.courseCode);

                      return (
                        <div
                          key={`${enrollment.studentId}-${enrollment.courseCode}`}
                          style={itemCardStyle}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                            <div style={{ flex: 1 }}>
                              <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                                {student?.name || enrollment.studentId}
                              </h3>
                              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#6b7280' }}>
                                Student ID: {enrollment.studentId} • Semester: {student?.semester || "N/A"}
                              </p>
                              <div style={{
                                display: 'inline-block',
                                padding: '6px 12px',
                                background: '#f3f4f6',
                                borderRadius: '8px',
                              }}>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: '#111827' }}>
                                  {course?.title || enrollment.courseCode}
                                </p>
                                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>
                                  {enrollment.courseCode} • {course?.creditHours || "?"} Credits • Semester {course?.semester || "?"}
                                </p>
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleApproveEnrollment(enrollment)}
                                disabled={loading}
                              >
                                <Check size={14} />
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleRejectEnrollment(enrollment)}
                                disabled={loading}
                              >
                                <X size={14} />
                                Reject
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleDeleteEnrollment(enrollment)}
                                disabled={loading}
                              >
                                <Trash2 size={14} />
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
