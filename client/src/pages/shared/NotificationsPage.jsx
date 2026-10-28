import React, { useState, useEffect } from 'react';
import { FiBell, FiCheck, FiCheckCircle, FiCalendar, FiAward, FiFileText, FiClock } from 'react-icons/fi';
import toast from 'react-hot-toast';
import api from '../../services/api';

const NotificationsPage = () => {
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/notifications');
      if (res.data?.success) {
        setNotifications(res.data.data);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch (err) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'LEAVE':
        return <FiCalendar className="text-warning" />;
      case 'TRAINING':
        return <FiAward className="text-info" />;
      case 'ANNOUNCEMENT':
        return <FiFileText className="text-primary" />;
      case 'ATTENDANCE':
        return <FiClock className="text-success" />;
      default:
        return <FiBell className="text-secondary" />;
    }
  };

  return (
    <div className="mx-auto" style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h4 className="fw-bold text-dark mb-1">Notifications</h4>
          <p className="text-muted small mb-0">System alerts, leave updates, announcements, and training reminders.</p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn btn-outline-custom btn-sm d-flex align-items-center gap-1.5"
          >
            <FiCheck />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading Notifications...</span>
          </div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="app-card p-5 text-center text-muted">
          <FiBell size={40} className="mb-2 text-secondary" />
          <h5>No Notifications</h5>
          <p className="small">You are all caught up! There are no new notifications at this time.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((n) => (
            <div
              key={n._id}
              className={`app-card p-3 d-flex align-items-start justify-content-between gap-3 ${
                !n.isRead ? 'border-primary border-opacity-25 bg-white shadow-sm' : 'bg-light bg-opacity-50'
              }`}
            >
              <div className="d-flex align-items-start gap-3">
                <div
                  className="rounded-circle p-2.5 d-flex align-items-center justify-content-center bg-light border mt-1"
                  style={{ fontSize: '1.2rem' }}
                >
                  {getTypeIcon(n.type)}
                </div>
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6 className="fw-bold text-dark mb-0">{n.title}</h6>
                    {!n.isRead && (
                      <span className="badge bg-primary rounded-pill" style={{ fontSize: '0.65rem' }}>
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-muted small mb-1">{n.message}</p>
                  <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                    {new Date(n.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </small>
                </div>
              </div>

              {!n.isRead && (
                <button
                  onClick={() => handleMarkAsRead(n._id)}
                  className="btn btn-sm btn-light border flex-shrink-0 text-muted"
                  title="Mark as read"
                >
                  <FiCheck size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
