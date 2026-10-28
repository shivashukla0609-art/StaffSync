import React, { useState, useEffect } from 'react';
import {
  FiDownload,
  FiBarChart2,
  FiPieChart,
  FiCalendar,
  FiUsers,
  FiAward,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import toast from 'react-hot-toast';
import api from '../../services/api';

const COLORS = ['#4f46e5', '#7c3aed', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/dashboard');
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleDownloadCSV = (endpoint, filename) => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/${endpoint}?format=csv`;
    window.open(url, '_blank');
    toast.success(`Downloading ${filename}...`);
  };

  if (loading || !reportData) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Analytics...</span>
        </div>
      </div>
    );
  }

  const { departmentDistribution, attendanceTrends, leaveStatusDistribution, trainingStats } = reportData;

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Reports & Executive Analytics</h4>
          <p className="text-muted small mb-0">Live aggregated metrics, organizational distributions, and downloadable CSV records.</p>
        </div>

        {/* Export Shortcuts */}
        <div className="d-flex flex-wrap gap-2">
          <button
            onClick={() => handleDownloadCSV('employees', 'Employee Roster')}
            className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5"
          >
            <FiDownload />
            <span>Employee CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('attendance', 'Attendance Report')}
            className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5"
          >
            <FiDownload />
            <span>Attendance CSV</span>
          </button>
          <button
            onClick={() => handleDownloadCSV('leaves', 'Leaves Report')}
            className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5"
          >
            <FiDownload />
            <span>Leaves CSV</span>
          </button>
        </div>
      </div>

      {/* Row 1: Department Distribution and Leave Requests */}
      <div className="row g-4 mb-4">
        {/* Department Headcount Bar Chart */}
        <div className="col-lg-7">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-1">Department Headcount Distribution</h5>
            <small className="text-muted d-block mb-3">Employee volume across operational wings</small>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={11} interval={0} tick={{ width: 80 }} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="count" name="Staff Members" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Leave Status Donut Chart */}
        <div className="col-lg-5">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-1">Leave Requests Status</h5>
            <small className="text-muted d-block mb-3">Approval workflow distribution</small>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveStatusDistribution}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                  >
                    {leaveStatusDistribution.map((entry, index) => (
                      <Cell key={`leave-cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance Trends and Training Performance */}
      <div className="row g-4">
        {/* Attendance Trends */}
        <div className="col-lg-8">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-1">Attendance & Punctuality Trends</h5>
            <small className="text-muted d-block mb-3">Daily present, absent, and late volume for past 7 days</small>

            <div style={{ height: 280, width: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={attendanceTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="present" name="Present" stroke="#10b981" fill="#d1fae5" strokeWidth={2} />
                  <Area type="monotone" dataKey="absent" name="Absent" stroke="#ef4444" fill="#fee2e2" strokeWidth={2} />
                  <Area type="monotone" dataKey="late" name="Late Arrivals" stroke="#f59e0b" fill="#fef3c7" strokeWidth={2} />
                  <Legend verticalAlign="bottom" height={36} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Training Performance Card */}
        <div className="col-lg-4">
          <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
            <div>
              <h5 className="fw-bold text-dark mb-1">Training Completion Rate</h5>
              <small className="text-muted d-block mb-4">Organizational skill growth tracker</small>

              <div className="text-center my-4">
                <div
                  className="rounded-circle d-inline-flex flex-column align-items-center justify-content-center border border-4 border-primary p-4 shadow-sm"
                  style={{ width: '130px', height: '130px' }}
                >
                  <h2 className="fw-extrabold text-primary mb-0">{trainingStats.completionRate}%</h2>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>Certified</small>
                </div>
              </div>

              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Total Programs:</span>
                  <strong className="text-dark">{trainingStats.totalPrograms}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Total Enrollments:</span>
                  <strong className="text-dark">{trainingStats.totalEnrollments}</strong>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Completed Certifications:</span>
                  <strong className="text-success">{trainingStats.completedEnrollments}</strong>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top">
              <button
                onClick={() => handleDownloadCSV('employees', 'Employee Roster')}
                className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              >
                <FiDownload />
                <span>Export Master Records</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
