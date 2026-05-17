'use client';

import Link from 'next/link';
import { useState } from 'react';

interface SidebarLink {
  href: string;
  label: string;
  icon: string;
}

const SIDEBAR_LINKS: SidebarLink[] = [
  { href: '/', label: 'Dashboard', icon: '📊' },
  { href: '/institutes', label: 'Institutes', icon: '🏫' },
  { href: '/clubs', label: 'Clubs', icon: '🎯' },
  { href: '/events', label: 'Events', icon: '📅' },
  { href: '/tasks', label: 'Tasks', icon: '🧩' },
  { href: '/calendar', label: 'Calendar', icon: '📆' },
  { href: '/users', label: 'Users', icon: '👥' },
  { href: '/settings', label: 'Settings', icon: '⚙️' }
];

export default function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`${isCollapsed ? 'w-20' : 'w-80'} h-screen bg-gray-900 text-gray-100 flex flex-col border-r border-gray-700 transition-all duration-300 overflow-y-auto relative`}
    >
      <div className="p-6 border-b border-gray-700 bg-black">
        <div className="flex items-center justify-between gap-2">
          {!isCollapsed && (
            <span className="text-xl font-bold text-blue-400">CampusOS</span>
          )}
          <button
            className="bg-none border-none text-gray-400 cursor-pointer text-xl p-1 transition-colors duration-200 hover:text-gray-200 ml-auto"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="flex flex-col gap-2">
          {SIDEBAR_LINKS.map((link) => (
            <li key={link.href} className="px-2">
              <Link
                href={link.href}
                className="relative flex items-center gap-4 px-4 py-3 text-gray-300 no-underline rounded transition-all duration-200 hover:bg-gray-700 hover:text-gray-100 group before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-blue-400 before:rounded-r before:opacity-0 before:transition-opacity before:duration-200 group-hover:before:opacity-100"
              >
                <span className="text-xl min-w-fit flex items-center justify-center">
                  {link.icon}
                </span>
                {!isCollapsed && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {link.label}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700 flex items-center justify-between gap-2 bg-black">
        {!isCollapsed && (
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-2xl shrink-0">
              👤
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <p className="text-sm font-semibold text-gray-100 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                User
              </p>
              <p className="text-xs text-gray-400 m-0 whitespace-nowrap overflow-hidden text-ellipsis">
                Admin
              </p>
            </div>
          </div>
        )}
        <button
          className="bg-none border-none text-gray-400 cursor-pointer text-xl p-2 rounded transition-all duration-200 hover:bg-gray-700 hover:text-red-500 shrink-0"
          title="Logout"
        >
          🚪
        </button>
      </div>
    </aside>
  );
}
