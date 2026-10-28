import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiAlertCircle, FiArrowLeft } from 'react-icons/fi';

const NotFoundPage = () => {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  const getHomeLink = () => {
    if (!isAuthenticated || !user) return '/';
    if (user.role === 'HR') return '/hr/dashboard';
    if (user.role === 'MANAGER') return '/manager/dashboard';
    return '/employee/dashboard';
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light p-4 text-center">
      <div className="app-card p-5 bg-white shadow-sm" style={{ maxWidth: '480px' }}>
        <div className="text-danger mb-3">
          <FiAlertCircle size={56} />
        </div>
        <h2 className="fw-bold text-dark mb-2">Page Not Found</h2>
        <p className="text-muted small mb-4">
          The page or resource you are looking for does not exist or may have been moved.
        </p>
        <Link to={getHomeLink()} className="btn btn-primary-custom d-inline-flex align-items-center gap-2">
          <FiArrowLeft />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
