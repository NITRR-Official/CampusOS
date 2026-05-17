'use client';

import { useState } from 'react';

export default function Header() {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="flex items-center justify-between p-4 md:p-8 bg-white border-b border-gray-200 h-20 shadow-sm">
      <div className="flex-1">
        <h2 className="text-3xl font-semibold text-gray-900 m-0">Dashboard</h2>
      </div>

      <div className="flex items-center gap-8 ml-auto">
        {/* Search bar */}
        <div className="relative w-80">
          <input
            type="text"
            placeholder="Search..."
            className="w-full px-2.5 py-2 border border-gray-300 rounded text-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            aria-label="Search"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            🔍
          </span>
        </div>

        {/* Notifications */}
        <div className="relative flex items-center">
          <button
            className="bg-none border-none text-2xl cursor-pointer relative p-2 rounded transition-all duration-200 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            🔔
            <span className="absolute top-0 right-0 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-semibold border-2 border-white">
              3
            </span>
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-2 w-96 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                <p className="text-sm font-medium text-gray-900 m-0">
                  New event created
                </p>
                <p className="text-xs text-gray-400 m-0 mt-1">5 minutes ago</p>
              </div>
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                <p className="text-sm font-medium text-gray-900 m-0">
                  Club request approved
                </p>
                <p className="text-xs text-gray-400 m-0 mt-1">1 hour ago</p>
              </div>
              <div className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer">
                <p className="text-sm font-medium text-gray-900 m-0">
                  New member joined
                </p>
                <p className="text-xs text-gray-400 m-0 mt-1">3 hours ago</p>
              </div>
              <a
                href="#"
                className="block p-3 text-center text-blue-500 text-sm font-medium border-t border-gray-100 hover:bg-gray-50 transition-colors duration-200"
              >
                View all notifications
              </a>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="flex items-center">
          <button
            className="flex items-center gap-3 bg-none border border-gray-300 rounded p-2 cursor-pointer transition-all duration-200 text-gray-900 hover:bg-gray-50 hover:border-blue-500"
            aria-label="User menu"
          >
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xl shrink-0">
              👤
            </div>
            <span className="text-sm font-medium hidden lg:inline">
              Admin User
            </span>
            <span className="text-xs text-gray-400">▼</span>
          </button>
        </div>
      </div>
    </header>
  );
}
