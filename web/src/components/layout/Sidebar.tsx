import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  LayoutDashboard,
  FolderArchive,
  FilePlus2,
  CheckSquare,
  ShieldAlert,
  Sliders,
  Radio,
  MessageSquare,
  X,
  Shield,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!user) return null;

  const role = user.role;

  const navItems = [
    {
      to: '/dashboard',
      label: t('nav.dashboard'),
      icon: LayoutDashboard,
      roles: ['INSTITUTION', 'SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'],
    },
    {
      to: '/fdrs',
      label: t('nav.repository'),
      icon: FolderArchive,
      roles: ['INSTITUTION', 'SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'],
    },
    {
      to: '/submission',
      label: t('nav.submission'),
      icon: FilePlus2,
      roles: ['INSTITUTION', 'SYSTEM_ADMIN'],
    },
    {
      to: '/release',
      label: t('nav.release'),
      icon: CheckSquare,
      roles: ['INSTITUTION', 'SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'],
    },
    {
      to: '/audit',
      label: t('nav.audit'),
      icon: ShieldAlert,
      roles: ['SCRUTINY_OFFICER', 'COMPETENT_AUTHORITY', 'SYSTEM_ADMIN'],
    },
    {
      to: '/integrations',
      label: t('nav.integrations'),
      icon: Radio,
      roles: ['SCRUTINY_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      to: '/sms-outbox',
      label: t('nav.smsOutbox'),
      icon: MessageSquare,
      roles: ['INSTITUTION', 'SCRUTINY_OFFICER', 'SYSTEM_ADMIN'],
    },
    {
      to: '/admin',
      label: t('nav.admin'),
      icon: Sliders,
      roles: ['SYSTEM_ADMIN'],
    },
  ];

  const allowedItems = navItems.filter((item) => item.roles.includes(role));

  const handleMobileLogout = async () => {
    if (onCloseMobile) onCloseMobile();
    await logout();
    navigate('/login');
  };

  const navLinksContent = (isMobile = false) => (
    <div className="space-y-1 px-3">
      <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
        Main Navigation
      </div>
      {allowedItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => {
              if (isMobile && onCloseMobile) onCloseMobile();
            }}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-md text-xs font-medium transition ${
                isActive
                  ? 'bg-amber-500 text-gov-navy-900 font-bold shadow-xs'
                  : 'text-gray-300 hover:bg-gov-navy-800 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );

  const scopeBannerContent = (
    <div className="p-3 mx-3 bg-gov-navy-800 rounded-lg border border-gov-navy-700 text-xs">
      <span className="text-[10px] text-amber-400 font-bold uppercase block">
        Current Access Scope
      </span>
      <p className="font-semibold text-white mt-0.5 truncate">
        {user.institution ? user.institution.name : 'AICTE Headquarters (National)'}
      </p>
      <p className="text-[11px] text-gray-400">
        Role: <strong className="text-gray-300">{user.role}</strong>
      </p>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Sidebar (always visible on md: and larger screens) */}
      <aside className="hidden md:flex w-64 bg-gov-navy-900 text-gray-200 shrink-0 min-h-[calc(100vh-100px)] border-r border-gov-navy-800 flex-col justify-between py-4">
        {navLinksContent(false)}
        {scopeBannerContent}
      </aside>

      {/* 2. Mobile Drawer Navigation (visible only on mobile when opened) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Slide-over Drawer Panel */}
          <aside className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-gov-navy-900 text-gray-200 shadow-2xl flex flex-col justify-between py-4 z-50 overflow-y-auto transform transition-transform">
            <div>
              {/* Drawer Header with Title and Close Button */}
              <div className="flex items-center justify-between px-4 pb-4 mb-2 border-b border-gov-navy-800">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 bg-gov-navy-800 rounded-lg flex items-center justify-center text-amber-400 border border-gov-navy-700">
                    <Shield className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-white block">
                      DEPOSIT-TRACK
                    </span>
                    <span className="text-[10px] text-amber-400 font-medium">
                      AICTE Portal
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onCloseMobile}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gov-navy-800 rounded-lg transition focus:outline-none"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Mobile Navigation Links */}
              {navLinksContent(true)}
            </div>

            {/* Bottom: Scope Banner & Logout */}
            <div className="space-y-3 mt-4">
              {scopeBannerContent}

              <div className="px-3">
                <button
                  type="button"
                  onClick={handleMobileLogout}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 border border-red-500/30 rounded-lg text-xs font-semibold transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('logout')}</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
};
