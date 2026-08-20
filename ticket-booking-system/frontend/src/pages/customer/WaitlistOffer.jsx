import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  ShieldCheck,
  Sparkles,
  XCircle,
} from 'lucide-react';

import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function WaitlistOffer() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [offer, setOffer] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [booking, setBooking] = useState(null);
  const [expired, setExpired] = useState(false);

  // ============================================================
  // LOAD OFFER
  // ============================================================

  useEffect(() => {
    async function loadOffer() {
      try {
        const res = await api.get(
          `/waitlist/offer/${token}`
        );

        setOffer(res.data);
      } catch (err) {
        if (err.response?.status === 410) {
          setExpired(true);
        } else {
          toast.error(
            err.response?.data?.message ||
              'Could not load this offer'
          );
        }
      } finally {
        setLoading(false);
      }
    }

    loadOffer();
  }, [token]);

  // ============================================================
  // OFFER COUNTDOWN
  // ============================================================

  useEffect(() => {
    if (!offer?.offerExpiresAt) {
      return;
    }

    function tick() {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(
            offer.offerExpiresAt
          ).getTime() -
            Date.now()) /
            1000
        )
      );

      setSecondsLeft(remaining);

      if (remaining === 0) {
        setExpired(true);
      }
    }

    tick();

    const interval = setInterval(
      tick,
      1000
    );

    return () => clearInterval(interval);
  }, [offer]);

  // ============================================================
  // CLAIM OFFER
  // ============================================================

  async function claimOffer() {
    if (
      claiming ||
      expired ||
      secondsLeft === 0
    ) {
      return;
    }

    setClaiming(true);

    try {
      const res = await api.post(
        `/waitlist/offer/${token}/complete`
      );

      setBooking(res.data);

      toast.success(
        'Waitlist seat successfully booked!'
      );
    } catch (err) {
      if (err.response?.status === 410) {
        setExpired(true);

        toast.error(
          'This waitlist offer has expired.'
        );
      } else {
        toast.error(
          err.response?.data?.message ||
            'Could not claim this seat'
        );
      }
    } finally {
      setClaiming(false);
    }
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <Layout>
        <div className="flex min-h-[450px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

            <p className="text-sm text-slate-400">
              Loading your waitlist offer...
            </p>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // SUCCESSFUL BOOKING
  // ============================================================

  if (booking) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg">

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">

            {/* Success */}
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 py-10 text-center text-white">

              <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-white/15">
                <CheckCircle2 size={40} />
              </div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">
                Waitlist converted
              </p>

              <h1 className="mt-2 text-3xl font-bold">
                Seat secured!
              </h1>

              <p className="mt-2 text-sm text-white/80">
                Your waitlist offer has been converted
                into a confirmed booking.
              </p>

            </div>

            {/* Ticket */}
            <div className="p-6">

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

                <div className="flex items-center justify-between">

                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Booking reference
                    </p>

                    <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                      {booking.reference}
                    </p>

                  </div>

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Ticket size={19} />
                  </div>

                </div>

              </div>

              {booking.qrCodeDataUrl && (
                <div className="py-6 text-center">

                  <img
                    src={
                      booking.qrCodeDataUrl
                    }
                    alt="Booking QR code"
                    className="mx-auto h-48 w-48 rounded-2xl border border-slate-200 bg-white p-2"
                  />

                  <p className="mt-3 text-xs text-slate-400">
                    Show this QR code at the venue
                  </p>

                </div>
              )}

              <div className="space-y-3 border-t border-slate-100 pt-5">

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Seat
                  </span>

                  <span className="text-sm font-bold text-slate-900">
                    {booking.seats}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Total
                  </span>

                  <span className="text-lg font-bold text-slate-900">
                    ₹{booking.totalAmount}
                  </span>

                </div>

              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">

                <button
                  onClick={() =>
                    navigate('/bookings')
                  }
                  className="btn-secondary"
                >
                  My bookings
                </button>

                <button
                  onClick={() =>
                    navigate('/events')
                  }
                  className="btn-primary"
                >
                  Browse events
                </button>

              </div>

            </div>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // EXPIRED OFFER
  // ============================================================

  if (expired) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg">

          <div className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm">

            <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-red-50 text-red-500">
              <XCircle size={40} />
            </div>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-red-500">
              Offer expired
            </p>

            <h1 className="mt-2 text-2xl font-bold text-slate-900">
              This seat offer is no longer available
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-500">
              The time limit for accepting this waitlist
              offer has passed. The seat has been returned
              to the waitlist system.
            </p>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-left">

              <div className="flex gap-3">

                <Clock3
                  size={18}
                  className="mt-0.5 shrink-0 text-slate-400"
                />

                <div>

                  <p className="text-sm font-semibold text-slate-700">
                    What happens next?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    The system automatically passes the
                    opportunity to the next eligible person
                    in the FIFO waitlist.
                  </p>

                </div>

              </div>

            </div>

            <button
              onClick={() =>
                navigate('/events')
              }
              className="btn-primary mt-6 w-full"
            >
              Browse events
            </button>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // NO OFFER
  // ============================================================

  if (!offer) {
    return (
      <Layout>
        <div className="mx-auto max-w-lg">

          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">

            <XCircle
              size={40}
              className="mx-auto text-slate-300"
            />

            <h1 className="mt-4 text-xl font-bold text-slate-900">
              Offer unavailable
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              This waitlist offer could not be found.
            </p>

            <button
              onClick={() =>
                navigate('/events')
              }
              className="btn-primary mt-6"
            >
              Back to events
            </button>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // TIMER
  // ============================================================

  const minutes = Math.floor(
    (secondsLeft || 0) / 60
  );

  const seconds =
    (secondsLeft || 0) % 60;

  const timerText = `${String(
    minutes
  ).padStart(2, '0')}:${String(
    seconds
  ).padStart(2, '0')}`;

  /*
   * The backend controls the actual expiration.
   * This percentage is only visual.
   */
  const totalOfferSeconds =
    15 * 60;

  const progress = Math.min(
    100,
    Math.max(
      0,
      ((secondsLeft || 0) /
        totalOfferSeconds) *
        100
    )
  );

  const urgent =
    (secondsLeft || 0) <= 60;

  // ============================================================
  // OFFER PAGE
  // ============================================================

  return (
    <Layout>

      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <button
          onClick={() =>
            navigate('/events')
          }
          className="mb-6 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-600"
        >
          <ArrowLeft size={16} />
          Back to events
        </button>

        {/* Main Card */}
        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">

          {/* ================================================= */}
          {/* HERO                                              */}
          {/* ================================================= */}

          <div className="relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-10 text-white">

            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

            <div className="relative">

              <div className="mb-4 flex items-center gap-2">

                <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
                  <Sparkles size={12} />
                  Waitlist offer
                </span>

              </div>

              <h1 className="text-3xl font-bold">
                A seat just opened up! 🎉
              </h1>

              <p className="mt-2 max-w-lg text-sm leading-6 text-white/75">
                You've reached the front of the waitlist.
                This seat has been temporarily reserved
                for you.
              </p>

            </div>

          </div>

          {/* ================================================= */}
          {/* CONTENT                                           */}
          {/* ================================================= */}

          <div className="p-6">

            {/* Event */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600">
                  <Ticket size={22} />
                </div>

                <div className="min-w-0">

                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Event
                  </p>

                  <h2 className="mt-1 text-lg font-bold text-slate-900">
                    {offer.eventTitle}
                  </h2>

                  <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">

                    <MapPin size={14} />

                    {offer.venue}

                  </div>

                </div>

              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-white p-3">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Category
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {offer.category}
                  </p>

                </div>

                <div className="rounded-xl bg-white p-3">

                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Price
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-800">
                    ₹{offer.price}
                  </p>

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* COUNTDOWN                                         */}
            {/* ================================================= */}

            <div
              className={`mt-5 overflow-hidden rounded-2xl border ${
                urgent
                  ? 'border-red-200'
                  : 'border-amber-200'
              }`}
            >

              <div
                className={`px-5 py-4 ${
                  urgent
                    ? 'bg-red-50'
                    : 'bg-amber-50'
                }`}
              >

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        urgent
                          ? 'bg-red-100 text-red-600'
                          : 'bg-amber-100 text-amber-600'
                      }`}
                    >
                      <Clock3 size={20} />
                    </div>

                    <div>

                      <p
                        className={`text-sm font-bold ${
                          urgent
                            ? 'text-red-900'
                            : 'text-amber-900'
                        }`}
                      >
                        Offer expires in
                      </p>

                      <p
                        className={`text-xs ${
                          urgent
                            ? 'text-red-600'
                            : 'text-amber-600'
                        }`}
                      >
                        Claim your seat before someone else gets it.
                      </p>

                    </div>

                  </div>

                  <span
                    className={`font-mono text-2xl font-bold ${
                      urgent
                        ? 'text-red-600'
                        : 'text-amber-700'
                    }`}
                  >
                    {timerText}
                  </span>

                </div>

              </div>

              <div className="bg-white px-5 py-4">

                <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      urgent
                        ? 'bg-red-500'
                        : 'bg-amber-500'
                    }`}
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            {/* ================================================= */}
            {/* PROTECTION                                       */}
            {/* ================================================= */}

            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-emerald-600"
              />

              <div>

                <p className="text-sm font-semibold text-emerald-800">
                  Your seat is temporarily protected
                </p>

                <p className="mt-1 text-xs leading-5 text-emerald-600">
                  This offer was generated automatically
                  from the event's FIFO waitlist.
                </p>

              </div>

            </div>

            {/* ================================================= */}
            {/* CLAIM BUTTON                                     */}
            {/* ================================================= */}

            <button
              onClick={claimOffer}
              disabled={
                claiming ||
                expired ||
                secondsLeft === 0
              }
              className={`mt-6 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-bold text-white transition ${
                urgent
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-brand-600 hover:bg-brand-700'
              } disabled:cursor-not-allowed disabled:opacity-50`}
            >

              {claiming ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Confirming seat...
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  Claim Seat & Complete Booking
                </>
              )}

            </button>

            <p className="mt-3 text-center text-[11px] leading-5 text-slate-400">
              By claiming this offer, the seat will be
              converted into a confirmed booking.
            </p>

          </div>

        </div>

      </div>

    </Layout>
  );
}