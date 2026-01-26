import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Badge } from "../components/badge";
import { Dropdown } from "../components/dropdown";
import {
  getAllStudents,
  getAllCourses,
  createEnrollment,
  getPendingEnrollments,
  updateEnrollmentStatus,
  deleteEnrollment,
  getEnrollmentsByStudent,
} from "../firebase";
import type { Student } from "../models/student";
import type { Course } from "../models/course";
import type { Enrollment } from "../models/enrollment";

export default function EnrollmentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pendingEnrollments, setPendingEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(false);
  
  // New enrollment request form state
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [studentEnrollments, setStudentEnrollments] = useState<Enrollment[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, coursesData, enrollmentsData] = await Promise.all([
        getAllStudents(),
        getAllCourses(),
        getPendingEnrollments(),
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
      setPendingEnrollments(enrollmentsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

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
      
      // Reload data
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

  const getEnrollmentStatus = (courseCode: string) => {
    const enrollment = studentEnrollments.find(e => e.courseCode === courseCode);
    return enrollment?.status;
  };

  // Filter available courses (not already enrolled)
  const availableCourses = courses.filter(course => !isEnrolled(course.code));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            📋 Enrollment Management
          </h1>
          <p className="text-gray-600 mt-2">Manage student course enrollments and approval requests</p>
        </div>

        {/* New Enrollment Request Section */}
        <Card>
          <CardHeader>Request New Enrollment</CardHeader>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Student Selection */}
              <div>
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

              {/* Course Selection */}
              <div>
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

            {/* Student's Current Enrollments */}
            {selectedStudent && studentEnrollments.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Current Enrollments for {getStudentById(selectedStudent)?.name}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {studentEnrollments.map(enrollment => {
                    const course = getCourseByCode(enrollment.courseCode);
                    return (
                      <div key={enrollment.courseCode} className="p-3 bg-white rounded-lg border border-gray-200">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{course?.title}</p>
                            <p className="text-xs text-gray-500">{enrollment.courseCode}</p>
                          </div>
                          <Badge 
                            variant={
                              enrollment.status === "approved" ? "success" : 
                              enrollment.status === "pending" ? "warning" : "danger"
                            }
                          >
                            {enrollment.status}
                          </Badge>
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
        </Card>

        {/* Pending Enrollments Section */}
        <Card>
          <CardHeader>Pending Enrollment Requests ({pendingEnrollments.length})</CardHeader>
          <div className="p-6">
            {loading && pendingEnrollments.length === 0 ? (
              <p className="text-center text-gray-500 py-8">Loading...</p>
            ) : pendingEnrollments.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">✅</div>
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
                      className="p-5 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 hover:shadow-lg transition"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* Student & Course Info */}
                        <div className="flex-1">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-2xl">👤</span>
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900">
                                    {student?.name || enrollment.studentId}
                                  </h3>
                                  <p className="text-sm text-gray-600">
                                    Student ID: {enrollment.studentId}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-3 ml-10">
                                <span className="text-xl">📚</span>
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    {course?.title || enrollment.courseCode}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Code: {enrollment.courseCode} • Credits: {course?.creditHours || "N/A"}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="primary"
                            onClick={() => handleApproveEnrollment(enrollment)}
                            disabled={loading}
                          >
                            ✓ Approve
                          </Button>
                          <Button
                            variant="danger"
                            onClick={() => handleRejectEnrollment(enrollment)}
                            disabled={loading}
                          >
                            ✗ Reject
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={() => handleDeleteEnrollment(enrollment)}
                            disabled={loading}
                          >
                            🗑️ Delete
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
    </div>
  );
}
