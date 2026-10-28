import React, { useState, useEffect } from 'react';
import { FiAward, FiCalendar, FiUser, FiMapPin, FiCheckCircle, FiClock, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeTrainings = () => {
  const [loading, setLoading] = useState(true);
  const [trainings, setTrainings] = useState([]);
  const [myEnrollments, setMyEnrollments] = useState([]);
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'my'
  const [enrollingId, setEnrollingId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [trainingsRes, myRes] = await Promise.all([
        api.get('/trainings'),
        api.get('/trainings/me/enrollments'),
      ]);

      if (trainingsRes.data?.success) {
        setTrainings(trainingsRes.data.data);
      }
      if (myRes.data?.success) {
        setMyEnrollments(myRes.data.data);
      }
    } catch (err) {
      toast.error('Failed to load training programs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEnroll = async (trainingId) => {
    try {
      setEnrollingId(trainingId);
      const res = await api.post(`/trainings/${trainingId}/enroll`);
      toast.success(res.data.message || 'Enrolled in training successfully!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to enroll');
    } finally {
      setEnrollingId(null);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading Trainings...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Training & Professional Development</h4>
          <p className="text-muted small mb-0">Upskill your capabilities through curated internal workshops and seminars.</p>
        </div>

        {/* Tab Switcher */}
        <div className="btn-group p-1 bg-light border rounded-3">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`btn btn-sm ${activeTab === 'catalog' ? 'btn-white shadow-sm fw-bold' : 'btn-light text-muted'}`}
          >
            Available Programs ({trainings.length})
          </button>
          <button
            onClick={() => setActiveTab('my')}
            className={`btn btn-sm ${activeTab === 'my' ? 'btn-white shadow-sm fw-bold' : 'btn-light text-muted'}`}
          >
            My Enrollments ({myEnrollments.length})
          </button>
        </div>
      </div>

      {activeTab === 'catalog' ? (
        <div className="row g-4">
          {trainings.map((t) => {
            const isFull = t.availableSeats <= 0;
            return (
              <div key={t._id} className="col-md-6 col-lg-4">
                <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="badge bg-primary-subtle text-primary">
                        {t.departmentId?.name || 'All Company'}
                      </span>
                      <span className={`badge ${t.status === 'Upcoming' ? 'badge-status-pending' : t.status === 'In Progress' ? 'badge-status-present' : 'bg-light text-muted'}`}>
                        {t.status}
                      </span>
                    </div>

                    <h5 className="fw-bold text-dark mb-2">{t.title}</h5>
                    <p className="text-muted small mb-3">{t.description}</p>

                    <div className="small text-muted d-flex flex-column gap-1 mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <FiUser className="text-secondary" />
                        <span>Trainer: <strong>{t.trainer}</strong></span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FiCalendar className="text-secondary" />
                        <span>
                          {new Date(t.startDate).toLocaleDateString([], { month: 'short', day: 'numeric' })} -{' '}
                          {new Date(t.endDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <FiMapPin className="text-secondary" />
                        <span>{t.location || 'Online Classroom'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-3">
                    <div className="d-flex justify-content-between align-items-center mb-2 small">
                      <span className="text-muted">Seats: {t.enrolledCount} / {t.capacity}</span>
                      <span className={isFull ? 'text-danger fw-semibold' : 'text-success fw-semibold'}>
                        {isFull ? 'Program Full' : `${t.availableSeats} seats remaining`}
                      </span>
                    </div>

                    {t.isEnrolled ? (
                      <button disabled className="btn btn-outline-success w-100 d-flex align-items-center justify-content-center gap-2">
                        <FiCheck />
                        <span>You are Enrolled</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnroll(t._id)}
                        disabled={isFull || enrollingId === t._id}
                        className="btn btn-primary-custom w-100 d-flex align-items-center justify-content-center gap-2"
                      >
                        {enrollingId === t._id ? 'Enrolling...' : isFull ? 'No Seats Available' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* My Enrollments View */
        <div className="app-card p-4">
          <h5 className="fw-bold text-dark mb-3">Enrolled Courses & Workshops</h5>

          {myEnrollments.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <FiAward size={36} className="mb-2 text-secondary" />
              <p>You haven't enrolled in any training programs yet. Explore the catalog tab above!</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Program Title</th>
                    <th>Schedule</th>
                    <th>Trainer</th>
                    <th>Enrollment Status</th>
                    <th>Completion Status</th>
                    <th>Trainer Feedback</th>
                  </tr>
                </thead>
                <tbody>
                  {myEnrollments.map((enr) => (
                    <tr key={enr._id}>
                      <td className="fw-semibold text-dark">{enr.trainingId?.title}</td>
                      <td className="small text-muted">
                        {enr.trainingId?.startDate && new Date(enr.trainingId.startDate).toLocaleDateString()}
                      </td>
                      <td className="small text-muted">{enr.trainingId?.trainer}</td>
                      <td>
                        <span className="badge bg-primary-subtle text-primary">
                          {enr.enrollmentStatus}
                        </span>
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
                      <td className="small text-muted">
                        {enr.feedback || 'In evaluation / Ongoing'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmployeeTrainings;
