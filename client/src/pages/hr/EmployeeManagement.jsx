import React, { useState, useEffect } from 'react';
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiCheckCircle,
  FiXCircle,
  FiMail,
  FiBriefcase,
  FiFilter,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeManagement = () => {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const initialForm = {
    name: '',
    email: '',
    password: 'StaffSync@123',
    role: 'EMPLOYEE',
    department: '',
    jobTitle: '',
    managerId: '',
    phone: '',
    address: '',
    salary: '',
  };
  const [form, setForm] = useState(initialForm);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (departmentFilter) params.department = departmentFilter;
      if (statusFilter) params.status = statusFilter;
      if (roleFilter) params.role = roleFilter;

      const res = await api.get('/employees', { params });
      if (res.data?.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load employees list');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [deptRes, mgrRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees?role=MANAGER'),
      ]);
      if (deptRes.data?.success) setDepartments(deptRes.data.data);
      if (mgrRes.data?.success) setManagers(mgrRes.data.data);
    } catch (e) {
      // quiet
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [departmentFilter, statusFilter, roleFilter]);

  useEffect(() => {
    fetchMeta();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEmployees();
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/employees', form);
      toast.success(res.data.message || 'Employee created successfully');
      setShowAddModal(false);
      setForm(initialForm);
      fetchEmployees();
      fetchMeta();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/employees/${editEmployee._id}`, editEmployee);
      toast.success(res.data.message || 'Employee updated successfully');
      setEditEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (id, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const res = await api.patch(`/employees/${id}/status`, { status: newStatus });
      toast.success(res.data.message || `Status updated to ${newStatus}`);
      fetchEmployees();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Employee Management</h4>
          <p className="text-muted small mb-0">Create, configure, and maintain company personnel records and access privileges.</p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setShowAddModal(true);
          }}
          className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiPlus />
          <span>New Employee</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="app-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-4">
            <form onSubmit={handleSearch} className="input-group input-group-sm">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button className="btn btn-primary-custom" type="submit">
                <FiSearch />
              </button>
            </form>
          </div>

          <div className="col-sm-3 col-md-3">
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

          <div className="col-sm-3 col-md-3">
            <select
              className="form-select form-select-sm"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="EMPLOYEE">Employee</option>
              <option value="MANAGER">Manager</option>
              <option value="HR">HR Administrator</option>
            </select>
          </div>

          <div className="col-sm-2 col-md-2">
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PROBATION">Probation</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="app-card p-4">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h5 className="fw-bold text-dark mb-0">Staff Directory ({employees.length})</h5>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Employees...</span>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-5 text-muted">
            <FiUsers size={36} className="mb-2 text-secondary" />
            <p>No employees match your search criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Manager</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td>
                      <div className="d-flex align-items-center gap-2.5">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm flex-shrink-0"
                          style={{
                            width: '36px',
                            height: '36px',
                            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                            fontSize: '0.85rem',
                          }}
                        >
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="fw-bold text-dark">{emp.name}</div>
                          <small className="text-muted">{emp.email} • <strong>{emp.employeeId}</strong></small>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge rounded-pill ${emp.role === 'HR' ? 'badge-role-hr' : emp.role === 'MANAGER' ? 'badge-role-manager' : 'badge-role-employee'}`}>
                        {emp.role}
                      </span>
                      <div className="text-muted small">{emp.jobTitle}</div>
                    </td>
                    <td className="small text-dark fw-medium">
                      {emp.department?.name || 'Unassigned'}
                    </td>
                    <td className="small text-muted">
                      {emp.managerId?.name || '-'}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill ${
                          emp.employmentStatus === 'ACTIVE'
                            ? 'badge-status-approved'
                            : emp.employmentStatus === 'PROBATION'
                            ? 'badge-status-pending'
                            : 'badge-status-rejected'
                        }`}
                      >
                        {emp.employmentStatus}
                      </span>
                    </td>
                    <td className="small text-muted">
                      {new Date(emp.joiningDate).toLocaleDateString([], { month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <button
                          onClick={() => setEditEmployee(emp)}
                          className="btn btn-sm btn-outline-secondary p-1 px-2"
                          title="Edit Employee"
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleStatusToggle(emp._id, emp.employmentStatus)}
                          className={`btn btn-sm ${emp.employmentStatus === 'ACTIVE' ? 'btn-outline-danger' : 'btn-outline-success'} p-1 px-2`}
                          title={emp.employmentStatus === 'ACTIVE' ? 'Deactivate Account' : 'Activate Account'}
                        >
                          {emp.employmentStatus === 'ACTIVE' ? <FiXCircle size={14} /> : <FiCheckCircle size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Add New Employee</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreateEmployee}>
                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Johnathan Smith"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Work Email</label>
                      <input
                        type="email"
                        className="form-control"
                        placeholder="john.smith@company.com"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Initial Role</label>
                      <select
                        className="form-select"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        required
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR">HR Administrator</option>
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Department</label>
                      <select
                        className="form-select"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-secondary">Reporting Manager</label>
                      <select
                        className="form-select"
                        value={form.managerId}
                        onChange={(e) => setForm({ ...form, managerId: e.target.value })}
                      >
                        <option value="">None / Self Managed</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.jobTitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Job Title</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="e.g. Software Engineer"
                        value={form.jobTitle}
                        onChange={(e) => setForm({ ...form, jobTitle: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Temporary Password</label>
                      <input
                        type="text"
                        className="form-control"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        placeholder="+1 (555) 000-0000"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Annual Salary ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder="e.g. 85000"
                        value={form.salary}
                        onChange={(e) => setForm({ ...form, salary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Creating...' : 'Create Employee Record'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {editEmployee && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Edit Employee: {editEmployee.name}</h5>
                <button type="button" className="btn-close" onClick={() => setEditEmployee(null)}></button>
              </div>

              <form onSubmit={handleUpdateEmployee}>
                <div className="modal-body px-4 py-3">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployee.name}
                        onChange={(e) => setEditEmployee({ ...editEmployee, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Role</label>
                      <select
                        className="form-select"
                        value={editEmployee.role}
                        onChange={(e) => setEditEmployee({ ...editEmployee, role: e.target.value })}
                        required
                      >
                        <option value="EMPLOYEE">Employee</option>
                        <option value="MANAGER">Manager</option>
                        <option value="HR">HR Administrator</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Department</label>
                      <select
                        className="form-select"
                        value={editEmployee.department?._id || editEmployee.department || ''}
                        onChange={(e) => setEditEmployee({ ...editEmployee, department: e.target.value })}
                      >
                        <option value="">Unassigned</option>
                        {departments.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Job Title</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editEmployee.jobTitle}
                        onChange={(e) => setEditEmployee({ ...editEmployee, jobTitle: e.target.value })}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Reporting Manager</label>
                      <select
                        className="form-select"
                        value={editEmployee.managerId?._id || editEmployee.managerId || ''}
                        onChange={(e) => setEditEmployee({ ...editEmployee, managerId: e.target.value })}
                      >
                        <option value="">None / Self Managed</option>
                        {managers.map((m) => (
                          <option key={m._id} value={m._id}>
                            {m.name} ({m.jobTitle})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Employment Status</label>
                      <select
                        className="form-select"
                        value={editEmployee.employmentStatus}
                        onChange={(e) => setEditEmployee({ ...editEmployee, employmentStatus: e.target.value })}
                        required
                      >
                        <option value="ACTIVE">Active</option>
                        <option value="INACTIVE">Inactive</option>
                        <option value="PROBATION">Probation</option>
                        <option value="TERMINATED">Terminated</option>
                      </select>
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control"
                        value={editEmployee.phone || ''}
                        onChange={(e) => setEditEmployee({ ...editEmployee, phone: e.target.value })}
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-secondary">Annual Salary ($)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={editEmployee.salary || ''}
                        onChange={(e) => setEditEmployee({ ...editEmployee, salary: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setEditEmployee(null)}>
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

export default EmployeeManagement;
