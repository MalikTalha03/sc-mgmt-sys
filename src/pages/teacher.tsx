import { useState, useEffect } from "react";
import { Button } from "../components/button";
import { useAuth } from "../context/AuthContext";
import {
  getTeacherById,
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
import {
  Users,
  BookOpen,
  Award,
  Loader2,
  AlertCircle,
  Save,
  ChevronDown,
  GraduationCap,
  Building2,
  ClipboardList
} from "lucide-react";

export default function TeacherPage() {
  const { userData } = useAuth();
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<{ [key: string]: number }>({});
  const [loading, setLoading] = useState(true);

  const [gradeType, setGradeType] = useState<"assignment" | "quiz" | "mid" | "final">("assignment");
  const [gradeNumber, setGradeNumber] = useState<number>(1);
  const [globalMaxMarks, setGlobalMaxMarks] = useState<number>(100);
  const [bulkGrades, setBulkGrades] = useState<{ [studentId: string]: { obtained: number; max: number } }>({});

  useEffect(() => {
    if (userData?.linkedId) {
      loadData(userData.linkedId);
    }
  }, [userData]);

  const loadData = async (teacherId: string) => {
    try {
      setLoading(true);
      const [teacherData, coursesData, studentsData] = await Promise.all([
        getTeacherById(teacherId),
        getAllCourses(),
        getAllStudents(),
      ]);
      setTeacher(teacherData);
      setCourses(coursesData);
      setStudents(studentsData);

      if (teacherData) {
        loadTeacherCourses(teacherData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeacherCourses = async (teacherData: Teacher) => {
    try {
      const counts: { [key: string]: number } = {};
      for (const courseCode of teacherData.assignedCourses || []) {
        const count = await countCourseEnrollments(courseCode);
        counts[courseCode] = count;
      }
      setEnrollmentCounts(counts);
    } catch (error) {
      console.error("Error loading teacher courses:", error);
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
    setBulkGrades({});
    if (courseCode) {
      loadCourseGrades(courseCode);
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
      const existingGrades = grades.filter(g => g.studentId === studentId);
      const existingGrade = existingGrades[0];

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

  const containerStyle: React.CSSProperties = {
    minHeight: '100vh',
    background: '#f3f4f6',
  };

  const contentStyle: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px 24px',
  };

  const statCardStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  };

  const sectionStyle: React.CSSProperties = {
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
  };

  const sectionHeaderStyle: React.CSSProperties = {
    padding: '16px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  const tableStyle: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
  };

  const thStyle: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    background: '#f9fafb',
    borderBottom: '1px solid #e5e7eb',
  };

  const tdStyle: React.CSSProperties = {
    padding: '14px 16px',
    fontSize: '14px',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
  };

  const selectStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    background: 'white',
    cursor: 'pointer',
  };

  const inputStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    width: '80px',
    textAlign: 'center',
  };

  if (loading && !teacher) {
    return (
      <div style={containerStyle}>
        <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ margin: 0 }}>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div style={containerStyle}>
        <div style={{ ...contentStyle, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p style={{ margin: 0 }}>Teacher data not found. Please contact administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  const totalStudents = Object.values(enrollmentCounts).reduce((a, b) => a + b, 0);

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 4px 0' }}>
                Welcome, {teacher.name}
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                {teacher.designation} • {teacher.departmentCode}
              </p>
            </div>
            <div style={{
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center',
            }}>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.9 }}>Assigned Courses</p>
              <p style={{ margin: '4px 0 0', fontSize: '28px', fontWeight: '700' }}>{teacher.assignedCourses?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#eef2ff', borderRadius: '10px' }}>
                <BookOpen size={20} color="#4f46e5" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{teacher.assignedCourses?.length || 0}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>My Courses</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#ecfdf5', borderRadius: '10px' }}>
                <GraduationCap size={20} color="#059669" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{totalStudents}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Total Students</p>
              </div>
            </div>
          </div>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ padding: '10px', background: '#f3e8ff', borderRadius: '10px' }}>
                <Building2 size={20} color="#7c3aed" />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#111827' }}>{teacher.departmentCode}</p>
                <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>Department</p>
              </div>
            </div>
          </div>
        </div>

        {/* My Courses */}
        <div style={{ ...sectionStyle, marginBottom: '24px' }}>
          <div style={sectionHeaderStyle}>
            <BookOpen size={18} color="#4f46e5" />
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>My Courses</h2>
          </div>
          {!teacher.assignedCourses || teacher.assignedCourses.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280' }}>
              <BookOpen size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No courses assigned yet</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', padding: '20px' }}>
              {teacher.assignedCourses.map((courseCode) => {
                const course = getCourseByCode(courseCode);
                const enrolledCount = enrollmentCounts[courseCode] || 0;
                const isSelected = selectedCourse === courseCode;
                return (
                  <div
                    key={courseCode}
                    onClick={() => handleCourseSelect(courseCode)}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      border: isSelected ? '2px solid #4f46e5' : '1px solid #e5e7eb',
                      background: isSelected ? '#eef2ff' : '#f9fafb',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#111827' }}>
                      {course?.title || courseCode}
                    </h3>
                    <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#6b7280' }}>{courseCode}</p>
                    <div style={{ display: 'flex', gap: '16px' }}>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <strong style={{ color: '#4f46e5' }}>{course?.creditHours || 3}</strong> Credits
                      </span>
                      <span style={{ fontSize: '12px', color: '#6b7280' }}>
                        <strong style={{ color: '#059669' }}>{enrolledCount}</strong> Students
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Grade Entry Section */}
        {selectedCourse && (
          <>
            <div style={{ ...sectionStyle, marginBottom: '24px' }}>
              <div style={sectionHeaderStyle}>
                <ClipboardList size={18} color="#4f46e5" />
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                  Enter Grades - {getCourseByCode(selectedCourse)?.title}
                </h2>
              </div>
              <div style={{ padding: '20px' }}>
                {/* Grade Type Selection */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      Grade Type
                    </label>
                    <select
                      value={gradeType}
                      onChange={(e) => setGradeType(e.target.value as any)}
                      style={selectStyle}
                    >
                      <option value="assignment">Assignment</option>
                      <option value="quiz">Quiz</option>
                      <option value="mid">Mid Term</option>
                      <option value="final">Final</option>
                    </select>
                  </div>

                  {(gradeType === "assignment" || gradeType === "quiz") && (
                    <div>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                        Number
                      </label>
                      <select
                        value={gradeNumber}
                        onChange={(e) => setGradeNumber(parseInt(e.target.value))}
                        style={selectStyle}
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                        <option value="4">4</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '500', color: '#374151' }}>
                      Max Marks
                    </label>
                    <input
                      type="number"
                      value={globalMaxMarks}
                      onChange={(e) => setGlobalMaxMarks(parseFloat(e.target.value) || 100)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Student Grades Table */}
                {enrolledStudents.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', background: '#f9fafb', borderRadius: '8px' }}>
                    <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                    <p style={{ margin: 0 }}>No students enrolled in this course</p>
                  </div>
                ) : (
                  <>
                    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
                      <table style={tableStyle}>
                        <thead>
                          <tr>
                            <th style={thStyle}>Student</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Current Value</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Marks Obtained</th>
                            <th style={{ ...thStyle, textAlign: 'center' }}>Max Marks</th>
                          </tr>
                        </thead>
                        <tbody>
                          {enrolledStudents.map((student) => {
                            const existingGrade = grades.find(g => g.studentId === student.studentId);
                            let currentValue = 0;

                            if (existingGrade) {
                              if (gradeType === "assignment") {
                                currentValue = existingGrade.marks.assignments[gradeNumber - 1] || 0;
                              } else if (gradeType === "quiz") {
                                currentValue = existingGrade.marks.quizzes[gradeNumber - 1] || 0;
                              } else if (gradeType === "mid") {
                                currentValue = existingGrade.marks.mid || 0;
                              } else if (gradeType === "final") {
                                currentValue = existingGrade.marks.final || 0;
                              }
                            }

                            const displayValue = bulkGrades[student.studentId]?.obtained ?? "";

                            return (
                              <tr key={student.studentId}>
                                <td style={tdStyle}>
                                  <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{student.name}</p>
                                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#6b7280' }}>{student.studentId}</p>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
                                  <span style={{
                                    padding: '4px 10px',
                                    background: '#f3f4f6',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#374151',
                                  }}>
                                    {currentValue}
                                  </span>
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center' }}>
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
                                    style={inputStyle}
                                  />
                                </td>
                                <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '500' }}>{globalMaxMarks}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div style={{ marginTop: '16px' }}>
                      <Button variant="primary" onClick={handleSaveAllGrades}>
                        <Save size={16} />
                        Save All Grades
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Grades Overview */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}>
                <Award size={18} color="#4f46e5" />
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#111827' }}>All Student Grades</h2>
              </div>
              {grades.length === 0 ? (
                <div style={{ padding: '60px', textAlign: 'center', color: '#6b7280' }}>
                  <Award size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No grades recorded yet</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={tableStyle}>
                    <thead>
                      <tr>
                        <th style={thStyle}>Student</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>A1</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>A2</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>A3</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>A4</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Q1</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Q2</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Q3</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Q4</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Mid</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Final</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>Total</th>
                        <th style={{ ...thStyle, textAlign: 'center' }}>GPA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.map((grade) => {
                        const student = students.find(s => s.studentId === grade.studentId);
                        const total = calculateTotal(grade.marks);
                        const gpa = calculateGPA(total);
                        return (
                          <tr key={grade.studentId}>
                            <td style={tdStyle}>
                              <p style={{ margin: 0, fontWeight: '500', color: '#111827' }}>{student?.name || grade.studentId}</p>
                            </td>
                            {[0, 1, 2, 3].map((i) => (
                              <td key={`a${i}`} style={{ ...tdStyle, textAlign: 'center', fontSize: '12px' }}>
                                {grade.marks.assignments[i] !== undefined
                                  ? `${grade.marks.assignments[i]}/${grade.marks.maxAssignments[i] || 100}`
                                  : "-"}
                              </td>
                            ))}
                            {[0, 1, 2, 3].map((i) => (
                              <td key={`q${i}`} style={{ ...tdStyle, textAlign: 'center', fontSize: '12px' }}>
                                {grade.marks.quizzes[i] !== undefined
                                  ? `${grade.marks.quizzes[i]}/${grade.marks.maxQuizzes[i] || 100}`
                                  : "-"}
                              </td>
                            ))}
                            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '12px' }}>
                              {grade.marks.mid > 0 ? `${grade.marks.mid}/${grade.marks.maxMid}` : "-"}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontSize: '12px' }}>
                              {grade.marks.final > 0 ? `${grade.marks.final}/${grade.marks.maxFinal}` : "-"}
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center', fontWeight: '600', color: '#4f46e5' }}>
                              {total.toFixed(1)}%
                            </td>
                            <td style={{ ...tdStyle, textAlign: 'center' }}>
                              <span style={{
                                padding: '4px 10px',
                                background: gpa >= 3.0 ? '#ecfdf5' : gpa >= 2.0 ? '#fef3c7' : '#fef2f2',
                                color: gpa >= 3.0 ? '#059669' : gpa >= 2.0 ? '#d97706' : '#dc2626',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '12px',
                              }}>
                                {gpa.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
