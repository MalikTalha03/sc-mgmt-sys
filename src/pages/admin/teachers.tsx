import { useState, useEffect } from "react";
import { teacherService, type Teacher, type TeacherDesignation } from "../../services/teacher.service";
import { departmentService, type Department } from "../../services/department.service";
import { Loader2, Users, Search, Trash2, Plus, X } from "lucide-react";
import { Button } from "../../components/button";

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department_id: "",
    designation: "" as TeacherDesignation | ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, deptsData] = await Promise.all([
        teacherService.getAll(),
        departmentService.getAll()
      ]);
      setTeachers(teachersData);
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    if (!searchQuery) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(t => {
      return (
        t.id.toString().includes(query) ||
        t.user_id.toString().includes(query) ||
        t.department?.name?.toLowerCase().includes(query) ||
        t.user?.email?.toLowerCase().includes(query) ||
        t.user?.name?.toLowerCase().includes(query)
      );
    });
  };

  const handleDeleteTeacher = async (teacherId: number) => {
    if (!confirm("Are you sure you want to delete this teacher?")) return;
    
    try {
      await teacherService.delete(teacherId);
      alert("Teacher deleted successfully!");
      loadData();
    } catch (error: any) {
      console.error("Error deleting teacher:", error);
      alert(error.message || "Failed to delete teacher");
    }
  };

  const handleCreateTeacher = async () => {
    if (!formData.name || !formData.department_id || !formData.designation) {
      alert("Please fill all fields");
      return;
    }

    try {
      await teacherService.create({
        name: formData.name,
        department_id: parseInt(formData.department_id),
        designation: formData.designation as TeacherDesignation,
        user_id: 0 // placeholder, backend will create user
      } as any);
      alert("Teacher created successfully! Email will be auto-generated.");
      setShowAddModal(false);
      setFormData({ name: "", department_id: "", designation: "" });
      loadData();
    } catch (error: any) {
      console.error("Error creating teacher:", error);
      alert(error.message || "Failed to create teacher");
    }
  };

  const filteredTeachers = filterTeachers();

  if (loading) {
    return (
      <div className="page-bg loading-page">
        <div className="loading-content">
          <Loader2 size={40} className="loading-spinner-pink" style={{ margin: '0 auto 16px' }} />
          <p className="text-muted" style={{ margin: 0 }}>Loading teachers...</p>
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
              <Users size={28} color="#ec4899" />
              Admin Teachers Manager
            </h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>View and manage all teachers</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p className="stat-value" style={{ margin: 0, color: '#ec4899' }}>{filteredTeachers.length}</p>
              <p className="stat-label" style={{ margin: '4px 0 0' }}>Total Teachers</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Teacher
            </Button>
          </div>
        </div>

        <div className="search-box">
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by ID, user ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-field"
          />
        </div>

        <div className="table-container">
          {filteredTeachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No teachers found</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th className="th">ID</th>
                  <th className="th">User ID</th>
                  <th className="th">Department</th>
                  <th className="th th-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="td">
                      <span style={{ fontWeight: '600', color: '#ec4899' }}>{teacher.id}</span>
                    </td>
                    <td className="td">
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{teacher.user?.name || teacher.user?.email || `User #${teacher.user_id}`}</div>
                        <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{teacher.user?.email || 'No email'}</div>
                      </div>
                    </td>
                    <td className="td">
                      <div>
                        <div style={{ fontWeight: '500', color: '#111827' }}>{teacher.department?.name || `Dept #${teacher.department_id}`}</div>
                        <div className="text-sm text-muted" style={{ marginTop: '2px' }}>{teacher.department?.code}</div>
                      </div>
                    </td>
                    <td className="td td-right">
                      <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Teacher Modal */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-row">
                <h2 className="page-title" style={{ margin: 0 }}>Add New Teacher</h2>
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
                  placeholder="Enter teacher's full name"
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

              <div className="form-group">
                <label className="form-label">
                  Designation <span className="required-star">*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value as TeacherDesignation })}
                  className="form-control"
                >
                  <option value="">Select designation...</option>
                  <option value="visiting_faculty">Visiting Faculty</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="assistant_professor">Assistant Professor</option>
                  <option value="associate_professor">Associate Professor</option>
                  <option value="professor">Professor</option>
                </select>
              </div>

              <div className="form-note-blue">
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  <strong>Note:</strong> Email and password will be auto-generated. Default password: <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>12345678</code>
                </p>
              </div>

              <div className="form-actions">
                <Button variant="secondary" onClick={() => {
                  setShowAddModal(false);
                  setFormData({ name: "", department_id: "", designation: "" });
                }}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={handleCreateTeacher}>
                  Create Teacher
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
