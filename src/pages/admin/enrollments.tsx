import { useState, useEffect } from "react";
import { Button } from "../../components/button";
import {
  ClipboardList,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
} from "lucide-react";
import {
  getAllEnrollments,
  updateEnrollmentStatus,
  getAllStudents,
  getAllCourses,
  createEnrollment,
} from "../../firebase";
import type { Enrollment } from "../../models/enrollment";
import type { Student } from "../../models/student";
import type { Course } from "../../models/course";

const ITEMS_PER_PAGE = 10;

type EnrollmentWithId = Enrollment & { id: string };

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<EnrollmentWithId[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected" | "completed">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, studentsData, coursesData] = await Promise.all([
        getAllEnrollments(),
        getAllStudents(),
        getAllCourses(),
      ]);
      setEnrollments(enrollmentsData);
      setStudents(studentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEnrollments = () => {
    let filtered = enrollments;

    if (statusFilter !== "all") {
      filtered = filtered.filter(e => e.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e => {
        const student = students.find(s => s.studentId === e.studentId);
        const course = courses.find(c => c.code === e.courseCode);
        return (
          e.studentId.toLowerCase().includes(query) ||
          e.courseCode.toLowerCase().includes(query) ||
          student?.name.toLowerCase().includes(query) ||
          course?.title.toLowerCase().includes(query)
        );
      });
    }

    return filtered;
  };

  const paginate = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (total: number) => Math.ceil(total / ITEMS_PER_PAGE);
  const getStudentName = (studentId: string) => students.find(s => s.studentId === studentId)?.name || studentId;
  const getCourseName = (courseCode: string) => courses.find(c => c.code === courseCode)?.title || courseCode;

  const handleUpdateStatus = async (enrollment: EnrollmentWithId, status: "approved" | "rejected") => {
    try {
      await updateEnrollmentStatus(enrollment.studentId, enrollment.courseCode, status);
      loadData();
    } catch (error) {
      alert("Failed to update enrollment status");
    }
  };

  const handleAddEnrollment = async () => {
    if (!selectedStudentId || !selectedCourseCode) {
      alert("Please select both a student and a course");
      return;
    }
    try {
      await createEnrollment({
        studentId: selectedStudentId,
        courseCode: selectedCourseCode,
        status: "approved",
      });
      setShowAddModal(false);
      setSelectedStudentId("");
      setSelectedCourseCode("");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to create enrollment");
    }
  };

  const filtered = filterEnrollments();
  const totalPages = getTotalPages(filtered.length);

  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6' };
  const contentStyle: React.CSSProperties = { padding: '24px 32px' };
  const headerStyle: React.CSSProperties = { marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' };
  const searchBoxStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '10px', flex: 1, maxWidth: '400px' };
  const tableContainerStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' };
  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 16px',
    border: '1px solid',
    borderColor: active ? '#4f46e5' : '#e5e7eb',
    borderRadius: '8px',
    background: active ? '#4f46e5' : 'white',
    color: active ? 'white' : '#374151',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, React.CSSProperties> = {
      pending: { background: '#fef3c7', color: '#d97706' },
      approved: { background: '#ecfdf5', color: '#059669' },
      rejected: { background: '#fef2f2', color: '#dc2626' },
      completed: { background: '#e0e7ff', color: '#4f46e5' },
    };
    const icons: Record<string, React.ReactNode> = {
      pending: <Clock size={12} />,
      approved: <CheckCircle size={12} />,
      rejected: <XCircle size={12} />,
      completed: <Check size={12} />,
    };
    return (
      <span style={{ ...styles[status], padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: '500', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {icons[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const pendingCount = enrollments.filter(e => e.status === "pending").length;

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Enrollments</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>
              Manage course enrollment requests
              {pendingCount > 0 && <span style={{ marginLeft: '8px', background: '#fef3c7', color: '#d97706', padding: '2px 8px', borderRadius: '10px', fontSize: '12px' }}>{pendingCount} pending</span>}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={searchBoxStyle}>
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by student or course..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }} />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Enrollment
            </Button>
          </div>
        </div>

        {/* Add Enrollment Modal */}
        {showAddModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '100%', maxWidth: '450px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827', margin: 0 }}>Add Enrollment</h2>
                <button onClick={() => { setShowAddModal(false); setSelectedStudentId(""); setSelectedCourseCode(""); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                  <X size={20} color="#6b7280" />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Student</label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#374151', background: 'white' }}
                  >
                    <option value="">Select a student</option>
                    {students.map(s => (
                      <option key={s.studentId} value={s.studentId}>{s.name} ({s.studentId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '6px' }}>Course</label>
                  <select
                    value={selectedCourseCode}
                    onChange={(e) => setSelectedCourseCode(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', color: '#374151', background: 'white' }}
                  >
                    <option value="">Select a course</option>
                    {courses.map(c => (
                      <option key={c.code} value={c.code}>{c.title} ({c.code}) - {c.creditHours} CH</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <Button variant="secondary" onClick={() => { setShowAddModal(false); setSelectedStudentId(""); setSelectedCourseCode(""); }} style={{ flex: 1 }}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleAddEnrollment} style={{ flex: 1 }}>
                    <Check size={16} /> Add & Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
          <button style={filterBtnStyle(statusFilter === "all")} onClick={() => setStatusFilter("all")}>All</button>
          <button style={filterBtnStyle(statusFilter === "pending")} onClick={() => setStatusFilter("pending")}>Pending</button>
          <button style={filterBtnStyle(statusFilter === "approved")} onClick={() => setStatusFilter("approved")}>Approved</button>
          <button style={filterBtnStyle(statusFilter === "rejected")} onClick={() => setStatusFilter("rejected")}>Rejected</button>
          <button style={filterBtnStyle(statusFilter === "completed")} onClick={() => setStatusFilter("completed")}>Completed</button>
        </div>

        <div style={tableContainerStyle}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 8px' }} />
              <p>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <ClipboardList size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery || statusFilter !== "all" ? "No enrollments match your criteria" : "No enrollment requests yet"}</p>
            </div>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Student</th>
                    <th style={thStyle}>Course</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Status</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: '500', color: '#111827', display: 'block' }}>{getStudentName(enrollment.studentId)}</span>
                          <span style={{ fontSize: '12px', color: '#6b7280' }}>{enrollment.studentId}</span>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <span style={{ fontWeight: '500', color: '#111827', display: 'block' }}>{getCourseName(enrollment.courseCode)}</span>
                          <span style={{ fontSize: '12px', color: '#4f46e5' }}>{enrollment.courseCode}</span>
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}>{getStatusBadge(enrollment.status)}</td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        {enrollment.status === "pending" && (
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <Button variant="primary" size="sm" onClick={() => handleUpdateStatus(enrollment, "approved")}>
                              <Check size={14} /> Approve
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(enrollment, "rejected")}>
                              <X size={14} /> Reject
                            </Button>
                          </div>
                        )}
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
    </div>
  );
}
