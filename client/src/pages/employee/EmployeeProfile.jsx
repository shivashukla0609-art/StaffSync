import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUserData } from '../../store/slices/authSlice';
import { FiUser, FiMail, FiPhone, FiMapPin, FiBriefcase, FiCalendar, FiShield, FiLock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'security'
  const [personalForm, setPersonalForm] = useState({
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

  const handleUpdatePersonal = async (e) => {
    e.preventDefault();
    try {
      setSavingPersonal(true);
      const res = await api.put('/auth/profile', personalForm);
      toast.success(res.data.message || 'Personal details updated successfully');
      dispatch(updateUserData(res.data.data));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update personal details');
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success(res.data.message || 'Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">My Employee Profile</h4>
          <p className="text-muted small mb-0">View your verified organization credentials and manage personal contact details.</p>
        </div>

        {/* Tab switch */}
        <div className="btn-group p-1 bg-light border rounded-3">
          <button
            onClick={() => setActiveTab('details')}
            className={`btn btn-sm ${activeTab === 'details' ? 'btn-white shadow-sm fw-bold' : 'btn-light text-muted'}`}
          >
            Personal & Career
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`btn btn-sm ${activeTab === 'security' ? 'btn-white shadow-sm fw-bold' : 'btn-light text-muted'}`}
          >
            Password & Security
          </button>
        </div>
      </div>

      {activeTab === 'details' ? (
        <div className="row g-4">
          {/* Readonly Organizational Records */}
          <div className="col-lg-5">
            <div className="app-card p-4 h-100">
              <div className="text-center mb-4 pb-3 border-bottom">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold shadow mb-3"
                  style={{
                    width: '72px',
                    height: '72px',
                    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                    fontSize: '1.75rem',
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <h5 className="fw-bold text-dark mb-1">{user?.name}</h5>
                <span className="badge rounded-pill badge-role-employee px-3 py-1 mb-2">
                  {user?.role}
                </span>
                <div className="text-muted small">{user?.email}</div>
              </div>

              <h6 className="fw-bold text-dark mb-3">Administrative Records</h6>
              <div className="d-flex flex-column gap-2.5 small">
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Employee ID:</span>
                  <strong className="text-dark">{user?.employeeId || 'EMP-XXXX'}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Job Title:</span>
                  <strong className="text-dark">{user?.jobTitle}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Department:</span>
                  <strong className="text-dark">{user?.department?.name || 'General Staff'}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Reporting Manager:</span>
                  <strong className="text-dark">{user?.managerId?.name || 'None Assigned'}</strong>
                </div>
                <div className="d-flex justify-content-between py-1 border-bottom">
                  <span className="text-muted">Employment Status:</span>
                  <span className="badge bg-success-subtle text-success">{user?.employmentStatus || 'ACTIVE'}</span>
                </div>
                <div className="d-flex justify-content-between py-1">
                  <span className="text-muted">Joining Date:</span>
                  <strong className="text-dark">
                    {user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString([], { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                  </strong>
                </div>
              </div>
            </div>
          </div>

          {/* Editable Contact Info */}
          <div className="col-lg-7">
            <div className="app-card p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">Update Contact Information</h5>
              <p className="text-muted small mb-4">
                These personal contact fields can be updated by you directly to ensure HR records are accurate.
              </p>

              <form onSubmit={handleUpdatePersonal}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Phone Number</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <FiPhone />
                    </span>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+1 (555) 000-0000"
                      value={personalForm.phone}
                      onChange={(e) => setPersonalForm({ ...personalForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Residential Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <FiMapPin />
                    </span>
                    <textarea
                      rows={3}
                      className="form-control"
                      placeholder="Enter street, city, state, postal code"
                      value={personalForm.address}
                      onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                    ></textarea>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPersonal}
                  className="btn btn-primary-custom d-flex align-items-center gap-2"
                >
                  <FiCheck />
                  <span>{savingPersonal ? 'Saving changes...' : 'Save Changes'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        /* Password & Security Tab */
        <div className="row justify-content-center">
          <div className="col-lg-6">
            <div className="app-card p-4">
              <h5 className="fw-bold text-dark mb-2">Change Account Password</h5>
              <p className="text-muted small mb-4">
                Ensure your account uses a secure password of at least 6 characters with mixed letters and symbols.
              </p>

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Current Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <FiLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <FiLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary">Confirm New Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-white text-muted">
                      <FiLock />
                    </span>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={passwordForm.confirmNewPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="btn btn-primary-custom w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                >
                  <FiLock />
                  <span>{savingPassword ? 'Updating Password...' : 'Update Password'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeProfile;
