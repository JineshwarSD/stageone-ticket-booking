import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Clock, Ticket } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function WaitlistOffer() {
  const { token } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [offer, setOffer] = useState(null);
  const [error, setError] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(null);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.get(`/waitlist/offer/${token}`)
      .then((res) => setOffer(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Offer not found'));
  }, [token, user]);

  useEffect(() => {
    if (!offer) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.floor((new Date(offer.offerExpiresAt) - Date.now()) / 1000)));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [offer]);

  async function claim() {
    setClaiming(true);
    try {
      const res = await api.post(`/waitlist/offer/${token}/complete`);
      toast.success('Booking confirmed!');
      navigate('/bookings');
      void res;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete booking');
      setError(err.response?.data?.message);
    } finally {
      setClaiming(false);
    }
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-center text-gray-500">
        Please <a href="/login" className="mx-1 font-semibold text-brand-600">log in</a> to view your waitlist offer.
      </div>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-md">
        <div className="card text-center">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : !offer ? (
            <p className="text-gray-400">Loading offer...</p>
          ) : (
            <>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <Ticket size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">A seat opened up!</h2>
              <p className="mt-1 text-sm text-gray-500">{offer.eventTitle} — {offer.venue}</p>
              <p className="mt-2 text-sm text-gray-600">Category: <span className="font-semibold">{offer.category}</span></p>
              <p className="text-lg font-bold text-gray-900">₹{offer.price}</p>

              {secondsLeft > 0 ? (
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700">
                  <Clock size={16} /> Expires in {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
                </div>
              ) : (
                <p className="mt-4 text-sm font-medium text-red-500">This offer has expired.</p>
              )}

              <button disabled={claiming || secondsLeft === 0} onClick={claim} className="btn-primary mt-6 w-full">
                {claiming ? 'Confirming...' : 'Complete Booking'}
              </button>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
