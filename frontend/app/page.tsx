import Link from 'next/link';
import MainLayout from './components/MainLayout';

export default function Dashboard() {
  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl text-gray-900 mb-2">Welcome to CampusOS</h1>
          <p className="text-lg text-gray-600">
            Campus Management & Community Platform
          </p>
          <div className="flex gap-3 mt-4">
            <Link
              href="/login"
              className="inline-flex items-center px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center gap-6 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-4xl min-w-fit">🏫</div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold m-0 mb-2">
                Institutes
              </p>
              <p className="text-3xl font-bold text-gray-900 m-0">0</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center gap-6 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-4xl min-w-fit">🎯</div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold m-0 mb-2">
                Clubs
              </p>
              <p className="text-3xl font-bold text-gray-900 m-0">0</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center gap-6 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-4xl min-w-fit">📅</div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold m-0 mb-2">
                Events
              </p>
              <p className="text-3xl font-bold text-gray-900 m-0">0</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 flex items-center gap-6 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="text-4xl min-w-fit">👥</div>
            <div className="flex-1">
              <p className="text-xs text-gray-600 uppercase tracking-wide font-semibold m-0 mb-2">
                Members
              </p>
              <p className="text-3xl font-bold text-gray-900 m-0">0</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl text-gray-900 mb-6 mt-0">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 text-center">
              <span className="text-2xl">➕</span>
              <span className="text-sm font-semibold text-gray-900">
                Create Institute
              </span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 text-center">
              <span className="text-2xl">➕</span>
              <span className="text-sm font-semibold text-gray-900">
                Create Club
              </span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 text-center">
              <span className="text-2xl">➕</span>
              <span className="text-sm font-semibold text-gray-900">
                Schedule Event
              </span>
            </button>
            <button className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-dashed border-gray-300 rounded-lg cursor-pointer transition-all duration-200 hover:border-blue-500 hover:bg-blue-50 hover:-translate-y-0.5 active:translate-y-0 text-center">
              <span className="text-2xl">👥</span>
              <span className="text-sm font-semibold text-gray-900">
                Invite Member
              </span>
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="text-2xl text-gray-900 mb-6 mt-0">Recent Activity</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-400 text-base m-0">
              No recent activity. Create an institute or club to get started!
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
