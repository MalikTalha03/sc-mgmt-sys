import { useState, useEffect } from "react";
import { Button } from "../../components/button";
import { StudentForm } from "../../components/studentform";
import {
  GraduationCap,
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
  ArrowUpCircle,
} from "lucide-react";
import {
  getAllStudents,
  createStudent,
  deleteStudent,
  updateStudent,
  getAllDepartments,
  registerUser,
  getAllUsers,
  deleteUserDoc,
  completeAllEnrollmentsForStudent,
} from "../../firebase";
import type { Student } from "../../models/student";
import type { Department } from "../../models/department";
import type { AppUser } from "../../models/user";

const ITEMS_PER_PAGE = 10;

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
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
      const [studentsData, deptsData, usersData] = await Promise.all([
        getAllStudents(),
        getAllDepartments(),
        getAllUsers(),
      ]);
      setStudents(studentsData);
      setDepartments(deptsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(s =>
      s.name.toLowerCase().includes(query) ||
      s.studentId.toLowerCase().includes(query) ||
      s.departmentCode.toLowerCase().includes(query)
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
      await registerUser(userEmail, userPassword, "student", selectedUserTarget.id);
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

  const handleCreateStudent = async (data: any) => {
    try {
      await createStudent({
        studentId: data.studentId,
        name: data.name,
        semester: parseInt(data.semester),
        departmentCode: data.departmentCode,
        currentCreditHours: 0,
        maxCreditHours: 18,
      });
      setShowAddModal(false);
      loadData();
    } catch (error) {
      alert("Failed to create student");
    }
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (!confirm("Delete this student?")) return;
    try {
      await deleteStudent(studentId);
      loadData();
    } catch (error) {
      alert("Failed to delete student");
    }
  };

  const handleUpgradeSemester = async (student: Student) => {
    const nextSemester = student.semester + 1;
    if (nextSemester > 8) {
      alert("Student is already in the final semester (8)");
      return;
    }
    if (!confirm(`Upgrade ${student.name} from Semester ${student.semester} to Semester ${nextSemester}?\n\nThis will:\n- Move to Semester ${nextSemester}\n- Reset credit hours to 0\n- Mark all current enrollments as completed`)) return;
    try {
      // Complete all approved enrollments for this student
      await completeAllEnrollmentsForStudent(student.studentId);
      // Update semester and reset credit hours to 0
      await updateStudent(student.studentId, { 
        semester: nextSemester,
        currentCreditHours: 0
      });
      loadData();
    } catch (error) {
      alert("Failed to upgrade semester");
    }
  };

  const filtered = filterStudents();
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
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Students</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>Manage all students in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={searchBoxStyle}>
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by name, ID, or department..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }} />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Student
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
              <GraduationCap size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No students match your search" : "No students yet"}</p>
            </div>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Student ID</th>
                    <th style={thStyle}>Name</th>
                    <th style={thStyle}>Department</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Semester</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Credits</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Account</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((student) => {
                    const hasAccount = !!getUserForEntity(student.studentId);
                    return (
                      <tr key={student.studentId}>
                        <td style={tdStyle}><span style={{ fontWeight: '600', color: '#4f46e5' }}>{student.studentId}</span></td>
                        <td style={tdStyle}><span style={{ fontWeight: '500', color: '#111827' }}>{student.name}</span></td>
                        <td style={tdStyle}><span style={badgeStyle('indigo')}>{student.departmentCode}</span></td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{student.semester}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>{student.currentCreditHours}/{student.maxCreditHours}</td>
                        <td style={{ ...tdStyle, textAlign: 'center' }}>
                          {hasAccount ? <span style={badgeStyle('green')}> Active</span> : <span style={badgeStyle('gray')}>No Account</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="secondary" size="sm" onClick={() => handleUpgradeSemester(student)} title="Upgrade to next semester">
                              <ArrowUpCircle size={14} /> Sem {student.semester < 8 ? student.semester + 1 : 'Max'}
                            </Button>
                            {!hasAccount ? (
                              <Button variant="secondary" size="sm" onClick={() => openCreateUserModal(student.studentId, student.name)}><UserPlus size={14} /> Create Login</Button>
                            ) : (
                              <Button variant="secondary" size="sm" onClick={() => handleDeleteUserAccount(student.studentId)}><Key size={14} /> Remove</Button>
                            )}
                            <Button variant="danger" size="sm" onClick={() => handleDeleteStudent(student.studentId)}><Trash2 size={14} /></Button>
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Add Student</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <StudentForm onSubmit={handleCreateStudent} departments={departments} />
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showUserModal && (
        <div style={modalOverlayStyle} onClick={() => setShowUserModal(false)}>
          <div style={modalStyle} onClick={e => e.stopPropagation()}>
            <div style={{ marginBottom: '24px' }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>Create Login Account</h2>
              <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Student: {selectedUserTarget?.name}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                <Mail size={14} /> Email Address
              </label>
              <input type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="student@school.edu" style={{ width: '100%', padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '10px', fontSize: '14px', boxSizing: 'border-box' }} />
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
