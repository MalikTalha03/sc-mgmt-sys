import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home,
  BookOpen,
  Building2,
  GraduationCap,
  UserCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Users,
  ClipboardList,
  Lock
} from "lucide-react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  // All menu items with their access roles
  const allMenuItems = [
    { path: "/admin", label: "Dashboard", icon: Home, roles: ["admin"] },
    { path: "/admin/students", label: "Students", icon: GraduationCap, roles: ["admin"] },
    { path: "/admin/teachers", label: "Teachers", icon: Users, roles: ["admin"] },
    { path: "/admin/courses", label: "Courses", icon: BookOpen, roles: ["admin"] },
    { path: "/admin/departments", label: "Departments", icon: Building2, roles: ["admin"] },
    { path: "/admin/enrollments", label: "Enrollments", icon: ClipboardList, roles: ["admin"] },
    { path: "/student", label: "My Portal", icon: GraduationCap, roles: ["student"] },
    { path: "/teacher", label: "My Portal", icon: UserCircle, roles: ["teacher"] },
  ];

  // Get items relevant to user's context (admin sees admin items, student sees student items, etc.)
  const getContextMenuItems = () => {
    if (!userData) return [];
    
    if (userData.role === "admin") {
      return allMenuItems.filter(item => item.roles.includes("admin"));
    } else if (userData.role === "student") {
      // Student sees their portal + disabled admin items
      const studentItems = allMenuItems.filter(item => item.roles.includes("student"));
      const adminItems = allMenuItems.filter(item => item.roles.includes("admin"));
      return [...studentItems, ...adminItems];
    } else if (userData.role === "teacher") {
      // Teacher sees their portal + disabled admin items
      const teacherItems = allMenuItems.filter(item => item.roles.includes("teacher"));
      const adminItems = allMenuItems.filter(item => item.roles.includes("admin"));
      return [...teacherItems, ...adminItems];
    }
    return [];
  };

  const menuItems = getContextMenuItems();

  const hasAccess = (item: typeof allMenuItems[0]) => {
    return userData && item.roles.includes(userData.role);
  };

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div
      className="sidebar-container"
      style={{ width: isOpen ? '260px' : '72px', transition: 'width 0.3s ease' }}
    >
      {/* Header */}
      <div className="sidebar-header flex-between">
        {isOpen && (
          <div className="sidebar-logo">
            <div className="sidebar-logo-box">
              <GraduationCap size={20} color="white" />
            </div>
            <span className="sidebar-logo-text">School SMS</span>
          </div>
        )}
        <button className="sidebar-toggle" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* User Info */}
      {userData && isOpen && (
        <div className="sidebar-user-info">
          <p className="sidebar-user-role">Logged in as</p>
          <p className="sidebar-user-email">{userData.email}</p>
          <span className={`sidebar-role-badge sidebar-role-${userData.role}`}>
            {userData.role}
          </span>
        </div>
      )}

      {/* Menu Items */}
      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          const accessible = hasAccess(item);

          if (!accessible) {
            return (
              <div
                key={item.path}
                className="sidebar-nav-disabled"
                title={`${item.label} - Admin access required`}
              >
                <Icon size={20} />
                {isOpen && (
                  <>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    <Lock size={14} />
                  </>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-link${active ? ' active' : ''}`}
            >
              <Icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
