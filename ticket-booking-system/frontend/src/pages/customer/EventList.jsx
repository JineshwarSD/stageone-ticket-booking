import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, MapPin, Search, Clapperboard, Music } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

export default function EventList() {
  const [events, setEvents] = useState([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { load(); }, [type]);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get('/events', { params: { q: q || undefined, type: type || undefined } });
      setEvents(res.data);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Events</h1>
          <p className="text-sm text-gray-500">Find a movie or concert and book your seats</p>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); load(); }} className="flex gap-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input w-56 pl-9" placeholder="Search events..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <select className="input w-36" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="MOVIE">Movies</option>
            <option value="CONCERT">Concerts</option>
          </select>
        </form>
      </div>

      {loading ? (
        <p className="text-gray-400">Loading events...</p>
      ) : events.length === 0 ? (
        <div className="card text-center text-gray-400">No events found.</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((ev) => (
            <button
              key={ev.id}
              onClick={() => navigate(`/events/${ev.id}/seats`)}
              className="card group text-left transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="mb-4 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                {ev.type === 'CONCERT' ? <Music size={36} /> : <Clapperboard size={36} />}
              </div>
              <span className="badge mb-2 bg-brand-50 text-brand-700">{ev.type}</span>
              <h3 className="mb-1 text-base font-bold text-gray-900 group-hover:text-brand-700">{ev.title}</h3>
              <p className="mb-3 line-clamp-2 text-xs text-gray-500">{ev.description}</p>
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <CalendarDays size={14} />
                  {new Date(ev.date).toLocaleDateString()} · {ev.time}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {ev.venue?.name}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ev.pricing?.map((p) => (
                  <span key={p.categoryId} className="badge bg-gray-100 text-gray-600">
                    {p.category.name} ₹{p.price}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      )}
    </Layout>
  );
}
