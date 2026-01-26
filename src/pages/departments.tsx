import { useState, useEffect } from "react";
import { DepartmentForm } from "../components/departmentForm";
import { Card, CardHeader } from "../components/card";
import { Button } from "../components/button";
import {
  getAllDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  toggleDepartmentStatus,
} from "../firebase";
import type { Department } from "../models/department";
import { getAllStudents } from "../firebase/studentService";
import { getAllTeachers } from "../firebase/teacherService";
import { getAllCourses } from "../firebase/courseService";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Record<string, { students: number; teachers: number; courses: number }>>({});

  useEffect(() => {
    loadDepartments();
  }, []);

  // Load stats whenever departments change
  useEffect(() => {
    if (departments.length > 0) {
      loadStats();
    }
  }, [departments]);

  const loadDepartments = async () => {
    try {
      setLoading(true);
      const data = await getAllDepartments();
      setDepartments(data);
    } catch (error) {
      console.error("Error loading departments:", error);
      alert("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const [students, teachers, courses] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
        getAllCourses(),
      ]);

      const statsMap: Record<string, { students: number; teachers: number; courses: number }> = {};
      
      departments.forEach(dept => {
        statsMap[dept.code] = {
          students: students.filter(s => s.departmentCode === dept.code).length,
          teachers: teachers.filter(t => t.departmentCode === dept.code).length,
          courses: courses.filter(c => c.departmentCode === dept.code).length,
        };
      });

      setStats(statsMap);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleCreateDepartment = async (data: { code: string; name: string; isActive: boolean }) => {
    try {
      await createDepartment(data);
      alert("Department created successfully!");
      loadDepartments();
      loadStats();
    } catch (error) {
      console.error("Error creating department:", error);
      alert("Failed to create department");
    }
  };

  const handleDeleteDepartment = async (code: string) => {
    if (!confirm(`Are you sure you want to delete department ${code}?`)) return;

    try {
      await deleteDepartment(code);
      alert("Department deleted successfully!");
      loadDepartments();
      loadStats();
    } catch (error) {
      console.error("Error deleting department:", error);
      alert("Failed to delete department");
    }
  };

  const handleToggleStatus = async (code: string) => {
    try {
      await toggleDepartmentStatus(code);
      alert("Department status updated!");
      loadDepartments();
    } catch (error) {
      console.error("Error toggling status:", error);
      alert("Failed to update status");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Departments Management</h1>
          <p className="text-gray-600">Manage all academic departments and their resources</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DepartmentForm onSubmit={handleCreateDepartment} />
          </div>

          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="p-2">All Departments</CardHeader>
              <div className="p-6 space-y-4">
                {loading ? (
                  <p className="text-center text-gray-500 py-8">Loading departments...</p>
                ) : departments.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No departments found</p>
                ) : (
                  departments.map((dept) => (
                    <div key={dept.code} className="p-6 bg-gradient-to-r from-gray-50 to-indigo-50 rounded-xl border border-gray-200 hover:border-indigo-300 transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">{dept.name}</h3>
                          <p className="text-sm text-gray-600">Code: {dept.code}</p>
                        </div>
                        <span>
                          {dept.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-blue-600">{stats[dept.code]?.students || 0}</p>
                          <p className="text-xs text-gray-600 mt-1">Students</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-green-600">{stats[dept.code]?.teachers || 0}</p>
                          <p className="text-xs text-gray-600 mt-1">Teachers</p>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <p className="text-2xl font-bold text-purple-600">{stats[dept.code]?.courses || 0}</p>
                          <p className="text-xs text-gray-600 mt-1">Courses</p>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="secondary" size="sm" onClick={() => handleToggleStatus(dept.code)}>
                          {dept.isActive ? "Deactivate" : "Activate"}
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => handleDeleteDepartment(dept.code)}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
