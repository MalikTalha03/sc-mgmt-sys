import { useState, useEffect } from "react";
import { enrollmentService, type Enrollment } from "../../services/enrollment.service";
import { studentService, type Student } from "../../services/student.service";
import { courseService, type Course } from "../../services/course.service";
import {
  ClipboardList,
  Loader2,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Award,
  Ban
} from "lucide-react";

export default function AdminEnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"pending" | "approved">("pending");
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [enrollmentsData, studentsData, coursesData] = await Promise.all([
        enrollmentService.getAll(),
        studentService.getAll(),
        courseService.getAll(),
      ]);
      setEnrollments(enrollmentsData);
      setStudents(studentsData);
      setCourses(coursesData);
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const pendingEnrollments = enrollments.filter(e => e.status === 'pending');
  const approvedEnrollments = enrollments.filter(e => ['approved', 'completed', 'dropped', 'withdrawn', 'rejected'].includes(e.status));

  const filterEnrollments = (list: Enrollment[]) => {
    if (!searchQuery) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(e => {
      return (
        e.id.toString().includes(query) ||
        e.student?.user?.email?.toLowerCase().includes(query) ||
        e.student?.user?.name?.toLowerCase().includes(query) ||
        e.course?.title?.toLowerCase().includes(query)
      );
    });
  };

  const handleApprove = async (id: number) => {
    try {
      await enrollmentService.approve(id);
      alert("Enrollment approved!");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to approve enrollment");
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm("Are you sure you want to reject this enrollment request?")) return;
    try {
      await enrollmentService.reject(id);
      alert("Enrollment rejected");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to reject enrollment");
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await enrollmentService.complete(id);
      alert("Enrollment marked as completed!");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to complete enrollment");
    }
  };

  const handleDrop = async (id: number) => {
    if (!confirm("Are you sure you want to drop this student from the course?")) return;
    try {
      await enrollmentService.drop(id);
      alert("Student dropped from course");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to drop enrollment");
    }
  };



  const handleCreateEnrollment = async () => {
    if (!selectedStudent || !selectedCourse) {
      alert("Please select both student and course");
      return;
    }

    try {
      await enrollmentService.create({
        student_id: parseInt(selectedStudent),
        course_id: parseInt(selectedCourse),
        status: 'approved' // Admin creates approved enrollments
      });
      alert("Enrollment created successfully!");
      setShowAddModal(false);
      setSelectedStudent("");
      setSelectedCourse("");
      setStudentSearch("");
      setCourseSearch("");
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to create enrollment");
    }
  };

  // Filter students based on search
  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true;
    const search = studentSearch.toLowerCase();
    return (
      s.user?.name?.toLowerCase().includes(search) ||
      s.user?.email?.toLowerCase().includes(search) ||
      s.id.toString().includes(search)
    );
  });

  // Filter courses: only show courses the selected student is NOT enrolled in
  const availableCourses = courses.filter(c => {
    if (!selectedStudent) return false;
    
    // Check if student is already enrolled in this course
    const isEnrolled = enrollments.some(
      e => e.student_id === parseInt(selectedStudent) && 
           e.course_id === c.id &&
           ['pending', 'approved', 'completed'].includes(e.status)
    );
    
    if (isEnrolled) return false;
    
    // Apply search filter
    if (courseSearch) {
      const search = courseSearch.toLowerCase();
      return (
        c.title?.toLowerCase().includes(search) ||
        c.id.toString().includes(search) ||
        c.department?.name?.toLowerCase().includes(search)
      );
    }
    
    return true;
  });

  const getStatusStyle = (status: string): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '12px',
      fontWeight: '500'
    };

    switch (status) {
      case 'pending':
        return { ...baseStyle, background: '#fef3c7', color: '#92400e' };
      case 'approved':
        return { ...baseStyle, background: '#dbeafe', color: '#1e40af' };
      case 'rejected':
        return { ...baseStyle, background: '#fee2e2', color: '#991b1b' };
      case 'completed':
        return { ...baseStyle, background: '#dcfce7', color: '#15803d' };
      case 'dropped':
        return { ...baseStyle, background: '#f3f4f6', color: '#374151' };
      case 'withdrawn':
        return { ...baseStyle, background: '#fce7f3', color: '#9f1239' };
      default:
        return { ...baseStyle, background: '#f3f4f6', color: '#374151' };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock size={14} />;
      case 'approved': return <CheckCircle size={14} />;
      case 'rejected': return <XCircle size={14} />;
      case 'completed': return <Award size={14} />;
      case 'dropped': return <Ban size={14} />;
      case 'withdrawn': return <XCircle size={14} />;
      default: return null;
    }
  };

  // Inline styles
  const containerStyle: React.CSSProperties = { minHeight: '100vh', background: '#f3f4f6', padding: '24px' };
  const cardStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px', marginBottom: '20px' };
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '12px 24px',
    border: 'none',
    background: active ? '#3b82f6' : '#e5e7eb',
    color: active ? 'white' : '#6b7280',
    fontWeight: '600',
    cursor: 'pointer',
    borderRadius: '8px',
    fontSize: '14px',
    transition: 'all 0.2s'
  });
  const searchBoxStyle: React.CSSProperties = { position: 'relative', flex: '1', minWidth: '250px' };
  const inputStyle: React.CSSProperties = { width: '100%', padding: '10px 10px 10px 40px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px' };
  const tableContainerStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' };
  const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' };
  const thStyle: React.CSSProperties = { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', background: '#f9fafb', borderBottom: '1px solid #e5e7eb' };
  const tdStyle: React.CSSProperties = { padding: '16px 20px', fontSize: '14px', color: '#374151', borderBottom: '1px solid #f3f4f6' };
  const buttonStyle: React.CSSProperties = { padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '500', cursor: 'pointer', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' };
  const modalStyle: React.CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 };
  const modalContentStyle: React.CSSProperties = { background: 'white', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '500px' };

  const filteredPending = filterEnrollments(pendingEnrollments);
  const filteredApproved = filterEnrollments(approvedEnrollments);

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh' }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px', color: '#3b82f6' }} />
            <p style={{ color: '#6b7280', margin: 0 }}>Loading enrollments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClipboardList size={32} color="#3b82f6" />
                Enrollment Manager
              </h1>
              <p style={{ color: '#6b7280', fontSize: '14px', margin: '8px 0 0' }}>
                {pendingEnrollments.length} pending • {approvedEnrollments.length} processed
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              style={{ ...buttonStyle, background: '#3b82f6', color: 'white', padding: '10px 20px' }}
            >
              <Plus size={16} />
              Create Enrollment
            </button>
          </div>
        </div>

        {/* Tabs and Search */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button onClick={() => setActiveTab("pending")} style={tabStyle(activeTab === "pending")}>
              Pending Requests ({pendingEnrollments.length})
            </button>
            <button onClick={() => setActiveTab("approved")} style={tabStyle(activeTab === "approved")}>
              All Enrollments ({approvedEnrollments.length})
            </button>
          </div>

          <div style={searchBoxStyle}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={18} />
            <input
              type="text"
              placeholder="Search by student, course, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={inputStyle}
            />
          </div>
        </div>

        {/* Pending Requests Table */}
        {activeTab === "pending" && (
          <div style={tableContainerStyle}>
            {filteredPending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px' }}>No pending requests</p>
                <p style={{ fontSize: '14px', margin: 0 }}>Students haven't submitted any enrollment requests yet</p>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Student</th>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: '#3b82f6' }}>{enrollment.id}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {enrollment.student?.user?.name || enrollment.student?.user?.email || `Student #${enrollment.student_id}`}
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                            {enrollment.student?.department?.name || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {enrollment.course?.title || `Course #${enrollment.course_id}`}
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                            {enrollment.course?.credit_hours} credit hours
                          </p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={getStatusStyle(enrollment.status)}>
                          {getStatusIcon(enrollment.status)}
                          {enrollment.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() => handleApprove(enrollment.id)}
                            style={{ ...buttonStyle, background: '#dcfce7', color: '#15803d' }}
                            title="Approve enrollment"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(enrollment.id)}
                            style={{ ...buttonStyle, background: '#fee2e2', color: '#991b1b' }}
                            title="Reject request"
                          >
                            <XCircle size={14} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Approved/All Enrollments Table */}
        {activeTab === "approved" && (
          <div style={tableContainerStyle}>
            {filteredApproved.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p style={{ fontSize: '16px', fontWeight: '500', margin: '0 0 8px' }}>No enrollments found</p>
              </div>
            ) : (
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Student</th>
                    <th style={thStyle}>Course</th>
                    <th style={thStyle}>Status</th>
                    <th style={thStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td style={tdStyle}>
                        <span style={{ fontWeight: '600', color: '#3b82f6' }}>#{enrollment.id}</span>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {enrollment.student?.user?.name || enrollment.student?.user?.email || `Student #${enrollment.student_id}`}
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                            {enrollment.student?.department?.name || 'N/A'}
                          </p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <div>
                          <div style={{ fontWeight: '500', color: '#111827' }}>
                            {enrollment.course?.title || `Course #${enrollment.course_id}`}
                          </div>
                          <p style={{ fontSize: '12px', color: '#6b7280', margin: '4px 0 0' }}>
                            {enrollment.course?.credit_hours} credit hours
                          </p>
                        </div>
                      </td>
                      <td style={tdStyle}>
                        <span style={getStatusStyle(enrollment.status)}>
                          {getStatusIcon(enrollment.status)}
                          {enrollment.status}
                        </span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {enrollment.status === 'approved' && (
                            <>
                              <button
                                onClick={() => handleComplete(enrollment.id)}
                                style={{ ...buttonStyle, background: '#dcfce7', color: '#15803d' }}
                                title="Mark as completed"
                              >
                                <Award size={14} />
                              </button>
                              <button
                                onClick={() => handleDrop(enrollment.id)}
                                style={{ ...buttonStyle, background: '#f3f4f6', color: '#374151' }}
                                title="Drop student"
                              >
                                <Ban size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Create Enrollment Modal */}
        {showAddModal && (
          <div style={modalStyle} onClick={() => setShowAddModal(false)}>
            <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', margin: '0 0 20px' }}>
               Create Enrollment
              </h2>
              
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Student <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search student by name, email, or ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '8px' }}
                />
                <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                  {filteredStudents.length === 0 ? (
                    <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                      No students found
                    </div>
                  ) : (
                    filteredStudents.slice(0, 50).map(s => (
                      <div
                        key={s.id}
                        onClick={() => {
                          setSelectedStudent(s.id.toString());
                          setSelectedCourse(""); // Reset course when student changes
                        }}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          background: selectedStudent === s.id.toString() ? '#eff6ff' : 'white',
                          borderBottom: '1px solid #f3f4f6',
                          transition: 'all 0.15s'
                        }}
                        onMouseEnter={(e) => {
                          if (selectedStudent !== s.id.toString()) {
                            e.currentTarget.style.background = '#f9fafb';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (selectedStudent !== s.id.toString()) {
                            e.currentTarget.style.background = 'white';
                          }
                        }}
                      >
                        <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                          {s.user?.name || s.user?.email || `Student #${s.id}`}
                        </div>
                        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                          {s.user?.email} • {s.department?.name || 'N/A'} • Semester {s.semester}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                  Course <span style={{ color: '#ef4444' }}>*</span>
                  {!selectedStudent && <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: 'normal' }}> (Select student first)</span>}
                </label>
                {selectedStudent ? (
                  <>
                    <input
                      type="text"
                      placeholder="Search course by title, department, or ID..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      style={{ width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', marginBottom: '8px' }}
                    />
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '6px' }}>
                      {availableCourses.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '14px' }}>
                          {courseSearch ? 'No courses found' : 'Student is already enrolled in all available courses'}
                        </div>
                      ) : (
                        availableCourses.slice(0, 50).map(c => (
                          <div
                            key={c.id}
                            onClick={() => setSelectedCourse(c.id.toString())}
                            style={{
                              padding: '12px',
                              cursor: 'pointer',
                              background: selectedCourse === c.id.toString() ? '#eff6ff' : 'white',
                              borderBottom: '1px solid #f3f4f6',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              if (selectedCourse !== c.id.toString()) {
                                e.currentTarget.style.background = '#f9fafb';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (selectedCourse !== c.id.toString()) {
                                e.currentTarget.style.background = 'white';
                              }
                            }}
                          >
                            <div style={{ fontWeight: '500', color: '#111827', fontSize: '14px' }}>
                              {c.title}
                            </div>
                            <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                              {c.department?.name || 'N/A'} • {c.credit_hours} credits • {c.teacher?.user?.name || 'No teacher'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div style={{ padding: '40px 20px', textAlign: 'center', background: '#f9fafb', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                    <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>Please select a student first</p>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStudent("");
                    setSelectedCourse("");
                    setStudentSearch("");
                    setCourseSearch("");
                  }}
                  style={{ ...buttonStyle, background: '#e5e7eb', color: '#374151', padding: '10px 20px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEnrollment}
                  disabled={!selectedStudent || !selectedCourse}
                  style={{ 
                    ...buttonStyle, 
                    background: (!selectedStudent || !selectedCourse) ? '#d1d5db' : '#3b82f6', 
                    color: 'white', 
                    padding: '10px 20px',
                    cursor: (!selectedStudent || !selectedCourse) ? 'not-allowed' : 'pointer',
                    opacity: (!selectedStudent || !selectedCourse) ? 0.6 : 1
                  }}
                >
                  Create Enrollment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
