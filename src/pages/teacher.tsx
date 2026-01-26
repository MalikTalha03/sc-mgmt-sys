import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Badge } from "../components/badge";
import { Dropdown } from "../components/dropdown";
import { Input } from "../components/input";
import {
  getAllTeachers,
  getAllCourses,
  getAllStudents,
  getGradesByCourse,
  setGrade,
  countCourseEnrollments,
  getEnrollmentsByCourse,
  calculateTotal,
  calculateGPA,
} from "../firebase";
import type { Teacher } from "../models/teacher";
import type { Course } from "../models/course";
import type { Student } from "../models/student";
import type { Grade, GradeMarks } from "../models/grade";

export default function TeacherPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(false);

  // Grade entry form state
  const [gradeType, setGradeType] = useState<"assignment" | "quiz" | "mid" | "final">("assignment");
  const [gradeNumber, setGradeNumber] = useState<number>(1); // For assignment/quiz number (1-4)
  const [globalMaxMarks, setGlobalMaxMarks] = useState<number>(100);
  const [bulkGrades, setBulkGrades] = useState<{ [studentId: string]: { obtained: number; max: number } }>({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [teachersData, coursesData, studentsData] = await Promise.all([
        getAllTeachers(),
        getAllCourses(),
        getAllStudents(),
      ]);
      setTeachers(teachersData);
      setCourses(coursesData);
      setStudents(studentsData);

      if (teachersData.length > 0) {
        setSelectedTeacher(teachersData[0]);
        loadTeacherCourses(teachersData[0]);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const loadTeacherCourses = async (teacher: Teacher) => {
    try {
      // Load enrollment counts for assigned courses
      const counts: { [key: string]: number } = {};
      for (const courseCode of teacher.assignedCourses || []) {
        const count = await countCourseEnrollments(courseCode);
        counts[courseCode] = count;
      }
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error("Error loading teacher courses:", error);
    }
  };

  const handleTeacherChange = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    if (teacher) {
      setSelectedTeacher(teacher);
      loadTeacherCourses(teacher);
      setSelectedCourse("");
      setGrades([]);
    }
  };

  const loadCourseGrades = async (courseCode: string) => {
    try {
      setLoading(true);
      const gradesData = await getGradesByCourse(courseCode);
      setGrades(gradesData);
    } catch (error) {
      console.error("Error loading grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseSelect = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    if (courseCode) {
      loadCourseGrades(courseCode);
      // Load enrolled students for this course
      try {
        const enrollments = await getEnrollmentsByCourse(courseCode);
        const enrolledStudentIds = enrollments
          .filter(e => e.status === "approved")
          .map(e => e.studentId);
        const enrolled = students.filter(s => enrolledStudentIds.includes(s.studentId));
        setEnrolledStudents(enrolled);
      } catch (error) {
        console.error("Error loading enrolled students:", error);
        setEnrolledStudents([]);
      }
    } else {
      setGrades([]);
      setEnrolledStudents([]);
    }
  };

  const handleSubmitGrade = async (studentId: string) => {
    if (!selectedCourse) {
      alert("Please select a course");
      return;
    }

    const gradeData = bulkGrades[studentId];
    if (!gradeData || gradeData.obtained === undefined) {
      alert("Please enter grade for the student");
      return;
    }

    try {
      // Get existing grade for the student
      const existingGrades = grades.filter(g => g.studentId === studentId);
      const existingGrade = existingGrades[0];

      // Build updated marks object
      const updatedMarks: GradeMarks = existingGrade ? { ...existingGrade.marks } : {
        assignments: [],
        quizzes: [],
        mid: 0,
        final: 0,
        maxAssignments: [],
        maxQuizzes: [],
        maxMid: 100,
        maxFinal: 100,
      };

      // Update the specific grade type
      if (gradeType === "assignment") {
        updatedMarks.assignments[gradeNumber - 1] = gradeData.obtained;
        updatedMarks.maxAssignments[gradeNumber - 1] = gradeData.max;
      } else if (gradeType === "quiz") {
        updatedMarks.quizzes[gradeNumber - 1] = gradeData.obtained;
        updatedMarks.maxQuizzes[gradeNumber - 1] = gradeData.max;
      } else if (gradeType === "mid") {
        updatedMarks.mid = gradeData.obtained;
        updatedMarks.maxMid = gradeData.max;
      } else if (gradeType === "final") {
        updatedMarks.final = gradeData.obtained;
        updatedMarks.maxFinal = gradeData.max;
      }

      await setGrade({
        studentId: studentId,
        courseCode: selectedCourse,
        marks: updatedMarks,
      });

      alert("Grade saved successfully!");
      loadCourseGrades(selectedCourse);
      // Clear this student's grade from bulk
      setBulkGrades(prev => {
        const newGrades = { ...prev };
        delete newGrades[studentId];
        return newGrades;
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      alert("Failed to save grade");
    }
  };

  const handleSaveAllGrades = async () => {
    if (!selectedCourse) {
      alert("Please select a course");
      return;
    }

    const studentIds = Object.keys(bulkGrades);
    if (studentIds.length === 0) {
      alert("Please enter grades for at least one student");
      return;
    }

    try {
      for (const studentId of studentIds) {
        await handleSubmitGrade(studentId);
      }
      alert("All grades saved successfully!");
    } catch (error) {
      console.error("Error saving grades:", error);
      alert("Failed to save some grades");
    }
  };

  const getCourseByCode = (code: string) => {
    return courses.find(c => c.code === code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Teacher Dashboard</h1>
            <p className="text-gray-600">Manage assigned courses and student grades</p>
          </div>
          <div className="w-80">
            <Dropdown
              options={teachers.map((teacher) => ({
                value: teacher.id || "",
                label: `${teacher.name} (${teacher.id})`,
              }))}
              value={selectedTeacher?.id || ""}
              onChange={handleTeacherChange}
              placeholder="Select teacher..."
            />
          </div>
        </div>

        {!selectedTeacher ? (
          <p className="text-center text-gray-500 py-8">No teachers found</p>
        ) : (
          <>
            {/* Teacher Info Card */}
            <div className="mb-8">
              <Card>
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <h2 className="text-3xl font-bold text-gray-900">{selectedTeacher.name}</h2>
                      <div className="space-y-1">
                        <p className="text-gray-600">
                          <span className="font-medium">Teacher ID:</span> {selectedTeacher.id}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Department:</span> {selectedTeacher.departmentCode}
                        </p>
                        <p className="text-gray-600">
                          <span className="font-medium">Designation:</span> {selectedTeacher.designation}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                        <p className="text-sm text-gray-600 mb-1">Assigned Courses</p>
                        <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                          {selectedTeacher.assignedCourses?.length || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Assigned Courses */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader className="p-4">Assigned Courses</CardHeader>
                  <div className="p-6" >
                    {!selectedTeacher.assignedCourses || selectedTeacher.assignedCourses.length === 0 ? (
                      <p className="text-center text-gray-500 py-4">No courses assigned</p>
                    ) : (
                      <div className="gap-4  grid grid-cols-2">
                        {selectedTeacher.assignedCourses.map((courseCode) => {
                          const course = getCourseByCode(courseCode);
                          const enrolledCount = enrollmentCounts[courseCode] || 0;
                          return (
                            <div
                              key={courseCode}
                              className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <h3 className="font-bold text-gray-900">
                                    {course?.title || courseCode}
                                  </h3>
                                  <p className="text-sm text-gray-600">{courseCode}</p>
                                  <div className="flex gap-3 mt-2">
                                    <span className="text-sm text-gray-600">{course?.creditHours || 3} Credits</span>
                                    <span className="text-sm text-gray-600">{enrolledCount} Enrolled</span>
                                  </div>
                                </div>
                                <Button
                                  variant="primary"
                                  size="sm"
                                  onClick={() => handleCourseSelect(courseCode)}
                                >
                                  {selectedCourse === courseCode ? "Selected" : "View Grades"}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Grade Entry & Display */}
              <div className="space-y-6">
                {selectedCourse && (
                  <>
                    <Card>
                      <CardHeader className="p-4">Enter Grade</CardHeader>
                      <div className="p-6 space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Dropdown
                            label="Grade Type"
                            className="w-4/12"
                            options={[
                              { value: "assignment", label: "Assignment" },
                              { value: "quiz", label: "Quiz" },
                              { value: "mid", label: "Mid Term" },
                              { value: "final", label: "Final" },
                            ]}
                            value={gradeType}
                            onChange={(value) => setGradeType(value as "assignment" | "quiz" | "mid" | "final")}
                            placeholder="Select grade type..."
                          />

                          {/* Number Selection for Assignment/Quiz */}
                          {(gradeType === "assignment" || gradeType === "quiz") && (
                            <Dropdown
                              label={`${gradeType === "assignment" ? "Assignment" : "Quiz"} Number`}
                              className="w-4/12"
                              options={[
                                { value: "1", label: "1" },
                                { value: "2", label: "2" },
                                { value: "3", label: "3" },
                                { value: "4", label: "4" },
                              ]}
                              value={gradeNumber.toString()}
                              onChange={(value) => setGradeNumber(parseInt(value))}
                              placeholder="Select number..."
                            />
                          )}


                          {/* Global Maximum Marks */}
                          <Input
                            className="w-4/12"
                            label="Max Marks"
                            type="number"
                            min="0"
                            value={globalMaxMarks}
                            onChange={(e) => setGlobalMaxMarks(parseFloat(e.target.value) || 100)}
                            placeholder="100"
                          />
                        </div>
                        {/* Bulk Grade Entry for All Students */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Enter Grades for Enrolled Students ({enrolledStudents.length})
                          </label>
                          {enrolledStudents.length === 0 ? (
                            <p className="text-sm text-gray-500 py-4 text-center">
                              No students enrolled in this course
                            </p>
                          ) : (
                            <>
                            <div className="space-y-4">
                              <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="w-full">
                                  <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b">Student Name</th>
                                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Marks Obtained</th>
                                      <th className="px-4 py-3 text-center text-sm font-medium text-gray-700 border-b">Total Marks</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {enrolledStudents.map((student) => {
                                      const existingGrade = grades.find(g => g.studentId === student.studentId);
                                      let currentValue = 0;
                                      let currentMax = 100;

                                      // Get existing value for this grade type
                                      if (existingGrade) {
                                        if (gradeType === "assignment") {
                                          currentValue = existingGrade.marks.assignments[gradeNumber - 1] || 0;
                                          currentMax = existingGrade.marks.maxAssignments[gradeNumber - 1] || 100;
                                        } else if (gradeType === "quiz") {
                                          currentValue = existingGrade.marks.quizzes[gradeNumber - 1] || 0;
                                          currentMax = existingGrade.marks.maxQuizzes[gradeNumber - 1] || 100;
                                        } else if (gradeType === "mid") {
                                          currentValue = existingGrade.marks.mid || 0;
                                          currentMax = existingGrade.marks.maxMid || 100;
                                        } else if (gradeType === "final") {
                                          currentValue = existingGrade.marks.final || 0;
                                          currentMax = existingGrade.marks.maxFinal || 100;
                                        }
                                      }

                                      // Use bulk grades if set, otherwise use existing value
                                      const displayValue = bulkGrades[student.studentId]?.obtained ?? (currentValue || "");

                                      return (
                                        <tr key={student.studentId} className="hover:bg-gray-50 ">
                                          <td className="p-2 text-sm text-center font-medium text-gray-900">{student.name}</td>
                                          <td className="p-2 text-center">
                                            <input
                                              type="number"
                                              min="0"
                                              placeholder="0"
                                              value={displayValue}
                                              onChange={(e) => {
                                                const value = parseFloat(e.target.value);
                                                if (value < 0) return;
                                                setBulkGrades(prev => ({
                                                  ...prev,
                                                  [student.studentId]: {
                                                    obtained: value || 0,
                                                    max: globalMaxMarks
                                                  }
                                                }));
                                              }}
                                              className="w-24 p-2 border border-gray-300 rounded-lg text-sm text-center"
                                            />
                                          </td>
                                          <td className="p-2 text-center text-sm text-gray-600">
                                            {globalMaxMarks}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                              <Button variant="primary" onClick={handleSaveAllGrades} className="w-1/6">
                                Save All Grades
                              </Button>
                            </div>
                            </>
                          )}
                        </div>
                      </div>
                    </Card>

                    {/* Grades Table */}
                    <Card>
                      <CardHeader className="p-4">All Student Grades</CardHeader>
                      <div className="p-6 overflow-x-auto">
                        {loading ? (
                          <p className="text-center text-gray-500 py-4">Loading...</p>
                        ) : grades.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No grades recorded yet</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">A1</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">A2</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">A3</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">A4</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Q1</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Q2</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Q3</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Q4</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Mid</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Final</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="p-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">GPA</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {grades.map((grade) => {
                                const student = students.find(s => s.studentId === grade.studentId);
                                const total = calculateTotal(grade.marks);
                                const gpa = calculateGPA(total);
                                return (
                                  <tr key={grade.studentId} className="hover:bg-gray-50">
                                    <td className="p-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                      {student?.name || grade.studentId}
                                    </td>
                                    {[0, 1, 2, 3].map((i) => (
                                      <td key={`a${i}`} className="p-4 text-center text-sm text-gray-600">
                                        {grade.marks.assignments[i] !== undefined
                                          ? `${grade.marks.assignments[i]}/${grade.marks.maxAssignments[i] || 100}`
                                          : "-"}
                                      </td>
                                    ))}
                                    {[0, 1, 2, 3].map((i) => (
                                      <td key={`q${i}`} className="p-4 text-center text-sm text-gray-600">
                                        {grade.marks.quizzes[i] !== undefined
                                          ? `${grade.marks.quizzes[i]}/${grade.marks.maxQuizzes[i] || 100}`
                                          : "-"}
                                      </td>
                                    ))}
                                    <td className="p-4  text-center text-sm text-gray-600">
                                      {grade.marks.mid > 0 ? `${grade.marks.mid}/${grade.marks.maxMid}` : "-"}
                                    </td>
                                    <td className="p-4 text-center text-sm text-gray-600">
                                      {grade.marks.final > 0 ? `${grade.marks.final}/${grade.marks.maxFinal}` : "-"}
                                    </td>
                                    <td className="p-4 text-center text-sm font-semibold text-gray-900">
                                      {total.toFixed(1)}%
                                    </td>
                                    <td className="p-4 text-center">
                                      <span
                                      >
                                        {gpa.toFixed(2)}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}