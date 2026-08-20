import { useState } from 'react';
import {
  Link,
  useNavigate,
} from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  UserPlus,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!form.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (form.password.length < 6) {
      toast.error(
        'Password must contain at least 6 characters'
      );
      return;
    }

    setLoading(true);

    try {
      const user = await register(
        form.name,
        form.email,
        form.password
      );

      toast.success(
        `Welcome to StageOne, ${
          user.name.split(' ')[0]
        }!`
      );

      navigate('/events');
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="grid min-h-screen lg:grid-cols-2">

        {/* ================================================== */}
        {/* BRAND PANEL                                         */}
        {/* ================================================== */}

        <div className="hidden bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 p-12 text-white lg:flex lg:flex-col lg:justify-between">

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
              <Ticket size={23} />
            </div>

            <span className="text-xl font-bold">
              StageOne
            </span>

          </div>

          <div className="max-w-lg">

            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-white/60">
              Your seat. Your event.
            </p>

            <h1 className="text-5xl font-bold leading-tight">
              Experience events
              <br />
              without the hassle.
            </h1>

            <p className="mt-6 max-w-md text-base leading-7 text-white/70">
              Create your account and discover
              concerts, movies, shows and experiences
              with secure real-time seat booking.
            </p>

          </div>

          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} StageOne
          </p>

        </div>

        {/* ================================================== */}
        {/* SIGNUP FORM                                         */}
        {/* ================================================== */}

        <div className="flex items-center justify-center px-5 py-10 sm:px-8">

          <div className="w-full max-w-md">

            {/* Mobile Logo */}
            <div className="mb-8 flex items-center gap-2 lg:hidden">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Ticket size={20} />
              </div>

              <span className="text-lg font-bold text-slate-900">
                StageOne
              </span>

            </div>

            <div className="mb-8">

              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <UserPlus size={23} />
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                Create your account
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Join StageOne and start booking your
                favourite events.
              </p>

            </div>

            <form
              onSubmit={handleSubmit}
              className="space-y-5"
            >

              {/* Name */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Full name
                </label>

                <input
                  required
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />

              </div>

              {/* Email */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Email address
                </label>

                <input
                  required
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                />

              </div>

              {/* Password */}
              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Password
                </label>

                <div className="relative">

                  <input
                    required
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        !showPassword
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>

                </div>

                <p className="mt-2 text-xs text-slate-400">
                  Use at least 6 characters.
                </p>

              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <UserPlus size={17} />
                    Create account
                  </>
                )}

              </button>

            </form>

            {/* Login */}
            <p className="mt-7 text-center text-sm text-slate-500">

              Already have an account?{' '}

              <Link
                to="/login"
                className="font-semibold text-brand-600 hover:text-brand-700"
              >
                Sign in
              </Link>

            </p>

            {/* Account Info */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">

              <p className="text-xs leading-5 text-slate-500">
                New accounts are automatically created
                as <strong>CUSTOMER</strong> accounts.
                You can use your own email and password
                to sign in later.
              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}