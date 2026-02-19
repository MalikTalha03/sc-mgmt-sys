import { useState, useEffect } from "react";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import { departmentService, type Department } from "../services";
import { 
  Building2, 
  GraduationCap, 
  Users, 
  BookOpen, 
  Trash2, 
  Loader2,
  Plus,
  Edit
} from "lucide-react";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await departmentService.getAll();
      setDepartments(data);
    } catch (err: any) {
      console.error("Error loading departments:", err);
      setError(err.message || "Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}? This cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(id);
      await departmentService.delete(id);
      setDepartments(departments.filter(dept => dept.id !== id));
      // You can add a toast notification here: toast.success('Department deleted!');
    } catch (err: any) {
      console.error("Error deleting department:", err);
      alert(err.message || "Failed to delete department. It may have associated courses, teachers, or students.");
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto text-indigo-600 mb-4" />
          <p className="text-gray-600">Loading departments...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <h2 className="text-red-800 font-semibold text-lg mb-2">Error Loading Departments</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadDepartments} className="bg-red-600 hover:bg-red-700">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Building2 className="w-8 h-8 text-indigo-600" />
              Departments
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your school departments and view statistics
            </p>
          </div>
          <Button className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2">
            <Plus size={20} />
            Add Department
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">Total Departments</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{departments.length}</p>
              </div>
              <Building2 className="w-12 h-12 text-blue-600 opacity-50" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">Total Students</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {departments.reduce((sum, dept) => sum + (dept.students_count || 0), 0)}
                </p>
              </div>
              <GraduationCap className="w-12 h-12 text-green-600 opacity-50" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">Total Teachers</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {departments.reduce((sum, dept) => sum + (dept.teachers_count || 0), 0)}
                </p>
              </div>
              <Users className="w-12 h-12 text-purple-600 opacity-50" />
            </div>
          </div>
        </Card>
      </div>

      {/* Departments Grid */}
      {departments.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Departments Found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first department</p>
          <Button className="bg-indigo-600 hover:bg-indigo-700">
            <Plus size={20} className="mr-2" />
            Add Department
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card 
              key={dept.id} 
              className="hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{dept.name}</h3>
                    <p className="text-indigo-100 text-sm mt-1">Code: {dept.code.toUpperCase()}</p>
                  </div>
                  <Building2 size={32} className="opacity-80" />
                </div>
              </CardHeader>

              <div className="p-6 space-y-4">
                {/* Statistics */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <BookOpen className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-900">{dept.courses_count || 0}</p>
                    <p className="text-xs text-blue-600 font-medium">Courses</p>
                  </div>

                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <GraduationCap className="w-5 h-5 text-green-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-green-900">{dept.students_count || 0}</p>
                    <p className="text-xs text-green-600 font-medium">Students</p>
                  </div>

                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-900">{dept.teachers_count || 0}</p>
                    <p className="text-xs text-purple-600 font-medium">Teachers</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1 text-indigo-600 border-indigo-600 hover:bg-indigo-50"
                  >
                    <Edit size={16} className="mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => handleDelete(dept.id, dept.name)}
                    disabled={actionLoading === dept.id}
                  >
                    {actionLoading === dept.id ? (
                      <Loader2 size={16} className="animate-spin mr-2" />
                    ) : (
                      <Trash2 size={16} className="mr-2" />
                    )}
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
