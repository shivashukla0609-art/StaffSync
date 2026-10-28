import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser, clearError } from '../../store/slices/authSlice';
import { FiMail, FiLock, FiEye, FiEyeOff, FiFolder, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error } = useSelector((state) => state.auth);

  const queryParams = new URLSearchParams(location.search);
  const sessionExpired = queryParams.get('sessionExpired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please enter both email and password.');
      return;
    }

    try {
      const result = await dispatch(loginUser({ email, password })).unwrap();
      toast.success(`Welcome back, ${result.user.name}!`);

      if (result.user.role === 'HR') {
        navigate('/hr/dashboard');
      } else if (result.user.role === 'MANAGER') {
        navigate('/manager/dashboard');
      } else {
        navigate('/employee/dashboard');
      }
    } catch (err) {
      // Handled in redux
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    dispatch(clearError());
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="w-100" style={{ maxWidth: '440px' }}>
        {/* Logo and title */}
        <div className="text-center mb-4">
          <Link to="/" className="d-inline-flex align-items-center gap-2 text-decoration-none mb-3">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
              style={{
                width: '44px',
                height: '44px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}
            >
              <FiFolder size={24} />
            </div>
            <h3 className="mb-0 fw-bold text-dark" style={{ letterSpacing: '-0.5px' }}>
              Staff<span style={{ color: '#4f46e5' }}>Sync</span>
            </h3>
          </Link>
          <h4 className="fw-bold text-dark mb-1">Sign in to your account</h4>
          <p className="text-muted small">Enter your credentials to access your workspace</p>
        </div>

        {sessionExpired && (
          <div className="alert alert-warning py-2 small mb-3 text-center" role="alert">
            Your previous session expired. Please sign in again.
          </div>
        )}

        {error && (
          <div className="alert alert-danger py-2 small mb-3 text-center" role="alert">
            {error}
          </div>
        )}

        {/* Login Form Card */}
        <div className="app-card p-4 bg-white mb-4 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiMail />
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label small fw-semibold text-secondary mb-0">Password</label>
                <button
                  type="button"
                  className="btn btn-link p-0 small text-decoration-none text-muted"
                  style={{ fontSize: '0.8rem' }}
                  onClick={() => toast('For demo accounts, use Admin@123, Manager@123, or Employee@123', { icon: 'ℹ️' })}
                >
                  Forgot password?
                </button>
              </div>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiLock />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control border-start-0 border-end-0 ps-0"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) dispatch(clearError());
                  }}
                  required
                />
                <button
                  type="button"
                  className="input-group-text bg-white text-muted border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label className="form-check-label small text-muted" htmlFor="rememberMe">
                  Remember my session
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Autofill */}
          <div className="mt-4 pt-3 border-top">
            <small className="d-block text-muted text-center mb-2 fw-medium">Quick Demo Autofill</small>
            <div className="d-flex gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('hr@staffsync.com', 'Admin@123')}
                className="btn btn-sm btn-outline-secondary flex-fill"
                style={{ fontSize: '0.75rem' }}
              >
                HR Admin
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('manager.sarah@staffsync.com', 'Manager@123')}
                className="btn btn-sm btn-outline-secondary flex-fill"
                style={{ fontSize: '0.75rem' }}
              >
                Manager
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('john.doe@staffsync.com', 'Employee@123')}
                className="btn btn-sm btn-outline-secondary flex-fill"
                style={{ fontSize: '0.75rem' }}
              >
                Employee
              </button>
            </div>
          </div>
        </div>

        {/* Link to register */}
        <div className="text-center small text-muted">
          Need an employee account?{' '}
          <Link to="/register" className="fw-semibold text-primary text-decoration-none">
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
