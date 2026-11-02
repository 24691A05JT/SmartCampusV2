import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import apiClient from '../services/apiClient';
import { useToast } from '../context/ToastContext';
import {
  Bell,
  CheckCheck,
  Trash2,
  Ticket,
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Star,
  Award,
  Calendar,
  ExternalLink,
  Filter,
  Check
} from 'lucide-react';

const typeConfig = {
  registration: {
    icon: Ticket,
    color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
  },
  attendance: {
    icon: ClipboardCheck,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  approval: {
    icon: CheckCircle2,
    color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  },
  rejection: {
    icon: XCircle,
    color: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  },
  feedback: {
    icon: Star,
    color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
  },
  certificate: {
    icon: Award,
    color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
  },
  event_update: {
    icon: Calendar,
    color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20'
  },
  system: {
    icon: Bell,
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
};

export const NotificationsPage = () => {
  const { addToast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread' | 'read'
  const [actionLoading, setActionLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      let url = '/notifications?limit=50';
      if (activeTab === 'unread') url += '&isRead=false';
      if (activeTab === 'read') url += '&isRead=true';

      const res = await apiClient.get(url);
      setNotifications(res.data.notifications || []);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      addToast('Unable to load notifications.', 'error');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addToast]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id) => {
    try {
      const res = await apiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      if (res.data?.unreadCount !== undefined) {
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setActionLoading(true);
    try {
      await apiClient.patch('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      addToast('All notifications marked as read.', 'success');
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      addToast('Failed to mark all as read.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await apiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      addToast('Notification removed.', 'info');
    } catch (err) {
      console.error('Failed to delete notification:', err);
      addToast('Unable to delete notification.', 'error');
    }
  };

  const handleClearRead = async () => {
    setActionLoading(true);
    try {
      const res = await apiClient.delete('/notifications/clear-read');
      setNotifications((prev) => prev.filter((n) => !n.isRead));
      addToast(`Cleared ${res.data?.deletedCount || 0} read notifications.`, 'info');
    } catch (err) {
      console.error('Failed to clear read notifications:', err);
      addToast('Unable to clear notifications.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-400" />
            <span>Notification Center</span>
            {unreadCount > 0 && (
              <Badge variant="primary" size="sm">
                {unreadCount} unread
              </Badge>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time activity alerts, registration statuses, and campus announcements.
          </p>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={actionLoading}
              leftIcon={<CheckCheck className="w-4 h-4 text-indigo-400" />}
            >
              Mark All Read
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearRead}
            disabled={actionLoading || notifications.length === 0}
            className="text-xs text-slate-400 hover:text-slate-200"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Read
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: `Unread (${unreadCount})` },
          { key: 'read', label: 'Read' }
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List Container */}
      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="p-4 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse space-y-2"
              >
                <div className="h-4 bg-slate-800 rounded w-1/3" />
                <div className="h-3 bg-slate-800 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={Bell}
            title={activeTab === 'unread' ? 'All Caught Up!' : 'No Notifications'}
            description={
              activeTab === 'unread'
                ? 'You have reviewed all your alerts. New event and attendance updates will appear here.'
                : 'No notification records found in this category.'
            }
          />
        ) : (
          notifications.map((item) => {
            const conf = typeConfig[item.type] || typeConfig.system;
            const Icon = conf.icon;

            return (
              <div
                key={item._id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${
                  item.isRead
                    ? 'bg-slate-900/30 border-slate-800/80 hover:bg-slate-900/60'
                    : 'bg-indigo-950/20 border-indigo-500/30 hover:bg-indigo-950/30 shadow-md shadow-indigo-950/20'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category Icon */}
                  <div className={`p-2.5 rounded-xl border shrink-0 ${conf.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Body Text */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-white">
                        {item.title}
                      </h4>
                      {!item.isRead && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500 ring-2 ring-indigo-500/30 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 sm:self-center shrink-0">
                  {item.link && (
                    <Link to={item.link}>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 gap-1.5"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  )}

                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item._id)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDeleteNotification(item._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg text-xs transition-colors cursor-pointer"
                    title="Delete notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
