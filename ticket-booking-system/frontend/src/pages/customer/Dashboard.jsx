import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Ticket,
  IndianRupee,
  Clock,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function Dashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookings();
  }, []);

  async function loadBookings() {
    try {
      const res = await api.get('/bookings');
      setBookings(res.data || []);
    } catch (err) {
      console.error('Dashboard loading failed:', err);
    } finally {
      setLoading(false);
    }
  }

  const confirmed = bookings.filter(
    (b) => b.status === 'CONFIRMED'
  );

  const cancelled = bookings.filter(
    (b) => b.status === 'CANCELLED'
  );

  const totalSpent = confirmed.reduce(
    (sum, b) => sum + Number(b.totalAmount || 0),
    0
  );

  const upcoming = confirmed
    .filter(
      (b) =>
        b.event &&
        new Date(b.event.date) >= new Date()
    )
    .sort(
      (a, b) =>
        new Date(a.event.date) -
        new Date(b.event.date)
    );

  const nextEvent = upcoming[0];

  return (
    <Layout>

      {/* HEADER */}
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-600">
          CUSTOMER DASHBOARD
        </p>

        <h1 className="mt-1 text-3xl font-bold text-gray-900">
          Welcome back 👋
        </h1>

        <p className="mt-2 text-gray-500">
          Manage your tickets, bookings and upcoming events.
        </p>
      </div>


      {/* STATISTICS */}
      <div className="grid gap-4 md:grid-cols-3">

        <StatCard
          icon={<Ticket size={22} />}
          title="Total Bookings"
          value={bookings.length}
        />

        <StatCard
          icon={<IndianRupee size={22} />}
          title="Total Spent"
          value={`₹${totalSpent}`}
        />

        <StatCard
          icon={<CalendarDays size={22} />}
          title="Upcoming Events"
          value={upcoming.length}
        />

      </div>


      {/* NEXT EVENT */}
      <div className="mt-8">

        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            Your Next Event
          </h2>

          <p className="text-sm text-gray-500">
            Your upcoming confirmed booking
          </p>
        </div>

        {loading ? (

          <div className="card">
            <p className="text-gray-400">
              Loading dashboard...
            </p>
          </div>

        ) : !nextEvent ? (

          <div className="card py-10 text-center">

            <CalendarDays
              size={42}
              className="mx-auto mb-3 text-gray-300"
            />

            <h3 className="font-semibold text-gray-700">
              No upcoming events
            </h3>

            <p className="mt-1 text-sm text-gray-400">
              Find an event and book your seats.
            </p>

            <button
              onClick={() => navigate('/events')}
              className="btn-primary mt-5"
            >
              Browse Events
            </button>

          </div>

        ) : (

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">

            <div className="bg-gradient-to-r from-brand-600 to-brand-500 p-6 text-white">

              <div className="flex items-start justify-between">

                <div>

                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    CONFIRMED
                  </span>

                  <h3 className="mt-4 text-2xl font-bold">
                    {nextEvent.event?.title}
                  </h3>

                </div>

                <Ticket size={34} />

              </div>

            </div>


            <div className="grid gap-5 p-6 md:grid-cols-3">

              <InfoItem
                icon={<CalendarDays size={18} />}
                text={new Date(
                  nextEvent.event.date
                ).toLocaleDateString()}
              />

              <InfoItem
                icon={<Clock size={18} />}
                text={nextEvent.event.time}
              />

              <InfoItem
                icon={<MapPin size={18} />}
                text={
                  nextEvent.event.venue?.name ||
                  'Venue'
                }
              />

            </div>


            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">

              <div>
                <p className="text-xs text-gray-400">
                  Booking Reference
                </p>

                <p className="font-mono font-semibold text-gray-900">
                  {nextEvent.reference}
                </p>
              </div>

              <button
                onClick={() => navigate('/bookings')}
                className="flex items-center gap-2 text-sm font-semibold text-brand-600 hover:text-brand-700"
              >
                View Ticket
                <ArrowRight size={16} />
              </button>

            </div>

          </div>

        )}

      </div>


      {/* RECENT BOOKINGS */}
      <div className="mt-8">

        <div className="mb-4 flex items-center justify-between">

          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Recent Bookings
            </h2>

            <p className="text-sm text-gray-500">
              Your latest ticket activity
            </p>
          </div>

          <button
            onClick={() => navigate('/bookings')}
            className="text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            View all
          </button>

        </div>


        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">

          {loading ? (

            <div className="p-8 text-center text-gray-400">
              Loading...
            </div>

          ) : bookings.length === 0 ? (

            <div className="p-8 text-center">
              <Ticket
                size={38}
                className="mx-auto mb-3 text-gray-300"
              />

              <p className="font-semibold text-gray-700">
                No bookings yet
              </p>

              <button
                onClick={() => navigate('/events')}
                className="btn-primary mt-4"
              >
                Browse Events
              </button>
            </div>

          ) : (

            bookings.slice(0, 5).map((booking) => (

              <div
                key={booking.id}
                className="flex items-center justify-between border-b border-gray-50 p-5 last:border-0"
              >

                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                    <Ticket size={19} />
                  </div>

                  <div>

                    <p className="font-semibold text-gray-900">
                      {booking.event?.title}
                    </p>

                    <p className="text-xs text-gray-400">
                      {booking.reference}
                    </p>

                  </div>

                </div>


                <div className="text-right">

                  <p className="font-semibold text-gray-900">
                    ₹{booking.totalAmount}
                  </p>

                  <p
                    className={`text-xs ${
                      booking.status === 'CONFIRMED'
                        ? 'text-green-600'
                        : 'text-red-500'
                    }`}
                  >
                    {booking.status}
                  </p>

                </div>

              </div>

            ))

          )}

        </div>

      </div>


      {/* QUICK ACTIONS */}
      <div className="mt-8 grid gap-4 md:grid-cols-2">

        <button
          onClick={() => navigate('/events')}
          className="card text-left transition hover:-translate-y-1 hover:shadow-md"
        >
          <CalendarDays
            className="mb-3 text-brand-600"
            size={24}
          />

          <h3 className="font-bold text-gray-900">
            Discover Events
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Explore upcoming movies, concerts and shows.
          </p>
        </button>


        <button
          onClick={() => navigate('/bookings')}
          className="card text-left transition hover:-translate-y-1 hover:shadow-md"
        >
          <Ticket
            className="mb-3 text-brand-600"
            size={24}
          />

          <h3 className="font-bold text-gray-900">
            Manage Tickets
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            View your bookings and manage your tickets.
          </p>
        </button>

      </div>

    </Layout>
  );
}


// ============================================================
// STAT CARD
// ============================================================

function StatCard({ icon, title, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">

      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </div>

      <p className="mt-5 text-sm text-gray-400">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold text-gray-900">
        {value}
      </p>

    </div>
  );
}


// ============================================================
// INFO ITEM
// ============================================================

function InfoItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 text-sm text-gray-600">

      <div className="text-brand-600">
        {icon}
      </div>

      <span>{text}</span>

    </div>
  );
}