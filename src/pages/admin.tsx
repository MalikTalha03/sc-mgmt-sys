import { useState, useEffect } from "react";
import { CourseForm } from "../components/courseForm";
import { StudentForm } from "../components/studentform";
import { TeacherForm } from "../components/teacherform";
import { DepartmentForm } from "../components/departmentForm";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Dropdown } from "../components/dropdown";
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
    { id: "students", label: "Students" },
    { id: "teachers", label: "Teachers" },
    { id: "courses", label: "Courses" },
    { id: "departments", label: "Departments" },
    { id: "enrollments", label: "Enrollments" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-600">Comprehensive management of students, faculty, courses, and departments</p>
        </div>

        {/* Pending Enrollments Alert */}
        {pendingEnrollmentCount > 0 && activeTab !== "enrollments" && (
          <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-yellow-800">
                    Pending Enrollment Requests
                  </h3>
                  <p className="text-sm text-yellow-700">
                    You have {pendingEnrollmentCount} enrollment request{pendingEnrollmentCount !== 1 ? 's' : ''} waiting for approval
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab("enrollments")}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition"
              >
                Review Now
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex gap-4 w-full">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 "
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <StudentForm onSubmit={handleCreateStudent} departments={departments} />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>All Students</CardHeader>
                <div className="p-6 space-y-4">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
                  ) : students.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No students found</p>
                  ) : (
                    students.map((student) => (
                      <div key={student.studentId} className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{student.name}</h3>
                            <p className="text-sm text-gray-600">ID: {student.studentId}</p>
                            <p className="text-sm text-gray-600">Department: {student.departmentCode} | Semester: {student.semester}</p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.studentId)}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <TeacherForm onSubmit={handleCreateTeacher} departments={departments} />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>All Teachers</CardHeader>
                <div className="p-6 space-y-4">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
                  ) : teachers.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No teachers found</p>
                  ) : (
                    teachers.map((teacher) => (
                      <div key={teacher.id} className="p-6 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{teacher.name}</h3>
                            <p className="text-sm text-gray-600">Department: {teacher.departmentCode}</p>
                            <p className="text-sm text-gray-600">Designation: {teacher.designation}</p>
                            <p className="text-sm text-gray-600">Courses: {teacher.assignedCourses.length}</p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id!)}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <CourseForm onSubmit={handleCreateCourse} departments={departments} />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="p-4">All Courses</CardHeader>
                <div className="p-6 space-y-4">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
                  ) : courses.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No courses found</p>
                  ) : (
                    courses.map((course) => (
                      <div key={course.code} className="p-6 bg-gradient-to-r from-gray-50 to-purple-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{course.title}</h3>
                            <p className="text-sm text-gray-600">Code: {course.code}</p>
                            <p className="text-sm text-gray-600">Department: {course.departmentCode} | Credits: {course.creditHours} | Semester: {course.semester}</p>
                          </div>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.code)}>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <DepartmentForm onSubmit={handleCreateDepartment} />
            </div>
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="p-4">All Departments</CardHeader>
                <div className="p-6 grid grid-cols-3 gap-4">
                  {loading ? (
                    <p className="text-center text-gray-500 py-8">Loading...</p>
                  ) : departments.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No departments found</p>
                  ) : (
                    departments.map((dept) => (
                      <div key={dept.code} className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                            <p className="text-sm text-gray-600">Code: {dept.code}</p>
                          </div>
                          <span>
                            {dept.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="secondary" size="sm" onClick={() => toggleDepartmentStatus(dept.code).then(loadData)}>
                            {dept.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteDepartment(dept.code)}>
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

        {/* Enrollments Tab */}
        {activeTab === "enrollments" && (
          <div className="space-y-6">
            {/* New Enrollment Request Form */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Request New Enrollment</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-2 gap-4 mb-4">
                  <div className="w-4/12">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Student
                    </label>
                    <Dropdown
                      options={students.map(s => ({ value: s.studentId, label: `${s.name} (${s.studentId})` }))}
                      value={selectedStudent}
                      onChange={handleStudentSelect}
                      placeholder="Choose a student"
                    />
                  </div>
                  <div className="w-4/12">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Course
                    </label>
                    <Dropdown
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
                </div>

                {selectedStudent && studentEnrollments.length > 0 && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">
                      Current Enrollments for {getStudentById(selectedStudent)?.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {studentEnrollments.map(enrollment => {
                        const course = getCourseByCode(enrollment.courseCode);
                        return (
                          <div key={enrollment.courseCode} className="p-3 bg-white rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between p-4">
                              <div className="text-lg font-medium text-gray-900">{`${course?.title} (${enrollment.courseCode})`}
                              </div>
                              <span

                              >
                                {enrollment.status.toUpperCase()}
                              </span>
                            </div>
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
            </div>

            {/* Pending Enrollments List */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                  Pending Enrollment Requests ({pendingEnrollments.length})
                </h2>
              </div>
              <div className="p-6">
                {loading && pendingEnrollments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">Loading...</p>
                ) : pendingEnrollments.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 text-lg">No pending enrollment requests</p>
                    <p className="text-gray-400 text-sm mt-2">All enrollments have been processed</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingEnrollments.map((enrollment) => {
                      const student = getStudentById(enrollment.studentId);
                      const course = getCourseByCode(enrollment.courseCode);

                      return (
                        <div
                          key={`${enrollment.studentId}-${enrollment.courseCode}`}
                          className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div className="flex-1">
                              <div className="mb-3">
                                <h3 className="text-lg font-bold text-gray-900">
                                  {student?.name || enrollment.studentId}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  Student ID: {enrollment.studentId} • Semester: {student?.semester || "N/A"}
                                </p>
                              </div>
                              <div className="mt-2">
                                <p className="font-semibold text-gray-900">
                                  {course?.title || enrollment.courseCode}
                                </p>
                                <p className="text-sm text-gray-600">
                                  Code: {enrollment.courseCode} • Credits: {course?.creditHours || "N/A"} • Course Semester: {course?.semester || "N/A"}
                                </p>
                              </div>
                            </div>

                            <div className="flex gap-4">
                              <Button
                                variant="primary"
                                onClick={() => handleApproveEnrollment(enrollment)}
                                disabled={loading}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="danger"
                                onClick={() => handleRejectEnrollment(enrollment)}
                                disabled={loading}
                              >
                                Reject
                              </Button>
                              <Button
                                variant="secondary"
                                onClick={() => handleDeleteEnrollment(enrollment)}
                                disabled={loading}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
