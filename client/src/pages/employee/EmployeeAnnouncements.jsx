import React, { useState, useEffect } from 'react';
import { FiSearch, FiFileText, FiTag, FiClock, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const EmployeeAnnouncements = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (category) params.category = category;
      if (search) params.search = search;

      const res = await api.get('/announcements', { params });
      if (res.data?.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [category]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company Announcements</h4>
          <p className="text-muted small mb-0">Stay informed with company policies, festive notices, and organizational updates.</p>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '320px' }}>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search announcements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit" className="btn btn-sm btn-primary-custom">
            <FiSearch />
          </button>
        </form>
      </div>

      {/* Category Pills */}
      <div className="d-flex flex-wrap gap-2 mb-4">
        {['', 'General', 'HR Policy', 'Events', 'Holidays'].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`btn btn-sm ${category === cat ? 'btn-primary-custom' : 'btn-outline-custom'}`}
          >
            {cat || 'All Categories'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Announcements...</span>
          </div>
        </div>
      ) : announcements.length === 0 ? (
        <div className="app-card p-5 text-center text-muted">
          <FiFileText size={40} className="mb-2 text-secondary" />
          <h5>No Announcements Found</h5>
          <p className="small">There are no updates matching your selected filters.</p>
        </div>
      ) : (
        <div className="row g-4">
          {announcements.map((ann) => (
            <div key={ann._id} className="col-12 col-lg-6">
              <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <span className="badge bg-secondary-subtle text-secondary">{ann.category}</span>
                    <span
                      className={`badge ${
                        ann.priority === 'URGENT'
                          ? 'bg-danger text-white'
                          : ann.priority === 'HIGH'
                          ? 'bg-warning text-dark'
                          : 'bg-light text-muted'
                      }`}
                    >
                      {ann.priority} Priority
                    </span>
                  </div>

                  <h5 className="fw-bold text-dark mb-2">{ann.title}</h5>
                  <p className="text-muted small mb-4" style={{ whiteSpace: 'pre-line' }}>
                    {ann.description}
                  </p>
                </div>

                <div className="border-top pt-3 d-flex align-items-center justify-content-between text-muted small">
                  <div className="d-flex align-items-center gap-1">
                    <FiUser size={14} />
                    <span>Posted by {ann.createdBy?.name || 'HR Admin'}</span>
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <FiClock size={14} />
                    <span>{new Date(ann.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeAnnouncements;
