import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
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

      // Load enrollment counts for each course
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Courses Management</h1>
          <p className="text-gray-600">View all courses and manage faculty assignments efficiently</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {loading ? (
              <p className="text-center text-gray-500 py-8">Loading courses...</p>
            ) : courses.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No courses found</p>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-2 gap-4">
                {courses.map((course) => {
                  const teacher = getTeacherForCourse(course.code);
                  return (
                    <Card key={course.code} hover>
                      <div className="p-6">
                        <div className="mb-4">
                          <h3 className="text-xl font-bold text-gray-900">{course.title}</h3>
                          <p className="text-sm text-gray-600">{course.code}</p>
                        </div>
                        <div className="space-y-2 mb-4">
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Department:</span> {course.departmentCode}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Credits:</span> {course.creditHours}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Semester:</span> {course.semester}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-medium">Enrolled:</span> {enrollmentCounts[course.code] || 0} students
                          </p>
                        </div>
                        
                        {teacher ? (
                          <div className="space-y-3">
                            <div className="p-3 bg-emerald-50 rounded-lg">
                              <p className="text-sm font-medium text-gray-700">Instructor:</p>
                              <p className="text-sm text-gray-900">{teacher.name}</p>
                            </div>
                            <Button
                              variant="danger"
                              size="sm"
                              fullWidth
                              onClick={() => handleUnassignTeacher(course.code)}
                            >
                              Unassign Instructor
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <span >No Instructor Assigned</span>
                            {selectedCourse === course.code ? (
                              <div className="space-y-2">
                                <select
                                  value={selectedTeacher}
                                  onChange={(e) => setSelectedTeacher(e.target.value)}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                >
                                  <option value="">Select Teacher</option>
                                  {teachers
                                    .filter(t => t.departmentCode === course.departmentCode)
                                    .map((t) => (
                                      <option key={t.id} value={t.id}>
                                        {t.name} ({t.assignedCourses.length} courses)
                                      </option>
                                    ))}
                                </select>
                                <div className="flex gap-2">
                                  <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={() => handleAssignTeacher(course.code)}
                                  >
                                    Assign
                                  </Button>
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setSelectedCourse(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                variant="primary"
                                size="sm"
                                fullWidth
                                onClick={() => setSelectedCourse(course.code)}
                              >
                                Assign Instructor
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-6">
      

            <Card>
              <CardHeader className="p-4">Available Faculty</CardHeader>
              <div className="p-6 grid grid-cols-3 md:grid-cols-2 gap-4">
                {teachers.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No teachers found</p>
                ) : (
                  teachers.map((teacher) => (
                    <div key={teacher.id} className="p-4 bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl border border-gray-200 hover:border-emerald-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <p className="font-bold text-gray-900">{teacher.name}</p>
                        <span>{teacher.departmentCode}</span>
                      </div>
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-semibold text-indigo-600">{teacher.assignedCourses.length}</span> / 3 Courses Assigned
                      </div>
                      <div className="relative">
                        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(teacher.assignedCourses.length / 3) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
