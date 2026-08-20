import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CalendarDays, MapPin, XCircle } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const STATUS_BADGE = {
  CONFIRMED: 'bg-green-50 text-green-700',
  CANCELLED: 'bg-red-50 text-red-600',
};

export default function BookingHistory() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/bookings');
      setBookings(res.data);
    } finally {
      setLoading(false);
    }
  }

  async function cancel(id) {
    if (!confirm('Cancel this booking? The seat will be offered to the waitlist.')) return;
    try {
      await api.post(`/bookings/${id}/cancel`);
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Cancel failed');
    }
  }

  return (
    <Layout>
      <h1 className="mb-6 text-2xl font-bold text-gray-900">My Bookings</h1>
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : bookings.length === 0 ? (
        <div className="card text-center text-gray-400">No bookings yet.</div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => (
            <div key={b.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                {b.qrCodeData && <img src={b.qrCodeData} alt="QR" className="h-20 w-20 rounded-lg border border-gray-100" />}
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-bold text-gray-900">{b.event?.title}</h3>
                    <span className={`badge ${STATUS_BADGE[b.status]}`}>{b.status}</span>
                  </div>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><CalendarDays size={13} /> {new Date(b.event?.date).toLocaleDateString()} · {b.event?.time}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={13} /> {b.event?.venue?.name}</p>
                  <p className="mt-1 text-xs text-gray-400">Ref: <span className="font-mono">{b.reference}</span> · Seats: {b.seats.map((s) => `${s.showSeat.seat.row}${s.showSeat.seat.number}`).join(', ')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                <span className="font-bold text-gray-900">₹{b.totalAmount}</span>
                {b.status === 'CONFIRMED' && (
                  <button onClick={() => cancel(b.id)} className="flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700">
                    <XCircle size={14} /> Cancel booking
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
