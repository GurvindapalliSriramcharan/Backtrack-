import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'
import ItemCard from '../components/ItemCard'

export default function Student() {
  const [items, setItems] = useState([])
  const [myReports, setMyReports] = useState([])

  useEffect(() => {
    // If report was just submitted, show only that confirmation.
    const justReported = typeof window !== 'undefined' ? sessionStorage.getItem('justReported') : null
    if (justReported) {
      try { sessionStorage.removeItem('justReported') } catch (e) {}
      alert('Report submitted — thank you!')
    } else {
      // show welcome once per login/session
      const welcomeShown = typeof window !== 'undefined' ? sessionStorage.getItem('welcomeShown') : null
      if (!welcomeShown) {
        alert('🎉 Welcome to Lost and Found!')
        try { sessionStorage.setItem('welcomeShown', '1') } catch (e) {}
      }
    }
    fetchItems()
  }, [])

  // protect route: only student role allowed
  const navigate = useNavigate()
  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role !== 'student') navigate('/')
  }, [navigate])

  function fetchItems() {
    fetch('http://localhost:5000/api/items')
      .then(r => r.json())
      .then(data => {
        setItems(data)
        try {
          const user = typeof window !== 'undefined' ? localStorage.getItem('username') : null
          if (user) {
            const mine = data.filter(i => i.reported_by === user)
            setMyReports(mine)
          } else setMyReports([])
        } catch (e) { setMyReports([]) }
      })
      .catch(err => console.error(err))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-indigo-900 to-black text-gray-100">
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center gap-4">
          <img src="https://cdn.prod.website-files.com/60af144c343b5fdc5513a640/62201bb0b4baad0916cfc7bb_03c756_0a279644d7694f22996bd152f6f8b6be_mv2.png" alt="VNRVJIET logo" className="w-16 h-16 rounded" />
          <div>
            <h2 className="text-2xl font-bold">Backtrack</h2>
            <p className="text-sm text-gray-400">Browse reported items or view your own reports.</p>
          </div>
        </div>

        {myReports && myReports.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3 text-white">My Reports</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {myReports.map(item => (
                <div key={item.id} className="bg-gray-800/60 rounded-lg overflow-hidden shadow p-3 border border-gray-700">
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2 rounded" />
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-sm text-gray-300">{item.description}</div>
                  <div className="text-sm text-gray-400 mt-1">Location: {item.location || '—'}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold mb-3 text-white">Lost items</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {items.filter(i => !i.reported_by && !i.claimed_by && i.status !== 'resale').map(item => (
            <div key={item.id} className="bg-gray-800/50 rounded-lg overflow-hidden shadow p-3 border border-gray-700">
              <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2 rounded" />
              <div className="font-semibold text-white">{item.name}</div>
              <div className="text-sm text-gray-300">{item.description}</div>
              <div className="text-sm text-gray-400 mt-1">Location: {item.location || '—'}</div>
            </div>
          ))}
        </div>

        {items.filter(i => i.status === 'resale').length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-3 text-white">Resale Items</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.filter(i => i.status === 'resale').map(item => (
                <div key={item.id} className="bg-gray-800/60 rounded-lg overflow-hidden shadow p-3 border border-gray-700">
                  <img src={`http://localhost:5000${item.image_path || ''}`} alt={item.name} className="w-full h-36 object-cover mb-2 rounded" />
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="text-sm text-gray-300">{item.description}</div>
                  <div className="text-sm text-green-400 font-medium">Price: ₹{item.resale_price}</div>
                  <div className="mt-2">
                    <button onClick={() => {
                      alert(`Purchased ${item.name} for ₹${item.resale_price}!`);
                    }} className="px-3 py-1 bg-green-600 text-white rounded">Purchase</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
