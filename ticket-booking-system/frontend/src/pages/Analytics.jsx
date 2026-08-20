import { useEffect, useState } from 'react';

import {
  BarChart3,
  IndianRupee,
  Ticket,
  Users,
  CalendarDays,
  TrendingUp,
  XCircle,
} from 'lucide-react';

import toast from 'react-hot-toast';

import api from '../api/axios';

import Layout from '../components/Layout';

import { useAuth } from '../context/AuthContext';


export default function Analytics() {

  const {
    user,
  } = useAuth();


  const [
    data,
    setData,
  ] = useState(null);


  const [
    loading,
    setLoading,
  ] = useState(true);


  // ==========================================================
  // LOAD ANALYTICS
  // ==========================================================

  async function loadAnalytics() {

    try {

      setLoading(true);


      const response =
        await api.get(
          '/admin/analytics'
        );


      setData(
        response.data
      );

    } catch (error) {

      console.error(
        'Analytics error:',
        error
      );


      toast.error(
        error.response?.data?.message ||
        'Failed to load analytics'
      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    if (
      user?.role === 'ADMIN' ||
      user?.role === 'ORGANISER'
    ) {

      loadAnalytics();

    }

  }, [user?.role]);


  const summary =
    data?.summary || {};


  const monthly =
    data?.monthly || [];


  const eventPerformance =
    data?.eventPerformance || [];


  const isOrganizer =
    user?.role === 'ORGANISER';


  return (

    <Layout>

      <div className="mx-auto max-w-7xl">


        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mb-8">

          <div className="flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600">

              <BarChart3 size={24} />

            </div>


            <div>

              <p className="text-sm font-medium text-brand-600">

                {isOrganizer
                  ? 'Organizer Insights'
                  : 'Platform Insights'}

              </p>


              <h1 className="text-3xl font-bold text-gray-900">

                Analytics

              </h1>


              <p className="mt-1 text-sm text-gray-500">

                {isOrganizer
                  ? 'Track the performance of your events.'
                  : 'Monitor StageOne platform performance.'}

              </p>

            </div>

          </div>

        </div>


        {/* ====================================================
            SUMMARY
        ==================================================== */}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">


          <Metric
            title="Revenue"
            value={
              loading
                ? '—'
                : `₹${Number(
                    summary.totalRevenue || 0
                  ).toLocaleString('en-IN')}`
            }
            icon={IndianRupee}
          />


          <Metric
            title="Bookings"
            value={
              loading
                ? '—'
                : summary.totalBookings || 0
            }
            icon={Ticket}
          />


          <Metric
            title="Confirmed"
            value={
              loading
                ? '—'
                : summary.confirmedBookings || 0
            }
            icon={TrendingUp}
          />


          <Metric
            title={
              isOrganizer
                ? 'Customers'
                : 'Users'
            }
            value={
              loading
                ? '—'
                : summary.totalUsers || 0
            }
            icon={Users}
          />


          <Metric
            title="Events"
            value={
              loading
                ? '—'
                : summary.totalEvents || 0
            }
            icon={CalendarDays}
          />

        </div>


        {/* ====================================================
            CANCELLED
        ==================================================== */}

        <div className="mt-4">

          <div className="inline-flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">

            <XCircle
              size={19}
              className="text-red-500"
            />

            <span className="text-sm text-gray-500">
              Cancelled bookings
            </span>

            <span className="font-bold text-gray-900">
              {loading
                ? '—'
                : summary.cancelledBookings || 0}
            </span>

          </div>

        </div>


        {/* ====================================================
            MONTHLY PERFORMANCE
        ==================================================== */}

        <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 px-6 py-5">

            <h2 className="font-bold text-gray-900">
              Monthly Performance
            </h2>

            <p className="mt-1 text-sm text-gray-500">

              {isOrganizer
                ? 'Your booking and revenue performance.'
                : 'Platform booking and revenue performance.'}

            </p>

          </div>


          {loading ? (

            <div className="p-12 text-center text-sm text-gray-400">
              Loading analytics...
            </div>

          ) : monthly.length === 0 ? (

            <div className="p-12 text-center">

              <BarChart3
                size={36}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-500">
                No booking data available yet.
              </p>

            </div>

          ) : (

            <div className="overflow-x-auto">

              <table className="w-full">

                <thead>

                  <tr className="border-b border-gray-100 bg-gray-50">

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                      Month
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                      Bookings
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                      Revenue
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {monthly.map(
                    (item) => (

                      <tr
                        key={item.month}
                        className="border-b border-gray-50 last:border-0"
                      >

                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                          {formatMonth(item.month)}
                        </td>


                        <td className="px-6 py-4 text-right text-sm text-gray-600">
                          {item.bookings}
                        </td>


                        <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">

                          ₹{Number(
                            item.revenue || 0
                          ).toLocaleString('en-IN')}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* ====================================================
            ORGANIZER EVENT PERFORMANCE
        ==================================================== */}

        {isOrganizer && (

          <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">

            <div className="border-b border-gray-100 px-6 py-5">

              <h2 className="font-bold text-gray-900">
                Event Performance
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Performance of your individual events.
              </p>

            </div>


            {loading ? (

              <div className="p-8 text-center text-sm text-gray-400">
                Loading...
              </div>

            ) : eventPerformance.length === 0 ? (

              <div className="p-8 text-center text-sm text-gray-500">
                You haven't created any events yet.
              </div>

            ) : (

              <div className="overflow-x-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b border-gray-100 bg-gray-50">

                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                        Event
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                        Bookings
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                        Confirmed
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                        Cancelled
                      </th>

                      <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-400">
                        Revenue
                      </th>

                    </tr>

                  </thead>


                  <tbody>

                    {eventPerformance.map(
                      (event) => (

                        <tr
                          key={event.id}
                          className="border-b border-gray-50 last:border-0"
                        >

                          <td className="px-6 py-4">

                            <p className="font-semibold text-gray-900">
                              {event.title}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">

                              {new Date(
                                event.date
                              ).toLocaleDateString(
                                'en-IN',
                                {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                }
                              )}

                            </p>

                          </td>


                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {event.bookings}
                          </td>


                          <td className="px-6 py-4 text-right text-sm font-semibold text-green-600">
                            {event.confirmedBookings}
                          </td>


                          <td className="px-6 py-4 text-right text-sm text-red-500">
                            {event.cancelledBookings}
                          </td>


                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">

                            ₹{Number(
                              event.revenue || 0
                            ).toLocaleString(
                              'en-IN'
                            )}

                          </td>

                        </tr>

                      )
                    )}

                  </tbody>

                </table>

              </div>

            )}

          </div>

        )}


        {/* ====================================================
            BOOKING ACTIVITY
        ==================================================== */}

        {!loading &&
          monthly.length > 0 && (

            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

              <h2 className="font-bold text-gray-900">
                Booking Activity
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Relative booking volume by month.
              </p>


              <div className="mt-6 space-y-4">

                {monthly.map(
                  (item) => {

                    const max =
                      Math.max(
                        ...monthly.map(
                          (x) =>
                            x.bookings
                        ),
                        1
                      );


                    const width =
                      Math.max(
                        4,
                        (
                          item.bookings /
                          max
                        ) * 100
                      );


                    return (

                      <div
                        key={item.month}
                      >

                        <div className="mb-2 flex justify-between text-xs">

                          <span className="font-semibold text-gray-600">
                            {formatMonth(item.month)}
                          </span>

                          <span className="font-bold text-gray-900">
                            {item.bookings} bookings
                          </span>

                        </div>


                        <div className="h-3 overflow-hidden rounded-full bg-gray-100">

                          <div
                            className="h-full rounded-full bg-brand-600 transition-all"
                            style={{
                              width:
                                `${width}%`,
                            }}
                          />

                        </div>

                      </div>

                    );

                  }
                )}

              </div>

            </div>

          )}

      </div>

    </Layout>

  );

}


// ============================================================
// METRIC
// ============================================================

function Metric({
  title,
  value,
  icon: Icon,
}) {

  return (

    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div className="flex items-center justify-between">

        <div>

          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

        </div>


        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">

          <Icon size={20} />

        </div>

      </div>

    </div>

  );

}


// ============================================================
// FORMAT MONTH
// ============================================================

function formatMonth(value) {

  const [
    year,
    month,
  ] = value.split('-');


  const date =
    new Date(
      Number(year),
      Number(month) - 1,
      1
    );


  return date.toLocaleDateString(
    'en-IN',
    {
      month: 'short',
      year: 'numeric',
    }
  );

}