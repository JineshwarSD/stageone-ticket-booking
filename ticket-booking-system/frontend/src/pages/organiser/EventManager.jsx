import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, CalendarPlus, X } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function EventManager() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', type: 'MOVIE', description: '', date: '', time: '', venueId: '' });
  const [pricing, setPricing] = useState({});
  const [saving, setSaving] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => { load(); loadVenues(); }, []);

  async function load() {
    const res = await api.get('/events');
    setEvents(res.data);
  }
  async function loadVenues() {
    const res = await api.get('/venues');
    setVenues(res.data);
  }

  function selectVenue(venueId) {
    const venue = venues.find((v) => v.id === venueId);
    setForm({ ...form, venueId });
    const initial = {};
    venue?.categories?.forEach((c) => (initial[c.id] = ''));
    setPricing(initial);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/events', {
        ...form,
        pricing: Object.entries(pricing).map(([categoryId, price]) => ({ categoryId, price: Number(price) })),
      });
      toast.success('Event created!');
      setShowForm(false);
      setForm({ title: '', type: 'MOVIE', description: '', date: '', time: '', venueId: '' });
      setPricing({});
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setSaving(false);
    }
  }

  async function viewSummary(eventId) {
    const res = await api.get(`/events/${eventId}/summary`);
    setSummary(res.data);
  }

  const selectedVenue = venues.find((v) => v.id === form.venueId);

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
          <p className="text-sm text-gray-500">Create listings and track revenue per show</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus size={16} /> New Event
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Title</label>
              <input required className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="MOVIE">Movie</option>
                <option value="CONCERT">Concert</option>
              </select>
            </div>
            <div>
              <label className="label">Date</label>
              <input required type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div>
              <label className="label">Time</label>
              <input required type="time" className="input" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Description</label>
              <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Venue</label>
              <select required className="input" value={form.venueId} onChange={(e) => selectVenue(e.target.value)}>
                <option value="">Select a venue...</option>
                {venues.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
            </div>
          </div>

          {selectedVenue && (
            <div>
              <label className="label">Pricing per category</label>
              <div className="grid grid-cols-2 gap-3">
                {selectedVenue.categories.map((c) => (
                  <div key={c.id}>
                    <span className="mb-1 block text-xs text-gray-500">{c.name}</span>
                    <input required type="number" min="0" className="input" placeholder="₹ price"
                      value={pricing[c.id] || ''} onChange={(e) => setPricing({ ...pricing, [c.id]: e.target.value })} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary"><CalendarPlus size={16} />{saving ? 'Creating...' : 'Create Event'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((ev) => (
          <div key={ev.id} className="card">
            <span className="badge mb-2 bg-brand-50 text-brand-700">{ev.type}</span>
            <h3 className="font-bold text-gray-900">{ev.title}</h3>
            <p className="mb-3 text-xs text-gray-500">{ev.venue?.name} · {new Date(ev.date).toLocaleDateString()} · {ev.time}</p>
            <button onClick={() => viewSummary(ev.id)} className="btn-secondary w-full text-xs">
              <TrendingUp size={14} /> View revenue
            </button>
          </div>
        ))}
      </div>

      {summary && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/40 px-4" onClick={() => setSummary(null)}>
          <div className="card w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-gray-900">{summary.title}</h3>
              <button onClick={() => setSummary(null)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <Row label="Total bookings" value={summary.totalBookings} />
              <Row label="Seats sold" value={summary.seatsSold} />
              <Row label="Revenue" value={`₹${summary.revenue}`} bold />
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

function Row({ label, value, bold }) {
  return (
    <div className="flex items-center justify-between border-b border-gray-50 py-1.5">
      <span className="text-gray-500">{label}</span>
      <span className={bold ? 'font-bold text-gray-900' : 'text-gray-700'}>{value}</span>
    </div>
  );
}
