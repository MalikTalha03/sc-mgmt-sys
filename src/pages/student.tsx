import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Dropdown } from "../components/dropdown";
import { useAuth } from "../context/AuthContext";
import {
  getStudentById,
  getAllCourses,
  getEnrollmentsByStudent,
  getGradesByStudent,
  calculateStudentCGPA,
  calculateTotal,
  calculateGPA,
  createEnrollment,
} from "../firebase";
import type { Student } from "../models/student";
import type { Course } from "../models/course";
import type { Enrollment } from "../models/enrollment";
import type { Grade } from "../models/grade";

export default function StudentPage() {
  const { userData } = useAuth();
  const [student, setStudent] = useState<Student | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedCourseForEnrollment, setSelectedCourseForEnrollment] = useState<string>("");
  const [requestingEnrollment, setRequestingEnrollment] = useState(false);

  useEffect(() => {
    if (userData?.linkedId) {
      loadStudentData(userData.linkedId);
    }
  }, [userData]);

  const loadStudentData = async (studentId: string) => {
    try {
      setLoading(true);
      const [studentData, coursesData, enrollmentsData, gradesData, cgpaValue] = await Promise.all([
        getStudentById(studentId),
        getAllCourses(),
        getEnrollmentsByStudent(studentId),
        getGradesByStudent(studentId),
        calculateStudentCGPA(studentId),
      ]);
      setStudent(studentData);
      setCourses(coursesData);
      setEnrollments(enrollmentsData);
      setGrades(gradesData);
      setCgpa(cgpaValue);
    } catch (error) {
      console.error("Error loading student data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCourseByCode = (code: string) => {
    return courses.find(c => c.code === code);
  };

  const handleRequestEnrollment = async () => {
    if (!student || !selectedCourseForEnrollment) {
      alert("Please select a course");
      return;
    }

    try {
      setRequestingEnrollment(true);
      await createEnrollment({
        studentId: student.studentId,
        courseCode: selectedCourseForEnrollment,
        status: "pending",
      });
      alert("Enrollment request submitted successfully! Waiting for admin approval.");
      
      // Reload student data
      await loadStudentData(student.studentId);
      setSelectedCourseForEnrollment("");
    } catch (error: any) {
      console.error("Error requesting enrollment:", error);
      alert(error.message || "Failed to submit enrollment request");
    } finally {
      setRequestingEnrollment(false);
    }
  };

  // Get courses not yet enrolled in
  const availableCourses = courses.filter(course => 
    !enrollments.some(e => e.courseCode === course.code)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Student Dashboard</h1>
          <p className="text-gray-600">View your enrollments and academic records</p>
        </div>

        {loading ? (
          <p className="text-center text-gray-500 py-8">Loading...</p>
        ) : !student ? (
          <p className="text-center text-gray-500 py-8">Student data not found. Please contact administrator.</p>
        ) : (
          <>
            {/* Student Info Card */}
            <div className="mb-8">
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">{student.name}</h2>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Student ID:</span> {student.studentId}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Department:</span> {student.departmentCode}
                        </p>
                      </div>
                    </div>
                    <div className="text-right space-y-4">
                      <div>
                        <p className="text-4xl text-gray-600 mb-1">Current Semester: {student.semester}</p>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">CGPA</p>
                        <p className="text-3xl font-bold text-indigo-600">{cgpa.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 ">
              {/* Request New Enrollment */}
              <div>
                <Card>
                  <CardHeader className="p-4">Request Course Enrollment</CardHeader>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Course
                      </label>
                      <Dropdown
                        options={availableCourses.map(c => ({ 
                          value: c.code, 
                          label: `${c.title} (${c.code})` 
                        }))}
                        value={selectedCourseForEnrollment}
                        onChange={setSelectedCourseForEnrollment}
                        placeholder="Choose a course to enroll in"
                      />
                    </div>
                    {selectedCourseForEnrollment && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">
                          <strong>Credits:</strong> {getCourseByCode(selectedCourseForEnrollment)?.creditHours}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          <strong>Department:</strong> {getCourseByCode(selectedCourseForEnrollment)?.departmentCode}
                        </p>
                      </div>
                    )}
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleRequestEnrollment}
                      disabled={!selectedCourseForEnrollment || requestingEnrollment}
                    >
                      {requestingEnrollment ? "Submitting..." : "Submit Request"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      Your request will be reviewed by the admin
                    </p>
                  </div>
                </Card>
              </div>

              {/* Current Enrollments */}
              <div >
                <Card >
                  <CardHeader className="p-4">Current Enrollments</CardHeader>
                  <div className="p-6">
                    {enrollments.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No enrollments found</p>
                    ) : (
                      <div className="space-y-4">
                        {enrollments.map((enrollment) => {
                          const course = getCourseByCode(enrollment.courseCode);
                          return (
                            <div
                              key={enrollment.courseCode}
                              className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    {course?.title || enrollment.courseCode}
                                  </h3>
                                  <p className="text-sm text-gray-600">{enrollment.courseCode}</p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {course?.creditHours} Credits
                                  </p>
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
                    )}
                  </div>
                </Card>
              </div>

              {/* Academic Grades */}
              <div>
                <Card>
                  <CardHeader className="p-4">Academic Grades</CardHeader>
                  <div className="p-6">
                    {grades.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No grades recorded yet</p>
                    ) : (
                      <div className="space-y-4">
                        {grades.map((grade) => {
                          const course = getCourseByCode(grade.courseCode);
                          const total = calculateTotal(grade.marks);
                          const gpa = calculateGPA(total);
                          return (
                            <div
                              key={grade.courseCode}
                              className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h3 className="font-bold text-gray-900">
                                    {course?.title || grade.courseCode}
                                  </h3>
                                  <p className="text-sm text-gray-600">{grade.courseCode}</p>
                                </div>
                                <span

                                >
                                  GPA: {gpa.toFixed(2)}
                                </span>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="p-2 bg-white rounded-lg text-center">
                                  <p className="text-xs text-gray-600">Mid</p>
                                  <p className="font-bold text-gray-900">{grade.marks.mid}</p>
                                </div>
                                <div className="p-2 bg-white rounded-lg text-center">
                                  <p className="text-xs text-gray-600">Final</p>
                                  <p className="font-bold text-gray-900">{grade.marks.final}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 rounded-lg text-center">
                                  <p className="text-xs text-gray-600">Total</p>
                                  <p className="font-bold text-indigo-600">{total.toFixed(1)}%</p>
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
          </>
        )}
      </div>
    </div>
  );
}
