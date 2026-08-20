import {
  User,
  Mail,
  ShieldCheck,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="mx-auto max-w-4xl">

      {/* Header */}
      <div className="mb-8">

        <button
          onClick={() => navigate(-1)}
          className="mb-5 flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ChevronLeft size={17} />
          Back
        </button>

        <h1 className="text-3xl font-bold text-gray-900">
          Settings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Manage your StageOne account and preferences.
        </p>

      </div>

      {/* Profile */}
      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="font-bold text-gray-900">
            Profile information
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Your registered account details
          </p>

        </div>

        <div className="space-y-5 p-6">

          {/* Avatar */}
          <div className="flex items-center gap-4">

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100 text-xl font-bold text-brand-700">
              {user?.name?.[0]?.toUpperCase() ||
                'U'}
            </div>

            <div>

              <p className="text-lg font-bold text-gray-900">
                {user?.name || 'User'}
              </p>

              <p className="text-sm capitalize text-gray-400">
                {user?.role?.toLowerCase()}
              </p>

            </div>

          </div>

          {/* Name */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

            <div className="flex items-center gap-3">

              <User
                size={18}
                className="text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Full name
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {user?.name || 'Not available'}
                </p>
              </div>

            </div>

          </div>

          {/* Email */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

            <div className="flex items-center gap-3">

              <Mail
                size={18}
                className="text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Registered email
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {user?.email || 'Not available'}
                </p>
              </div>

            </div>

          </div>

          {/* Account role */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">

            <div className="flex items-center gap-3">

              <ShieldCheck
                size={18}
                className="text-gray-400"
              />

              <div>
                <p className="text-xs text-gray-400">
                  Account type
                </p>

                <p className="mt-1 text-sm font-semibold capitalize text-gray-900">
                  {user?.role?.toLowerCase()}
                </p>
              </div>

            </div>

          </div>

        </div>

      </section>

      {/* Security */}
      <section className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">

        <div className="border-b border-gray-100 px-6 py-5">

          <h2 className="font-bold text-gray-900">
            Account security
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Your StageOne account authentication
          </p>

        </div>

        <div className="flex items-center gap-4 p-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <ShieldCheck size={21} />
          </div>

          <div className="flex-1">

            <p className="text-sm font-bold text-gray-900">
              Account protected
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Your account is authenticated securely
              using your registered credentials.
            </p>

          </div>

          <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
            Active
          </span>

        </div>

      </section>

      {/* Logout */}
      <section className="mt-6 rounded-2xl border border-red-100 bg-white shadow-sm">

        <div className="flex items-center gap-4 p-6">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <LogOut size={20} />
          </div>

          <div className="flex-1">

            <p className="text-sm font-bold text-gray-900">
              Sign out
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Sign out of your StageOne account on
              this device.
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 transition hover:bg-red-50"
          >
            Log out
          </button>

        </div>

      </section>

    </div>
  );
}