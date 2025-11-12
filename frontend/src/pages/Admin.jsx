import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import Modal from '../components/Modal'
import AddItemForm from '../components/AddItemForm'
import AdminEditForm from './AdminEditForm'

export default function Admin() {
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('home')
  const [securityContacts, setSecurityContacts] = useState([])
  const [showAddSecurity, setShowAddSecurity] = useState(false)
  const [secForm, setSecForm] = useState({ name: '', designation: '', location: '', phone: '' })

  useEffect(() => {
    fetchItems()
    fetchClaims()
    fetchSecurity()
  }, [])

  // protect route: only admin role allowed
  const navigate = useNavigate()
  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role !== 'admin') navigate('/')
  }, [navigate])

  function fetchItems() {
    fetch('http://localhost:5000/api/items')
      .then(r => r.json())
      .then(setItems)
      .catch(err => console.error(err))
  }

  function fetchClaims() {
    fetch('http://localhost:5000/api/claims')
      .then(r => r.json())
      .then(setClaims)
      .catch(err => console.error(err))
  }

  function fetchSecurity() {
    fetch('http://localhost:5000/api/security')
      .then(r => r.json())
      .then(setSecurityContacts)
      .catch(err => console.error('Failed to load security contacts', err))
  }

  function onAdded(newItem) {
    setShowAdd(false)
    // refresh list - put newest first
    fetchItems()
  }

  return (
    <div>
      <Navbar />
  <div className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setTab('home')} className={`px-3 py-1 rounded ${tab==='home' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Home</button>
          <button onClick={() => setTab('lost')} className={`px-3 py-1 rounded ${tab==='lost' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Lost Reports</button>
          <button onClick={() => setTab('resale')} className={`px-3 py-1 rounded ${tab==='resale' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Resale</button>
          <button onClick={() => setTab('claims')} className={`px-3 py-1 rounded ${tab==='claims' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Claims</button>
          <button onClick={() => setTab('security')} className={`px-3 py-1 rounded ${tab==='security' ? 'bg-indigo-600 text-white' : 'bg-white'}`}>Security</button>
          <div className="ml-auto text-sm text-gray-500">Total items: {items.length}</div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {tab === 'home' && (
            <>
              <div className="bg-white rounded-lg border-dashed border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:shadow" onClick={() => setShowAdd(true)}>
                <div className="text-center p-6">
                  <div className="text-4xl">+</div>
                  <div className="mt-2 text-sm text-gray-600">Add New Item</div>
                </div>
              </div>

              {items.filter(i => !i.reported_by && !i.claimed_by).map(item => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow p-3">
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                  <div className="text-sm text-gray-500 mt-1">Added: {new Date(item.created_at).toLocaleDateString()}</div>
                  {item.is_admin_item && !item.claimed_by && (new Date() - new Date(item.created_at)) > 0 * 24 * 60 * 60 * 1000 && (
                    <div className="mt-2">
                      <button onClick={async () => {
                        const price = prompt('Enter resale price (₹):');
                        if (price && !isNaN(price)) {
                            try {
                              const resp = await fetch(`http://localhost:5000/api/items/${item.id}/move-to-resale`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ price: parseFloat(price) })
                              });
                              const txt = await resp.text();
                              let data;
                              try { data = txt ? JSON.parse(txt) : null } catch (e) { data = { error: txt } }
                              if (!resp.ok) {
                                alert('Failed to move to resale: ' + (data && data.error ? data.error : resp.status));
                              } else {
                                alert('Item moved to resale')
                              }
                            } catch (e) {
                              console.error('Resale request failed', e);
                              alert('Resale request failed')
                            } finally {
                              fetchItems();
                            }
                          }
                      }} className="px-3 py-1 bg-orange-600 text-white rounded">Move to Resale</button>
                    </div>
                  )}
                  <div className="mt-2">
                    <button onClick={() => setSelected(item)} className="px-3 py-1 bg-blue-600 text-white rounded">Edit</button>
                  </div>
                </div>
              ))}
            </>
          )}

          {tab === 'resale' && (
            items.filter(i => i.status === 'resale').length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No resale items</div>
            ) : (
              items.filter(i => i.status === 'resale').map(item => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow p-3">
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">Price: ₹{item.resale_price}</div>
                  <div className="text-sm text-gray-500">Resale date: {new Date(item.resale_date).toLocaleDateString()}</div>
                </div>
              ))
            )
          )}

          {tab === 'lost' && (
            items.filter(i => i.reported_by && !i.claimed_by && !i.is_admin_item).length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No lost reports yet</div>
            ) : (
              items.filter(i => i.reported_by && !i.claimed_by && !i.is_admin_item).map(item => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow p-3 cursor-pointer" onClick={() => setSelected(item)}>
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">Reported by: {item.reported_by}</div>
                  <div className="text-sm text-gray-500">Location: {item.location || '—'}</div>
                </div>
              ))
            )
          )}

          {tab === 'claims' && (
            claims.length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No claim requests</div>
            ) : (
              claims.map(c => (
                <div key={c.id} className="bg-white rounded-lg overflow-hidden shadow p-3">
                  <img src={`http://localhost:5000${c.item_image || ''}`} alt={c.item_name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{c.item_name}</div>
                  <div className="text-sm text-gray-600">Requested by: {c.student}</div>
                  <div className="text-sm text-gray-500 mt-1">Message: {c.message || '—'}</div>
                  <div className="mt-2 flex gap-2">
                    <button onClick={async () => {
                      const admin = typeof window !== 'undefined' ? localStorage.getItem('username') : 'admin'
                      await fetch(`http://localhost:5000/api/claims/${c.id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'accept', admin }) })
                      fetchItems(); fetchClaims();
                    }} className="px-3 py-1 bg-green-600 text-white rounded">Accept</button>

                    <button onClick={async () => {
                      const admin = typeof window !== 'undefined' ? localStorage.getItem('username') : 'admin'
                      await fetch(`http://localhost:5000/api/claims/${c.id}/decision`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject', admin }) })
                      fetchItems(); fetchClaims();
                    }} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
                  </div>
                </div>
              ))
            )
          )}

          {tab === 'security' && (
            <>
              <div className="bg-white rounded-lg border-dashed border-2 border-gray-300 flex items-center justify-center cursor-pointer hover:shadow" onClick={() => setShowAddSecurity(true)}>
                <div className="text-center p-6">
                  <div className="text-4xl">+</div>
                  <div className="mt-2 text-sm text-gray-600">Add Security Contact</div>
                </div>
              </div>

              {securityContacts.length === 0 ? (
                <div className="col-span-full text-center text-gray-500">No security contacts yet</div>
              ) : (
                securityContacts.map(s => (
                  <div key={s.id} className="bg-white rounded-lg overflow-hidden shadow p-3">
                    <div className="font-semibold">{s.name}</div>
                    <div className="text-sm text-gray-600">{s.designation || '—'}</div>
                    <div className="text-sm text-gray-500 mt-1">{s.location || '—'}</div>
                    <div className="text-sm text-gray-500 mt-1">Phone: {s.phone}</div>
                    <div className="mt-2">
                      <button onClick={async () => {
                        if (!confirm('Delete this contact?')) return
                        try {
                          await fetch(`http://localhost:5000/api/security/${s.id}`, { method: 'DELETE' })
                          fetchSecurity()
                        } catch (e) { console.error('Failed to delete contact', e); alert('Delete failed') }
                      }} className="px-3 py-1 bg-red-600 text-white rounded">Delete</button>
                    </div>
                  </div>
                ))
              )}
            </>
          )}
        </div>
      </div>

      <Modal open={!!selected} onClose={() => setSelected(null)}>
        {selected && (
          <AdminEditForm
            item={selected}
            onClose={() => setSelected(null)}
            onSaved={() => { fetchItems(); setSelected(null); }}
            onDeleted={() => { fetchItems(); setSelected(null); }}
          />
        )}
      </Modal>

      <Modal open={showAdd} onClose={() => setShowAdd(false)}>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-3">Add New Item</h3>
          <AddItemForm onAdded={onAdded} attachReporter={false} submitLabel="Add Item" />
        </div>
      </Modal>

      <Modal open={showAddSecurity} onClose={() => setShowAddSecurity(false)}>
        <div className="p-4 max-w-md mx-auto">
          <h3 className="text-lg font-semibold mb-3">Add Security Contact</h3>
          <div className="space-y-3">
            <label className="block">
              <div className="text-sm text-gray-600">Name</div>
              <input className="w-full px-3 py-2 border rounded" value={secForm.name} onChange={e => setSecForm(s => ({ ...s, name: e.target.value }))} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">Designation</div>
              <input className="w-full px-3 py-2 border rounded" value={secForm.designation} onChange={e => setSecForm(s => ({ ...s, designation: e.target.value }))} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">Location</div>
              <input className="w-full px-3 py-2 border rounded" value={secForm.location} onChange={e => setSecForm(s => ({ ...s, location: e.target.value }))} />
            </label>

            <label className="block">
              <div className="text-sm text-gray-600">Phone</div>
              <input className="w-full px-3 py-2 border rounded" value={secForm.phone} onChange={e => setSecForm(s => ({ ...s, phone: e.target.value }))} />
            </label>

            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAddSecurity(false)} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
              <button onClick={async () => {
                if (!secForm.name || !secForm.phone) { alert('Name and phone are required'); return }
                try {
                  const resp = await fetch('http://localhost:5000/api/security', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(secForm) })
                  const txt = await resp.text(); let data; try { data = txt ? JSON.parse(txt) : null } catch (e) { data = { error: txt } }
                  if (!resp.ok) { alert('Failed to add contact: ' + (data && data.error ? data.error : resp.status)); return }
                  // refresh list
                  fetchSecurity()
                  setShowAddSecurity(false)
                  setSecForm({ name: '', designation: '', location: '', phone: '' })
                  // notify students UI could refresh on next visit; also dispatch event so open student pages can refresh
                  try { window.dispatchEvent(new Event('security:updated')) } catch (e) {}
                } catch (e) { console.error('Add security failed', e); alert('Add failed') }
              }} className="px-3 py-1 bg-indigo-600 text-white rounded">Add</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
