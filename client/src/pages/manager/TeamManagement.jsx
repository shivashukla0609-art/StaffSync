import React, { useState, useEffect } from 'react';
import { FiUsers, FiSearch, FiMail, FiPhone, FiCalendar, FiBriefcase, FiUserCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const TeamManagement = () => {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: { search: search || undefined },
      });
      if (res.data?.success) {
        setTeam(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load team members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTeam();
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Assigned Team Members</h4>
          <p className="text-muted small mb-0">Oversee and manage direct reports assigned to your department supervision.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '320px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search team members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary-custom">
            <FiSearch />
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Team...</span>
          </div>
        </div>
      ) : team.length === 0 ? (
        <div className="app-card p-5 text-center text-muted">
          <FiUsers size={40} className="mb-2 text-secondary" />
          <h5>No Team Members Found</h5>
          <p className="small">No employees currently report to your manager profile matching the criteria.</p>
        </div>
      ) : (
        <div className="row g-4">
          {team.map((member) => (
            <div key={member._id} className="col-md-6 col-lg-4">
              <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold shadow-sm"
                      style={{
                        width: '46px',
                        height: '46px',
                        background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                        fontSize: '1.1rem',
                      }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{member.name}</h6>
                      <small className="text-muted">{member.jobTitle}</small>
                      <div>
                        <span className="badge badge-role-employee" style={{ fontSize: '0.65rem' }}>
                          {member.employeeId || 'EMP-XXXX'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="small text-muted d-flex flex-column gap-2 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <FiMail className="text-secondary" />
                      <span className="text-truncate">{member.email}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiPhone className="text-secondary" />
                      <span>{member.phone || 'No phone recorded'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiBriefcase className="text-secondary" />
                      <span>{member.department?.name || 'Assigned Division'}</span>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <FiCalendar className="text-secondary" />
                      <span>
                        Joined {member.joiningDate ? new Date(member.joiningDate).toLocaleDateString([], { month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                  <span className="badge bg-success-subtle text-success">
                    {member.employmentStatus}
                  </span>
                  <button
                    onClick={() => setSelectedMember(member)}
                    className="btn btn-sm btn-outline-custom"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Member Details Modal */}
      {selectedMember && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Employee Record</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setSelectedMember(null)}
                ></button>
              </div>

              <div className="modal-body px-4 py-3">
                <div className="text-center mb-3">
                  <div
                    className="rounded-circle d-inline-flex align-items-center justify-content-center text-white fw-bold shadow mb-2"
                    style={{
                      width: '60px',
                      height: '60px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      fontSize: '1.4rem',
                    }}
                  >
                    {selectedMember.name.charAt(0).toUpperCase()}
                  </div>
                  <h5 className="fw-bold text-dark mb-0">{selectedMember.name}</h5>
                  <small className="text-muted">{selectedMember.jobTitle}</small>
                </div>

                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Employee ID:</span>
                    <strong className="text-dark">{selectedMember.employeeId}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Email:</span>
                    <strong className="text-dark">{selectedMember.email}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Phone:</span>
                    <strong className="text-dark">{selectedMember.phone || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Address:</span>
                    <strong className="text-dark">{selectedMember.address || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Department:</span>
                    <strong className="text-dark">{selectedMember.department?.name || 'N/A'}</strong>
                  </div>
                  <div className="d-flex justify-content-between py-1 border-bottom">
                    <span className="text-muted">Status:</span>
                    <span className="badge bg-success-subtle text-success">{selectedMember.employmentStatus}</span>
                  </div>
                  <div className="d-flex justify-content-between py-1">
                    <span className="text-muted">Joining Date:</span>
                    <strong className="text-dark">
                      {selectedMember.joiningDate ? new Date(selectedMember.joiningDate).toLocaleDateString() : 'N/A'}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer border-top px-4 py-3">
                <button
                  type="button"
                  className="btn btn-primary-custom"
                  onClick={() => setSelectedMember(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
