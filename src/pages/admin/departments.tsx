import { useState, useEffect } from "react";
import { Button } from "../../components/button";
import { DepartmentForm } from "../../components/departmentForm";
import {
  Building2,
  Trash2,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react";
import { departmentService, type Department } from "../../services/department.service";

const ITEMS_PER_PAGE = 10;

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const deptsData = await departmentService.getAll();
      setDepartments(deptsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterDepartments = () => {
    if (!searchQuery) return departments;
    const query = searchQuery.toLowerCase();
    return departments.filter(d =>
      d.name.toLowerCase().includes(query) ||
      d.id.toString().includes(query)
    );
  };

  const paginate = <T,>(items: T[]): T[] => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return items.slice(start, start + ITEMS_PER_PAGE);
  };

  const getTotalPages = (total: number) => Math.ceil(total / ITEMS_PER_PAGE);

  const handleCreateDepartment = async (data: any) => {
    try {
      await departmentService.create({
        name: data.name,
        code: data.code,
      });
      setShowAddModal(false);
      loadData();
    } catch (error) {
      alert("Failed to create department");
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    if (!confirm("Delete this department? This will affect associated courses and users.")) return;
    try {
      await departmentService.delete(id);
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to delete department");
    }
  };

  const filtered = filterDepartments();
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

  const badgeStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '4px 10px',
    background: isActive ? '#ecfdf5' : '#fef2f2',
    color: isActive ? '#059669' : '#dc2626',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
  });

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>Departments</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: '4px 0 0' }}>Manage all departments in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div style={searchBoxStyle}>
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', fontSize: '14px', color: '#374151', background: 'transparent' }} />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Department
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
              <Building2 size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No departments match your search" : "No departments yet"}</p>
            </div>
          ) : (
            <>
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>ID</th>
                    <th style={thStyle}>Department Name</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Students</th>
                    <th style={{ ...thStyle, textAlign: 'center' }}>Teachers</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((dept) => (
                    <tr key={dept.id}>
                      <td style={tdStyle}><span style={{ fontWeight: '600', color: '#4f46e5' }}>{dept.id}</span></td>
                      <td style={tdStyle}><span style={{ fontWeight: '500', color: '#111827' }}>{dept.name}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><span style={badgeStyle(true)}>{dept.students_count || 0}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'center' }}><span style={badgeStyle(true)}>{dept.teachers_count || 0}</span></td>
                      <td style={{ ...tdStyle, textAlign: 'right' }}>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteDepartment(dept.id)}><Trash2 size={14} /></Button>
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
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Add Department</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <DepartmentForm onSubmit={handleCreateDepartment} />
          </div>
        </div>
      )}
    </div>
  );
}
