import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { Dropdown } from "../components/dropdown";
import {
  getAllStudents,
  getAllCourses,
  getGradesByStudent,
  setGrade,
  calculateStudentCGPA,
  calculateTotal,
  calculateGPA,
} from "../firebase";
import type { Student } from "../models/student";
import type { Course } from "../models/course";
import type { Grade, GradeMarks } from "../models/grade";

export default function GradesPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [grades, setGrades] = useState<Grade[]>([]);
  const [cgpa, setCgpa] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [marks, setMarks] = useState<GradeMarks>({
    assignments: [],
    quizzes: [],
    mid: 0,
    final: 0,
    maxAssignments: [],
    maxQuizzes: [],
    maxMid: 100,
    maxFinal: 100,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsData, coursesData] = await Promise.all([
        getAllStudents(),
        getAllCourses(),
      ]);
      setStudents(studentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    }
  };

  const loadStudentGrades = async (studentId: string) => {
    try {
      setLoading(true);
      const [gradesData, cgpaValue] = await Promise.all([
        getGradesByStudent(studentId),
        calculateStudentCGPA(studentId),
      ]);
      setGrades(gradesData);
      setCgpa(cgpaValue);
    } catch (error) {
      console.error("Error loading grades:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (studentId: string) => {
    setSelectedStudent(studentId);
    if (studentId) {
      loadStudentGrades(studentId);
    } else {
      setGrades([]);
      setCgpa(0);
    }
  };

  const handleSubmitGrade = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert("Please select both student and course");
      return;
    }

    try {
      await setGrade({
        studentId: selectedStudent,
        courseCode: selectedCourse,
        marks,
      });
      alert("Grade saved successfully!");
      loadStudentGrades(selectedStudent);
      // Reset form
      setSelectedCourse("");
      setMarks({
        assignments: [],
        quizzes: [],
        mid: 0,
        final: 0,
        maxAssignments: [],
        maxQuizzes: [],
        maxMid: 100,
        maxFinal: 100,
      });
    } catch (error) {
      console.error("Error saving grade:", error);
      alert("Failed to save grade");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Grades Management</h1>
          <p className="text-gray-600">Manage student grades and calculate CGPA</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Grade Entry Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>Enter Grade</CardHeader>
              <div className="p-6 space-y-4">
                <Dropdown
                  label="Select Student"
                  options={students.map((student) => ({
                    value: student.studentId,
                    label: `${student.name} (${student.studentId})`,
                  }))}
                  value={selectedStudent}
                  onChange={handleStudentChange}
                  placeholder="Choose student..."
                />

                {selectedStudent && (
                  <>
                    <Dropdown
                      label="Select Course"
                      options={courses.map((course) => ({
                        value: course.code,
                        label: `${course.code} - ${course.title}`,
                      }))}
                      value={selectedCourse}
                      onChange={setSelectedCourse}
                      placeholder="Choose course..."
                    />

                    {selectedCourse && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Mid Term Marks
                          </label>
                          <input
                            type="number"
                            value={marks.mid}
                            onChange={(e) => setMarks({ ...marks, mid: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Out of 100"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Final Marks
                          </label>
                          <input
                            type="number"
                            value={marks.final}
                            onChange={(e) => setMarks({ ...marks, final: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            placeholder="Out of 100"
                          />
                        </div>

                        <Button variant="primary" fullWidth onClick={handleSubmitGrade}>
                          Save Grade
                        </Button>
                      </>
                    )}
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* Student Grades Display */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                {selectedStudent
                  ? `Grades for ${students.find(s => s.studentId === selectedStudent)?.name}`
                  : "Student Grades"}
              </CardHeader>
              <div className="p-6">
                {selectedStudent && (
                  <div className="mb-6 p-6 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
                    <div className="text-center">
                      <p className="text-sm text-gray-600 mb-2">Cumulative GPA</p>
                      <p className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        {cgpa.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading grades...</p>
                ) : !selectedStudent ? (
                  <p className="text-center text-gray-500 py-8">Select a student to view grades</p>
                ) : grades.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No grades recorded yet</p>
                ) : (
                  <div className="space-y-4">
                    {grades.map((grade) => {
                      const course = courses.find(c => c.code === grade.courseCode);
                      const total = calculateTotal(grade.marks);
                      const gpa = calculateGPA(total);
                      return (
                        <div
                          key={grade.courseCode}
                          className="p-6 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-bold text-gray-900">
                                {course?.title || grade.courseCode}
                              </h3>
                              <p className="text-sm text-gray-600">{grade.courseCode}</p>
                            </div>
                            <span>
                              GPA: {gpa.toFixed(2)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-white rounded-lg">
                              <p className="text-xs text-gray-600">Mid Term</p>
                              <p className="text-lg font-bold text-gray-900">{grade.marks.mid}/{grade.marks.maxMid}</p>
                            </div>
                            <div className="p-3 bg-white rounded-lg">
                              <p className="text-xs text-gray-600">Final</p>
                              <p className="text-lg font-bold text-gray-900">{grade.marks.final}/{grade.marks.maxFinal}</p>
                            </div>
                          </div>
                          <div className="mt-3 p-3 bg-indigo-50 rounded-lg">
                            <p className="text-xs text-gray-600">Total Marks</p>
                            <p className="text-2xl font-bold text-indigo-600">{total.toFixed(2)}%</p>
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
      </div>
    </div>
  );
}
