import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  LogIn,
  Eye,
  EyeOff,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.email || !form.password) {
      toast.error('Please enter your email and password');
      return;
    }

    setLoading(true);

    try {
      const user = await login(
        form.email,
        form.password
      );

      toast.success(
        `Welcome back, ${user.name.split(' ')[0]}!`
      );

      if (user.role === 'ADMIN') {
        navigate('/admin/venues');
      } else if (user.role === 'ORGANISER') {
        navigate('/organiser/events');
      } else {
        navigate('/dashboard');
      }

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Login failed'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-50">

      {/* ==================================================
          LEFT BRAND PANEL
          ================================================== */}

      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-brand-600 via-brand-600 to-indigo-700 lg:flex">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-white/5" />

        <div className="absolute -bottom-40 -right-20 h-[500px] w-[500px] rounded-full bg-white/5" />

        <div className="relative flex w-full flex-col justify-between p-8 xl:p-10">

          {/* LOGO */}

          <div className="flex items-center gap-3">

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 text-white backdrop-blur-sm">
              <Ticket size={23} />
            </div>

            <span className="text-xl font-bold text-white">
              StageOne
            </span>

          </div>


          {/* HERO */}

          <div className="max-w-lg">

            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-white/70">
              Welcome back
            </p>

            <h2 className="text-4xl font-bold leading-tight text-white xl:text-5xl">
              Your next
              <br />
              experience awaits.
            </h2>

            <p className="mt-5 max-w-md text-base leading-7 text-white/75">
              Sign in to discover events, select your
              favourite seats and manage your bookings
              securely.
            </p>

          </div>


          {/* FOOTER */}

          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} StageOne
          </p>

        </div>

      </div>


      {/* ==================================================
          RIGHT LOGIN PANEL
          ================================================== */}

      <div className="flex w-full items-center justify-center px-6 py-8 lg:w-1/2">

        <div className="w-full max-w-md">

          {/* MOBILE LOGO */}

          <div className="mb-7 flex items-center gap-3 lg:hidden">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white">
              <Ticket size={21} />
            </div>

            <span className="text-xl font-bold text-gray-900">
              StageOne
            </span>

          </div>


          {/* HEADER */}

          <div className="mb-6">

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <LogIn size={21} />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Welcome back
            </h1>

            <p className="mt-2 text-base text-gray-500">
              Sign in to continue to your account.
            </p>

          </div>


          {/* LOGIN FORM */}

          <form
            onSubmit={handleSubmit}
            className="space-y-4"
          >

            {/* EMAIL */}

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-800">
                Email address
              </label>

              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="h-14 w-full rounded-xl border border-gray-200 bg-white px-5 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
              />

            </div>


            {/* PASSWORD */}

            <div>

              <label className="mb-1.5 block text-sm font-semibold text-gray-800">
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
                  placeholder="Enter your password"
                  className="h-14 w-full rounded-xl border border-gray-200 bg-white px-5 pr-12 text-base text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
                >

                  {showPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}

                </button>

              </div>

            </div>


            {/* SIGN IN BUTTON */}

            <button
              type="submit"
              disabled={loading}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-base font-bold text-white shadow-md shadow-brand-200 transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <LogIn size={20} />

              {loading
                ? 'Signing in...'
                : 'Sign in'}

            </button>

          </form>


          {/* CUSTOMER REGISTER */}

          <p className="mt-5 text-center text-sm text-gray-500">

            Don't have an account?{' '}

            <Link
              to="/register"
              className="font-bold text-brand-600 hover:underline"
            >
              Create one
            </Link>

          </p>


          {/* ORGANIZER REGISTER */}

          <p className="mt-2 text-center text-sm text-gray-500">

            Want to organize events?{' '}

            <Link
              to="/organizer-register"
              className="font-bold text-brand-600 hover:underline"
            >
              Register as Organizer
            </Link>

          </p>


          {/* ORGANIZER INFO */}

          <div className="mt-5 rounded-xl border border-gray-200 bg-white p-4">

            <p className="text-xs font-semibold text-gray-700">
              Organizer accounts require approval
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              After registration, an administrator will
              review your application before you can
              access event management features.
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}