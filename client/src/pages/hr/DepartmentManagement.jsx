import React, { useState, useEffect } from 'react';
import { FiLayers, FiPlus, FiEdit2, FiTrash2, FiUsers, FiMapPin, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const DepartmentManagement = () => {
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    name: '',
    code: '',
    description: '',
    location: 'Headquarters',
    managerId: '',
  };
  const [form, setForm] = useState(initialForm);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments');
      if (res.data?.success) {
        setDepartments(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const fetchManagers = async () => {
    try {
      const res = await api.get('/employees?role=MANAGER');
      if (res.data?.success) {
        setManagers(res.data.data);
      }
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    fetchDepartments();
    fetchManagers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/departments', form);
      toast.success(res.data.message || 'Department created successfully');
      setShowAddModal(false);
      setForm(initialForm);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/departments/${editDept._id}`, editDept);
      toast.success(res.data.message || 'Department updated successfully');
      setEditDept(null);
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      const res = await api.delete(`/departments/${id}`);
      toast.success(res.data.message || 'Department deleted');
      fetchDepartments();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cannot delete department');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Department Structure</h4>
          <p className="text-muted small mb-0">Organize company functional units, managers, and operational wings.</p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setShowAddModal(true);
          }}
          className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiPlus />
          <span>New Department</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Departments...</span>
          </div>
        </div>
      ) : departments.length === 0 ? (
        <div className="app-card p-5 text-center text-muted">
          <FiLayers size={40} className="mb-2 text-secondary" />
          <h5>No Departments Configured</h5>
          <p className="small">Click 'New Department' to establish an organization wing.</p>
        </div>
      ) : (
        <div className="row g-4">
          {departments.map((dept) => (
            <div key={dept._id} className="col-md-6 col-lg-4">
              <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="badge bg-primary-subtle text-primary fw-bold">
                      {dept.code || 'DEPT'}
                    </span>
                    <span className="badge bg-success-subtle text-success">
                      {dept.status || 'ACTIVE'}
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-1">{dept.name}</h5>
                  <p className="text-muted small mb-3">{dept.description || 'No description provided.'}</p>

                  <div className="small text-muted d-flex flex-column gap-1.5 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <FiUser className="text-secondary" />
                      <span>Manager: <strong>{dept.managerId?.name || 'Unassigned'}</strong></span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiMapPin className="text-secondary" />
                      <span>Location: <strong>{dept.location}</strong></span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiUsers className="text-secondary" />
                      <span>Headcount: <strong>{dept.employeeCount || 0} Employees</strong></span>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-3 d-flex justify-content-end gap-2">
                  <button
                    onClick={() => setEditDept(dept)}
                    className="btn btn-sm btn-outline-secondary p-1 px-2.5 d-flex align-items-center gap-1"
                  >
                    <FiEdit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDelete(dept._id)}
                    className="btn btn-sm btn-outline-danger p-1 px-2.5 d-flex align-items-center gap-1"
                  >
                    <FiTrash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Department Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Create Department</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Department Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Engineering & Technology"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Code (Abbr)</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. ENG"
                        value={form.code}
                        onChange={(e) => setForm({ ...form, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Location / Floor</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Floor 4, West"
                        value={form.location}
                        onChange={(e) => setForm({ ...form, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Designated Manager</label>
                    <select
                      className="form-select"
                      value={form.managerId}
                      onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                    >
                      <option value="">Select Manager...</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.jobTitle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      placeholder="Functional purpose of this department..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Creating...' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Department Modal */}
      {editDept && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Edit Department</h5>
                <button type="button" className="btn-close" onClick={() => setEditDept(null)}></button>
              </div>

              <form onSubmit={handleUpdate}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Department Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editDept.name}
                      onChange={(e) => setEditDept({ ...editDept, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Code (Abbr)</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editDept.code}
                        onChange={(e) => setEditDept({ ...editDept, code: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Location</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editDept.location || ''}
                        onChange={(e) => setEditDept({ ...editDept, location: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Designated Manager</label>
                    <select
                      className="form-select"
                      value={editDept.managerId?._id || editDept.managerId || ''}
                      onChange={(e) => setEditDept({ ...editDept, managerId: e.target.value })}
                    >
                      <option value="">Select Manager...</option>
                      {managers.map((m) => (
                        <option key={m._id} value={m._id}>
                          {m.name} ({m.jobTitle})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Description</label>
                    <textarea
                      rows={2}
                      className="form-control"
                      value={editDept.description || ''}
                      onChange={(e) => setEditDept({ ...editDept, description: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setEditDept(null)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Saving...' : 'Save Changes'}
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

export default DepartmentManagement;
