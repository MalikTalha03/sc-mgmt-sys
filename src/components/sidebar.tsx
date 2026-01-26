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
  ChevronRight
} from "lucide-react";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, logout } = useAuth();

  const allMenuItems = [
    { path: "/admin", label: "Dashboard", icon: Home, roles: ["admin"] },
    { path: "/courses", label: "Courses", icon: BookOpen, roles: ["admin"] },
    { path: "/departments", label: "Departments", icon: Building2, roles: ["admin"] },
    { path: "/student", label: "My Portal", icon: GraduationCap, roles: ["student"] },
    { path: "/teacher", label: "My Portal", icon: UserCircle, roles: ["teacher"] },
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
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: isOpen ? '260px' : '72px',
        background: 'white',
        borderRight: '1px solid #e5e7eb',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        zIndex: 50
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 16px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        {isOpen && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              background: '#4f46e5',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <GraduationCap size={20} color="white" />
            </div>
            <span style={{ fontWeight: '700', fontSize: '18px', color: '#1f2937' }}>
              School SMS
            </span>
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f3f4f6',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            color: '#6b7280'
          }}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      {/* User Info */}
      {userData && isOpen && (
        <div style={{
          padding: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>
            Logged in as
          </p>
          <p style={{ 
            fontWeight: '600', 
            color: '#1f2937',
            fontSize: '14px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {userData.email}
          </p>
          <span style={{
            display: 'inline-block',
            marginTop: '8px',
            padding: '4px 10px',
            background: '#eef2ff',
            color: '#4f46e5',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {userData.role}
          </span>
        </div>
      )}

      {/* Menu Items */}
      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                marginBottom: '4px',
                borderRadius: '10px',
                textDecoration: 'none',
                background: active ? '#4f46e5' : 'transparent',
                color: active ? 'white' : '#4b5563',
                fontWeight: active ? '600' : '500',
                fontSize: '14px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  e.currentTarget.style.background = '#f3f4f6';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              <Icon size={20} />
              {isOpen && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div style={{
        padding: '16px 12px',
        borderTop: '1px solid #e5e7eb'
      }}>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            width: '100%',
            padding: '12px 14px',
            background: 'transparent',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            color: '#6b7280',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#fef2f2';
            e.currentTarget.style.color = '#dc2626';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#6b7280';
          }}
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
}
