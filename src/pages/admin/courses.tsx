import { useState, useEffect } from "react";
import { Button } from "../../components/button";
import {
  BookOpen,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  UserCog,
} from "lucide-react";
import { courseService, type Course } from "../../services/course.service";
import { departmentService, type Department } from "../../services/department.service";
import { teacherService, type Teacher } from "../../services/teacher.service";

const ITEMS_PER_PAGE = 10;

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [courseFormData, setCourseFormData] = useState({
    title: "",
    department_id: "",
    credit_hours: "3",
    teacher_id: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [coursesData, deptsData, teachersData] = await Promise.all([
        courseService.getAll(),
        departmentService.getAll(),
        teacherService.getAll(),
      ]);
      setCourses(coursesData);
      setDepartments(deptsData);
      setTeachers(teachersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterCourses = () => {
    if (!searchQuery) return courses;
    const query = searchQuery.toLowerCase();
    return courses.filter(c =>
      c.title.toLowerCase().includes(query) ||
      c.id.toString().includes(query) ||
      c.department?.name?.toLowerCase().includes(query) ||
      c.department?.code?.toLowerCase().includes(query) ||
      c.teacher?.user?.email?.toLowerCase().includes(query) ||
      c.teacher?.user?.name?.toLowerCase().includes(query)
    );
  };

  const paginate = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (total: number) => Math.ceil(total / ITEMS_PER_PAGE);

  const handleCreateCourse = async () => {
    if (!courseFormData.title || !courseFormData.department_id || !courseFormData.teacher_id) {
      alert("Please fill all required fields");
      return;
    }

    const creditHours = parseInt(courseFormData.credit_hours);
    if (creditHours < 1 || creditHours > 4) {
      alert("Credit hours must be between 1 and 4");
      return;
    }

    try {
      await courseService.create({
        title: courseFormData.title,
        department_id: parseInt(courseFormData.department_id),
        credit_hours: creditHours,
        teacher_id: parseInt(courseFormData.teacher_id)
      } as any);
      alert("Course created successfully!");
      setShowAddModal(false);
      setCourseFormData({ title: "", department_id: "", credit_hours: "3", teacher_id: "" });
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to create course");
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm("Delete this course?")) return;
    try {
      await courseService.delete(courseId);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to delete course");
    }
  };

  const handleReassignTeacher = (course: Course) => {
    setSelectedCourse(course);
    setSelectedTeacherId(course.teacher_id.toString());
    setShowReassignModal(true);
  };

  const handleSubmitReassign = async () => {
    if (!selectedCourse || !selectedTeacherId) {
      alert("Please select a teacher");
      return;
    }

    try {
      await courseService.update(selectedCourse.id, {
        teacher_id: parseInt(selectedTeacherId)
      });
      alert("Teacher reassigned successfully!");
      setShowReassignModal(false);
      setSelectedCourse(null);
      setSelectedTeacherId("");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to reassign teacher");
    }
  };

  const filtered = filterCourses();
  const totalPages = getTotalPages(filtered.length);

  return (
    <div className="page-bg">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Courses</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>Manage all courses in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-box-inline">
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by title, code, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-field" />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Course
            </Button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Loader2 size={24} className="loading-spinner" style={{ margin: '0 auto 8px' }} />
              <p>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No courses match your search" : "No courses yet"}</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Course Title</th>
                    <th className="th">Department</th>
                    <th className="th th-center">Credits</th>
                    <th className="th">Teacher</th>
                    <th className="th th-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((course) => (
                    <tr key={course.id}>
                      <td className="td"><span style={{ fontWeight: '600', color: '#4f46e5' }}>{course.id}</span></td>
                      <td className="td"><span style={{ fontWeight: '500', color: '#111827' }}>{course.title}</span></td>
                      <td className="td">
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{course.department?.name || `Dept #${course.department_id}`}</div>
                          <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{course.department?.code}</div>
                        </div>
                      </td>
                      <td className="td td-center"><span className="badge-blue-sm">{course.credit_hours}</span></td>
                      <td className="td">
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{course.teacher?.user?.name || course.teacher?.user?.email || `Teacher #${course.teacher_id}`}</div>
                          <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{course.teacher?.user?.email || course.teacher?.department?.name || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="td td-right">
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <Button variant="secondary" size="sm" onClick={() => handleReassignTeacher(course)} title="Reassign Teacher">
                            <UserCog size={14} />
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteCourse(course.id)}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="pagination-bar">
                  <span className="pagination-info">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="pagination-controls">
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pagination-label">Page {currentPage} / {totalPages || 1}</span>
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="page-title" style={{ margin: 0 }}>Add New Course</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">
                Course Title <span className="required-star">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Data Structures and Algorithms"
                value={courseFormData.title}
                onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Department <span className="required-star">*</span>
              </label>
              <select
                value={courseFormData.department_id}
                onChange={(e) => setCourseFormData({ ...courseFormData, department_id: e.target.value })}
                className="form-control"
              >
                <option value="">Select department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Credit Hours <span className="required-star">*</span>
              </label>
              <select
                value={courseFormData.credit_hours}
                onChange={(e) => setCourseFormData({ ...courseFormData, credit_hours: e.target.value })}
                className="form-control"
              >
                {[1, 2, 3, 4].map(ch => (
                  <option key={ch} value={ch}>{ch} Credit Hour{ch > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">
                Teacher <span className="required-star">*</span>
              </label>
              <select
                value={courseFormData.teacher_id}
                onChange={(e) => setCourseFormData({ ...courseFormData, teacher_id: e.target.value })}
                className="form-control"
              >
                <option value="">Select teacher...</option>
                {teachers.map(teacher => {
                  const courseCount = courses.filter(c => c.teacher_id === teacher.id).length;
                  const isAtLimit = courseCount >= 3;
                  return (
                    <option key={teacher.id} value={teacher.id} disabled={isAtLimit}>
                      {teacher.user?.name || teacher.user?.email || `Teacher #${teacher.id}`} - {teacher.department?.code || 'N/A'} ({courseCount}/3 courses) {isAtLimit ? '(At Limit)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => {
                setShowAddModal(false);
                setCourseFormData({ title: "", department_id: "", credit_hours: "3", teacher_id: "" });
              }}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleCreateCourse}>
                Create Course
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reassign Teacher Modal */}
      {showReassignModal && selectedCourse && (
        <div className="modal-overlay" onClick={() => setShowReassignModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <div>
                <h2 className="page-title" style={{ margin: 0 }}>Reassign Teacher</h2>
                <p className="page-subtitle" style={{ margin: '4px 0 0' }}>{selectedCourse.title}</p>
              </div>
              <button className="btn-close" onClick={() => setShowReassignModal(false)}>
                <X size={20} color="#6b7280" />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Select New Teacher</label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                className="form-control"
              >
                <option value="">Select teacher...</option>
                {teachers.map(teacher => {
                  const courseCount = courses.filter(c => c.teacher_id === teacher.id).length;
                  const isAtLimit = courseCount >= 3 && teacher.id !== selectedCourse.teacher_id;
                  return (
                    <option key={teacher.id} value={teacher.id} disabled={isAtLimit}>
                      {teacher.user?.name || teacher.user?.email || `Teacher #${teacher.id}`} - {teacher.department?.code || 'N/A'} ({courseCount}/3 courses) {isAtLimit ? '(At Limit)' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-actions">
              <Button variant="secondary" onClick={() => setShowReassignModal(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleSubmitReassign}>
                Reassign Teacher
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
