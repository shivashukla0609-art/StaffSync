import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiClock,
  FiCalendar,
  FiCheckCircle,
  FiAlertCircle,
  FiAward,
  FiBell,
  FiArrowRight,
  FiCheck,
  FiLogIn,
  FiLogOut,
  FiFileText,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceSummary, setAttendanceSummary] = useState({});
  const [leavesStats, setLeavesStats] = useState({});
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [trainings, setTrainings] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [attRes, leavesRes, trainingsRes, annRes] = await Promise.all([
        api.get('/attendance/me'),
        api.get('/leaves/me'),
        api.get('/trainings'),
        api.get('/announcements?limit=3'),
      ]);

      if (attRes.data?.success) {
        setTodayAttendance(attRes.data.data.today);
        setAttendanceSummary(attRes.data.data.summary);
      }

      if (leavesRes.data?.success) {
        setLeavesStats(leavesRes.data.stats);
        setRecentLeaves(leavesRes.data.data.slice(0, 4));
      }

      if (trainingsRes.data?.success) {
        setTrainings(trainingsRes.data.data.slice(0, 3));
      }

      if (annRes.data?.success) {
        setAnnouncements(annRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-in');
      toast.success(res.data.message || 'Clocked in successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock in');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-out');
      toast.success(res.data.message || 'Clocked out successfully!');
      fetchDashboardData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to clock out');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Dashboard...</span>
        </div>
      </div>
    );
  }

  const isClockedIn = !!todayAttendance;
  const isClockedOut = !!todayAttendance?.clockOut;

  return (
    <div>
      {/* Welcome & Clock-in Banner */}
      <div className="row g-4 mb-4">
        <div className="col-lg-8">
          <div className="app-card p-4 h-100 d-flex flex-column justify-content-between" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge rounded-pill badge-role-employee">Employee Portal</span>
                <span className="text-muted small">• {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
              </div>
              <h3 className="fw-bold text-dark mb-1">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}!
              </h3>
              <p className="text-muted small mb-0">
                Employee ID: <strong className="text-dark">{user?.employeeId || 'Pending'}</strong> • Department: <strong className="text-dark">{user?.department?.name || 'General Staff'}</strong> • Role: <strong className="text-dark">{user?.jobTitle}</strong>
              </p>
            </div>

            <div className="mt-4 pt-3 border-top d-flex flex-wrap gap-2">
              <Link to="/employee/leaves" className="btn btn-outline-custom btn-sm">
                Apply for Leave
              </Link>
              <Link to="/employee/trainings" className="btn btn-outline-custom btn-sm">
                Browse Trainings
              </Link>
              <Link to="/announcements" className="btn btn-outline-custom btn-sm">
                View Company Updates
              </Link>
            </div>
          </div>
        </div>

        {/* Today's Attendance Quick Action Card */}
        <div className="col-lg-4">
          <div className="app-card p-4 h-100 d-flex flex-column justify-content-between border-primary border-opacity-25 shadow-sm">
            <div>
              <div className="d-flex align-items-center justify-content-between mb-3">
                <span className="fw-bold text-dark">Today's Attendance</span>
                <FiClock className="text-primary" size={20} />
              </div>

              {!isClockedIn ? (
                <div className="p-3 bg-light rounded-3 text-center mb-3">
                  <div className="badge badge-status-absent mb-1">Not Clocked In Yet</div>
                  <small className="d-block text-muted">Standard check-in begins before 9:30 AM</small>
                </div>
              ) : isClockedOut ? (
                <div className="p-3 bg-light rounded-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge badge-status-approved">Shift Completed</span>
                    <small className="fw-bold text-dark">{((todayAttendance.totalWorkingMinutes || 0) / 60).toFixed(1)} hrs</small>
                  </div>
                  <small className="text-muted d-block">In: {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  <small className="text-muted d-block">Out: {new Date(todayAttendance.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                </div>
              ) : (
                <div className="p-3 bg-primary bg-opacity-10 rounded-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="badge badge-status-present">Currently Clocked In</span>
                    {todayAttendance.isLate && <span className="badge badge-status-late">Late Arrival</span>}
                  </div>
                  <small className="text-muted d-block">In at: {new Date(todayAttendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
                  <small className="text-muted d-block">Clock out when your shift ends.</small>
                </div>
              )}
            </div>

            <div>
              {!isClockedIn ? (
                <button
                  onClick={handleClockIn}
                  disabled={actionLoading}
                  className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                >
                  <FiLogIn size={18} />
                  <span>Clock In Now</span>
                </button>
              ) : !isClockedOut ? (
                <button
                  onClick={handleClockOut}
                  disabled={actionLoading}
                  className="btn btn-danger w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                >
                  <FiLogOut size={18} />
                  <span>Clock Out</span>
                </button>
              ) : (
                <button disabled className="btn btn-light w-100 py-2 border text-muted">
                  <FiCheck className="text-success me-1" />
                  Clocked out for today
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small fw-medium">Monthly Working Days</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{attendanceSummary.presentDays || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Total logged: {attendanceSummary.totalWorkingHours || 0} hrs</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiCalendar />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small fw-medium">Approved Leaves</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{leavesStats.approvedCount || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>{leavesStats.totalDaysTaken || 0} days taken this year</small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiCheckCircle />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small fw-medium">Pending Leaves</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{leavesStats.pendingCount || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Awaiting manager review</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiAlertCircle />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small fw-medium">Upcoming Trainings</span>
              <h3 className="fw-bold text-info mb-0 mt-1">{trainings.length}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Programs available</small>
            </div>
            <div className="stat-icon bg-info bg-opacity-10 text-info">
              <FiAward />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Leaves and Announcements */}
      <div className="row g-4">
        {/* Recent Leave Requests */}
        <div className="col-lg-6">
          <div className="app-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Recent Leave Requests</h5>
              <Link to="/employee/leaves" className="text-primary text-decoration-none small fw-semibold d-flex align-items-center gap-1">
                <span>View all</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {recentLeaves.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No leave requests submitted recently.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Dates</th>
                      <th>Days</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeaves.map((leave) => (
                      <tr key={leave._id}>
                        <td className="fw-semibold">{leave.leaveType}</td>
                        <td className="small text-muted">
                          {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </td>
                        <td>{leave.numberOfDays}</td>
                        <td>
                          <span
                            className={`badge rounded-pill ${
                              leave.status === 'Approved'
                                ? 'badge-status-approved'
                                : leave.status === 'Pending'
                                ? 'badge-status-pending'
                                : 'badge-status-rejected'
                            }`}
                          >
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Company Announcements */}
        <div className="col-lg-6">
          <div className="app-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Company Announcements</h5>
              <Link to="/announcements" className="text-primary text-decoration-none small fw-semibold d-flex align-items-center gap-1">
                <span>View all</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {announcements.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No published announcements at this time.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {announcements.map((ann) => (
                  <div key={ann._id} className="p-3 rounded-3 border bg-light bg-opacity-50">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-secondary-subtle text-secondary">{ann.category}</span>
                      <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                        {new Date(ann.publishedAt).toLocaleDateString()}
                      </small>
                    </div>
                    <h6 className="fw-bold text-dark mb-1">{ann.title}</h6>
                    <p className="text-muted small mb-0 text-truncate">{ann.description}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
