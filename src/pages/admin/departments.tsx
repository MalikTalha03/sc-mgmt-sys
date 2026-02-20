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

  return (
    <div className="page-bg">
      <div className="page-content">
        <div className="page-header">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle" style={{ margin: '4px 0 0' }}>Manage all departments in the system</p>
          </div>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <div className="search-box-inline">
              <Search size={18} color="#9ca3af" />
              <input type="text" placeholder="Search by name or code..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="search-field" />
            </div>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              <Plus size={18} /> Add Department
            </Button>
          </div>
        </div>

        <div className="table-container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Loader2 size={24} className="loading-spinner" style={{ margin: '0 auto 8px' }} />
              <p>Loading...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
              <Building2 size={40} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
              <p>{searchQuery ? "No departments match your search" : "No departments yet"}</p>
            </div>
          ) : (
            <>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="th">ID</th>
                    <th className="th">Department Name</th>
                    <th className="th th-center">Students</th>
                    <th className="th th-center">Teachers</th>
                    <th className="th th-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginate(filtered).map((dept) => (
                    <tr key={dept.id}>
                      <td className="td"><span style={{ fontWeight: '600', color: '#4f46e5' }}>{dept.id}</span></td>
                      <td className="td"><span style={{ fontWeight: '500', color: '#111827' }}>{dept.name}</span></td>
                      <td className="td td-center"><span className="badge-indigo-sm">{dept.students_count || 0}</span></td>
                      <td className="td td-center"><span className="badge-indigo-sm">{dept.teachers_count || 0}</span></td>
                      <td className="td td-right">
                        <Button variant="danger" size="sm" onClick={() => handleDeleteDepartment(dept.id)}><Trash2 size={14} /></Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length > 0 && (
                <div className="pagination-bar">
                  <span className="pagination-info">
                    {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filtered.length)}-{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
                  </span>
                  <div className="pagination-controls">
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                      <ChevronLeft size={16} />
                    </button>
                    <span className="pagination-label">Page {currentPage} / {totalPages || 1}</span>
                    <button className="pagination-btn" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages}>
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
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div className="modal-header-row">
              <h2 className="page-title" style={{ margin: 0 }}>Add Department</h2>
              <button className="btn-close" onClick={() => setShowAddModal(false)}>
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
