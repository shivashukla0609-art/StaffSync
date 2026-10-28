import React, { useState, useEffect } from 'react';
import { FiCheckSquare, FiCheck, FiX, FiDownload, FiCalendar, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const HRLeaveManagement = () => {
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [selectedLeave, setSelectedLeave] = useState(null);
  const [reviewAction, setReviewAction] = useState('approve');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (typeFilter) params.leaveType = typeFilter;

      const res = await api.get('/leaves', { params });
      if (res.data?.success) {
        setLeaves(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load leave records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, [statusFilter, typeFilter]);

  const handleExportCSV = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/leaves?format=csv`;
    window.open(url, '_blank');
  };

  const handleOpenReview = (leave, action) => {
    setSelectedLeave(leave);
    setReviewAction(action);
    setComment(action === 'approve' ? 'Approved by HR' : '');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewAction === 'reject' && !comment.trim()) {
      toast.error('A rejection reason is required.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.patch(`/leaves/${selectedLeave._id}/${reviewAction}`, { comment });
      toast.success(res.data.message || `Leave request ${reviewAction}d`);
      setSelectedLeave(null);
      fetchLeaves();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update leave');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company-Wide Leave Administration</h4>
          <p className="text-muted small mb-0">Oversee all organizational absence applications, review requests, and export records.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-outline-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiDownload />
          <span>Export Leaves CSV</span>
        </button>
      </div>

      {/* Filter Tabs & Selectors */}
      <div className="app-card p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-2">
            {['', 'Pending', 'Approved', 'Rejected', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`btn btn-sm ${statusFilter === st ? 'btn-primary-custom' : 'btn-outline-custom'}`}
              >
                {st || 'All Requests'}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="form-select form-select-sm"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Leave Types</option>
              <option value="Casual Leave">Casual Leave</option>
              <option value="Sick Leave">Sick Leave</option>
              <option value="Earned Leave">Earned Leave</option>
              <option value="Unpaid Leave">Unpaid Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="app-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">Leave Applications ({leaves.length})</h5>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Leaves...</span>
            </div>
          </div>
        ) : leaves.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiCheckSquare size={36} className="mb-2 text-secondary" />
            <p>No leave requests found matching the selected filters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Leave Type</th>
                  <th>Dates</th>
                  <th>Days</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Reviewer</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => (
                  <tr key={l._id}>
                    <td>
                      <div className="fw-semibold text-dark">{l.employeeId?.name}</div>
                      <small className="text-muted">{l.employeeId?.email} • {l.employeeId?.employeeId}</small>
                    </td>
                    <td className="small text-muted">{l.employeeId?.department?.name || '-'}</td>
                    <td className="fw-medium text-dark">{l.leaveType}</td>
                    <td className="small text-muted">
                      {new Date(l.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(l.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td>{l.numberOfDays}</td>
                    <td className="small text-muted" style={{ maxWidth: '200px' }}>
                      {l.reason}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          l.status === 'Approved'
                            ? 'badge-status-approved'
                            : l.status === 'Pending'
                            ? 'badge-status-pending'
                            : l.status === 'Cancelled'
                            ? 'bg-secondary text-white'
                            : 'badge-status-rejected'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {l.reviewedBy ? (
                        <div>
                          <strong>{l.reviewedBy.name}:</strong> {l.reviewComment || 'Approved'}
                        </div>
                      ) : (
                        'Pending Review'
                      )}
                    </td>
                    <td>
                      {l.status === 'Pending' ? (
                        <div className="d-flex gap-2">
                          <button
                            onClick={() => handleOpenReview(l, 'approve')}
                            className="btn btn-sm btn-success py-1 px-2.5"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenReview(l, 'reject')}
                            className="btn btn-sm btn-outline-danger py-1 px-2.5"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="small text-muted">-</span>
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
                <button type="button" className="btn-close" onClick={() => setSelectedLeave(null)}></button>
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
                      {reviewAction === 'approve' ? 'HR Decision Note (Optional)' : 'Rejection Reason (Required)'}
                    </label>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder={reviewAction === 'approve' ? 'Approved by HR...' : 'Specify reasons for refusal...'}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required={reviewAction === 'reject'}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setSelectedLeave(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className={`btn ${reviewAction === 'approve' ? 'btn-success' : 'btn-danger'}`}>
                    {submitting ? 'Updating...' : reviewAction === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
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

export default HRLeaveManagement;
