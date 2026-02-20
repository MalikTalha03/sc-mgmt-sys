import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { teacherService } from "../services/teacher.service";
import { courseService, type Course } from "../services/course.service";
import { enrollmentService, type Enrollment } from "../services/enrollment.service";
import { gradeService, type Grade, type GradeItem, type GradeCategory } from "../services/grade.service";
import { Loader2, ArrowLeft, Plus, Save, X, Users } from "lucide-react";

export default function TeacherGradesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const { courseId } = useParams<{ courseId: string }>();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [allGrades, setAllGrades] = useState<Grade[]>([]);
  const [allGradeItems, setAllGradeItems] = useState<GradeItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Grade Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<GradeCategory>('assignment');
  const [maxMarks, setMaxMarks] = useState<number>(20);
  const [studentMarks, setStudentMarks] = useState<{ [key: number]: number }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, courseId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (!currentUser || !courseId) return;
      
      const teacherData = await teacherService.getByUserId(currentUser.id);
      if (!teacherData) {
        alert("No teacher record found");
        navigate('/teacher');
        return;
      }

      const [courseData, enrollmentsData, gradesData, gradeItemsData] = await Promise.all([
        courseService.getById(Number(courseId)),
        enrollmentService.getAll(),
        gradeService.getAll(),
        gradeService.getAllGradeItems(),
      ]);

      // Verify teacher owns this course
      if (courseData.teacher_id !== teacherData.id) {
        alert("You don't have permission to manage this course");
        navigate('/teacher');
        return;
      }

      setCourse(courseData);
      
      // Filter enrollments for this course (approved only)
      const courseEnrollments = enrollmentsData.filter(
        e => e.course_id === Number(courseId) && e.status === 'approved'
      );
      setEnrollments(courseEnrollments);
      
      setAllGrades(gradesData);
      setAllGradeItems(gradeItemsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load course data");
    } finally {
      setLoading(false);
    }
  };

  const getGradeForStudent = (studentId: number): Grade | undefined => {
    return allGrades.find(g => g.student_id === studentId && g.course_id === Number(courseId));
  };

  const getGradeItemsForStudent = (studentId: number): GradeItem[] => {
    const grade = getGradeForStudent(studentId);
    if (!grade) return [];
    return allGradeItems.filter(gi => gi.grade_id === grade.id);
  };

  const hasExistingMidtermOrFinal = (studentId: number, category: GradeCategory): boolean => {
    if (category !== 'midterm' && category !== 'final') return false;
    const items = getGradeItemsForStudent(studentId);
    return items.some(item => item.category === category);
  };

  const handleCategoryChange = (category: GradeCategory) => {
    setSelectedCategory(category);
    // Set default max marks based on category
    if (category === 'assignment' || category === 'quiz') {
      setMaxMarks(20);
    } else if (category === 'midterm') {
      setMaxMarks(100);
    } else if (category === 'final') {
      setMaxMarks(100);
    }
  };

  const handleStudentMarkChange = (studentId: number, marks: number) => {
    setStudentMarks(prev => ({
      ...prev,
      [studentId]: marks
    }));
  };

  const handleSaveGrades = async () => {
    try {
      setSaving(true);
      
      const studentsWithMarks = Object.entries(studentMarks).filter(([_, marks]) => marks !== undefined);
      
      if (studentsWithMarks.length === 0) {
        alert("Please enter marks for at least one student");
        return;
      }

      // Validate marks
      for (const [_, marks] of studentsWithMarks) {
        if (marks < 0 || marks > maxMarks) {
          alert(`Invalid marks entered. Must be between 0 and ${maxMarks}`);
          return;
        }
      }

      // Check for existing midterm/final entries
      if (selectedCategory === 'midterm' || selectedCategory === 'final') {
        const studentsWithExisting = studentsWithMarks.filter(([studentIdStr]) => {
          const studentId = Number(studentIdStr);
          const existingItems = getGradeItemsForStudent(studentId);
          return existingItems.some(item => item.category === selectedCategory);
        });

        if (studentsWithExisting.length > 0) {
          const studentNames = studentsWithExisting.map(([studentIdStr]) => {
            const studentId = Number(studentIdStr);
            const enrollment = enrollments.find(e => e.student_id === studentId);
            return enrollment?.student?.user?.name || `Student ${studentId}`;
          }).join(', ');
          
          alert(`Cannot add ${selectedCategory}: The following students already have a ${selectedCategory} entry:\n${studentNames}\n\nPlease remove their marks or choose a different category.`);
          return;
        }
      }

      let successCount = 0;
      let errorMessages: string[] = [];

      for (const [studentIdStr, obtainedMarks] of studentsWithMarks) {
        const studentId = Number(studentIdStr);
        
        try {
          // Get or create grade
          let grade = getGradeForStudent(studentId);
          if (!grade) {
            grade = await gradeService.create({
              student_id: studentId,
              course_id: Number(courseId)
            });
          }

          // Create grade item
          await gradeService.createGradeItem({
            grade_id: grade.id,
            category: selectedCategory,
            max_marks: maxMarks,
            obtained_marks: obtainedMarks
          });
          
          successCount++;
        } catch (error: any) {
          const enrollment = enrollments.find(e => e.student_id === studentId);
          const studentName = enrollment?.student?.user?.name || `Student ${studentId}`;
          errorMessages.push(`${studentName}: ${error.message || 'Failed to save'}`);
        }
      }

      if (successCount > 0) {
        alert(`Successfully added grades for ${successCount} student(s)!${errorMessages.length > 0 ? '\n\nErrors:\n' + errorMessages.join('\n') : ''}`);
        setShowAddForm(false);
        setStudentMarks({});
        await loadData(); // Reload data
      } else {
        alert(`Failed to add grades.\n\nErrors:\n${errorMessages.join('\n')}`);
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      alert("An error occurred while saving grades");
    } finally {
      setSaving(false);
    }
  };

  const calculateStudentAverage = (studentId: number): number => {
    const items = getGradeItemsForStudent(studentId);
    if (items.length === 0) return 0;
    const total = items.reduce((sum, item) => sum + ((item.obtained_marks / item.max_marks) * 100), 0);
    return total / items.length;
  };
  if (loading) {
    return (
      <div className="page-bg">
        <div className="loading-center">
          <div className="loading-content">
            <Loader2 size={40} className="loading-spinner-purple" />
            <p className="text-muted" style={{ margin: 0 }}>Loading course data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="page-bg">
        <div className="page-content-max">
          <p>Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="page-content-max">
        {/* Header */}
        <div className="card" style={{ marginBottom: '24px' }}>
          <div className="flex-between">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button className="back-btn" onClick={() => navigate('/teacher')}>
                <ArrowLeft size={20} color="#374151" />
              </button>
              <div>
                <h1 className="page-title" style={{ margin: 0 }}>{course.title}</h1>
                <p className="page-subtitle" style={{ margin: '4px 0 0' }}>
                  {enrollments.length} Students • {course.credit_hours} Credits
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className={showAddForm ? 'btn-dark-cancel' : 'btn-dark'}
            >
              {showAddForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add New Grades</>}
            </button>
          </div>
        </div>

        {/* Add Grade Form */}
        {showAddForm && (
          <div className="card card-gray" style={{ marginBottom: '20px' }}>
            <h2 className="card-title" style={{ marginBottom: '20px' }}>Add New Grade Assessment</h2>

            {/* Assessment Configuration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px', padding: '20px', background: 'white', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
              <div className="form-group">
                <label className="form-label">Assessment Type *</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value as GradeCategory)}
                  className="form-control"
                >
                  <option value="assignment">Assignment (max 20 marks)</option>
                  <option value="quiz">Quiz (max 20 marks)</option>
                  <option value="midterm">Midterm Exam</option>
                  <option value="final">Final Exam (requires midterm/assignment/quiz first)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Maximum Marks *</label>
                <input
                  type="number"
                  value={maxMarks}
                  onChange={(e) => setMaxMarks(Number(e.target.value))}
                  min="1"
                  max={selectedCategory === 'assignment' || selectedCategory === 'quiz' ? 20 : selectedCategory === 'final' ? 100 : 1000}
                  className="form-control"
                />
                <p className="text-sm text-muted" style={{ margin: '6px 0 0' }}>
                  {selectedCategory === 'assignment' || selectedCategory === 'quiz'
                    ? 'Max 20 marks for assignments/quizzes'
                    : selectedCategory === 'final'
                    ? 'Must be 50 or 100 for finals'
                    : 'No limit for midterms'}
                </p>
              </div>
            </div>

            {/* Info Note for Midterm/Final */}
            {(selectedCategory === 'midterm' || selectedCategory === 'final') && (
              <div className="grade-info-note">
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                  Note: One {selectedCategory} per student
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                  Each student can only have ONE {selectedCategory} entry. Students who already have a {selectedCategory} entry will be disabled.
                </p>
              </div>
            )}

            {/* Students Marks Entry Table */}
            <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
              <div style={{ padding: '16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <h3 className="card-title" style={{ margin: 0 }}>Enter Marks for Students</h3>
              </div>

              {enrollments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                  <p style={{ margin: 0 }}>No students enrolled in this course</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th className="th-g">Student Name</th>
                      <th className="th-g" style={{ textAlign: 'center' }}>Current Grades</th>
                      <th className="th-g" style={{ textAlign: 'center', minWidth: '180px' }}>Obtained Marks (out of {maxMarks})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.map((enrollment) => {
                      const studentGradeItems = getGradeItemsForStudent(enrollment.student_id);
                      const average = calculateStudentAverage(enrollment.student_id);
                      const alreadyHasMidtermOrFinal = hasExistingMidtermOrFinal(enrollment.student_id, selectedCategory);

                      return (
                        <tr key={enrollment.id} style={{ opacity: alreadyHasMidtermOrFinal ? 0.5 : 1 }}>
                          <td className="td-g" style={{ fontWeight: '500' }}>
                            <div>
                              <div style={{ color: '#111827', fontWeight: '600' }}>
                                {enrollment.student?.user?.name || 'Unknown'}
                                {alreadyHasMidtermOrFinal && (
                                  <span className="grade-exists-badge">EXISTS</span>
                                )}
                              </div>
                              <div className="text-sm text-muted">{enrollment.student?.user?.email}</div>
                            </div>
                          </td>
                          <td className="td-g" style={{ textAlign: 'center' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                              {studentGradeItems.length === 0 ? (
                                <span className="text-sm" style={{ color: '#9ca3af' }}>No grades yet</span>
                              ) : (
                                <>
                                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', justifyContent: 'center' }}>
                                    {studentGradeItems.map(item => (
                                      <span key={item.id} className="grade-chip">
                                        {item.category.substring(0, 3).toUpperCase()}: {item.obtained_marks}/{item.max_marks}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="avg-purple">Avg: {average.toFixed(1)}%</span>
                                </>
                              )}
                            </div>
                          </td>
                          <td className="td-g" style={{ textAlign: 'center' }}>
                            {alreadyHasMidtermOrFinal ? (
                              <span className="already-exists-text">Already exists</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                max={maxMarks}
                                step="0.5"
                                placeholder="Enter marks"
                                value={studentMarks[enrollment.student_id] ?? ''}
                                onChange={(e) => handleStudentMarkChange(enrollment.student_id, Number(e.target.value))}
                                className="marks-input"
                              />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Save Button */}
            <div className="form-actions-mt">
              <button
                className="btn-secondary-sm"
                onClick={() => {
                  setShowAddForm(false);
                  setStudentMarks({});
                }}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveGrades}
                disabled={saving || Object.keys(studentMarks).length === 0}
                style={{ opacity: Object.keys(studentMarks).length === 0 ? 0.5 : 1, cursor: Object.keys(studentMarks).length === 0 ? 'not-allowed' : 'pointer' }}
              >
                {saving ? (
                  <>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Grades ({Object.keys(studentMarks).length} students)
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Existing Grades Table */}
        <div className="card">
          <h2 className="card-title" style={{ marginBottom: '16px' }}>Student Grades Overview</h2>

          {enrollments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No students enrolled in this course</p>
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th-g" style={{ minWidth: '200px' }}>Student</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Assignments</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Quizzes</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Midterm</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Final</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Average</th>
                    <th className="th-g" style={{ textAlign: 'center' }}>Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map((enrollment) => {
                    const gradeItems = getGradeItemsForStudent(enrollment.student_id);
                    const assignments = gradeItems.filter(gi => gi.category === 'assignment');
                    const quizzes = gradeItems.filter(gi => gi.category === 'quiz');
                    const midterms = gradeItems.filter(gi => gi.category === 'midterm');
                    const finals = gradeItems.filter(gi => gi.category === 'final');
                    const average = calculateStudentAverage(enrollment.student_id);

                    const getLetterGrade = (percentage: number): string => {
                      if (percentage >= 85) return 'A';
                      if (percentage >= 75) return 'B';
                      if (percentage >= 65) return 'C';
                      if (percentage >= 50) return 'D';
                      return 'F';
                    };

                    const renderCategoryMarks = (items: GradeItem[]) => {
                      if (items.length === 0) return <span className="text-sm" style={{ color: '#9ca3af' }}>-</span>;
                      return (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                          {items.map((item) => (
                            <span key={item.id} className="grade-chip-detailed">
                              {item.obtained_marks}/{item.max_marks}
                            </span>
                          ))}
                        </div>
                      );
                    };

                    return (
                      <tr key={enrollment.id}>
                        <td className="td-g">
                          <div>
                            <div style={{ fontWeight: '600', color: '#111827' }}>
                              {enrollment.student?.user?.name || 'Unknown'}
                            </div>
                            <div className="text-sm text-muted">{enrollment.student?.user?.email}</div>
                          </div>
                        </td>
                        <td className="td-g" style={{ textAlign: 'center' }}>{renderCategoryMarks(assignments)}</td>
                        <td className="td-g" style={{ textAlign: 'center' }}>{renderCategoryMarks(quizzes)}</td>
                        <td className="td-g" style={{ textAlign: 'center' }}>{renderCategoryMarks(midterms)}</td>
                        <td className="td-g" style={{ textAlign: 'center' }}>{renderCategoryMarks(finals)}</td>
                        <td className="td-g" style={{ textAlign: 'center' }}>
                          {gradeItems.length > 0 ? (
                            <span className="avg-purple" style={{ fontSize: '16px' }}>
                              {average.toFixed(1)}%
                            </span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                        <td className="td-g" style={{ textAlign: 'center' }}>
                          {gradeItems.length > 0 ? (
                            <span className="grade-letter-badge">{getLetterGrade(average)}</span>
                          ) : (
                            <span style={{ color: '#9ca3af' }}>-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
