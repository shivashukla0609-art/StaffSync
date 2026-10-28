import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import {
  FiCheckCircle,
  FiClock,
  FiUsers,
  FiCalendar,
  FiAward,
  FiBarChart2,
  FiArrowRight,
  FiFolder,
  FiShield,
  FiSmartphone,
  FiZap,
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleQuickDemoLogin = async (email, password, roleName) => {
    try {
      toast.loading(`Signing in as ${roleName}...`, { id: 'demo-login' });
      const res = await dispatch(loginUser({ email, password })).unwrap();
      toast.success(`Welcome, ${res.user.name}!`, { id: 'demo-login' });
      if (res.user.role === 'HR') navigate('/hr/dashboard');
      else if (res.user.role === 'MANAGER') navigate('/manager/dashboard');
      else navigate('/employee/dashboard');
    } catch (err) {
      toast.error(err || 'Failed to sign in demo account', { id: 'demo-login' });
    }
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'HR') return '/hr/dashboard';
    if (user.role === 'MANAGER') return '/manager/dashboard';
    return '/employee/dashboard';
  };

  return (
    <div className="min-vh-100 d-flex flex-column bg-white">
      {/* Top Navbar */}
      <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom sticky-top py-3">
        <div className="container">
          <Link to="/" className="navbar-brand d-flex align-items-center gap-2 fw-bold text-dark fs-4">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-3 shadow-sm"
              style={{
                width: '40px',
                height: '40px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}
            >
              <FiFolder size={22} />
            </div>
            <span>
              Staff<span style={{ color: '#4f46e5' }}>Sync</span>
            </span>
          </Link>

          <div className="d-flex align-items-center gap-3">
            {isAuthenticated ? (
              <Link to={getDashboardLink()} className="btn btn-primary-custom d-flex align-items-center gap-2">
                <span>Go to Dashboard</span>
                <FiArrowRight />
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline-custom">
                  Log In
                </Link>
                <Link to="/register" className="btn btn-primary-custom">
                  Get Started Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-5 text-center position-relative overflow-hidden" style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #ffffff 100%)' }}>
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-lg-9">
              <div className="d-inline-flex align-items-center gap-2 px-3 py-1.5 rounded-pill mb-4 border bg-white shadow-sm">
                <span className="badge bg-primary rounded-pill">StaffSync 2.0</span>
                <small className="fw-semibold text-secondary">Modern Human Resource Management System</small>
              </div>

              <h1 className="display-4 fw-extrabold text-dark tracking-tight mb-3" style={{ fontWeight: 800 }}>
                Simplify HR. <span style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Empower People.</span>
              </h1>

              <p className="lead text-muted mb-4 mx-auto" style={{ maxWidth: '680px', fontSize: '1.2rem' }}>
                StaffSync digitizes and unifies every facet of workforce operations—from attendance and leave approval workflows to talent development and executive analytics.
              </p>

              <div className="d-flex flex-wrap justify-content-center gap-3 mb-5">
                <Link to="/register" className="btn btn-primary-custom btn-lg px-4 py-2.5 fs-6 shadow">
                  Get Started Free
                </Link>
                <Link to="/login" className="btn btn-outline-custom btn-lg px-4 py-2.5 fs-6">
                  Sign In to Workspace
                </Link>
              </div>

              {/* Demo Credentials Quick-Access Bar */}
              <div className="app-card p-4 mx-auto text-start bg-white" style={{ maxWidth: '820px' }}>
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <div className="d-flex align-items-center gap-2">
                    <FiZap className="text-warning" size={20} />
                    <span className="fw-bold text-dark">One-Click Demo Access</span>
                  </div>
                  <small className="text-muted">Instant role testing</small>
                </div>
                <div className="row g-3">
                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 h-100 bg-light bg-opacity-50">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge badge-role-hr">HR Administrator</span>
                      </div>
                      <small className="d-block text-dark fw-semibold">hr@staffsync.com</small>
                      <small className="d-block text-muted mb-2">Password: Admin@123</small>
                      <button
                        onClick={() => handleQuickDemoLogin('hr@staffsync.com', 'Admin@123', 'HR Admin')}
                        className="btn btn-sm btn-outline-custom w-100"
                      >
                        Launch as HR
                      </button>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 h-100 bg-light bg-opacity-50">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge badge-role-manager">Team Manager</span>
                      </div>
                      <small className="d-block text-dark fw-semibold">manager.sarah@staffsync.com</small>
                      <small className="d-block text-muted mb-2">Password: Manager@123</small>
                      <button
                        onClick={() => handleQuickDemoLogin('manager.sarah@staffsync.com', 'Manager@123', 'Manager')}
                        className="btn btn-sm btn-outline-custom w-100"
                      >
                        Launch as Manager
                      </button>
                    </div>
                  </div>

                  <div className="col-md-4">
                    <div className="p-3 border rounded-3 h-100 bg-light bg-opacity-50">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <span className="badge badge-role-employee">Employee</span>
                      </div>
                      <small className="d-block text-dark fw-semibold">john.doe@staffsync.com</small>
                      <small className="d-block text-muted mb-2">Password: Employee@123</small>
                      <button
                        onClick={() => handleQuickDemoLogin('john.doe@staffsync.com', 'Employee@123', 'Employee')}
                        className="btn btn-sm btn-outline-custom w-100"
                      >
                        Launch as Employee
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="py-5 bg-light">
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">Everything your organization needs</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '580px' }}>
              Built from the ground up for modern enterprise workflows with role-based security and atomic state updates.
            </p>
          </div>

          <div className="row g-4">
            {/* Feature 1: Employee Management */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-primary bg-opacity-10 text-primary mb-3">
                  <FiUsers />
                </div>
                <h5 className="fw-bold text-dark mb-2">Employee Directory</h5>
                <p className="text-muted small">
                  Complete workforce lifecycle tracking, department allocations, designations, managers, and immutable audit logs for profile updates.
                </p>
              </div>
            </div>

            {/* Feature 2: Attendance Tracking */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-success bg-opacity-10 text-success mb-3">
                  <FiClock />
                </div>
                <h5 className="fw-bold text-dark mb-2">Smart Attendance</h5>
                <p className="text-muted small">
                  One-click clock in and clock out, automatic late arrival detection, working hours calculation, and daily duplicate prevention.
                </p>
              </div>
            </div>

            {/* Feature 3: Leave Management */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-warning bg-opacity-10 text-warning mb-3">
                  <FiCalendar />
                </div>
                <h5 className="fw-bold text-dark mb-2">Leave Workflow</h5>
                <p className="text-muted small">
                  Multi-tier leave requests (Sick, Casual, Earned, Unpaid) with date overlap validation, manager review comments, and instant notifications.
                </p>
              </div>
            </div>

            {/* Feature 4: Training & Development */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-info bg-opacity-10 text-info mb-3">
                  <FiAward />
                </div>
                <h5 className="fw-bold text-dark mb-2">Skill & Training Hub</h5>
                <p className="text-muted small">
                  Manage professional training programs, seat capacity limits, self-registration, and participant completion evaluations.
                </p>
              </div>
            </div>

            {/* Feature 5: Reports & Analytics */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-purple bg-opacity-10 text-secondary mb-3">
                  <FiBarChart2 />
                </div>
                <h5 className="fw-bold text-dark mb-2">Executive Analytics</h5>
                <p className="text-muted small">
                  Visual breakdowns of department headcount, attendance trends, leave ratios, and one-click CSV report exports.
                </p>
              </div>
            </div>

            {/* Feature 6: Enterprise Security */}
            <div className="col-md-4">
              <div className="app-card p-4 h-100">
                <div className="stat-icon bg-danger bg-opacity-10 text-danger mb-3">
                  <FiShield />
                </div>
                <h5 className="fw-bold text-dark mb-2">Role-Based Security</h5>
                <p className="text-muted small">
                  Strict backend authorization filters separating HR administrators, team managers, and employees with JWT authentication.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-5 bg-white">
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-primary-subtle text-primary fw-semibold px-3 py-1.5 rounded-pill mb-3">
                Why StaffSync?
              </span>
              <h2 className="fw-bold text-dark mb-4">
                Designed for high performance, clarity, and ease of use.
              </h2>
              <div className="d-flex flex-column gap-3">
                <div className="d-flex align-items-start gap-3">
                  <FiCheckCircle className="text-success mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Automated Calculations</h6>
                    <p className="text-muted small mb-0">Total working hours, attendance rates, and leave balances computed seamlessly on the server.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <FiCheckCircle className="text-success mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Scoped Manager Dashboards</h6>
                    <p className="text-muted small mb-0">Managers only see and approve actions for their assigned direct reports.</p>
                  </div>
                </div>
                <div className="d-flex align-items-start gap-3">
                  <FiCheckCircle className="text-success mt-1 flex-shrink-0" size={20} />
                  <div>
                    <h6 className="fw-bold mb-1 text-dark">Real-Time Notifications</h6>
                    <p className="text-muted small mb-0">Instant alerts for approvals, rejections, company announcements, and training registrations.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="app-card p-4 shadow-lg border">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <span className="fw-bold text-dark">Enterprise Overview</span>
                  <span className="badge bg-success-subtle text-success">Live Status</span>
                </div>
                <div className="row g-2 text-start">
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Platform Uptime</small>
                      <h4 className="fw-bold text-dark mb-0">99.98%</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Workforce Roles</small>
                      <h4 className="fw-bold text-dark mb-0">3 Tier RBAC</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Data Security</small>
                      <h4 className="fw-bold text-dark mb-0">JWT + Bcrypt</h4>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-3 bg-light rounded-3">
                      <small className="text-muted d-block">Audit Logs</small>
                      <h4 className="fw-bold text-dark mb-0">Enabled</h4>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-4 bg-dark text-white border-top">
        <div className="container d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-2">
            <div
              className="d-flex align-items-center justify-content-center text-white rounded-2"
              style={{
                width: '30px',
                height: '30px',
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              }}
            >
              <FiFolder size={16} />
            </div>
            <span className="fw-bold">StaffSync HRMS</span>
            <small className="text-secondary ms-2">© 2026. All rights reserved.</small>
          </div>

          <div className="d-flex gap-4 small text-secondary">
            <Link to="/login" className="text-secondary text-decoration-none hover-white">Login</Link>
            <Link to="/register" className="text-secondary text-decoration-none hover-white">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
