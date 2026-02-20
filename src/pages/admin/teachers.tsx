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

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6' };
  const contentStyle: React.CSSProperties = { padding: '24px 32px' };
  const headerStyle: React.CSSProperties = { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
  const searchBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', flex: 1, maxWidth: '400px', marginBottom: '24px' };
  const tableContainerStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' };
  const modalOverlayStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px' };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#ec4899' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading teachers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={28} color="#ec4899" />
              Admin Teachers Manager
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>View and manage all teachers</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#ec4899', margin: 0 }}>{filteredTeachers.length}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Total Teachers</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Teacher
            </Button>
          </div>
        </div>

        <div style={searchBoxStyle}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by ID, user ID, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }}
          />
        </div>

        <div style={tableContainerStyle}>
          {filteredTeachers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No teachers found</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>User ID</th>
                  <th style={thStyle}>Department</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((teacher) => {
                  return (
                    <tr key={teacher.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: '#ec4899' }}>{teacher.id}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{teacher.user?.name || teacher.user?.email || `User #${teacher.user_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{teacher.user?.email || 'No email'}</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{teacher.department?.name || `Dept #${teacher.department_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{teacher.department?.code}</div>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Add Teacher Modal */}
        {showAddModal && (
          <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Add New Teacher</h2>
                <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Full Name <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter teacher's full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Department <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="">Select department...</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Designation <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={formData.designation}
                  onChange={(e) => setFormData({ ...formData, designation: e.target.value as TeacherDesignation })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
                >
                  <option value="">Select designation...</option>
                  <option value="visiting_faculty">Visiting Faculty</option>
                  <option value="lecturer">Lecturer</option>
                  <option value="assistant_professor">Assistant Professor</option>
                  <option value="associate_professor">Associate Professor</option>
                  <option value="professor">Professor</option>
                </select>
              </div>

              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  <strong>Note:</strong> Email and password will be auto-generated. Default password: <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>12345678</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
