import Link from 'next/link';
import MainLayout from '../components/MainLayout';

export default function DashboardPage() {
  return (
    <MainLayout>
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-4xl text-gray-900">Welcome to CampusOS</h1>
          <p className="text-lg text-gray-600">
            Campus Management and Community Platform
          </p>
          <div className="mt-4 flex gap-3">
            <Link
              href="/login"
              className="inline-flex items-center rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
            >
              Create account
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Institutes', value: '0', badge: 'IN' },
            { label: 'Clubs', value: '0', badge: 'CL' },
            { label: 'Events', value: '0', badge: 'EV' },
            { label: 'Members', value: '0', badge: 'MB' }
          ].map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-sm font-semibold text-blue-600">
                {item.badge}
              </div>
              <div className="flex-1">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  {item.label}
                </p>
                <p className="m-0 text-3xl font-bold text-gray-900">
                  {item.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="mb-6 mt-0 text-2xl text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              'Create Institute',
              'Create Club',
              'Schedule Event',
              'Invite Member'
            ].map((action) => (
              <button
                key={action}
                className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-gray-300 bg-white p-6 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:bg-blue-50 active:translate-y-0"
              >
                <span className="text-2xl text-blue-600">+</span>
                <span className="text-sm font-semibold text-gray-900">
                  {action}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mb-8">
          <h2 className="mb-6 mt-0 text-2xl text-gray-900">Recent Activity</h2>
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
            <p className="m-0 text-base text-gray-400">
              No recent activity. Create an institute or club to get started!
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
