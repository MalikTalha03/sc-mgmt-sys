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
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#9333ea' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading students...</p>
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
              <GraduationCap size={28} color="#9333ea" />
              Admin Students Manager
            </h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>View and manage all students</p>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#9333ea', margin: 0 }}>{filteredStudents.length}</p>
              <p style={{ fontSize: '13px', color: '#6b7280', margin: '4px 0 0' }}>Total Students</p>
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Student
            </Button>
          </div>
        </div>

        <div style={searchBoxStyle}>
          <Search size={18} color="#9ca3af" />
          <input
            type="text"
            placeholder="Search by name, email, department, or semester..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }}
          />
        </div>

        <div style={tableContainerStyle}>
          {filteredStudents.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <GraduationCap size={40} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No students found</p>
            </div>
          ) : (
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>User ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Department</th>
                  <th style={thStyle}>Semester</th>
                  <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => {
                  return (
                    <tr key={student.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: '#9333ea' }}>{student.id}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{student.user?.name || student.user?.email || `User #${student.user_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{student.user?.email || 'No email'}</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>{student.department?.name || `Dept #${student.department_id}`}</div>
                          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{student.department?.code}</div>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: '#f3e8ff', color: '#7e22ce', borderRadius: '6px', fontSize: '12px', fontWeight: '500' }}>
                          <BookOpen size={12} />
                          Semester {student.semester || 'N/A'}
                        </span>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.id)}>
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

        {/* Add Student Modal */}
        {showAddModal && (
          <div style={modalOverlayStyle} onClick={() => setShowAddModal(false)}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: 0 }}>Add New Student</h2>
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
                  placeholder="Enter student's full name"
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

              <div style={{ padding: '12px', background: '#eff6ff', borderRadius: '8px', marginBottom: '20px' }}>
                <p style={{ margin: 0, fontSize: '13px', color: '#1e40af' }}>
                  <strong>Note:</strong> Student will start at Semester 1. Email and password will be auto-generated. Default password: <code style={{ background: '#dbeafe', padding: '2px 6px', borderRadius: '4px' }}>12345678</code>
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
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
