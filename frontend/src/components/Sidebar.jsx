import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiHome, FiUpload, FiFileText, FiUsers, FiList, FiLogOut, FiShield, FiActivity } from 'react-icons/fi';

const studentLinks = [
  { to: '/dashboard', icon: <FiHome size={18} />, label: 'Dashboard' },
  { to: '/upload', icon: <FiUpload size={18} />, label: 'Upload Document' },
  { to: '/my-documents', icon: <FiFileText size={18} />, label: 'My Documents' },
];

const adminLinks = [
  { to: '/admin', icon: <FiHome size={18} />, label: 'Dashboard' },
  { to: '/admin/documents', icon: <FiFileText size={18} />, label: 'Document Requests' },
  { to: '/admin/students', icon: <FiUsers size={18} />, label: 'Students' },
  { to: '/admin/audit-logs', icon: <FiActivity size={18} />, label: 'Audit Logs' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const links = user?.role === 'admin' ? adminLinks : studentLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🎓</div>
          <div className="sidebar-logo-text">
            <h2>ADSMS</h2>
            <span>Digital Signatures</span>
          </div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="sidebar-avatar">{initials}</div>
        <div className="sidebar-user-info">
          <p>{user?.name}</p>
          <span>{user?.role}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-section-title">
          {user?.role === 'admin' ? 'Administration' : 'Navigation'}
        </p>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/admin' || link.to === '/dashboard'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        {user?.rollNumber && (
          <div style={{ padding: '8px 12px', marginBottom: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            Roll: {user.rollNumber}
          </div>
        )}
        <button className="btn-logout" onClick={handleLogout}>
          <FiLogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
