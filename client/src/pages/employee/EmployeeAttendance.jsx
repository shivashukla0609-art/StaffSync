import React, { useState, useEffect } from 'react';
import { FiClock, FiCalendar, FiLogIn, FiLogOut, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState(null);
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({});

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/me');
      if (res.data?.success) {
        setTodayRecord(res.data.data.today);
        setRecords(res.data.data.records);
        setSummary(res.data.data.summary);
      }
    } catch (err) {
      toast.error('Failed to load attendance history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-in');
      toast.success(res.data.message || 'Clocked in successfully!');
      fetchAttendance();
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
      fetchAttendance();
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
          <span className="visually-hidden">Loading Attendance...</span>
        </div>
      </div>
    );
  }

  const isClockedIn = !!todayRecord;
  const isClockedOut = !!todayRecord?.clockOut;

  return (
    <div>
      {/* Header and Clock-in action card */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">My Attendance & Work Hours</h4>
          <p className="text-muted small mb-0">Record your daily shift presence and inspect historical time logs.</p>
        </div>

        {/* Action button */}
        <div>
          {!isClockedIn ? (
            <button
              onClick={handleClockIn}
              disabled={actionLoading}
              className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
            >
              <FiLogIn />
              <span>Clock In for Today</span>
            </button>
          ) : !isClockedOut ? (
            <button
              onClick={handleClockOut}
              disabled={actionLoading}
              className="btn btn-danger d-flex align-items-center gap-2 shadow-sm"
            >
              <FiLogOut />
              <span>Clock Out ({((todayRecord.totalWorkingMinutes || 0) / 60).toFixed(1)} hrs)</span>
            </button>
          ) : (
            <span className="badge bg-success-subtle text-success p-2 px-3 fs-6 d-flex align-items-center gap-1">
              <FiCheck />
              <span>Completed Today</span>
            </span>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Days Present</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.presentDays || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>This month</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiCalendar />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Total Hours Logged</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.totalWorkingHours || '0.0'}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Cumulative hours</small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiClock />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Average Shift</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{summary.averageDailyHours || '0.0'}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Hours per workday</small>
            </div>
            <div className="stat-icon bg-info bg-opacity-10 text-info">
              <FiClock />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Late Arrivals</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{summary.lateDays || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>After 9:30 AM</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiAlertTriangle />
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History Table */}
      <div className="app-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">Attendance History</h5>
          <span className="text-muted small">Last 30 workdays</span>
        </div>

        {records.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiClock size={36} className="mb-2 text-secondary" />
            <p>No attendance records found yet. Clock in to record today's shift!</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Time</th>
                  <th>Status</th>
                  <th>Notes / Correction</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const hours = (r.totalWorkingMinutes / 60).toFixed(1);
                  return (
                    <tr key={r._id}>
                      <td className="fw-semibold text-dark">
                        {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="text-muted">
                        {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="text-muted">
                        {r.clockOut ? new Date(r.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (
                          <span className="text-primary fw-medium">Active shift</span>
                        )}
                      </td>
                      <td className="fw-medium text-dark">{hours > 0 ? `${hours} hrs` : '-'}</td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            r.status === 'PRESENT'
                              ? 'badge-status-present'
                              : r.status === 'LATE'
                              ? 'badge-status-late'
                              : r.status === 'HALF_DAY'
                              ? 'badge-status-pending'
                              : 'badge-status-absent'
                          }`}
                        >
                          {r.status}
                        </span>
                        {r.isLate && r.status !== 'LATE' && (
                          <span className="badge badge-status-late ms-1">Late</span>
                        )}
                      </td>
                      <td className="small text-muted">
                        {r.isManualCorrection ? (
                          <span className="text-warning">
                            Manual HR Correction: {r.correctionReason}
                          </span>
                        ) : (
                          r.notes || 'Normal check-in'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendance;
