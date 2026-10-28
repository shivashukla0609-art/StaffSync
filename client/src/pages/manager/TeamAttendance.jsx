import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiUserCheck, FiUserX, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TeamAttendance = () => {
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [attendanceData, setAttendanceData] = useState({
    roster: [],
    presentCount: 0,
    absentCount: 0,
    totalTeam: 0,
  });

  const fetchTeamAttendance = async (selectedDate) => {
    try {
      setLoading(true);
      const res = await api.get('/attendance/team', {
        params: { date: selectedDate || date },
      });
      if (res.data?.success) {
        setAttendanceData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load team attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamAttendance(date);
  }, [date]);

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Team Attendance Roster</h4>
          <p className="text-muted small mb-0">Track shift punctuality, presence, and daily hours for your reporting team.</p>
        </div>

        {/* Date Selector */}
        <div className="d-flex align-items-center gap-2">
          <label className="small text-muted fw-semibold">Roster Date:</label>
          <input
            type="date"
            className="form-control form-control-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Total Team Size</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{attendanceData.totalTeam || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Assigned employees</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiCalendar />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Present on {date}</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{attendanceData.presentCount || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                {attendanceData.totalTeam > 0 ? `${Math.round((attendanceData.presentCount / attendanceData.totalTeam) * 100)}% attendance` : '0%'}
              </small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiUserCheck />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Absent</span>
              <h3 className="fw-bold text-danger mb-0 mt-1">{attendanceData.absentCount || 0}</h3>
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
              <span className="text-muted small">Late Arrivals</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">
                {(attendanceData.roster || []).filter((r) => r.attendance?.isLate).length}
              </h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>After 9:30 AM</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiAlertTriangle />
            </div>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      <div className="app-card p-4">
        <h5 className="fw-bold text-dark mb-3">Roster Log for {date}</h5>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Roster...</span>
            </div>
          </div>
        ) : (!attendanceData.roster || attendanceData.roster.length === 0) ? (
          <div className="text-center py-5 text-muted">
            <p>No team members found for this date.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Team Member</th>
                  <th>Designation</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.roster.map((item) => {
                  const att = item.attendance;
                  const hours = att?.totalWorkingMinutes ? (att.totalWorkingMinutes / 60).toFixed(1) : '0.0';
                  return (
                    <tr key={item.member._id}>
                      <td>
                        <div className="fw-semibold text-dark">{item.member.name}</div>
                        <small className="text-muted">{item.member.email} • {item.member.employeeId}</small>
                      </td>
                      <td className="small text-muted">{item.member.jobTitle}</td>
                      <td className="small text-muted">
                        {att?.clockIn ? new Date(att.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="small text-muted">
                        {att?.clockOut ? new Date(att.clockOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : att ? (
                          <span className="text-primary fw-medium">Active shift</span>
                        ) : '-'}
                      </td>
                      <td className="fw-medium text-dark">{att?.totalWorkingMinutes ? `${hours} hrs` : '-'}</td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            item.status === 'PRESENT'
                              ? 'badge-status-present'
                              : item.status === 'LATE'
                              ? 'badge-status-late'
                              : 'badge-status-absent'
                          }`}
                        >
                          {item.status}
                        </span>
                        {att?.isLate && item.status !== 'LATE' && (
                          <span className="badge badge-status-late ms-1">Late</span>
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

export default TeamAttendance;
