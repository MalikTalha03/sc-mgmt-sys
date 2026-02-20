import { useState, useEffect } from "react";
import { studentService, type Student } from "../../services/student.service";
import { departmentService, type Department } from "../../services/department.service";
import { Loader2, GraduationCap, Search, Trash2, BookOpen, Plus, X } from "lucide-react";
import { Button } from "../../components/button";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department_id: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [studentsData, deptsData] = await Promise.all([
        studentService.getAll(),
        departmentService.getAll()
      ]);
      setStudents(studentsData);
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s => {
      return (
        s.id.toString().includes(query) ||
        s.semester?.toString().includes(query) ||
        s.department?.name?.toLowerCase().includes(query) ||
        s.user?.email?.toLowerCase().includes(query) ||
        s.user?.name?.toLowerCase().includes(query)
      );
    });
  };

  const handleDeleteStudent = async (studentId: number) => {
    if (!confirm("Are you sure you want to delete this student?")) return;
    
    try {
      await studentService.delete(studentId);
      alert("Student deleted successfully!");
      loadData();
    } catch (error: any) {
      console.error("Error deleting student:", error);
      alert(error.message || "Failed to delete student");
    }
  };

  const handleCreateStudent = async () => {
    if (!formData.name || !formData.department_id) {
      alert("Please fill all fields");
      return;
    }

    try {
      await studentService.create({
        name: formData.name,
        department_id: parseInt(formData.department_id),
        semester: 1, // Always start at semester 1
        user_id: 0 // placeholder, backend will create user
      } as any);
      alert("Student created successfully! Email will be auto-generated.");
      setShowAddModal(false);
      setFormData({ name: "", department_id: "" });
      loadData();
    } catch (error: any) {
      console.error("Error creating student:", error);
      alert(error.message || "Failed to create student");
    }
  };

  const filteredStudents = filterStudents();

  if (loading) {
    return (
      <div className="page-bg loading-page">
        <div className="loading-content">
          <Loader2 size={40} className="loading-spinner-purple" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted" style={{ margin: 0 }}>Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <GraduationCap size={28} color="#9333ea" />
              Admin Students Manager
            </h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>View and manage all students</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p className="stat-value" style={{ margin: 0, color: '#9333ea' }}>{filteredStudents.length}</p>
              <p className="stat-label" style={{ margin: '4px 0 0' }}>Total Students</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Student
            </Button>
          </div>
        </div>

        <div className="search-box">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name, email, department, or semester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
          />
        </div>

        <div className="table-container">
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <GraduationCap size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No students found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th">User ID</th>
                  <th className="th">Name</th>
                  <th className="th">Department</th>
                  <th className="th">Semester</th>
                  <th className="th th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="td">
                      <span style={{ fontWeight: '600', color: '#9333ea' }}>{student.id}</span>
                    </td>
                    <td className="td">
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{student.user?.name || student.user?.email || `User #${student.user_id}`}</div>
                        <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{student.user?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="td">
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{student.department?.name || `Dept #${student.department_id}`}</div>
                        <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{student.department?.code}</div>
                      </div>
                    </td>
                    <td className="td">
                      <span className="badge-purple-sm">
                        <BookOpen size={12} />
                        Semester {student.semester || 'N/A'}
                      </span>
                    </td>
                    <td className="td td-right">
                      <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Student Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h2 className="page-title" style={{ margin: 0 }}>Add New Student</h2>
                <button className="btn-close" onClick={() => setShowAddModal(false)}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Full Name <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter student's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Department <span className="required-star">*</span>
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="form-control"
                >
                  <option value="">Select department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div className="form-note-blue">
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  <strong>Note:</strong> Student will start at Semester 1. Email and password will be auto-generated. Default password: <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>12345678</code>
                </p>
              </div>

              <div className="form-actions">
                <Button variant="secondary" onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: "", department_id: "" });
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateStudent}>
                  Create Student
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
