import React, { useState, useEffect } from 'react';
import { FiPlus, FiCalendar, FiCheckCircle, FiClock, FiXCircle, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeLeaves = () => {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [stats, setStats] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    leaveType: 'Casual Leave',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves/me');
      if (res.data?.success) {
        setLeaves(res.data.data);
        setStats(res.data.stats);
      }
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleApply = async (e) => {
    e.preventDefault();

    if (!form.startDate || !form.endDate) {
      toast.error('Please select both start and end dates.');
      return;
    }

    if (new Date(form.startDate) > new Date(form.endDate)) {
      toast.error('End date cannot be earlier than start date.');
      return;
    }

    if (!form.reason.trim()) {
      toast.error('Please specify a reason for your leave.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/leaves', form);
      toast.success(res.data.message || 'Leave request submitted successfully!');
      setShowModal(false);
      setForm({
        leaveType: 'Casual Leave',
        startDate: '',
        endDate: '',
        reason: '',
      });
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId) => {
    if (!window.confirm('Are you sure you want to cancel this pending leave request?')) {
      return;
    }

    try {
      const res = await api.patch(`/leaves/${leaveId}/cancel`);
      toast.success(res.data.message || 'Leave request cancelled.');
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel leave');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Leaves...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Leave Management</h4>
          <p className="text-muted small mb-0">Apply for time off and review request approvals and remaining balances.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiPlus />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Quota and Statistics */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Annual Allowance</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{stats.totalLeavesAllowance || 24}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Days allocated per year</small>
            </div>
            <div className="stat-icon bg-primary bg-opacity-10 text-primary">
              <FiCalendar />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Days Taken</span>
              <h3 className="fw-bold text-success mb-0 mt-1">{stats.totalDaysTaken || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Approved leaves</small>
            </div>
            <div className="stat-icon bg-success bg-opacity-10 text-success">
              <FiCheckCircle />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Remaining Balance</span>
              <h3 className="fw-bold text-dark mb-0 mt-1">{stats.remainingAllowance || 24}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Days available</small>
            </div>
            <div className="stat-icon bg-info bg-opacity-10 text-info">
              <FiClock />
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="stat-card">
            <div>
              <span className="text-muted small">Pending Requests</span>
              <h3 className="fw-bold text-warning mb-0 mt-1">{stats.pendingCount || 0}</h3>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>Under review</small>
            </div>
            <div className="stat-icon bg-warning bg-opacity-10 text-warning">
              <FiClock />
            </div>
          </div>
        </div>
      </div>

      {/* Leaves History Table */}
      <div className="app-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">My Leave Applications</h5>
          <span className="text-muted small">History of all submissions</span>
        </div>

        {leaves.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiCalendar size={36} className="mb-2 text-secondary" />
            <p>You have not submitted any leave applications yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer Feedback</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave._id}>
                    <td className="fw-semibold text-dark">{leave.leaveType}</td>
                    <td className="small text-muted">
                      {new Date(leave.startDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' — '}
                      {new Date(leave.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>{leave.numberOfDays}</td>
                    <td className="small text-muted" style={{ maxWidth: '240px' }}>
                      {leave.reason}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          leave.status === 'Approved'
                            ? 'badge-status-approved'
                            : leave.status === 'Pending'
                            ? 'badge-status-pending'
                            : leave.status === 'Cancelled'
                            ? 'bg-secondary text-white'
                            : 'badge-status-rejected'
                        }`}
                      >
                        {leave.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {leave.reviewedBy ? (
                        <div>
                          <strong>{leave.reviewedBy.name}:</strong> {leave.reviewComment || 'No comment provided'}
                        </div>
                      ) : (
                        <span className="text-muted">Awaiting review</span>
                      )}
                    </td>
                    <td>
                      {leave.status === 'Pending' && (
                        <button
                          onClick={() => handleCancelLeave(leave._id)}
                          className="btn btn-sm btn-outline-danger"
                          title="Cancel request"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Apply for Leave</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleApply}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Leave Type</label>
                    <select
                      className="form-select"
                      value={form.leaveType}
                      onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
                      required
                    >
                      <option value="Casual Leave">Casual Leave</option>
                      <option value="Sick Leave">Sick Leave</option>
                      <option value="Earned Leave">Earned Leave</option>
                      <option value="Unpaid Leave">Unpaid Leave</option>
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.startDate}
                        onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={form.endDate}
                        onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Reason for Absence</label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Briefly describe the purpose of this leave..."
                      value={form.reason}
                      onChange={(e) => setForm({ ...form, reason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-outline-custom"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn btn-primary-custom"
                  >
                    {submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeLeaves;
