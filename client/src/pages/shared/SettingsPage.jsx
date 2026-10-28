import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { FiSettings, FiLock, FiShield, FiInfo, FiServer, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const SettingsPage = () => {
  const { user } = useSelector((state) => state.auth);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);

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
    <div className="mx-auto" style={{ maxWidth: '850px' }}>
      {/* Header */}
      <div className="mb-4">
        <h4 className="fw-bold text-dark mb-1">Account & Security Settings</h4>
        <p className="text-muted small mb-0">Manage password credentials and review active session parameters.</p>
      </div>

      <div className="row g-4">
        {/* Profile & Session Overview */}
        <div className="col-md-5">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-3">Account Summary</h5>

            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom">
              <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                style={{
                  width: '50px',
                  height: '50px',
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  fontSize: '1.25rem',
                }}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h6 className="fw-bold text-dark mb-0">{user?.name}</h6>
                <small className="text-muted">{user?.email}</small>
                <div>
                  <span className={`badge rounded-pill ${user?.role === 'HR' ? 'badge-role-hr' : user?.role === 'MANAGER' ? 'badge-role-manager' : 'badge-role-employee'}`} style={{ fontSize: '0.65rem' }}>
                    {user?.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="d-flex flex-column gap-2 small mb-4">
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Employee ID:</span>
                <strong className="text-dark">{user?.employeeId || 'N/A'}</strong>
              </div>
              <div className="d-flex justify-content-between py-1 border-bottom">
                <span className="text-muted">Department:</span>
                <strong className="text-dark">{user?.department?.name || 'Assigned Division'}</strong>
              </div>
              <div className="d-flex justify-content-between py-1">
                <span className="text-muted">Account Status:</span>
                <span className="badge bg-success-subtle text-success">{user?.employmentStatus || 'ACTIVE'}</span>
              </div>
            </div>

            <div className="p-3 bg-light rounded-3 small">
              <div className="d-flex align-items-center gap-2 mb-1 fw-bold text-dark">
                <FiServer size={14} className="text-primary" />
                <span>Security Environment</span>
              </div>
              <p className="text-muted small mb-0">
                StaffSync uses JSON Web Tokens (JWT) and Bcrypt 10-round salted password hashing with role-based database authorization.
              </p>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="col-md-7">
          <div className="app-card p-4 h-100">
            <h5 className="fw-bold text-dark mb-1">Update Password</h5>
            <p className="text-muted small mb-4">Protect your account with a strong, distinct password.</p>

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
                    placeholder="At least 6 characters"
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
                    placeholder="Repeat new password"
                    value={passwordForm.confirmNewPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmNewPassword: e.target.value })}
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                className="btn btn-primary-custom d-flex align-items-center gap-2"
              >
                <FiCheck />
                <span>{savingPassword ? 'Updating Password...' : 'Save New Password'}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
