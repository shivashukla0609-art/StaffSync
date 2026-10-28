import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiCalendar,
  FiAward,
  FiArrowRight,
  FiCheckCircle,
  FiXCircle,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const ManagerDashboard = () => {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [trainings, setTrainings] = useState([]);

  const fetchManagerData = async () => {
    try {
      setLoading(true);
      const [teamRes, attRes, leavesRes, trainRes] = await Promise.all([
        api.get('/employees'),
        api.get('/attendance/team'),
        api.get('/leaves?status=Pending'),
        api.get('/trainings'),
      ]);

      if (teamRes.data?.success) {
        setTeamMembers(teamRes.data.data);
      }
      if (attRes.data?.success) {
        setAttendanceData(attRes.data.data);
      }
      if (leavesRes.data?.success) {
        setPendingLeaves(leavesRes.data.data);
      }
      if (trainRes.data?.success) {
        setTrainings(trainRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load manager dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchManagerData();
  }, []);

  const handleQuickApprove = async (leaveId) => {
    try {
      await api.patch(`/leaves/${leaveId}/approve`, { comment: 'Approved via Manager Dashboard' });
      toast.success('Leave request approved');
      fetchManagerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve');
    }
  };

  const handleQuickReject = async (leaveId) => {
    const reason = prompt('Please enter a rejection comment:');
    if (!reason) return;

    try {
      await api.patch(`/leaves/${leaveId}/reject`, { comment: reason });
      toast.success('Leave request rejected');
      fetchManagerData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Manager Dashboard...</span>
        </div>
      </div>
    );
  }

  const totalTeam = teamMembers.length;
  const presentToday = attendanceData.presentCount || 0;
  const absentToday = attendanceData.absentCount || Math.max(0, totalTeam - presentToday);

  return (
    <div>
      {/* Welcome Banner */}
      <div className="app-card p-4 mb-4" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge rounded-pill badge-role-manager">Manager Portal</span>
              <span className="text-muted small">• Assigned Team Overview</span>
            </div>
            <h3 className="fw-bold text-dark mb-1">Welcome back, {user?.name}</h3>
            <p className="text-muted small mb-0">
              Department: <strong className="text-dark">{user?.department?.name || 'Department Leadership'}</strong> • Team Size: <strong className="text-dark">{totalTeam} Members</strong>
            </p>
          </div>

          <div className="d-flex gap-2">
            <Link to="/manager/leaves" className="btn btn-primary-custom btn-sm">
              Review Leave Requests ({pendingLeaves.length})
            </Link>
            <Link to="/manager/attendance" className="btn btn-outline-custom btn-sm">
              Today's Team Roster
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Total Team Members</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{totalTeam}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Direct reports</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiUsers />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Present Today</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{presentToday}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Clocked in</small>
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
              <h3 className="fw-bold text-danger mb-0 mt-1">{absentToday}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Not checked in</small>
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
              <h3 className="fw-bold text-warning mb-0 mt-1">{pendingLeaves.length}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Requires your action</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiCalendar />
            </div>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Pending Approvals & Team Members Table */}
      <div className="row g-4">
        {/* Pending Leave Requests */}
        <div className="col-lg-6">
          <div className="app-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Pending Leave Approvals</h5>
              <Link to="/manager/leaves" className="text-primary text-decoration-none small fw-semibold d-flex align-items-center gap-1">
                <span>All requests</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {pendingLeaves.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No pending leave requests from your team.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {pendingLeaves.slice(0, 4).map((leave) => (
                  <div key={leave._id} className="p-3 border rounded-3 bg-light bg-opacity-50">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold text-dark mb-0">{leave.employeeId?.name}</h6>
                        <small className="text-muted">{leave.employeeId?.jobTitle} • {leave.leaveType}</small>
                      </div>
                      <span className="badge badge-status-pending">Pending</span>
                    </div>

                    <p className="text-muted small mb-2">{leave.reason}</p>

                    <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                      <small className="text-muted">
                        {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                        {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} ({leave.numberOfDays} days)
                      </small>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => handleQuickApprove(leave._id)}
                          className="btn btn-sm btn-success py-1 px-2.5"
                          title="Approve"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleQuickReject(leave._id)}
                          className="btn btn-sm btn-outline-danger py-1 px-2.5"
                          title="Reject"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Team Attendance Roster Today */}
        <div className="col-lg-6">
          <div className="app-card p-4 h-100">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h5 className="fw-bold text-dark mb-0">Today's Team Attendance</h5>
              <Link to="/manager/attendance" className="text-primary text-decoration-none small fw-semibold d-flex align-items-center gap-1">
                <span>Detailed roster</span>
                <FiArrowRight size={14} />
              </Link>
            </div>

            {(!attendanceData.roster || attendanceData.roster.length === 0) ? (
              <div className="text-center py-4 text-muted small">
                No team attendance records found for today.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Status</th>
                      <th>Check In</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceData.roster.slice(0, 6).map((item) => (
                      <tr key={item.member._id}>
                        <td>
                          <div className="fw-semibold text-dark">{item.member.name}</div>
                          <small className="text-muted">{item.member.jobTitle}</small>
                        </td>
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
                        </td>
                        <td className="small text-muted">
                          {item.attendance?.clockIn
                            ? new Date(item.attendance.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerDashboard;
