import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Ticket,
  Users,
  Timer,
  Zap,
  ShieldCheck,
} from 'lucide-react';

import api from '../../api/axios';
import { useSocket } from '../../context/SocketContext';
import Layout from '../../components/Layout';
import SeatGrid from '../../components/SeatGrid';

export default function SeatMap() {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const socketRef = useSocket();

  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [selected, setSelected] = useState([]);
  const [holdExpiresAt, setHoldExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  // Live activity
  const [activity, setActivity] = useState([]);

  const selectedRef = useRef([]);
  selectedRef.current = selected;

  // ============================================================
  // LOAD EVENT + SEAT MAP
  // ============================================================

  const load = useCallback(async () => {
    try {
      const [evRes, mapRes] = await Promise.all([
        api.get(`/events/${eventId}`),
        api.get(`/seats/${eventId}/seatmap`),
      ]);

      setEvent(evRes.data);
      setSeats(mapRes.data.seats);
      setPricing(mapRes.data.pricing);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not load event information'
      );
    }
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  // ============================================================
  // REAL-TIME SOCKET.IO SEAT UPDATES
  // ============================================================

  useEffect(() => {
    const socket = socketRef?.current;

    if (!socket) return;

    socket.emit('joinShow', eventId);

    const handler = (payload) => {
      // Find the seat before updating state
      const changedSeat = seats.find(
        (seat) =>
          seat.showSeatId === payload.showSeatId
      );

      // Update seat status
      setSeats((prev) =>
        prev.map((seat) =>
          seat.showSeatId === payload.showSeatId
            ? {
                ...seat,
                status: payload.status,
                holdExpiresAt: payload.holdExpiresAt,
                heldByMe:
                  payload.heldByMe ?? seat.heldByMe,
              }
            : seat
        )
      );

      // Add activity entry
      if (changedSeat) {
        const seatName = `${changedSeat.row}${changedSeat.number}`;

        let message = '';
        let icon = '🟢';

        if (payload.status === 'HELD') {
          message = `Seat ${seatName} is temporarily held`;
          icon = '🟡';
        } else if (payload.status === 'BOOKED') {
          message = `Seat ${seatName} was booked`;
          icon = '🔴';
        } else if (payload.status === 'AVAILABLE') {
          message = `Seat ${seatName} was released`;
          icon = '🟢';
        }

        if (message) {
          setActivity((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              message,
              icon,
              category: changedSeat.category,
              time: new Date(),
            },
            ...prev,
          ].slice(0, 6));
        }
      }
    };

    socket.on('seatUpdate', handler);

    return () => {
      socket.emit('leaveShow', eventId);
      socket.off('seatUpdate', handler);
    };
  }, [socketRef, eventId, seats]);

  // ============================================================
  // RELEASE SEATS WHEN USER LEAVES PAGE
  // ============================================================

  useEffect(() => {
    function releaseOnUnload() {
      if (selectedRef.current.length > 0) {
        const url = `${
          import.meta.env.VITE_API_URL ||
          'http://localhost:5000/api'
        }/seats/${eventId}/release`;

        const token = localStorage.getItem('token');

        if (navigator.sendBeacon) {
          navigator.sendBeacon(
            url,
            new Blob(
              [
                JSON.stringify({
                  showSeatIds:
                    selectedRef.current,
                }),
              ],
              {
                type: 'application/json',
              }
            )
          );
        }

        fetch(url, {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type':
              'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            showSeatIds:
              selectedRef.current,
          }),
        }).catch(() => {});
      }
    }

    window.addEventListener(
      'beforeunload',
      releaseOnUnload
    );

    return () => {
      window.removeEventListener(
        'beforeunload',
        releaseOnUnload
      );

      releaseOnUnload();
    };
  }, [eventId]);

  // ============================================================
  // SEAT HOLD COUNTDOWN / TTL
  // ============================================================

  useEffect(() => {
    if (!holdExpiresAt) {
      setSecondsLeft(null);
      return;
    }

    const tick = () => {
      const diff = Math.max(
        0,
        Math.floor(
          (new Date(holdExpiresAt).getTime() -
            Date.now()) /
            1000
        )
      );

      setSecondsLeft(diff);

      if (diff === 0) {
        toast.error(
          'Your seat reservation has expired.'
        );

        setSelected([]);
        setHoldExpiresAt(null);

        load();
      }
    };

    tick();

    const interval = setInterval(
      tick,
      1000
    );

    return () =>
      clearInterval(interval);
  }, [holdExpiresAt, load]);

  // ============================================================
  // SELECT / UNSELECT SEAT
  // ============================================================

  async function toggleSeat(seat) {
    const alreadySelected =
      selected.includes(
        seat.showSeatId
      );

    // ----------------------------------------------------------
    // UNSELECT / RELEASE
    // ----------------------------------------------------------

    if (alreadySelected) {
      try {
        await api.post(
          `/seats/${eventId}/release`,
          {
            showSeatIds: [
              seat.showSeatId,
            ],
          }
        );

        const next =
          selected.filter(
            (id) =>
              id !== seat.showSeatId
          );

        setSelected(next);

        if (next.length === 0) {
          setHoldExpiresAt(null);
        }

        return;
      } catch (err) {
        toast.error(
          err.response?.data?.message ||
          'Could not release the seat'
        );

        return;
      }
    }

    // ----------------------------------------------------------
    // HOLD NEW SEAT
    // ----------------------------------------------------------

    try {
      const res = await api.post(
        `/seats/${eventId}/hold`,
        {
          showSeatIds: [
            seat.showSeatId,
          ],
        }
      );

      setSelected([
        ...selected,
        seat.showSeatId,
      ]);

      setHoldExpiresAt(
        res.data.holdExpiresAt
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not hold that seat'
      );

      load();
    }
  }

  // ============================================================
  // CONFIRM BOOKING
  // ============================================================

  async function confirmBooking() {
    if (
      selected.length === 0 ||
      confirming ||
      secondsLeft === 0
    ) {
      return;
    }

    setConfirming(true);

    try {
      const res = await api.post(
        `/bookings/${eventId}`,
        {
          showSeatIds: selected,
        }
      );

      setConfirmedBooking(
        res.data
      );

      setSelected([]);
      setHoldExpiresAt(null);

      toast.success(
        'Booking confirmed! Check your email for the QR ticket.'
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Booking failed'
      );

      load();
    } finally {
      setConfirming(false);
    }
  }

  // ============================================================
  // WAITLIST
  // ============================================================

  async function joinWaitlist(
    categoryId
  ) {
    try {
      await api.post(
        `/waitlist/${eventId}/join`,
        {
          categoryId,
        }
      );

      toast.success(
        "You're on the waitlist! We'll email you if a seat opens up."
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
        'Could not join waitlist'
      );
    }
  }

  // ============================================================
  // CONFIRMED BOOKING SCREEN
  // ============================================================

  if (confirmedBooking) {
    return (
      <Layout>
        <div className="mx-auto max-w-md">

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* Success Header */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-700 px-6 py-8 text-center text-white">

              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/15">
                <Ticket size={30} />
              </div>

              <h2 className="text-2xl font-bold">
                Booking Confirmed!
              </h2>

              <p className="mt-2 text-sm text-white/80">
                Your seats are officially reserved.
              </p>

            </div>

            {/* Ticket Details */}
            <div className="p-6">

              <div className="rounded-xl bg-slate-50 p-4 text-center">

                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Booking Reference
                </p>

                <p className="mt-1 font-mono text-lg font-bold text-slate-900">
                  {confirmedBooking.reference}
                </p>

              </div>

              {confirmedBooking.qrCodeDataUrl && (
                <img
                  src={
                    confirmedBooking.qrCodeDataUrl
                  }
                  alt="QR ticket"
                  className="mx-auto my-6 h-48 w-48 rounded-xl border border-slate-200 p-2"
                />
              )}

              <div className="space-y-3 border-t border-slate-100 pt-5">

                <div className="flex items-center justify-between text-sm">

                  <span className="text-slate-500">
                    Seats
                  </span>

                  <span className="font-semibold text-slate-900">
                    {confirmedBooking.seats}
                  </span>

                </div>

                <div className="flex items-center justify-between">

                  <span className="text-sm text-slate-500">
                    Total paid
                  </span>

                  <span className="text-lg font-bold text-slate-900">
                    ₹
                    {
                      confirmedBooking.totalAmount
                    }
                  </span>

                </div>

              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">

                <button
                  className="btn-secondary flex-1"
                  onClick={() =>
                    navigate('/events')
                  }
                >
                  Browse more
                </button>

                <button
                  className="btn-primary flex-1"
                  onClick={() =>
                    navigate('/bookings')
                  }
                >
                  My bookings
                </button>

              </div>

            </div>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (!event) {
    return (
      <Layout>
        <div className="flex min-h-[400px] items-center justify-center">

          <div className="text-center">

            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-brand-600" />

            <p className="text-sm text-slate-400">
              Loading seat map...
            </p>

          </div>

        </div>
      </Layout>
    );
  }

  // ============================================================
  // TOTAL PRICE
  // ============================================================

  const total =
    selected.reduce(
      (sum, id) => {
        const seat =
          seats.find(
            (s) =>
              s.showSeatId === id
          );

        const price =
          pricing.find(
            (p) =>
              p.categoryId ===
              seat?.categoryId
          )?.price || 0;

        return sum + price;
      },
      0
    );

  // ============================================================
  // SOLD OUT CATEGORIES
  // ============================================================

  const soldOutCategories =
    pricing.filter(
      (p) =>
        !seats.some(
          (s) =>
            s.categoryId ===
              p.categoryId &&
            s.status ===
              'AVAILABLE'
        )
    );

  // ============================================================
  // TIMER VALUES
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
   * Assignment specifies a 10-minute
   * example TTL, so 600 seconds is used
   * for the visual progress bar.
   *
   * The actual countdown is based on
   * the server-provided holdExpiresAt.
   */
  const timerProgress =
    secondsLeft !== null
      ? Math.min(
          100,
          Math.max(
            0,
            (secondsLeft / 600) *
              100
          )
        )
      : 0;

  // ============================================================
  // MAIN PAGE
  // ============================================================

  return (
    <Layout>

      {/* ====================================================== */}
      {/* HEADER                                                  */}
      {/* ====================================================== */}

      <div className="mb-6">

        <button
          onClick={() =>
            navigate('/events')
          }
          className="mb-5 flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-600"
        >
          <ArrowLeft size={16} />
          Back to events
        </button>

        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">

          <div>

            <div className="mb-2 flex items-center gap-2">

              <span className="rounded-full bg-brand-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-700">
                {event.type ||
                  'EVENT'}
              </span>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                Live

              </span>

            </div>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {event.title}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {event.venue?.name} ·{' '}
              {new Date(
                event.date
              ).toLocaleDateString()}{' '}
              · {event.time}
            </p>

          </div>

          {/* Selected Count */}
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">

            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Your selection
            </p>

            <p className="mt-1 text-lg font-bold text-slate-900">

              {selected.length}{' '}

              <span className="text-sm font-medium text-slate-400">
                seat
                {selected.length !==
                1
                  ? 's'
                  : ''}
              </span>

            </p>

          </div>

        </div>

      </div>

      {/* ====================================================== */}
      {/* MAIN CONTENT                                            */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">

        {/* ==================================================== */}
        {/* SEAT MAP                                              */}
        {/* ==================================================== */}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <SeatGrid
            seats={seats}
            selected={selected}
            onToggle={toggleSeat}
          />

        </div>

        {/* ==================================================== */}
        {/* RIGHT SIDEBAR                                         */}
        {/* ==================================================== */}

        <div className="space-y-4">

          {/* ================================================== */}
          {/* LIVE RESERVATION TIMER                             */}
          {/* ================================================== */}

          {secondsLeft !== null && (
            <div className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">

              {/* Timer Header */}
              <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50 px-5 py-4">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Timer size={20} />
                  </div>

                  <div>

                    <p className="text-sm font-bold text-amber-900">
                      Seats reserved for you
                    </p>

                    <p className="text-xs text-amber-600">
                      Complete your booking before the timer expires
                    </p>

                  </div>

                </div>

                <Zap
                  size={17}
                  className="animate-pulse text-amber-500"
                />

              </div>

              {/* Countdown */}
              <div className="px-5 py-6 text-center">

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                  Reservation expires in
                </p>

                <div className="mt-2">

                  <span
                    className={`font-mono text-4xl font-bold tracking-wider ${
                      secondsLeft <= 60
                        ? 'text-red-600'
                        : secondsLeft <=
                          180
                          ? 'text-amber-600'
                          : 'text-slate-900'
                    }`}
                  >
                    {timerText}
                  </span>

                </div>

                {/* Progress Bar */}
                <div className="mt-5">

                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">

                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        secondsLeft <=
                        60
                          ? 'bg-red-500'
                          : secondsLeft <=
                            180
                            ? 'bg-amber-500'
                            : 'bg-brand-600'
                      }`}
                      style={{
                        width: `${timerProgress}%`,
                      }}
                    />

                  </div>

                </div>

                <div className="mt-4 flex items-start justify-center gap-2 text-xs leading-5 text-slate-500">

                  <ShieldCheck
                    size={14}
                    className="mt-0.5 shrink-0 text-emerald-500"
                  />

                  <span>
                    Your selected seats
                    are temporarily
                    protected from
                    other customers.
                  </span>

                </div>

              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* SELECTION CARD                                     */}
          {/* ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-slate-900">
                  Your selection
                </h3>

                <p className="mt-0.5 text-xs text-slate-400">
                  {selected.length}{' '}
                  seat
                  {selected.length !==
                  1
                    ? 's'
                    : ''}{' '}
                  selected
                </p>

              </div>

              {selected.length >
                0 && (
                <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-600">
                  Reserved
                </span>
              )}

            </div>

            {selected.length ===
            0 ? (

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-7 text-center">

                <Ticket
                  size={24}
                  className="mx-auto mb-2 text-slate-300"
                />

                <p className="text-sm font-medium text-slate-500">
                  No seats selected
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Tap an available
                  seat to reserve it.
                </p>

              </div>

            ) : (

              <ul className="space-y-2">

                {selected.map(
                  (id) => {
                    const seat =
                      seats.find(
                        (s) =>
                          s.showSeatId ===
                          id
                      );

                    const seatPrice =
                      pricing.find(
                        (p) =>
                          p.categoryId ===
                          seat?.categoryId
                      )?.price ||
                      0;

                    return (
                      <li
                        key={id}
                        className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2.5"
                      >

                        <div className="flex items-center gap-3">

                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                            {seat?.row}
                            {seat?.number}
                          </div>

                          <div>

                            <p className="text-sm font-semibold text-slate-700">
                              Seat{' '}
                              {seat?.row}
                              {seat?.number}
                            </p>

                            <p className="text-[11px] text-slate-400">
                              {seat?.category}
                            </p>

                          </div>

                        </div>

                        <span className="text-sm font-semibold text-slate-700">
                          ₹
                          {
                            seatPrice
                          }
                        </span>

                      </li>
                    );
                  }
                )}

              </ul>

            )}

            {/* Total */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">

              <span className="text-sm text-slate-500">
                Total
              </span>

              <span className="text-xl font-bold text-slate-900">
                ₹{total}
              </span>

            </div>

            {/* Booking Button */}
            <button
              disabled={
                selected.length ===
                  0 ||
                confirming ||
                secondsLeft ===
                  0
              }
              onClick={
                confirmBooking
              }
              className="btn-primary mt-4 w-full"
            >
              {confirming
                ? 'Confirming booking...'
                : secondsLeft ===
                  0
                  ? 'Reservation expired'
                  : 'Confirm Booking'}
            </button>

            {/* Unselect Help */}
            {selected.length >
              0 && (
              <p className="mt-3 text-center text-[11px] text-slate-400">
                Click a selected
                seat again to
                release it.
              </p>
            )}

          </div>

          {/* ================================================== */}
          {/* WAITLIST                                            */}
          {/* ================================================== */}

          {soldOutCategories.length >
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

              <div className="mb-3 flex items-center gap-3">

                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Users size={17} />
                </div>

                <div>

                  <h3 className="font-semibold text-slate-900">
                    Sold out?
                  </h3>

                  <p className="text-[11px] text-slate-400">
                    Join the live waitlist
                  </p>

                </div>

              </div>

              <p className="mb-4 text-xs leading-5 text-slate-500">
                Join the waitlist and
                we'll notify you
                automatically when a
                seat becomes available.
              </p>

              <div className="space-y-2">

                {soldOutCategories.map(
                  (category) => (
                    <button
                      key={
                        category.categoryId
                      }
                      onClick={() =>
                        joinWaitlist(
                          category.categoryId
                        )
                      }
                      className="btn-secondary w-full justify-between"
                    >

                      <span>
                        {
                          category.category
                        }
                      </span>

                      <span className="text-xs text-slate-400">
                        Join waitlist
                      </span>

                    </button>
                  )
                )}

              </div>

            </div>
          )}

          {/* ================================================== */}
          {/* LIVE ACTIVITY                                      */}
          {/* ================================================== */}

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="mb-4 flex items-center justify-between">

              <div>

                <h3 className="font-semibold text-slate-900">
                  Live activity
                </h3>

                <p className="mt-0.5 text-[11px] text-slate-400">
                  Real-time seat updates
                </p>

              </div>

              <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-600">

                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                Live

              </span>

            </div>

            {activity.length ===
            0 ? (

              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center">

                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm">
                  ⚡
                </div>

                <p className="text-xs font-medium text-slate-500">
                  Waiting for
                  activity
                </p>

                <p className="mt-1 text-[10px] text-slate-400">
                  Live seat changes
                  will appear here.
                </p>

              </div>

            ) : (

              <div className="space-y-3">

                {activity.map(
                  (item) => (

                    <div
                      key={item.id}
                      className="flex gap-3 rounded-xl bg-slate-50 px-3 py-3"
                    >

                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-sm shadow-sm">
                        {item.icon}
                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="text-xs font-semibold text-slate-700">
                          {
                            item.message
                          }
                        </p>

                        <div className="mt-1 flex items-center gap-2">

                          <span className="text-[10px] text-slate-400">
                            {
                              item.category
                            }
                          </span>

                          <span className="text-[10px] text-slate-300">
                            •
                          </span>

                          <span className="text-[10px] text-slate-400">
                            {formatActivityTime(
                              item.time
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                  )
                )}

              </div>

            )}

          </div>

          {/* ================================================== */}
          {/* SYSTEM STATUS                                       */}
          {/* ================================================== */}

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">

            <div className="flex items-start gap-3">

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                <ShieldCheck
                  size={16}
                />
              </div>

              <div>

                <p className="text-xs font-bold text-emerald-800">
                  Live booking
                  protection
                </p>

                <p className="mt-1 text-[11px] leading-5 text-emerald-600">
                  Seats are protected
                  using real-time
                  availability and
                  automatic hold
                  expiry.
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>

    </Layout>
  );
}

// ============================================================
// LIVE ACTIVITY TIME FORMATTER
// ============================================================

function formatActivityTime(date) {
  const seconds = Math.floor(
    (Date.now() -
      new Date(date).getTime()) /
      1000
  );

  if (seconds < 5) {
    return 'Just now';
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  const minutes = Math.floor(
    seconds / 60
  );

  return `${minutes}m ago`;
}