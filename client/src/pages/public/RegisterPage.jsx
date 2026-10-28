import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser, clearError } from '../../store/slices/authSlice';
import { FiUser, FiMail, FiLock, FiPhone, FiFolder, FiArrowRight, FiShield } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    department: '',
  });
  const [departments, setDepartments] = useState([]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) {
          setDepartments(res.data.data);
        }
      } catch (e) {
        // quiet
      }
    };
    fetchDepts();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) dispatch(clearError());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    try {
      const res = await dispatch(
        registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          department: formData.department || undefined,
        })
      ).unwrap();

      toast.success(`Account created! Welcome to StaffSync, ${res.user.name}`);
      navigate('/employee/dashboard');
    } catch (err) {
      // Handled in authSlice
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light py-5 px-3">
      <div className="w-100" style={{ maxWidth: '480px' }}>
        {/* Header */}
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
          <h4 className="fw-bold text-dark mb-1">Create Employee Account</h4>
          <p className="text-muted small">Join your team workspace with single-step onboarding</p>
        </div>

        {error && (
          <div className="alert alert-danger py-2 small mb-3 text-center" role="alert">
            {error}
          </div>
        )}

        <div className="app-card p-4 bg-white mb-4 shadow-sm">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Full Name</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiUser />
                </span>
                <input
                  type="text"
                  name="name"
                  className="form-control border-start-0 ps-0"
                  placeholder="e.g. Sarah Jenkins"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Work Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiMail />
                </span>
                <input
                  type="email"
                  name="email"
                  className="form-control border-start-0 ps-0"
                  placeholder="sarah.jenkins@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="row g-2 mb-3">
              <div className="col-sm-6">
                <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                <div className="input-group">
                  <span className="input-group-text bg-white text-muted border-end-0">
                    <FiPhone />
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    className="form-control border-start-0 ps-0"
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="col-sm-6">
                <label className="form-label small fw-semibold text-secondary">Department</label>
                <select
                  name="department"
                  className="form-select"
                  value={formData.department}
                  onChange={handleChange}
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d._id} value={d._id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiLock />
                </span>
                <input
                  type="password"
                  name="password"
                  className="form-control border-start-0 ps-0"
                  placeholder="At least 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold text-secondary">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted border-end-0">
                  <FiLock />
                </span>
                <input
                  type="password"
                  name="confirmPassword"
                  className="form-control border-start-0 ps-0"
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Role Notice */}
            <div className="p-2.5 rounded-3 bg-light border small text-muted mb-4 d-flex align-items-start gap-2">
              <FiShield className="text-primary mt-1 flex-shrink-0" size={16} />
              <div style={{ fontSize: '0.78rem' }}>
                All public registrations are assigned the <strong>Employee</strong> role. Management and HR administrator accounts are provisioned internally by HR.
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
            >
              {loading ? (
                <div className="spinner-border spinner-border-sm text-light" role="status">
                  <span className="visually-hidden">Creating account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <FiArrowRight />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="text-center small text-muted">
          Already have an account?{' '}
          <Link to="/login" className="fw-semibold text-primary text-decoration-none">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
