import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiAward,
  FiCheckCircle,
  FiPlus,
  FiFileText,
  FiArrowRight,
  FiLayers,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';

const COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

const HRDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load HR dashboard analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading || !reportData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading HR Dashboard...</span>
        </div>
      </div>
    );
  }

  const { summary, departmentDistribution, attendanceTrends, leaveStatusDistribution } = reportData;

  return (
    <div>
      {/* Header and Quick Action Buttons */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge rounded-pill badge-role-hr">Executive HR Portal</span>
            <span className="text-muted small">• StaffSync Headquarters</span>
          </div>
          <h3 className="fw-bold text-dark mb-0">Organization Intelligence</h3>
        </div>

        {/* Quick action shortcuts */}
        <div className="d-flex flex-wrap gap-2">
          <Link to="/hr/employees" className="btn btn-primary-custom btn-sm d-flex align-items-center gap-1.5 shadow-sm">
            <FiPlus size={15} />
            <span>Add Employee</span>
          </Link>
          <Link to="/hr/departments" className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5">
            <FiLayers size={15} />
            <span>Departments</span>
          </Link>
          <Link to="/hr/announcements" className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5">
            <FiFileText size={15} />
            <span>Post Notice</span>
          </Link>
          <Link to="/hr/reports" className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5">
            <span>Export CSV</span>
          </Link>
        </div>
      </div>

      {/* 8 Metric KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Total Workforce</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.totalEmployees}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>{summary.totalManagers} Managers</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiUsers />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Active Employees</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{summary.activeEmployees}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Verified active</small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiUserCheck />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Present Today</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{summary.presentToday}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>{summary.lateToday} late check-ins</small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiUserCheck />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Absent Today</span>
              <h3 className="fw-bold text-danger mb-0 mt-1">{summary.absentToday}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Not clocked in</small>
            </div>
            <div className="stat-icon bg-danger bg-opacity-10 text-danger">
              <FiUserX />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Pending Leaves</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{summary.pendingLeaves}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Requires review</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiCalendar />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Approved This Month</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.approvedLeavesThisMonth}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Leave requests</small>
            </div>
            <div className="stat-icon bg-info bg-opacity-10 text-info">
              <FiCheckCircle />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Upcoming Trainings</span>
              <h3 className="fw-bold text-info mb-0 mt-1">{summary.upcomingTrainings}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Scheduled courses</small>
            </div>
            <div className="stat-icon bg-info bg-opacity-10 text-info">
              <FiAward />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Active Departments</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.totalDepartments}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Divisions operational</small>
            </div>
            <div className="stat-icon bg-purple bg-opacity-10 text-secondary">
              <FiLayers />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <div className="row g-4 mb-4">
        {/* Attendance Trends Chart */}
        <div className="col-lg-8">
          <div className="app-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div>
                <h5 className="fw-bold text-dark mb-0">7-Day Attendance Trend</h5>
                <small className="text-muted">Daily present vs absent ratios</small>
              </div>
              <Link to="/hr/attendance" className="text-primary text-decoration-none small fw-semibold d-flex align-items-center gap-1">
                <span>View Attendance Log</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Area type="monotone" dataKey="present" name="Present" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#presentGrad)" />
                  <Area type="monotone" dataKey="late" name="Late" stroke="#f59e0b" strokeWidth={2} fillOpacity={0} />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" strokeWidth={2} fillOpacity={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Department Headcount Breakdown */}
        <div className="col-lg-4">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-1">Headcount by Department</h5>
            <small className="text-muted d-block mb-3">Staff distribution</small>

            <div style={{ height: 260, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={departmentDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {departmentDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;
