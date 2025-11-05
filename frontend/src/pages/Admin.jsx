import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'
import Modal from '../components/Modal'
import AddItemForm from '../components/AddItemForm'
import AdminEditForm from './AdminEditForm'

export default function Admin() {
  const [items, setItems] = useState([])
  const [selected, setSelected] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [tab, setTab] = useState('home')

  useEffect(() => {
    fetchItems()
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

              {items.filter(i => !i.reported_by).map(item => (
                <ItemCard key={item.id} item={item} onClick={() => setSelected(item)} />
              ))}
            </>
          )}

          {tab === 'lost' && (
            items.filter(i => i.reported_by).length === 0 ? (
              <div className="col-span-full text-center text-gray-500">No lost reports yet</div>
            ) : (
              items.filter(i => i.reported_by).map(item => (
                <div key={item.id} className="bg-white rounded-lg overflow-hidden shadow p-3 cursor-pointer" onClick={() => setSelected(item)}>
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2" />
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-sm text-gray-600">Reported by: {item.reported_by}</div>
                  <div className="text-sm text-gray-500">Location: {item.location || '—'}</div>
                </div>
              ))
            )
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
    </div>
  )
}
