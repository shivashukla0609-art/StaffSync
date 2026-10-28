import React, { useState, useEffect } from 'react';
import { FiCalendar, FiClock, FiDownload, FiEdit3, FiSearch, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AttendanceManagement = () => {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Filters
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Correction Modal
  const [correctingRecord, setCorrectingRecord] = useState(null);
  const [correctionForm, setCorrectionForm] = useState({
    clockIn: '',
    clockOut: '',
    status: 'PRESENT',
    correctionReason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const params = {};
      if (date) params.date = date;
      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/attendance', { params });
      if (res.data?.success) {
        setRecords(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load organization attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date, departmentFilter, statusFilter]);

  useEffect(() => {
    const fetchDepts = async () => {
      try {
        const res = await api.get('/departments');
        if (res.data?.success) setDepartments(res.data.data);
      } catch (e) {
        // quiet
      }
    };
    fetchDepts();
  }, []);

  const handleExportCSV = () => {
    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/reports/attendance?format=csv`;
    window.open(url, '_blank');
  };

  const handleOpenCorrection = (r) => {
    setCorrectingRecord(r);
    setCorrectionForm({
      clockIn: r.clockIn ? new Date(r.clockIn).toISOString().slice(0, 16) : '',
      clockOut: r.clockOut ? new Date(r.clockOut).toISOString().slice(0, 16) : '',
      status: r.status,
      correctionReason: '',
    });
  };

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!correctionForm.correctionReason.trim()) {
      toast.error('A justification reason is required for audit logs.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.patch(`/attendance/${correctingRecord._id}/correction`, correctionForm);
      toast.success(res.data.message || 'Attendance corrected successfully');
      setCorrectingRecord(null);
      fetchAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to correct record');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company-Wide Attendance Administration</h4>
          <p className="text-muted small mb-0">Inspect daily logs, correct timing anomalies, and export attendance records.</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="btn btn-outline-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiDownload />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="app-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-sm-4 col-md-3">
            <label className="form-label small text-muted mb-1 fw-semibold">Attendance Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="col-sm-4 col-md-3">
            <label className="form-label small text-muted mb-1 fw-semibold">Department</label>
            <select
              className="form-select form-select-sm"
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-sm-4 col-md-3">
            <label className="form-label small text-muted mb-1 fw-semibold">Status</label>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="HALF_DAY">Half Day</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          <div className="col-md-3 d-flex align-items-end">
            <button
              onClick={() => {
                setDate('');
                setDepartmentFilter('');
                setStatusFilter('');
              }}
              className="btn btn-sm btn-light border w-100 py-1.5"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="app-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">Logs on {date || 'All Recorded Dates'} ({records.length})</h5>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Records...</span>
            </div>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiClock size={36} className="mb-2 text-secondary" />
            <p>No attendance records found for the selected parameters.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Clock In</th>
                  <th>Clock Out</th>
                  <th>Total Time</th>
                  <th>Status</th>
                  <th>Correction / Audit</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => {
                  const hours = (r.totalWorkingMinutes / 60).toFixed(1);
                  return (
                    <tr key={r._id}>
                      <td>
                        <div className="fw-semibold text-dark">{r.employeeId?.name}</div>
                        <small className="text-muted">{r.employeeId?.email} • {r.employeeId?.employeeId}</small>
                      </td>
                      <td className="small text-muted">{r.employeeId?.department?.name || '-'}</td>
                      <td className="small text-dark fw-medium">{r.date}</td>
                      <td className="small text-muted">
                        {r.clockIn ? new Date(r.clockIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="small text-muted">
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
                            Corrected: {r.correctionReason}
                          </span>
                        ) : (
                          '-'
                        )}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenCorrection(r)}
                          className="btn btn-sm btn-outline-secondary p-1 px-2.5 d-flex align-items-center gap-1"
                          title="Manual Attendance Correction"
                        >
                          <FiEdit3 size={13} />
                          <span>Correct</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Correction Modal */}
      {correctingRecord && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark">Manual Attendance Correction</h5>
                  <small className="text-muted">
                    {correctingRecord.employeeId?.name} ({correctingRecord.date})
                  </small>
                </div>
                <button type="button" className="btn-close" onClick={() => setCorrectingRecord(null)}></button>
              </div>

              <form onSubmit={handleSubmitCorrection}>
                <div className="modal-body px-4 py-3">
                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Clock In Timestamp</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={correctionForm.clockIn}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, clockIn: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Clock Out Timestamp</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={correctionForm.clockOut}
                        onChange={(e) => setCorrectionForm({ ...correctionForm, clockOut: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Attendance Status</label>
                    <select
                      className="form-select"
                      value={correctionForm.status}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, status: e.target.value })}
                    >
                      <option value="PRESENT">PRESENT</option>
                      <option value="LATE">LATE</option>
                      <option value="HALF_DAY">HALF_DAY</option>
                      <option value="ABSENT">ABSENT</option>
                      <option value="ON_LEAVE">ON_LEAVE</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Reason for Correction (Audit Logged)</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="e.g. Employee forgot to clock out due to offsite client meeting..."
                      value={correctionForm.correctionReason}
                      onChange={(e) => setCorrectionForm({ ...correctionForm, correctionReason: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setCorrectingRecord(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Saving...' : 'Apply Correction & Log'}
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

export default AttendanceManagement;
