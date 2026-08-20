import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Building2, Plus, Trash2 } from 'lucide-react';
import api from '../../api/axios';
import Layout from '../../components/Layout';

const emptyRow = () => ({ row: '', seatCount: 8, category: 'Standard' });

export default function VenueManager() {
  const [venues, setVenues] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const res = await api.get('/venues');
    setVenues(res.data);
  }

  function updateRow(i, field, value) {
    const next = [...rows];
    next[i] = { ...next[i], [field]: value };
    setRows(next);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/venues', {
        name,
        address,
        rows: rows.map((r) => ({ ...r, seatCount: Number(r.seatCount) })),
      });
      toast.success('Venue created with seat layout');
      setShowForm(false);
      setName(''); setAddress(''); setRows([emptyRow()]);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create venue');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Venues</h1>
          <p className="text-sm text-gray-500">Create venues and define their seat layout & categories</p>
        </div>
        <button onClick={() => setShowForm((s) => !s)} className="btn-primary">
          <Plus size={16} /> New Venue
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Venue name</label>
              <input required className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PVR Grand Mall" />
            </div>
            <div>
              <label className="label">Address</label>
              <input required className="input" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="e.g. OMR, Chennai" />
            </div>
          </div>

          <div>
            <label className="label">Seat rows</label>
            <div className="space-y-2">
              {rows.map((r, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input required className="input w-20" placeholder="Row (A)" value={r.row} onChange={(e) => updateRow(i, 'row', e.target.value.toUpperCase())} />
                  <input required type="number" min="1" className="input w-28" placeholder="Seats" value={r.seatCount} onChange={(e) => updateRow(i, 'seatCount', e.target.value)} />
                  <input required className="input w-36" placeholder="Category (Premium)" value={r.category} onChange={(e) => updateRow(i, 'category', e.target.value)} />
                  {rows.length > 1 && (
                    <button type="button" onClick={() => setRows(rows.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setRows([...rows, emptyRow()])} className="btn-secondary mt-3 text-xs">
              <Plus size={14} /> Add row
            </button>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="btn-primary">{saving ? 'Creating...' : 'Create Venue'}</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {venues.map((v) => (
          <div key={v.id} className="card">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Building2 size={20} />
            </div>
            <h3 className="font-bold text-gray-900">{v.name}</h3>
            <p className="mb-3 text-xs text-gray-500">{v.address}</p>
            <p className="text-xs text-gray-400">{v._count?.seats} seats · {v.categories?.map((c) => c.name).join(', ')}</p>
          </div>
        ))}
      </div>
    </Layout>
  );
}
