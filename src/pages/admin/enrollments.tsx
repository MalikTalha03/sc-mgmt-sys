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

  const filteredPending = filterEnrollments(pendingEnrollments);
  const filteredApproved = filterEnrollments(approvedEnrollments);

  if (loading) {
    return (
      <div className="page-bg loading-page">
        <div className="loading-center">
          <div className="loading-content">
            <Loader2 size={40} className="loading-spinner-purple" />
            <p className="text-muted">Loading enrollments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-bg">
      <div className="page-content">
        {/* Header */}
        <div className="card card-p24">
          <div className="card-header-row">
            <div>
              <h1 className="page-title-lg" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <ClipboardList size={32} color="#3b82f6" />
                Enrollment Manager
              </h1>
              <p className="page-subtitle">
                {pendingEnrollments.length} pending • {approvedEnrollments.length} processed
              </p>
            </div>
            <button className="btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Create Enrollment
            </button>
          </div>
        </div>

        {/* Tabs and Search */}
        <div className="card card-p24">
          <div className="flex-between" style={{ justifyContent: 'flex-start', gap: '12px', marginBottom: '16px' }}>
            <button
              className={`tab-btn${activeTab === "pending" ? " tab-active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              Pending Requests ({pendingEnrollments.length})
            </button>
            <button
              className={`tab-btn${activeTab === "approved" ? " tab-active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              All Enrollments ({approvedEnrollments.length})
            </button>
          </div>

          <div className="search-relative">
            <Search className="search-icon-abs" size={18} />
            <input
              type="text"
              placeholder="Search by student, course, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input-icon"
            />
          </div>
        </div>

        {/* Pending Requests Table */}
        {activeTab === "pending" && (
          <div className="table-container">
            {filteredPending.length === 0 ? (
              <div className="select-placeholder-box">
                <Clock size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p className="font-semibold" style={{ fontSize: '16px', margin: '0 0 8px' }}>No pending requests</p>
                <p className="text-sm text-muted" style={{ margin: 0 }}>Students haven't submitted any enrollment requests yet</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Student</th>
                    <th className="th">Course</th>
                    <th className="th">Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPending.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="td">
                        <span className="font-semibold" style={{ color: '#3b82f6' }}>{enrollment.id}</span>
                      </td>
                      <td className="td">
                        <div className="font-semibold">
                          {enrollment.student?.user?.name || enrollment.student?.user?.email || `Student #${enrollment.student_id}`}
                        </div>
                        <div className="text-sm text-muted">
                          {enrollment.student?.department?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="td">
                        <div className="font-semibold">
                          {enrollment.course?.title || `Course #${enrollment.course_id}`}
                        </div>
                        <div className="text-sm text-muted">
                          {enrollment.course?.credit_hours} credit hours
                        </div>
                      </td>
                      <td className="td">
                        <span className={`status-badge-${enrollment.status}`}>
                          {getStatusIcon(enrollment.status)}
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="action-btn action-btn-approve"
                            onClick={() => handleApprove(enrollment.id)}
                            title="Approve enrollment"
                          >
                            <CheckCircle size={14} />
                            Approve
                          </button>
                          <button
                            className="action-btn action-btn-reject"
                            onClick={() => handleReject(enrollment.id)}
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
          <div className="table-container">
            {filteredApproved.length === 0 ? (
              <div className="select-placeholder-box">
                <ClipboardList size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p className="font-semibold" style={{ fontSize: '16px', margin: '0 0 8px' }}>No enrollments found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Student</th>
                    <th className="th">Course</th>
                    <th className="th">Status</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApproved.map((enrollment) => (
                    <tr key={enrollment.id}>
                      <td className="td">
                        <span className="font-semibold" style={{ color: '#3b82f6' }}>#{enrollment.id}</span>
                      </td>
                      <td className="td">
                        <div className="font-semibold">
                          {enrollment.student?.user?.name || enrollment.student?.user?.email || `Student #${enrollment.student_id}`}
                        </div>
                        <div className="text-sm text-muted">
                          {enrollment.student?.department?.name || 'N/A'}
                        </div>
                      </td>
                      <td className="td">
                        <div className="font-semibold">
                          {enrollment.course?.title || `Course #${enrollment.course_id}`}
                        </div>
                        <div className="text-sm text-muted">
                          {enrollment.course?.credit_hours} credit hours
                        </div>
                      </td>
                      <td className="td">
                        <span className={`status-badge-${enrollment.status}`}>
                          {getStatusIcon(enrollment.status)}
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="td">
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {enrollment.status === 'approved' && (
                            <>
                              <button
                                className="action-btn action-btn-complete"
                                onClick={() => handleComplete(enrollment.id)}
                                title="Mark as completed"
                              >
                                <Award size={14} />
                              </button>
                              <button
                                className="action-btn action-btn-drop"
                                onClick={() => handleDrop(enrollment.id)}
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
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h2 className="card-title" style={{ margin: '0 0 20px' }}>
                Create Enrollment
              </h2>

              <div className="form-group">
                <label className="form-label">
                  Student <span className="required-star">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Search student by name, email, or ID..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="form-control"
                  style={{ marginBottom: '8px' }}
                />
                <div className="scrollable-select-list">
                  {filteredStudents.length === 0 ? (
                    <div className="select-list-empty">No students found</div>
                  ) : (
                    filteredStudents.slice(0, 50).map(s => (
                      <div
                        key={s.id}
                        className={`select-list-item${selectedStudent === s.id.toString() ? ' selected' : ''}`}
                        onClick={() => {
                          setSelectedStudent(s.id.toString());
                          setSelectedCourse("");
                        }}
                      >
                        <div className="font-semibold text-sm">
                          {s.user?.name || s.user?.email || `Student #${s.id}`}
                        </div>
                        <div className="text-sm text-muted">
                          {s.user?.email} • {s.department?.name || 'N/A'} • Semester {s.semester}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Course <span className="required-star">*</span>
                  {!selectedStudent && <span className="text-sm text-muted" style={{ fontWeight: 'normal' }}> (Select student first)</span>}
                </label>
                {selectedStudent ? (
                  <>
                    <input
                      type="text"
                      placeholder="Search course by title, department, or ID..."
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      className="form-control"
                      style={{ marginBottom: '8px' }}
                    />
                    <div className="scrollable-select-list">
                      {availableCourses.length === 0 ? (
                        <div className="select-list-empty">
                          {courseSearch ? 'No courses found' : 'Student is already enrolled in all available courses'}
                        </div>
                      ) : (
                        availableCourses.slice(0, 50).map(c => (
                          <div
                            key={c.id}
                            className={`select-list-item${selectedCourse === c.id.toString() ? ' selected' : ''}`}
                            onClick={() => setSelectedCourse(c.id.toString())}
                          >
                            <div className="font-semibold text-sm">{c.title}</div>
                            <div className="text-sm text-muted">
                              {c.department?.name || 'N/A'} • {c.credit_hours} credits • {c.teacher?.user?.name || 'No teacher'}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                ) : (
                  <div className="select-placeholder-box">
                    <p className="text-sm text-muted" style={{ margin: 0 }}>Please select a student first</p>
                  </div>
                )}
              </div>

              <div className="form-actions">
                <button
                  className="btn-dark-cancel"
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedStudent("");
                    setSelectedCourse("");
                    setStudentSearch("");
                    setCourseSearch("");
                  }}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleCreateEnrollment}
                  disabled={!selectedStudent || !selectedCourse}
                  style={{ opacity: (!selectedStudent || !selectedCourse) ? 0.6 : 1, cursor: (!selectedStudent || !selectedCourse) ? 'not-allowed' : 'pointer' }}
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
