import React from 'react';
import { NavLink } from 'react-router-dom';
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
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

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

  return (
    <aside className="w-64 bg-gov-navy-900 text-gray-200 shrink-0 min-h-[calc(100vh-100px)] border-r border-gov-navy-800 flex flex-col justify-between py-4">
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

      {/* Tenancy / Access Context Banner */}
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
    </aside>
  );
};
