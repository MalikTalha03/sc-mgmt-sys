import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const allMenuItems = [
    { path: "/admin", label: "Admin", icon: "🏠", roles: ["admin"] },
    { path: "/courses", label: "Courses", icon: "📚", roles: ["admin"] },
    { path: "/departments", label: "Departments", icon: "🏢", roles: ["admin"] },
    { path: "/student", label: "Student", icon: "👨‍🎓", roles: ["student"] },
    { path: "/teacher", label: "Teacher", icon: "👨‍🏫", roles: ["teacher"] },
  ];

  // Filter menu items based on user role
  const menuItems = allMenuItems.filter(
    (item) => userData && item.roles.includes(userData.role)
  );

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
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow-xl transition-all duration-300 z-50 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-indigo-500">
        <h1 className={`font-bold text-xl text-white ${!isOpen && "hidden"}`}>
          🎓 School
        </h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-indigo-500 rounded-lg transition text-white"
        >
          {isOpen ? "◀" : "▶"}
        </button>
      </div>

      {/* User Info */}
      {userData && (
        <div className={`p-4 border-b border-indigo-500 ${!isOpen && "hidden"}`}>
          <p className="text-sm text-indigo-200">Logged in as</p>
          <p className="font-semibold truncate">{userData.email}</p>
          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-500 rounded text-xs uppercase">
            {userData.role}
          </span>
        </div>
      )}

      {/* Menu Items */}
      <nav className="mt-4 flex-1">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-lg transition-all duration-200 ${
              isActive(item.path)
                ? "bg-white text-indigo-600 shadow-lg"
                : "text-indigo-100 hover:bg-indigo-500 hover:text-white"
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className={`font-semibold whitespace-nowrap ${!isOpen && "hidden"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-indigo-500">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-4 w-full px-4 py-3 rounded-lg text-indigo-100 hover:bg-red-500 hover:text-white transition-all duration-200 ${
            !isOpen && "justify-center"
          }`}
        >
          <span className="text-xl">🚪</span>
          <span className={`font-semibold whitespace-nowrap ${!isOpen && "hidden"}`}>
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
