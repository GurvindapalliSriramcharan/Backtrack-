import React, { useState, useEffect } from 'react'

export default function AdminEditForm({ item, onClose, onSaved, onDeleted }) {
  const [form, setForm] = useState({})
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setForm({
      name: item.name || '',
      description: item.description || '',
      lost_date: item.lost_date || '',
      location: item.location || '',
      category: item.category || '',
      brand: item.brand || '',
      model_no: item.model_no || '',
      colour: item.colour || '',
      identifications: item.identifications || '',
      reported_by: item.reported_by || ''
    })
    setImageFile(null)
  }, [item])

  async function save() {
    setLoading(true)
    try {
      const fd = new FormData()
      Object.keys(form).forEach(k => {
        if (form[k] !== undefined && form[k] !== null) fd.append(k, form[k])
      })
      if (imageFile) fd.append('image', imageFile)

      const res = await fetch(`http://localhost:5000/api/items/${item.id}`, {
        method: 'PUT',
        body: fd
      })
      if (!res.ok) throw new Error('Save failed')
      await res.json()
      setLoading(false)
      onSaved && onSaved()
    } catch (err) {
      console.error(err)
      setLoading(false)
      alert('Save failed')
    }
  }

  async function del() {
    if (!confirm('Delete this item? This cannot be undone.')) return
    try {
      const res = await fetch(`http://localhost:5000/api/items/${item.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      onDeleted && onDeleted()
    } catch (err) {
      console.error(err)
      alert('Delete failed')
    }
  }

  return (
    <div className="p-4 space-y-3">
      <div>
        <img src={`http://localhost:5000${item.image_path || ''}`} alt={form.name} className="w-full h-48 object-cover rounded mb-2" />
        <input type="file" accept="image/*,.svg" onChange={e => setImageFile(e.target.files[0])} />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Name</label>
        <input className="w-full px-3 py-2 border rounded" value={form.name} onChange={e => setForm(s => ({...s, name: e.target.value}))} />
      </div>

      <div>
        <label className="block text-sm text-gray-600">Description</label>
        <textarea className="w-full px-3 py-2 border rounded" value={form.description} onChange={e => setForm(s => ({...s, description: e.target.value}))} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">Lost date</label>
          <input type="date" className="w-full px-3 py-2 border rounded" value={form.lost_date} onChange={e => setForm(s => ({...s, lost_date: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Location</label>
          <input className="w-full px-3 py-2 border rounded" value={form.location} onChange={e => setForm(s => ({...s, location: e.target.value}))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">Category</label>
          <input className="w-full px-3 py-2 border rounded" value={form.category} onChange={e => setForm(s => ({...s, category: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Brand</label>
          <input className="w-full px-3 py-2 border rounded" value={form.brand} onChange={e => setForm(s => ({...s, brand: e.target.value}))} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-gray-600">Model no</label>
          <input className="w-full px-3 py-2 border rounded" value={form.model_no} onChange={e => setForm(s => ({...s, model_no: e.target.value}))} />
        </div>
        <div>
          <label className="block text-sm text-gray-600">Colour</label>
          <input className="w-full px-3 py-2 border rounded" value={form.colour} onChange={e => setForm(s => ({...s, colour: e.target.value}))} />
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-600">Identifications</label>
        <textarea className="w-full px-3 py-2 border rounded" value={form.identifications} onChange={e => setForm(s => ({...s, identifications: e.target.value}))} />
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1 rounded border">Close</button>
        <button onClick={del} className="px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600">Delete</button>
        <button onClick={save} className="px-3 py-1 rounded bg-indigo-600 text-white">{loading ? 'Saving...' : 'Save'}</button>
      </div>
    </div>
  )
}
