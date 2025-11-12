import React, { useState } from 'react'

const ITEM_OPTIONS = [
  'watch', 'phone', 'headphones and headset', 'charger', 'bottle', 'wallet', 'calculator', 'others'
]

const COLOURS = ['Black','White','Blue','Red','Green','Yellow','Pink','Purple','Grey','Brown','Silver','Gold']

export default function AddItemForm({ onAdded, submitLabel = 'Add Item', attachReporter = true }) {
  const [lost_date, setLostDate] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState(ITEM_OPTIONS[0])
  const [otherSpec, setOtherSpec] = useState('')
  const [brand, setBrand] = useState('')
  const [model_no, setModelNo] = useState('')
  const [colour, setColour] = useState(COLOURS[0])
  const [identifications, setIdentifications] = useState('')
  const [image, setImage] = useState(null)
  const [loading, setLoading] = useState(false)

  function submit(e) {
    e.preventDefault()
    // name will be category or otherSpec
    const name = category === 'others' ? (otherSpec || 'Other item') : category

    const fd = new FormData()
    fd.append('name', name)
    // build a short description from some fields
    const description = `Reported lost on ${lost_date || 'N/A'} at ${location || 'N/A'}`
    fd.append('description', description)
    if (lost_date) fd.append('lost_date', lost_date)
    if (location) fd.append('location', location)
    fd.append('category', category)
    if (brand) fd.append('brand', brand)
    if (model_no) fd.append('model_no', model_no)
    if (colour) fd.append('colour', colour)
    if (identifications) fd.append('identifications', identifications)
    if (image) fd.append('image', image)
    // attach reporter username if available and allowed
    if (attachReporter) {
      try {
        const user = typeof window !== 'undefined' ? localStorage.getItem('username') : null
        if (user) fd.append('reported_by', user)
      } catch (e) {
        // ignore
      }
    }
    // mark admin-added items explicitly so backend/UI can treat them separately
    if (!attachReporter) {
      try { fd.append('is_admin_item', '1') } catch (e) {}
    }

    setLoading(true)
    fetch('http://localhost:5000/api/items', {
      method: 'POST',
      body: fd
    })
      .then(async r => {
        const text = await r.text()
        let data
        try { data = text ? JSON.parse(text) : null } catch (e) { data = { error: text } }
        if (!r.ok) {
          // show server-provided error if available
          const msg = (data && data.error) ? data.error : `Server returned ${r.status}`
          throw new Error(msg)
        }
        return data
      })
      .then(data => {
        setLoading(false)
        onAdded && onAdded(data)

        // Server will create notifications for matches; dispatch an event so Navbar reloads immediately.
        try {
          try { window.dispatchEvent(new Event('notifications:updated')) } catch (e) {}
          // If backend returned match_count in the response, show immediate feedback to the user
          if (data && data.match_count && Number(data.match_count) > 0) {
            try { alert(`${data.match_count} possible match(es) found — check the bell (🔔) to request a claim.`) } catch (e) {}
          }
        } catch (e) { console.error('post-submit update failed', e) }
      })
      .catch(err => {
        setLoading(false)
        // show a clearer error message
        alert('Upload failed: ' + (err && err.message ? err.message : 'network error'))
        console.error(err)
      })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h4 className="font-semibold">Report lost</h4>

      <label className="block">
        <div className="text-sm text-gray-600">Lost date:</div>
        <input type="date" className="w-full px-3 py-2 border rounded" value={lost_date} onChange={e => setLostDate(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Location:</div>
        <input className="w-full px-3 py-2 border rounded" placeholder="e.g. Library, Cafeteria" value={location} onChange={e => setLocation(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Item:</div>
        <select className="w-full px-3 py-2 border rounded" value={category} onChange={e => setCategory(e.target.value)}>
          {ITEM_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      </label>

      {category === 'others' && (
        <input className="w-full px-3 py-2 border rounded" placeholder="Specify other item" value={otherSpec} onChange={e => setOtherSpec(e.target.value)} />
      )}

      <label className="block">
        <div className="text-sm text-gray-600">Brand:</div>
        <input className="w-full px-3 py-2 border rounded" value={brand} onChange={e => setBrand(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Model no: <span className="text-xs text-gray-400">(optional)</span></div>
        <input className="w-full px-3 py-2 border rounded" value={model_no} onChange={e => setModelNo(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Colour:</div>
        <select className="w-full px-3 py-2 border rounded" value={colour} onChange={e => setColour(e.target.value)}>
          {COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Identifications: <span className="text-xs text-gray-400">(optional)</span></div>
        <textarea className="w-full px-3 py-2 border rounded" value={identifications} onChange={e => setIdentifications(e.target.value)} />
      </label>

      <label className="block">
        <div className="text-sm text-gray-600">Image: <span className="text-xs text-gray-400">(optional)</span></div>
        <input type="file" accept="image/*,.svg" onChange={e => setImage(e.target.files[0])} />
      </label>

      <div className="flex justify-end">
        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">{loading ? 'Uploading...' : submitLabel}</button>
      </div>
    </form>
  )
}
