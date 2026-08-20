import { Armchair, CircleHelp, Monitor, Zap } from 'lucide-react';

const STATUS_STYLES = {
  AVAILABLE:
    'border-slate-300 bg-white text-slate-500 hover:-translate-y-0.5 hover:border-brand-500 hover:bg-brand-50 hover:text-brand-600 hover:shadow-md cursor-pointer',

  HELD:
    'border-amber-300 bg-amber-50 text-amber-600 cursor-not-allowed',

  BOOKED:
    'border-slate-200 bg-slate-200 text-slate-400 cursor-not-allowed',

  SELECTED:
    'border-brand-600 bg-brand-600 text-white shadow-lg shadow-brand-200 scale-110 cursor-pointer',
};

const STATUS_LABELS = {
  AVAILABLE: 'Available',
  HELD: 'Held',
  BOOKED: 'Booked',
};

export default function SeatGrid({ seats, selected, onToggle }) {
  const rows = {};

  seats.forEach((seat) => {
    if (!rows[seat.row]) {
      rows[seat.row] = [];
    }

    rows[seat.row].push(seat);
  });

  const rowKeys = Object.keys(rows).sort((a, b) =>
    a.localeCompare(b, undefined, { numeric: true })
  );

  const availableCount = seats.filter(
    (seat) => seat.status === 'AVAILABLE' || seat.heldByMe
  ).length;

  const heldCount = seats.filter(
    (seat) => seat.status === 'HELD' && !seat.heldByMe
  ).length;

  const bookedCount = seats.filter(
    (seat) => seat.status === 'BOOKED'
  ).length;

  return (
    <div className="space-y-7">

      {/* ================= SEAT MAP HEADER ================= */}
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">
              Select your seats
            </h2>

            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
              Live
            </span>
          </div>

          <p className="mt-1 text-xs text-slate-400">
            Choose from the available seats below
          </p>
        </div>

        {/* Seat statistics */}
        <div className="flex items-center gap-4 text-xs">

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="text-slate-500">
              {availableCount} available
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-slate-500">
              {heldCount} held
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-slate-500">
              {bookedCount} booked
            </span>
          </div>

        </div>
      </div>

      {/* ================= SCREEN ================= */}
      <div className="px-2 sm:px-8">

        <div className="relative mx-auto max-w-2xl">

          {/* Screen glow */}
          <div className="absolute -top-3 left-1/2 h-12 w-3/4 -translate-x-1/2 rounded-full bg-brand-100/50 blur-2xl" />

          <div className="relative">

            <div className="mx-auto h-1.5 w-3/4 rounded-full bg-gradient-to-r from-transparent via-slate-400 to-transparent" />

            <div className="mt-2 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
              <Monitor size={13} />
              Screen
            </div>

          </div>
        </div>

      </div>

      {/* ================= SEAT GRID ================= */}
      <div className="overflow-x-auto pb-3">

        <div className="mx-auto min-w-[620px] max-w-4xl space-y-3">

          {rowKeys.map((row) => {

            const rowSeats = [...rows[row]].sort(
              (a, b) => Number(a.number) - Number(b.number)
            );

            return (
              <div
                key={row}
                className="group flex items-center gap-4"
              >

                {/* Row label */}
                <div className="flex w-7 shrink-0 flex-col items-center">
                  <span className="text-[10px] font-bold uppercase text-slate-300">
                    Row
                  </span>

                  <span className="mt-0.5 text-xs font-bold text-slate-500">
                    {row}
                  </span>
                </div>

                {/* Seats */}
                <div className="flex flex-1 justify-center gap-2">

                  {rowSeats.map((seat) => {

                    const isSelected = selected.includes(
                      seat.showSeatId
                    );

                    const isMine = seat.heldByMe;

                    const clickable =
                        isSelected ||
                        seat.status === 'AVAILABLE' ||
                        isMine;

                    const styleKey = isSelected
                      ? 'SELECTED'
                      : isMine
                        ? 'AVAILABLE'
                        : seat.status;

                    return (
                      <button
                        key={seat.showSeatId}
                        type="button"
                        disabled={!clickable}
                        onClick={() =>
                          clickable && onToggle(seat)
                        }
                        title={`${row}${seat.number} · ${seat.category} · ${STATUS_LABELS[seat.status] || seat.status}`}
                        aria-label={`Seat ${row}${seat.number}, ${seat.category}, ${STATUS_LABELS[seat.status] || seat.status}`}
                        className={`
                          group/seat relative
                          flex h-10 w-10
                          shrink-0 items-center justify-center
                          rounded-xl border
                          transition-all duration-200
                          ${STATUS_STYLES[styleKey]}
                        `}
                      >

                        {/* Seat icon */}
                        <Armchair
                          size={17}
                          strokeWidth={1.8}
                        />

                        {/* Seat number */}
                        <span className="absolute bottom-0.5 text-[7px] font-bold opacity-80">
                          {seat.number}
                        </span>

                        {/* Selected indicator */}
                        {isSelected && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-black text-brand-600 shadow-sm">
                            ✓
                          </span>
                        )}

                        {/* My hold indicator */}
                        {isMine && !isSelected && (
                          <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-400 text-[7px] text-white shadow-sm">
                            !
                          </span>
                        )}

                      </button>
                    );
                  })}

                </div>

                {/* Right row label */}
                <div className="hidden w-7 shrink-0 items-center justify-center sm:flex">
                  <span className="text-xs font-semibold text-slate-300">
                    {row}
                  </span>
                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* ================= LEGEND ================= */}
      <div className="border-t border-slate-100 pt-5">

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">

          <Legend
            type="available"
            label="Available"
          />

          <Legend
            type="selected"
            label="Your selection"
          />

          <Legend
            type="held"
            label="Temporarily held"
          />

          <Legend
            type="booked"
            label="Booked"
          />

        </div>

      </div>

      {/* ================= LIVE INFO ================= */}
      <div className="rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3">

        <div className="flex items-start gap-3">

          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-600">
            <Zap size={15} />
          </div>

          <div>
            <p className="text-xs font-semibold text-brand-800">
              Live seat availability
            </p>

            <p className="mt-0.5 text-[11px] leading-5 text-brand-600">
              Seat availability updates automatically when other
              customers select, book or release seats.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}

function Legend({ type, label }) {

  const styles = {
    available:
      'border border-slate-300 bg-white text-slate-400',

    selected:
      'border border-brand-600 bg-brand-600 text-white',

    held:
      'border border-amber-300 bg-amber-100 text-amber-500',

    booked:
      'border border-slate-200 bg-slate-200 text-slate-400',
  };

  return (
    <div className="flex items-center gap-2">

      <span
        className={`flex h-7 w-7 items-center justify-center rounded-lg ${styles[type]}`}
      >
        <Armchair size={13} />
      </span>

      <span className="text-xs font-medium text-slate-500">
        {label}
      </span>

    </div>
  );
}