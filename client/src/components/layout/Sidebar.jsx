import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import {
  FiGrid,
  FiUsers,
  FiCalendar,
  FiFileText,
  FiAward,
  FiBell,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiFolder,
  FiCheckSquare,
  FiUser,
  FiLayers,
  FiX,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const role = user?.role || 'EMPLOYEE';

  const getNavLinks = () => {
    if (role === 'HR') {
      return [
        { to: '/hr/dashboard', label: 'HR Dashboard', icon: <FiGrid /> },
        { to: '/hr/employees', label: 'Employees', icon: <FiUsers /> },
        { to: '/hr/departments', label: 'Departments', icon: <FiLayers /> },
        { to: '/hr/attendance', label: 'Attendance', icon: <FiCalendar /> },
        { to: '/hr/leaves', label: 'Leave Requests', icon: <FiCheckSquare /> },
        { to: '/hr/trainings', label: 'Training Programs', icon: <FiAward /> },
        { to: '/hr/announcements', label: 'Announcements', icon: <FiFileText /> },
        { to: '/hr/reports', label: 'Reports & Analytics', icon: <FiBarChart2 /> },
      ];
    } else if (role === 'MANAGER') {
      return [
        { to: '/manager/dashboard', label: 'Manager Dashboard', icon: <FiGrid /> },
        { to: '/manager/team', label: 'Team Members', icon: <FiUsers /> },
        { to: '/manager/attendance', label: 'Team Attendance', icon: <FiCalendar /> },
        { to: '/manager/leaves', label: 'Leave Approvals', icon: <FiCheckSquare /> },
        { to: '/manager/trainings', label: 'Training Sessions', icon: <FiAward /> },
        { to: '/announcements', label: 'Announcements', icon: <FiFileText /> },
      ];
    } else {
      // EMPLOYEE
      return [
        { to: '/employee/dashboard', label: 'My Dashboard', icon: <FiGrid /> },
        { to: '/employee/attendance', label: 'My Attendance', icon: <FiCalendar /> },
        { to: '/employee/leaves', label: 'Leave Requests', icon: <FiCheckSquare /> },
        { to: '/employee/trainings', label: 'Training & Skills', icon: <FiAward /> },
        { to: '/announcements', label: 'Announcements', icon: <FiFileText /> },
        { to: '/employee/profile', label: 'My Profile', icon: <FiUser /> },
      ];
    }
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="d-lg-none position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-50"
          style={{ zIndex: 999 }}
          onClick={onClose}
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Logo Header */}
        <div className="d-flex align-items-center justify-content-between px-4 py-3 border-bottom">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}
            >
              <FiFolder size={20} />
            </div>
            <div>
              <h5 className="mb-0 fw-bold tracking-tight text-dark" style={{ letterSpacing: '-0.5px' }}>
                Staff<span style={{ color: '#4f46e5' }}>Sync</span>
              </h5>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>HR MANAGEMENT</small>
            </div>
          </div>
          <button
            className="btn btn-sm btn-light d-lg-none p-1 text-muted"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation Section */}
        <div className="px-3 py-3 flex-grow-1 overflow-auto">
          <div className="text-uppercase text-muted fw-bold px-3 mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
            Main Menu
          </div>
          {navLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onClose && onClose()}
              className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
            >
              <span className="fs-5 d-flex align-items-center">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}

          <div className="text-uppercase text-muted fw-bold px-3 mt-4 mb-2" style={{ fontSize: '0.68rem', letterSpacing: '0.08em' }}>
            Preferences
          </div>
          <NavLink
            to="/notifications"
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <span className="fs-5 d-flex align-items-center"><FiBell /></span>
            <span>Notifications</span>
          </NavLink>
          <NavLink
            to="/settings"
            onClick={() => onClose && onClose()}
            className={({ isActive }) => `nav-link-custom ${isActive ? 'active' : ''}`}
          >
            <span className="fs-5 d-flex align-items-center"><FiSettings /></span>
            <span>Settings</span>
          </NavLink>
        </div>

        {/* User Card & Logout Footer */}
        <div className="p-3 border-top bg-light bg-opacity-50">
          <div className="d-flex align-items-center gap-3 mb-2 px-1">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: '38px',
                height: '38px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                fontSize: '0.9rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden flex-grow-1">
              <div className="fw-semibold text-truncate text-dark" style={{ fontSize: '0.875rem' }}>
                {user?.name || 'StaffSync User'}
              </div>
              <span className={`badge rounded-pill ${role === 'HR' ? 'badge-role-hr' : role === 'MANAGER' ? 'badge-role-manager' : 'badge-role-employee'}`} style={{ fontSize: '0.65rem' }}>
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-outline-danger btn-sm w-100 d-flex align-items-center justify-content-center gap-2 mt-2 py-1.5"
            style={{ borderRadius: '8px' }}
          >
            <FiLogOut size={15} />
            <span style={{ fontSize: '0.825rem', fontWeight: '500' }}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
