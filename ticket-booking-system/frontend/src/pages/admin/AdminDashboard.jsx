import { useEffect, useState } from 'react';

import {
  Users,
  CalendarDays,
  Building2,
  Ticket,
  IndianRupee,
  UserCheck,
  Clock,
  ArrowRight,
  BarChart3,
} from 'lucide-react';

import {
  Link,
} from 'react-router-dom';

import toast from 'react-hot-toast';

import api from '../../api/axios';

import Layout from '../../components/Layout';


export default function AdminDashboard() {

  const [
    stats,
    setStats,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  const [
    pendingOrganizers,
    setPendingOrganizers,
  ] = useState([]);


  // ==========================================================
  // LOAD DASHBOARD
  // ==========================================================

  async function loadDashboard() {

    try {

      setLoading(true);


      const [
        dashboardResponse,
        organizerResponse,
      ] = await Promise.all([

        api.get(
          '/admin/dashboard/stats'
        ),

        api.get(
          '/admin/organizers/pending'
        ),

      ]);


      setStats(
        dashboardResponse.data.stats
      );


      setPendingOrganizers(
        organizerResponse.data.organizers || []
      );

    } catch (error) {

      console.error(
        'Dashboard error:',
        error
      );


      toast.error(
        error.response?.data?.message ||
        'Failed to load admin dashboard'
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadDashboard();

  }, []);


  // ==========================================================
  // STAT CARD
  // ==========================================================

  function StatCard({
    title,
    value,
    icon: Icon,
    description,
  }) {

    return (

      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

        <div className="flex items-start justify-between">

          <div>

            <p className="text-sm font-medium text-gray-500">
              {title}
            </p>


            <p className="mt-2 text-3xl font-bold text-gray-900">

              {loading
                ? '—'
                : value}

            </p>


            {description && (

              <p className="mt-1 text-xs text-gray-400">

                {description}

              </p>

            )}

          </div>


          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">

            <Icon size={22} />

          </div>

        </div>

      </div>

    );

  }


  return (

    <Layout>

      <div className="mx-auto max-w-7xl">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

          <div>

            <p className="text-sm font-medium text-brand-600">
              Administration
            </p>

            <h1 className="mt-1 text-3xl font-bold text-gray-900">
              Dashboard
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Monitor your ticketing platform.
            </p>

          </div>


          <Link
            to="/analytics"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-gray-800"
          >

            <BarChart3 size={17} />

            View Analytics

          </Link>

        </div>


        {/* ====================================================
            STATS
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Total Users"
            value={
              stats?.totalUsers ?? 0
            }
            icon={Users}
          />


          <StatCard
            title="Total Events"
            value={
              stats?.totalEvents ?? 0
            }
            icon={CalendarDays}
          />


          <StatCard
            title="Total Venues"
            value={
              stats?.totalVenues ?? 0
            }
            icon={Building2}
          />


          <StatCard
            title="Total Bookings"
            value={
              stats?.totalBookings ?? 0
            }
            icon={Ticket}
          />

        </div>


        {/* ====================================================
            FINANCIAL / BOOKING STATS
        ==================================================== */}

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          <StatCard
            title="Confirmed Bookings"
            value={
              stats?.confirmedBookings ?? 0
            }
            icon={Ticket}
          />


          <StatCard
            title="Cancelled Bookings"
            value={
              stats?.cancelledBookings ?? 0
            }
            icon={Ticket}
          />


          <StatCard
            title="Pending Organizers"
            value={
              stats?.pendingOrganizers ?? 0
            }
            icon={UserCheck}
          />


          <StatCard
            title="Confirmed Revenue"
            value={
              loading
                ? '—'
                : `₹${Number(
                    stats?.totalRevenue || 0
                  ).toLocaleString('en-IN')}`
            }
            icon={IndianRupee}
          />

        </div>


        {/* ====================================================
            LOWER SECTION
        ==================================================== */}

        <div className="mt-6 grid gap-6 lg:grid-cols-3">


          {/* ==================================================
              PENDING ORGANIZERS
          ================================================== */}

          <div className="lg:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm">

            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">

              <div>

                <h2 className="font-bold text-gray-900">
                  Pending Organizer Applications
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Applications waiting for approval.
                </p>

              </div>


              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">

                <Clock size={20} />

              </div>

            </div>


            <div className="p-6">

              {loading ? (

                <p className="py-8 text-center text-sm text-gray-400">
                  Loading...
                </p>

              ) : pendingOrganizers.length === 0 ? (

                <div className="rounded-xl bg-gray-50 p-8 text-center">

                  <UserCheck
                    size={30}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-3 text-sm font-medium text-gray-500">
                    No pending organizer applications.
                  </p>

                </div>

              ) : (

                <div className="space-y-3">

                  {pendingOrganizers
                    .slice(0, 5)
                    .map(
                      (organizer) => (

                        <div
                          key={organizer.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 p-4"
                        >

                          <div className="flex min-w-0 items-center gap-3">

                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 font-bold text-brand-600">

                              {organizer.name
                                ?.charAt(0)
                                ?.toUpperCase()}

                            </div>


                            <div className="min-w-0">

                              <p className="truncate text-sm font-semibold text-gray-900">

                                {organizer.name}

                              </p>

                              <p className="truncate text-xs text-gray-500">

                                {organizer.email}

                              </p>

                            </div>

                          </div>


                          <span className="ml-3 shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">

                            Pending

                          </span>

                        </div>

                      )
                    )}


                  <Link
                    to="/admin/organizers"
                    className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                  >

                    Review Applications

                    <ArrowRight size={17} />

                  </Link>

                </div>

              )}

            </div>

          </div>


          {/* ==================================================
              QUICK ACTIONS
          ================================================== */}

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <h2 className="font-bold text-gray-900">
              Quick Actions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Manage your platform.
            </p>


            <div className="mt-6 space-y-3">


              <Link
                to="/admin/organizers"
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
              >

                <UserCheck
                  size={20}
                  className="text-brand-600"
                />

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Organizer Approvals
                  </p>

                  <p className="text-xs text-gray-500">
                    Review applications
                  </p>

                </div>

              </Link>


              <Link
                to="/analytics"
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
              >

                <BarChart3
                  size={20}
                  className="text-brand-600"
                />

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Analytics
                  </p>

                  <p className="text-xs text-gray-500">
                    View platform performance
                  </p>

                </div>

              </Link>


              <Link
                to="/admin/venues"
                className="flex items-center gap-3 rounded-xl border border-gray-100 p-4 transition hover:bg-gray-50"
              >

                <Building2
                  size={20}
                  className="text-brand-600"
                />

                <div>

                  <p className="text-sm font-semibold text-gray-900">
                    Venues
                  </p>

                  <p className="text-xs text-gray-500">
                    Manage venues
                  </p>

                </div>

              </Link>

            </div>

          </div>

        </div>

      </div>

    </Layout>

  );

}