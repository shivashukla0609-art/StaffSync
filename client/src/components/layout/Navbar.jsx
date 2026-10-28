import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logoutUser } from '../../store/slices/authSlice';
import { FiMenu, FiBell, FiUser, FiSettings, FiLogOut } from 'react-icons/fi';
import api from '../../services/api';

const Navbar = ({ onToggleSidebar }) => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await api.get('/notifications');
        if (res.data?.success) {
          setUnreadCount(res.data.unreadCount || 0);
        }
      } catch (e) {
        // quiet
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // 30s poll
    return () => clearInterval(interval);
  }, []);

  const handleLogout = async () => {
    await dispatch(logoutUser());
    navigate('/login');
  };

  const role = user?.role || 'EMPLOYEE';

  return (
    <header className="app-navbar">
      <div className="d-flex align-items-center gap-3">
        {/* Toggle sidebar button on mobile/tablet */}
        <button
          className="btn btn-sm btn-light d-lg-none p-2 border"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation"
        >
          <FiMenu size={18} />
        </button>

        {/* Page / System Breadcrumb */}
        <div className="d-flex align-items-center gap-2">
          <span className="pulse-online" title="System Online"></span>
          <span className="fw-semibold text-secondary d-none d-sm-inline" style={{ fontSize: '0.85rem' }}>
            StaffSync Workspace
          </span>
          <span className="text-muted d-none d-sm-inline">/</span>
          <span className="fw-bold text-dark" style={{ fontSize: '0.9rem' }}>
            {role === 'HR' ? 'HR Portal' : role === 'MANAGER' ? 'Manager Portal' : 'Employee Portal'}
          </span>
        </div>
      </div>

      {/* Right controls: Notifications & Profile dropdown */}
      <div className="d-flex align-items-center gap-3">
        {/* Notification Bell */}
        <Link
          to="/notifications"
          className="position-relative p-2 text-secondary text-decoration-none rounded-circle hover-bg-light"
          title="Notifications"
        >
          <FiBell size={20} />
          {unreadCount > 0 && (
            <span
              className="position-absolute top-1 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: '0.65rem' }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="btn btn-sm p-1 d-flex align-items-center gap-2 border-0 bg-transparent"
            style={{ outline: 'none' }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
              style={{
                width: '36px',
                height: '36px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                fontSize: '0.85rem',
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="text-start d-none d-md-block">
              <div className="fw-semibold text-dark lh-1" style={{ fontSize: '0.825rem' }}>
                {user?.name || 'StaffSync User'}
              </div>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>
                {user?.jobTitle || role}
              </small>
            </div>
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen && (
            <>
              <div
                className="position-fixed top-0 start-0 w-100 h-100"
                style={{ zIndex: 1050 }}
                onClick={() => setDropdownOpen(false)}
              />
              <div
                className="position-absolute end-0 mt-2 bg-white rounded-3 shadow-lg border py-2"
                style={{ width: '220px', zIndex: 1055 }}
              >
                <div className="px-3 py-2 border-bottom">
                  <div className="fw-bold text-dark text-truncate" style={{ fontSize: '0.85rem' }}>
                    {user?.name}
                  </div>
                  <div className="text-muted text-truncate" style={{ fontSize: '0.75rem' }}>
                    {user?.email}
                  </div>
                  <div className="mt-1">
                    <span className={`badge rounded-pill ${role === 'HR' ? 'badge-role-hr' : role === 'MANAGER' ? 'badge-role-manager' : 'badge-role-employee'}`} style={{ fontSize: '0.65rem' }}>
                      {role}
                    </span>
                  </div>
                </div>

                {role === 'EMPLOYEE' && (
                  <Link
                    to="/employee/profile"
                    className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <FiUser size={15} className="text-muted" />
                    <span>My Profile</span>
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-dark"
                  onClick={() => setDropdownOpen(false)}
                >
                  <FiSettings size={15} className="text-muted" />
                  <span>Account Settings</span>
                </Link>

                <div className="dropdown-divider my-1"></div>

                <button
                  onClick={handleLogout}
                  className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger w-100 border-0 bg-transparent text-start"
                >
                  <FiLogOut size={15} />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
