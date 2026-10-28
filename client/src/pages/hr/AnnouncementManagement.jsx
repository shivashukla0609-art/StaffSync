import React, { useState, useEffect } from 'react';
import { FiFileText, FiPlus, FiEdit2, FiTrash2, FiSearch, FiCalendar, FiUser } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const AnnouncementManagement = () => {
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editAnn, setEditAnn] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const initialForm = {
    title: '',
    description: '',
    category: 'General',
    priority: 'MEDIUM',
    status: 'Published',
  };
  const [form, setForm] = useState(initialForm);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const params = {};
      if (categoryFilter) params.category = categoryFilter;
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
  }, [categoryFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAnnouncements();
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.post('/announcements', form);
      toast.success(res.data.message || 'Announcement published successfully');
      setShowAddModal(false);
      setForm(initialForm);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const res = await api.put(`/announcements/${editAnn._id}`, editAnn);
      toast.success(res.data.message || 'Announcement updated');
      setEditAnn(null);
      fetchAnnouncements();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update announcement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this announcement?')) return;
    try {
      await api.delete(`/announcements/${id}`);
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      toast.error('Failed to delete announcement');
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Company Announcements Management</h4>
          <p className="text-muted small mb-0">Broadcast notices, holiday calendars, policy changes, and events company-wide.</p>
        </div>

        <button
          onClick={() => {
            setForm(initialForm);
            setShowAddModal(true);
          }}
          className="btn btn-primary-custom d-flex align-items-center gap-2 shadow-sm"
        >
          <FiPlus />
          <span>New Announcement</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="app-card p-3 mb-4 bg-white">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex flex-wrap gap-2">
            {['', 'General', 'HR Policy', 'Events', 'Holidays'].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`btn btn-sm ${categoryFilter === cat ? 'btn-primary-custom' : 'btn-outline-custom'}`}
              >
                {cat || 'All Categories'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="d-flex gap-2" style={{ maxWidth: '300px' }}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Search notices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button type="submit" className="btn btn-sm btn-primary-custom">
              <FiSearch />
            </button>
          </form>
        </div>
      </div>

      {/* Announcements List */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading Notices...</span>
            </div>
          </div>
        ) : announcements.length === 0 ? (
          <div className="col-12">
            <div className="app-card p-5 text-center text-muted">
              <FiFileText size={40} className="mb-2 text-secondary" />
              <h5>No Announcements Found</h5>
              <p className="small">Click 'New Announcement' to publish a notice.</p>
            </div>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann._id} className="col-md-6 col-lg-4">
              <div className="app-card p-4 h-100 d-flex flex-column justify-content-between">
                <div>
                  <div className="d-flex justify-content-between align-items-center mb-2">
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
                  <p className="text-muted small mb-3" style={{ whiteSpace: 'pre-line' }}>
                    {ann.description}
                  </p>
                </div>

                <div className="border-top pt-3 d-flex align-items-center justify-content-between">
                  <small className="text-muted">
                    {new Date(ann.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </small>
                  <div className="d-flex gap-2">
                    <button
                      onClick={() => setEditAnn(ann)}
                      className="btn btn-sm btn-outline-secondary p-1 px-2.5 d-flex align-items-center gap-1"
                    >
                      <FiEdit2 size={13} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(ann._id)}
                      className="btn btn-sm btn-outline-danger p-1 px-2.5 d-flex align-items-center gap-1"
                    >
                      <FiTrash2 size={13} />
                      <span>Delete</span>
                    </button>
                  </div>
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
                <h5 className="modal-title fw-bold text-dark">Publish Company Announcement</h5>
                <button type="button" className="btn-close" onClick={() => setShowAddModal(false)}></button>
              </div>

              <form onSubmit={handleCreate}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Annual Company Offsite 2026"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Category</label>
                      <select
                        className="form-select"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="General">General</option>
                        <option value="HR Policy">HR Policy</option>
                        <option value="Events">Events</option>
                        <option value="Holidays">Holidays</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Priority</label>
                      <select
                        className="form-select"
                        value={form.priority}
                        onChange={(e) => setForm({ ...form, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Announcement Content</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      placeholder="Full details of this company broadcast..."
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn btn-primary-custom">
                    {submitting ? 'Publishing...' : 'Publish Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editAnn && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow">
              <div className="modal-header border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Edit Announcement</h5>
                <button type="button" className="btn-close" onClick={() => setEditAnn(null)}></button>
              </div>

              <form onSubmit={handleUpdate}>
                <div className="modal-body px-4 py-3">
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editAnn.title}
                      onChange={(e) => setEditAnn({ ...editAnn, title: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Category</label>
                      <select
                        className="form-select"
                        value={editAnn.category}
                        onChange={(e) => setEditAnn({ ...editAnn, category: e.target.value })}
                      >
                        <option value="General">General</option>
                        <option value="HR Policy">HR Policy</option>
                        <option value="Events">Events</option>
                        <option value="Holidays">Holidays</option>
                      </select>
                    </div>

                    <div className="col-6">
                      <label className="form-label small fw-semibold text-secondary">Priority</label>
                      <select
                        className="form-select"
                        value={editAnn.priority}
                        onChange={(e) => setEditAnn({ ...editAnn, priority: e.target.value })}
                      >
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Content</label>
                    <textarea
                      rows={4}
                      className="form-control"
                      value={editAnn.description}
                      onChange={(e) => setEditAnn({ ...editAnn, description: e.target.value })}
                      required
                    ></textarea>
                  </div>
                </div>

                <div className="modal-footer border-top px-4 py-3">
                  <button type="button" className="btn btn-outline-custom" onClick={() => setEditAnn(null)}>
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

export default AnnouncementManagement;
