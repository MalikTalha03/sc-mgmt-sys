import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();

  const menuItems = [
    { path: "/admin", label: "Admin" },
    { path: "/courses", label: "Courses" },
    { path: "/departments", label: "Departments" },
    { path: "/student", label: "Student" },
    { path: "/teacher", label: "Teacher" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-indigo-600 to-indigo-800 text-white shadow-xl transition-all duration-300 z-50 ${
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

      {/* Menu Items */}
      <nav className="mt-8">
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
            <span className={`font-semibold whitespace-nowrap ${!isOpen && "hidden"}`}>
              {item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
