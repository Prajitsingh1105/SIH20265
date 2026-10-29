import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useDemo } from '../../context/DemoContext';
import { Bell, LogOut, Shield, User as UserIcon, CheckCircle2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const { setIsGuideOpen } = useDemo();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const fetchNotifs = async () => {
    if (user) {
      try {
        const res = await api.getNotifications();
        if (res.success && res.data) {
          setUnreadCount(res.data.unreadCount);
          setNotifications(res.data.notifications || []);
        }
      } catch {
        // Ignore
      }
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const markAllRead = async () => {
    await api.markAllNotificationsRead();
    setUnreadCount(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Branding & National Emblem Placeholder */}
        <Link to="/" className="flex items-center space-x-3 group">
          {/* Neutral Government Shield Emblem Placeholder */}
          <div className="w-12 h-12 bg-gov-navy-900 rounded-lg flex items-center justify-center text-amber-400 shadow-sm border border-gov-navy-800">
            <Shield className="w-7 h-7 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-extrabold text-gov-navy-900 tracking-tight">
                {t('portal.title')}
              </span>
              <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-300">
                AICTE
              </span>
            </div>
            <p className="text-xs font-medium text-gray-700">
              {t('portal.subtitle')}
            </p>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              {t('portal.org')}
            </p>
          </div>
        </Link>

        {/* Right: Actions, Notifications & User Account */}
        <div className="flex items-center space-x-3">
          {/* Floating Demo Guide Pill Trigger */}
          <button
            onClick={() => setIsGuideOpen(true)}
            className="hidden md:flex items-center space-x-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gov-navy-900 font-bold text-xs rounded-md shadow-sm transition"
          >
            <span>▶</span>
            <span>{t('btn.guide')}</span>
          </button>

          {user ? (
            <>
              {/* Notification Bell */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="relative p-2 text-gray-600 hover:text-gov-navy-900 hover:bg-gray-100 rounded-full transition"
                  title="Notifications & Maturity Alerts"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
                      <span className="font-semibold text-xs text-gray-900">
                        Maturity & Compliance Alerts
                      </span>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-[11px] text-gov-navy-light hover:underline font-medium"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <p className="text-center text-xs text-gray-500 py-4">No new notifications</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 text-xs transition ${n.isRead ? 'bg-white' : 'bg-amber-50/50'}`}
                          >
                            <div className="flex items-start gap-2">
                              {n.type === 'ESCALATION' ? (
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-gov-navy-DEFAULT shrink-0 mt-0.5" />
                              )}
                              <div>
                                <p className="font-semibold text-gray-900">{n.title}</p>
                                <p className="text-gray-600 mt-0.5">{n.message}</p>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  {new Date(n.createdAt).toLocaleTimeString('en-IN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Identity Pill */}
              <div className="hidden sm:flex flex-col text-right pr-2 border-r border-gray-200">
                <span className="text-xs font-bold text-gov-navy-900 truncate max-w-[200px]">
                  {user.fullName}
                </span>
                <span className="text-[10px] font-medium text-amber-700">
                  {user.roleDisplayName || user.role} {user.institution ? `(${user.institution.code})` : ''}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 px-3 py-1.5 border border-gray-300 rounded-md text-xs font-semibold text-gray-700 hover:bg-gray-100 transition"
              >
                <LogOut className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden md:inline">{t('logout')}</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="px-4 py-2 bg-gov-navy-900 hover:bg-gov-navy-800 text-white text-xs font-bold rounded-md shadow-xs transition"
            >
              {t('login')}
            </Link>
          )}
        </div>
      </div>

      {/* Indian National Tricolour Stripe Band */}
      <div className="w-full flex h-1">
        <div className="w-1/3 bg-gov-saffron"></div>
        <div className="w-1/3 bg-white"></div>
        <div className="w-1/3 bg-gov-green"></div>
      </div>
    </header>
  );
};
