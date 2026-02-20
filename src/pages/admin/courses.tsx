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

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6' };
  const contentStyle: React.CSSProperties = { padding: '24px 32px' };
  const headerStyle: React.CSSProperties = { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const searchBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', flex: 1, maxWidth: '400px' };
  const tableContainerStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' };
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalStyle: React.CSSProperties = { background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' };

  const badgeStyle = (color: string): React.CSSProperties => ({
    padding: '4px 10px',
    background: color === 'indigo' ? '#eef2ff' : color === 'blue' ? '#eff6ff' : '#f3f4f6',
    color: color === 'indigo' ? '#4f46e5' : color === 'blue' ? '#2563eb' : '#6b7280',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  });

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Courses</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>Manage all courses in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={searchBoxStyle}>
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by title, code, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }} />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Course
            </Button>
          </div>
        </div>

        <div style={tableContainerStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <p>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <BookOpen size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No courses match your search" : "No courses yet"}</p>
            </div>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Course Title</th>
                    <th style={thStyle}>Department</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Credits</th>
                    <th style={thStyle}>Teacher</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((course) => (
                    <tr key={course.id}>
                      <td style={tdStyle}><span style={{ fontWeight: '600', color: '#4f46e5' }}>{course.id}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: '500', color: '#111827' }}>{course.title}</span></td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{course.department?.name || `Dept #${course.department_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{course.department?.code}</div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><span style={badgeStyle('blue')}>{course.credit_hours}</span></td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{course.teacher?.user?.name || course.teacher?.user?.email || `Teacher #${course.teacher_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{course.teacher?.user?.email || course.teacher?.department?.name || 'N/A'}</div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderTop: '1px solid #e5e7eb', background: '#fafafa' }}>
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: currentPage === 1 ? '#f3f4f6' : 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: '#374151' }}>
                      <ChevronLeft size={16} />
                    </button>
                    <span style={{ fontSize: '13px', color: '#374151', padding: '0 8px' }}>Page {currentPage} / {totalPages || 1}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: '8px', background: currentPage >= totalPages ? '#f3f4f6' : 'white', cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', color: '#374151' }}>
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
        <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Add New Course</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Course Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Data Structures and Algorithms"
                value={courseFormData.title}
                onChange={(e) => setCourseFormData({ ...courseFormData, title: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Department <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={courseFormData.department_id}
                onChange={(e) => setCourseFormData({ ...courseFormData, department_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              >
                <option value="">Select department...</option>
                {departments.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Credit Hours <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={courseFormData.credit_hours}
                onChange={(e) => setCourseFormData({ ...courseFormData, credit_hours: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              >
                {[1, 2, 3, 4].map(ch => (
                  <option key={ch} value={ch}>{ch} Credit Hour{ch > 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Teacher <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <select
                value={courseFormData.teacher_id}
                onChange={(e) => setCourseFormData({ ...courseFormData, teacher_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
        <div style={modalOverlayStyle} onClick={() => setShowReassignModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Reassign Teacher</h2>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#6b7280' }}>{selectedCourse.title}</p>
              </div>
              <button onClick={() => setShowReassignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                Select New Teacher
              </label>
              <select
                value={selectedTeacherId}
                onChange={(e) => setSelectedTeacherId(e.target.value)}
                style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
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

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
