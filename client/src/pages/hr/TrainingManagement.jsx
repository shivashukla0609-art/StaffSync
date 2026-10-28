import React, { useState, useEffect } from 'react';
import { FiAward, FiPlus, FiUsers, FiEdit2, FiTrash2, FiCalendar, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const HRTrainingManagement = () => {
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTraining, setSelectedTraining] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    description: '',
    trainer: '',
    startDate: '',
    endDate: '',
    capacity: 25,
    departmentId: '',
    location: 'Corporate HQ & Zoom Webcast',
  };
  const [form, setForm] = useState(initialForm);

  const fetchTrainings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/trainings');
      if (res.data?.success) {
        setTrainings(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await api.get('/departments');
      if (res.data?.success) setDepartments(res.data.data);
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    fetchTrainings();
    fetchDepts();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/trainings', form);
      toast.success(res.data.message || 'Training program created successfully');
      setShowAddModal(false);
      setForm(initialForm);
      fetchTrainings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create training');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewEnrollments = async (training) => {
    try {
      const res = await api.get(`/trainings/${training._id}`);
      if (res.data?.success) {
        setSelectedTraining(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load participant enrollments');
    }
  };

  const handleUpdateCompletion = async (enrollmentId, completionStatus) => {
    try {
      await api.patch(`/trainings/${selectedTraining._id}/enrollments/${enrollmentId}`, {
        completionStatus,
        feedback: completionStatus === 'Completed' ? 'Certified by HR' : 'Incomplete',
      });
      toast.success('Participant status updated');
      handleViewEnrollments(selectedTraining);
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this training program?')) return;
    try {
      await api.delete(`/trainings/${id}`);
      toast.success('Training program removed');
      fetchTrainings();
    } catch (err) {
      toast.error('Failed to remove program');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company Training & Learning Programs</h4>
          <p className="text-muted small mb-0">Oversee corporate capability workshops, certifications, and employee skill progress.</p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setShowAddModal(true);
          }}
          className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiPlus />
          <span>New Training Program</span>
        </button>
      </div>

      {/* Grid of Programs */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Trainings...</span>
            </div>
          </div>
        ) : trainings.length === 0 ? (
          <div className="col-12">
            <div className="app-card p-5 text-center text-muted">
              <FiAward size={40} className="mb-2 text-secondary" />
              <h5>No Training Programs Found</h5>
              <p className="small">Click 'New Training Program' to launch a workshop.</p>
            </div>
          </div>
        ) : (
          trainings.map((t) => (
            <div key={t._id} className="col-md-6 col-lg-4">
              <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary">
                      {t.departmentId?.name || 'All Organization'}
                    </span>
                    <span className={`badge ${t.status === 'Upcoming' ? 'badge-status-pending' : 'badge-status-present'}`}>
                      {t.status}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{t.title}</h5>
                  <p className="text-muted small mb-3">{t.description}</p>

                  <div className="small text-muted d-flex flex-column gap-1 mb-3">
                    <div>Trainer: <strong>{t.trainer}</strong></div>
                    <div>
                      Schedule: {new Date(t.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                      {new Date(t.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div>Seats: <strong>{t.enrolledCount} / {t.capacity}</strong></div>
                    <div>Location: <strong>{t.location}</strong></div>
                  </div>
                </div>

                <div className="border-top pt-3 d-flex justify-content-between align-items-center gap-2">
                  <button
                    onClick={() => handleViewEnrollments(t)}
                    className="btn btn-sm btn-outline-custom flex-grow-1 d-flex align-items-center justify-content-center gap-1.5"
                  >
                    <FiUsers size={14} />
                    <span>Participants ({t.enrolledCount})</span>
                  </button>
                  <button
                    onClick={() => handleDelete(t._id)}
                    className="btn btn-sm btn-outline-danger p-1.5"
                    title="Delete Program"
                  >
                    <FiTrash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Create Training Program</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Course Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Modern Full-Stack Cloud Architecture"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Syllabus and learning outcomes..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    ></textarea>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Trainer Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Alex Mercer"
                        value={form.trainer}
                        onChange={(e) => setForm({ ...form, trainer: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Max Capacity</label>
                      <input
                        type="number"
                        min="1"
                        max="200"
                        className="form-control"
                        value={form.capacity}
                        onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                        required
                      />
                    </div>
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

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Target Department</label>
                      <select
                        className="form-select"
                        value={form.departmentId}
                        onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      >
                        <option value="">All Company</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Location / Channel</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Zoom Webcast"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Creating...' : 'Create Program'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enrollments Modal */}
      {selectedTraining && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <div>
                  <h5 className="modal-title fw-bold text-dark">{selectedTraining.title}</h5>
                  <small className="text-muted">Enrolled participants & certification status</small>
                </div>
                <button type="button" className="btn-close" onClick={() => setSelectedTraining(null)}></button>
              </div>

              <div className="modal-body px-4 py-3">
                {(!selectedTraining.enrollments || selectedTraining.enrollments.length === 0) ? (
                  <div className="text-center py-4 text-muted">
                    No participants have registered for this program yet.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Participant</th>
                          <th>Department</th>
                          <th>Enrolled Date</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTraining.enrollments.map((enr) => (
                          <tr key={enr._id}>
                            <td>
                              <div className="fw-semibold text-dark">{enr.employeeId?.name}</div>
                              <small className="text-muted">{enr.employeeId?.email} • {enr.employeeId?.employeeId}</small>
                            </td>
                            <td className="small text-muted">{enr.employeeId?.department?.name || '-'}</td>
                            <td className="small text-muted">
                              {new Date(enr.enrolledAt).toLocaleDateString()}
                            </td>
                            <td>
                              <span
                                className={`badge rounded-pill ${
                                  enr.completionStatus === 'Completed'
                                    ? 'badge-status-approved'
                                    : enr.completionStatus === 'In Progress'
                                    ? 'badge-status-present'
                                    : 'badge-status-pending'
                                }`}
                              >
                                {enr.completionStatus}
                              </span>
                            </td>
                            <td>
                              {enr.completionStatus !== 'Completed' ? (
                                <button
                                  onClick={() => handleUpdateCompletion(enr._id, 'Completed')}
                                  className="btn btn-sm btn-success py-1 px-2.5"
                                >
                                  Certify Complete
                                </button>
                              ) : (
                                <span className="small text-success fw-medium">
                                  <FiCheck className="me-1" />
                                  Certified
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="modal-footer border-top px-4 py-3">
                <button type="button" className="btn btn-outline-custom" onClick={() => setSelectedTraining(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HRTrainingManagement;
