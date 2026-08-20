import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Ticket,
  UserPlus,
  Mail,
  Lock,
  User,
  CheckCircle,
} from 'lucide-react';

import api from '../api/axios';

export default function OrganizerRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);


  // ==========================================================
  // FORM CHANGE
  // ==========================================================

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }


  // ==========================================================
  // SUBMIT
  // ==========================================================

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

    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post(
        '/auth/register',
        {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          role: 'ORGANISER',
        }
      );

      toast.success(
        'Organizer application submitted!'
      );

      setSubmitted(true);

      console.log(
        'Organizer registration:',
        response.data
      );

    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          'Registration failed'
      );
    } finally {
      setLoading(false);
    }
  }


  // ==========================================================
  // SUCCESS SCREEN
  // ==========================================================

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4">

        <div className="w-full max-w-md">

          {/* LOGO */}

          <div className="mb-8 flex flex-col items-center">

            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200">

              <Ticket size={27} />

            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              StageOne
            </h1>

          </div>


          {/* SUCCESS CARD */}

          <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">

              <CheckCircle size={34} />

            </div>

            <h2 className="mt-5 text-2xl font-bold text-gray-900">
              Application Submitted
            </h2>

            <p className="mt-3 text-sm leading-6 text-gray-500">
              Your organizer registration has been
              submitted successfully.
            </p>

            <div className="mt-5 rounded-xl border border-amber-100 bg-amber-50 p-4 text-left">

              <p className="text-sm font-semibold text-amber-800">
                ⏳ Waiting for admin approval
              </p>

              <p className="mt-1 text-xs leading-5 text-amber-700">
                An administrator must approve your
                organizer account before you can log in
                and manage events.
              </p>

            </div>

            <button
              onClick={() => navigate('/login')}
              className="btn-primary mt-6 w-full"
            >
              Back to Login
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================================
  // REGISTRATION FORM
  // ==========================================================

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 via-white to-gray-50 px-4 py-8">

      <div className="w-full max-w-md">

        {/* LOGO */}

        <div className="mb-7 flex flex-col items-center">

          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200">

            <Ticket size={24} />

          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            StageOne
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Apply to become an event organizer
          </p>

        </div>


        {/* FORM CARD */}

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
        >

          {/* TITLE */}

          <div className="mb-6">

            <div className="flex items-center gap-2">

              <UserPlus
                size={20}
                className="text-brand-600"
              />

              <h2 className="font-bold text-gray-900">
                Organizer Registration
              </h2>

            </div>

            <p className="mt-1 text-xs text-gray-400">
              Your application will be reviewed by an
              administrator.
            </p>

          </div>


          {/* NAME */}

          <div className="mb-4">

            <label className="label">
              Full Name
            </label>

            <div className="relative">

              <User
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                required
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Your full name"
                className="input pl-10"
              />

            </div>

          </div>


          {/* EMAIL */}

          <div className="mb-4">

            <label className="label">
              Email
            </label>

            <div className="relative">

              <Mail
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                required
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="organizer@example.com"
                className="input pl-10"
              />

            </div>

          </div>


          {/* PASSWORD */}

          <div className="mb-4">

            <label className="label">
              Password
            </label>

            <div className="relative">

              <Lock
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                required
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className="input pl-10"
              />

            </div>

          </div>


          {/* CONFIRM PASSWORD */}

          <div className="mb-5">

            <label className="label">
              Confirm Password
            </label>

            <div className="relative">

              <Lock
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                required
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your password"
                className="input pl-10"
              />

            </div>

          </div>


          {/* APPROVAL NOTICE */}

          <div className="mb-5 rounded-xl border border-brand-100 bg-brand-50 p-4">

            <p className="text-xs font-semibold text-brand-800">
              Organizer approval required
            </p>

            <p className="mt-1 text-xs leading-5 text-brand-700">
              After registration, an administrator will
              review your application. You cannot access
              organizer features until your account is
              approved.
            </p>

          </div>


          {/* SUBMIT */}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full"
          >

            {loading
              ? 'Submitting application...'
              : 'Submit Organizer Request'}

          </button>

        </form>


        {/* LOGIN */}

        <p className="mt-5 text-center text-sm text-gray-500">

          Already have an account?{' '}

          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:underline"
          >
            Sign in
          </Link>

        </p>


        {/* CUSTOMER REGISTRATION */}

        <p className="mt-3 text-center text-xs text-gray-400">

          Looking for a customer account?{' '}

          <Link
            to="/register"
            className="font-medium text-gray-600 hover:underline"
          >
            Create customer account
          </Link>

        </p>

      </div>

    </div>
  );
}