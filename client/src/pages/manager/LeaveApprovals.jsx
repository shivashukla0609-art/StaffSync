import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiCheck, FiX, FiCalendar, FiMessageSquare } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const LeaveApprovals = () => {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve'); // 'approve' | 'reject'
  const [comment, setComment] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await api.get('/leaves', {
        params: { status: statusFilter || undefined },
      });
      if (res.data?.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter]);

  const handleOpenReview = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setComment(action === 'approve' ? 'Approved' : '');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewAction === 'reject' && !comment.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }

    try {
      setActionLoading(true);
      const endpoint = `/leaves/${selectedLeave._id}/${reviewAction}`;
      const res = await api.patch(endpoint, { comment });
      toast.success(res.data.message || `Leave request ${reviewAction}d`);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${reviewAction} leave`);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Team Leave Approvals</h4>
          <p className="text-muted small mb-0">Evaluate absence applications submitted by direct reports in your team.</p>
        </div>

        {/* Filter Pills */}
        <div className="d-flex gap-2">
          {['', 'Pending', 'Approved', 'Rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`btn btn-sm ${statusFilter === st ? 'btn-primary-custom' : 'btn-outline-custom'}`}
            >
              {st || 'All Requests'}
            </button>
          ))}
        </div>
      </div>

      {/* Leaves List */}
      <div className="app-card p-4">
        <h5 className="fw-bold text-dark mb-3">Leave Requests</h5>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Leaves...</span>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiCheckSquare size={36} className="mb-2 text-secondary" />
            <p>No leave requests found matching the selected filter.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div className="fw-semibold text-dark">{l.employeeId?.name}</div>
                      <small className="text-muted">{l.employeeId?.jobTitle} • {l.employeeId?.employeeId}</small>
                    </td>
                    <td>{l.leaveType}</td>
                    <td className="small text-muted">
                      {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="fw-medium">{l.numberOfDays}</td>
                    <td className="small text-muted" style={{ maxWidth: '220px' }}>
                      {l.reason}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          l.status === 'Approved'
                            ? 'badge-status-approved'
                            : l.status === 'Pending'
                            ? 'badge-status-pending'
                            : 'badge-status-rejected'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleOpenReview(l, 'approve')}
                            className="btn btn-sm btn-success py-1 px-2.5 d-flex align-items-center gap-1"
                          >
                            <FiCheck size={14} />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleOpenReview(l, 'reject')}
                            className="btn btn-sm btn-outline-danger py-1 px-2.5 d-flex align-items-center gap-1"
                          >
                            <FiX size={14} />
                            <span>Reject</span>
                          </button>
                        </div>
                      ) : (
                        <div className="small text-muted">
                          <strong>{l.reviewedBy?.name || 'Manager'}:</strong> {l.reviewComment || '-'}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedLeave && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">
                  {reviewAction === 'approve' ? 'Approve Leave Request' : 'Reject Leave Request'}
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedLeave(null)}
                ></button>
              </div>

              <form onSubmit={handleSubmitReview}>
                <div className="modal-body px-4 py-3">
                  <div className="p-3 bg-light rounded-3 mb-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Employee:</span>
                      <strong className="text-dark">{selectedLeave.employeeId?.name}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Type:</span>
                      <strong className="text-dark">{selectedLeave.leaveType} ({selectedLeave.numberOfDays} days)</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Dates:</span>
                      <strong className="text-dark">
                        {new Date(selectedLeave.startDate).toLocaleDateString()} to {new Date(selectedLeave.endDate).toLocaleDateString()}
                      </strong>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">Reason:</span>
                      <span className="text-dark">{selectedLeave.reason}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">
                      {reviewAction === 'approve' ? 'Approval Note (Optional)' : 'Rejection Reason (Required)'}
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder={reviewAction === 'approve' ? 'e.g. Approved. Have a good break!' : 'Specify why this request cannot be approved...'}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required={reviewAction === 'reject'}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button
                    type="button"
                    className="btn btn-outline-custom"
                    onClick={() => setSelectedLeave(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-danger'}`}
                  >
                    {actionLoading ? 'Processing...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
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

export default LeaveApprovals;
