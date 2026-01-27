import { useState, useEffect } from "react";
import { Button } from "../../components/button";
import { TeacherForm } from "../../components/teacherform";
import {
  Users,
  Trash2,
  Check,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Key,
  Plus,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  getAllTeachers,
  createTeacher,
  deleteTeacher,
  getAllDepartments,
  registerUser,
  getAllUsers,
  deleteUserDoc,
} from "../../firebase";
import type { Teacher } from "../../models/teacher";
import type { Department } from "../../models/department";
import type { AppUser } from "../../models/user";

const ITEMS_PER_PAGE = 10;

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  // User management
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUserTarget, setSelectedUserTarget] = useState<{ id: string; name: string } | null>(null);
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersData, deptsData, usersData] = await Promise.all([
        getAllTeachers(),
        getAllDepartments(),
        getAllUsers(),
      ]);
      setTeachers(teachersData);
      setDepartments(deptsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterTeachers = () => {
    if (!searchQuery) return teachers;
    const query = searchQuery.toLowerCase();
    return teachers.filter(t =>
      t.name.toLowerCase().includes(query) ||
      t.departmentCode.toLowerCase().includes(query)
    );
  };

  const paginate = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (total: number) => Math.ceil(total / ITEMS_PER_PAGE);

  const getUserForEntity = (linkedId: string) => users.find(u => u.linkedId === linkedId);

  const openCreateUserModal = (id: string, name: string) => {
    setSelectedUserTarget({ id, name });
    setUserEmail("");
    setUserPassword("");
    setShowUserModal(true);
  };

  const handleCreateUserAccount = async () => {
    if (!selectedUserTarget || !userEmail || !userPassword) return;
    if (userPassword.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }
    try {
      setUserLoading(true);
      await registerUser(userEmail, userPassword, "teacher", selectedUserTarget.id);
      alert(`Account created for ${selectedUserTarget.name}!`);
      setShowUserModal(false);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error: any) {
      alert(error.message || "Failed to create account");
    } finally {
      setUserLoading(false);
    }
  };

  const handleDeleteUserAccount = async (linkedId: string) => {
    const user = getUserForEntity(linkedId);
    if (!user || !confirm("Delete this user account?")) return;
    try {
      await deleteUserDoc(user.uid);
      const usersData = await getAllUsers();
      setUsers(usersData);
    } catch (error) {
      alert("Failed to delete account");
    }
  };

  const handleCreateTeacher = async (data: any) => {
    try {
      await createTeacher({
        name: data.name,
        designation: data.designation || "Lecturer",
        departmentCode: data.departmentCode,
        assignedCourses: [],
      });
      setShowAddModal(false);
      loadData();
    } catch (error) {
      alert("Failed to create teacher");
    }
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    if (!confirm("Delete this teacher?")) return;
    try {
      await deleteTeacher(teacherId);
      loadData();
    } catch (error) {
      alert("Failed to delete teacher");
    }
  };

  const filtered = filterTeachers();
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
    background: color === 'indigo' ? '#eef2ff' : color === 'green' ? '#ecfdf5' : '#f3f4f6',
    color: color === 'indigo' ? '#4f46e5' : color === 'green' ? '#059669' : '#6b7280',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  });

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Teachers</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>Manage all teachers in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={searchBoxStyle}>
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by name or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }} />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Teacher
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
              <Users size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No teachers match your search" : "No teachers yet"}</p>
            </div>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Designation</th>
                    <th style={thStyle}>Department</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Account</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((teacher) => {
                    const hasAccount = teacher.id ? !!getUserForEntity(teacher.id) : false;
                    return (
                      <tr key={teacher.id}>
                        <td style={tdStyle}><span style={{ fontWeight: '500', color: '#111827' }}>{teacher.name}</span></td>
                        <td style={tdStyle}>{teacher.designation}</td>
                        <td style={tdStyle}><span style={badgeStyle('indigo')}>{teacher.departmentCode}</span></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {hasAccount ? <span style={badgeStyle('green')}> Active</span> : <span style={badgeStyle('gray')}>No Account</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            {!hasAccount && teacher.id ? (
                              <Button variant="secondary" size="sm" onClick={() => openCreateUserModal(teacher.id!, teacher.name)}><UserPlus size={14} /> Create Login</Button>
                            ) : teacher.id ? (
                              <Button variant="secondary" size="sm" onClick={() => handleDeleteUserAccount(teacher.id!)}><Key size={14} /> Remove</Button>
                            ) : null}
                            {teacher.id && <Button variant="danger" size="sm" onClick={() => handleDeleteTeacher(teacher.id!)}><Trash2 size={14} /></Button>}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Add Teacher</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <TeacherForm onSubmit={handleCreateTeacher} departments={departments} />
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div style={modalOverlayStyle} onClick={() => setShowUserModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Create Login Account</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Teacher: {selectedUserTarget?.name}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <Mail size={14} /> Email Address
              </label>
              <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="teacher@school.edu" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <Lock size={14} /> Password
              </label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? "text" : "password"} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Minimum 6 characters" style={{ width: '100%', padding: '12px 44px 12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <Button variant="secondary" fullWidth onClick={() => setShowUserModal(false)}>Cancel</Button>
              <Button variant="primary" fullWidth onClick={handleCreateUserAccount} disabled={userLoading}>
                {userLoading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : <><UserPlus size={16} /> Create Account</>}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
